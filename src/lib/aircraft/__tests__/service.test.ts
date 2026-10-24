import { describe, expect, it, vi } from "vitest";
import { getAircraftConfig } from "../config";
import { BlimpTracker, createMemoryStore, deriveStatus, isInRegion } from "../service";
import type { AircraftFeedProvider, ProviderId, ProviderObservation } from "../types";

const cfg = { ...getAircraftConfig(), provider: "airplaneslive" as const, fallbackProvider: "adsblol" as const, upstreamCacheMs: 15_000, liveMaxAgeSeconds: 120 };

function fakeProvider(id: ProviderId, impl: () => Promise<ProviderObservation>): AircraftFeedProvider {
  return {
    id,
    info: { id, name: id, url: "", attribution: id },
    fetchObservation: impl,
  };
}

function obs(nowMs: number, lat = 25.9, lon = -80.2, ageSec = 2): ProviderObservation {
  return {
    identity: { registration: "N3A", icaoHex: "a31aa0" },
    providerTime: new Date(nowMs).toISOString(),
    position: { lat, lon, headingDeg: 90, altitudeFt: 1500, groundSpeedKt: 40, verticalRateFpm: 0, onGround: false, observedAt: new Date(nowMs - ageSec * 1000).toISOString() },
  };
}

describe("status derivation", () => {
  const now = Date.UTC(2026, 9, 24, 18, 0, 0);
  it("is LIVE within the live window", () => {
    expect(deriveStatus(obs(now).position, now, 120, false)).toBe("LIVE");
  });
  it("is LAST_SEEN when older", () => {
    expect(deriveStatus(obs(now, 25.9, -80.2, 900).position, now, 120, false)).toBe("LAST_SEEN");
  });
  it("is OFFLINE without a position and DEMO when demo", () => {
    expect(deriveStatus(null, now, 120, false)).toBe("OFFLINE");
    expect(deriveStatus(null, now, 120, true)).toBe("DEMO");
  });
  it("flags South Florida", () => {
    expect(isInRegion({ lat: 25.77, lon: -80.19 })).toBe(true);
    expect(isInRegion({ lat: 41.0, lon: -81.5 })).toBe(false);
  });
});

describe("BlimpTracker", () => {
  it("caches upstream responses and coalesces concurrent calls", async () => {
    let now = Date.UTC(2026, 9, 24, 18, 0, 0);
    const fetchObservation = vi.fn(async () => obs(now));
    const tracker = new BlimpTracker({
      cfg,
      store: createMemoryStore(),
      now: () => now,
      providerFactory: (id) => fakeProvider(id, fetchObservation),
    });
    const [a, b] = await Promise.all([tracker.getState(), tracker.getState()]);
    expect(fetchObservation).toHaveBeenCalledTimes(1);
    expect(a.status).toBe("LIVE");
    expect(b).toBe(a);
    now += 5_000;
    await tracker.getState();
    expect(fetchObservation).toHaveBeenCalledTimes(1);
    now += 11_000;
    await tracker.getState();
    expect(fetchObservation).toHaveBeenCalledTimes(2);
  });

  it("falls back to the secondary provider when the primary fails", async () => {
    const now = Date.UTC(2026, 9, 24, 18, 0, 0);
    const tracker = new BlimpTracker({
      cfg,
      store: createMemoryStore(),
      now: () => now,
      providerFactory: (id) =>
        id === "airplaneslive"
          ? fakeProvider(id, async () => { throw new Error("boom"); })
          : fakeProvider(id, async () => obs(now)),
    });
    const state = await tracker.getState();
    expect(state.ok).toBe(true);
    expect(state.source.id).toBe("adsblol");
    expect(state.status).toBe("LIVE");
  });

  it("serves the last known position as LAST_SEEN when the aircraft disappears, and builds a trail", async () => {
    let now = Date.UTC(2026, 9, 24, 18, 0, 0);
    let present = true;
    const tracker = new BlimpTracker({
      cfg,
      store: createMemoryStore(),
      now: () => now,
      providerFactory: (id) =>
        fakeProvider(id, async () =>
          present ? obs(now, 25.9 + (now % 100_000) / 1e6, -80.2) : { identity: {}, position: null, providerTime: new Date(now).toISOString() },
        ),
    });
    const first = await tracker.getState();
    expect(first.trail).toHaveLength(1);
    now += 20_000;
    const second = await tracker.getState();
    expect(second.trail).toHaveLength(2);

    present = false;
    now += 10 * 60_000;
    const third = await tracker.getState();
    expect(third.ok).toBe(true);
    expect(third.status).toBe("LAST_SEEN");
    expect(third.position?.lat).toBe(second.position?.lat);
    expect(third.ageSeconds).toBeGreaterThan(500);
    expect(third.message).toMatch(/last verified position/i);
  });

  it("reports OFFLINE with an upstream error when every provider fails and nothing is known", async () => {
    const now = Date.UTC(2026, 9, 24, 18, 0, 0);
    const tracker = new BlimpTracker({
      cfg,
      store: createMemoryStore(),
      now: () => now,
      providerFactory: (id) => fakeProvider(id, async () => { throw new Error("down"); }),
    });
    const state = await tracker.getState();
    expect(state.ok).toBe(false);
    expect(state.status).toBe("OFFLINE");
    expect(state.position).toBeNull();
    expect(state.upstreamError).toContain("down");
  });

  it("labels demo data as DEMO and never persists it as a real observation", async () => {
    const now = Date.UTC(2026, 9, 24, 18, 0, 0);
    const store = createMemoryStore();
    const tracker = new BlimpTracker({ cfg: { ...cfg, provider: "demo" }, store, now: () => now });
    const state = await tracker.getState();
    expect(state.demo).toBe(true);
    expect(state.status).toBe("DEMO");
    expect(state.position).not.toBeNull();
    expect(store.lastObservation).toBeNull();
    expect(state.trail).toEqual([]);
  });
});
