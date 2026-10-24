import { describe, expect, it } from "vitest";
import { bearingBetween, compassLabel, distanceMeters, lerpAngle } from "./geo";

describe("geo", () => {
  it("interpolates headings across north", () => {
    expect(Math.round(lerpAngle(350, 10, 0.5))).toBe(0);
    expect(Math.round(lerpAngle(10, 350, 0.5))).toBe(0);
    expect(Math.round(lerpAngle(90, 180, 0.5))).toBe(135);
  });
  it("computes bearing and distance", () => {
    const miami = { lat: 25.7743, lon: -80.1918 };
    const ftl = { lat: 26.1224, lon: -80.1373 };
    expect(Math.round(bearingBetween(miami, ftl))).toBeGreaterThan(0);
    expect(Math.round(bearingBetween(miami, ftl))).toBeLessThan(20);
    expect(distanceMeters(miami, ftl)).toBeGreaterThan(38_000);
    expect(distanceMeters(miami, ftl)).toBeLessThan(40_500);
  });
  it("labels compass points", () => {
    expect(compassLabel(0)).toBe("N");
    expect(compassLabel(92)).toBe("E");
    expect(compassLabel(359)).toBe("N");
  });
});
