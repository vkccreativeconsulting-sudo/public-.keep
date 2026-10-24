import { describe, expect, it, vi } from "vitest";
import { getAircraftConfig } from "../config";
import { createAirplanesLiveProvider } from "../providers/airplanesLive";
import { createAdsbLolProvider } from "../providers/adsbLol";

const cfg = getAircraftConfig();

describe("readsb REST providers", () => {
  it("query the hex endpoint and normalize the payload", async () => {
    const now = Date.now();
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toBe("https://api.airplanes.live/v2/hex/a31aa0");
      return new Response(JSON.stringify({ now, ac: [{ hex: "a31aa0", r: "N3A", lat: 26.0, lon: -80.1, alt_baro: 1200, gs: 35, track: 10, seen_pos: 1 }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const provider = createAirplanesLiveProvider(cfg, fetchImpl);
    const obs = await provider.fetchObservation();
    expect(obs.position?.lat).toBe(26.0);
    expect(obs.identity.registration).toBe("N3A");
  });

  it("throws a descriptive error on rate limiting", async () => {
    const fetchImpl = vi.fn(async () => new Response("slow down", { status: 429 })) as unknown as typeof fetch;
    const provider = createAdsbLolProvider(cfg, fetchImpl);
    await expect(provider.fetchObservation()).rejects.toThrow(/rate limited/);
  });

  it("builds the ADSB.lol endpoint from config", () => {
    expect(createAdsbLolProvider(cfg).endpoint()).toBe("https://api.adsb.lol/v2/hex/a31aa0");
  });
});
