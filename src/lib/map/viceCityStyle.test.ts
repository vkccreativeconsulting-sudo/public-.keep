import { describe, expect, it } from "vitest";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { buildViceCityStyle } from "./viceCityStyle";
import { LANDMARKS } from "./landmarks";

describe("Vice City style", () => {
  it("is a valid MapLibre style", () => {
    const errors = validateStyleMin(buildViceCityStyle("https://example.com/tiles.json"));
    expect(errors.map((e) => e.message)).toEqual([]);
  });
  it("uses the configured tile source for every data layer", () => {
    const style = buildViceCityStyle("https://example.com/tiles.json");
    const ids = new Set<string>();
    for (const layer of style.layers) {
      expect(ids.has(layer.id)).toBe(false);
      ids.add(layer.id);
      if (layer.type !== "background") expect(layer.source).toBe("omt");
    }
  });
  it("places landmarks inside South Florida", () => {
    for (const l of LANDMARKS) {
      expect(l.lat).toBeGreaterThan(25.4);
      expect(l.lat).toBeLessThan(26.6);
      expect(l.lon).toBeGreaterThan(-80.6);
      expect(l.lon).toBeLessThan(-79.9);
    }
  });
});
