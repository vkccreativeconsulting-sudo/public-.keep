import { describe, expect, it } from "vitest";
import { normalizeReadsb, readsbNowToMs, selectAircraft } from "../normalize";

const NOW_MS = Date.UTC(2026, 9, 24, 18, 0, 0);

describe("readsbNowToMs", () => {
  it("accepts milliseconds", () => {
    expect(readsbNowToMs(NOW_MS, 0)).toBe(NOW_MS);
  });
  it("accepts seconds", () => {
    expect(readsbNowToMs(NOW_MS / 1000, 0)).toBe(NOW_MS);
  });
  it("falls back when missing", () => {
    expect(readsbNowToMs(undefined, 42)).toBe(42);
  });
});

describe("selectAircraft", () => {
  it("prefers the record matching hex with the freshest position", () => {
    const picked = selectAircraft(
      [
        { hex: "a31aa0", r: "N3A", seen_pos: 50, lat: 1, lon: 1 },
        { hex: "a31aa0", r: "N3A", seen_pos: 2, lat: 2, lon: 2 },
        { hex: "abcdef", r: "N999", seen_pos: 0, lat: 3, lon: 3 },
      ],
      { icaoHex: "A31AA0", registration: "N3A" },
    );
    expect(picked?.lat).toBe(2);
  });
  it("returns null for empty input", () => {
    expect(selectAircraft([], { icaoHex: "a31aa0" })).toBeNull();
    expect(selectAircraft(undefined, { icaoHex: "a31aa0" })).toBeNull();
  });
});

describe("normalizeReadsb", () => {
  it("normalizes a live airborne record", () => {
    const obs = normalizeReadsb(
      {
        now: NOW_MS,
        ac: [
          {
            hex: "a31aa0",
            r: "N3A",
            t: "ZEPP",
            desc: "ZEPPELIN LZ N07-101",
            flight: "N3A     ",
            lat: 25.95,
            lon: -80.24,
            alt_baro: 1525,
            gs: 41.3,
            track: 187.4,
            baro_rate: -64,
            seen: 0.4,
            seen_pos: 3.2,
          },
        ],
      },
      { icaoHex: "a31aa0", registration: "N3A" },
      NOW_MS,
    );
    expect(obs.position).not.toBeNull();
    expect(obs.position!.lat).toBe(25.95);
    expect(obs.position!.altitudeFt).toBe(1525);
    expect(obs.position!.groundSpeedKt).toBe(41.3);
    expect(obs.position!.headingDeg).toBe(187.4);
    expect(obs.position!.verticalRateFpm).toBe(-64);
    expect(obs.position!.onGround).toBe(false);
    expect(Date.parse(obs.position!.observedAt)).toBe(NOW_MS - 3200);
    expect(obs.identity.callsign).toBe("N3A");
    expect(obs.identity.typeCode).toBe("ZEPP");
  });

  it("treats alt_baro 'ground' as on ground", () => {
    const obs = normalizeReadsb(
      { now: NOW_MS, ac: [{ hex: "a31aa0", lat: 26.247, lon: -80.111, alt_baro: "ground", gs: 0, seen_pos: 1 }] },
      { icaoHex: "a31aa0" },
      NOW_MS,
    );
    expect(obs.position?.onGround).toBe(true);
    expect(obs.position?.altitudeFt).toBe(0);
    expect(obs.position?.headingDeg).toBeNull();
  });

  it("uses lastPosition when the current message has no fix", () => {
    const obs = normalizeReadsb(
      { now: NOW_MS, ac: [{ hex: "a31aa0", lastPosition: { lat: 25.8, lon: -80.2, seen_pos: 600 } }] },
      { icaoHex: "a31aa0" },
      NOW_MS,
    );
    expect(obs.position?.lat).toBe(25.8);
    expect(Date.parse(obs.position!.observedAt)).toBe(NOW_MS - 600_000);
  });

  it("returns no position when the aircraft is absent", () => {
    const obs = normalizeReadsb({ now: NOW_MS, ac: [] }, { icaoHex: "a31aa0" }, NOW_MS);
    expect(obs.position).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    const obs = normalizeReadsb({ now: NOW_MS, ac: [{ hex: "a31aa0", lat: 123, lon: -80 }] }, { icaoHex: "a31aa0" }, NOW_MS);
    expect(obs.position).toBeNull();
  });
});
