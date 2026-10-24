export type LandmarkKind = "district" | "stadium" | "airport" | "base" | "beach" | "downtown";

export interface Landmark {
  id: string;
  name: string;
  /** Short GTA-style blurb for the hover card. */
  blurb: string;
  kind: LandmarkKind;
  lon: number;
  lat: number;
  /** Minimum zoom at which the marker appears. */
  minZoom: number;
}

/**
 * Real Miami / South Florida places rendered with GTA-style pins.
 * Coordinates are real WGS84; names are the real places.
 */
export const LANDMARKS: Landmark[] = [
  { id: "pompano-airpark", name: "Pompano Beach Airpark", blurb: "Goodyear's Florida airship base. Where the blimp sleeps.", kind: "base", lon: -80.1111, lat: 26.2471, minZoom: 8 },
  { id: "hard-rock", name: "Hard Rock Stadium", blurb: "Miami Gardens. Home of the Dolphins and big-game flyovers.", kind: "stadium", lon: -80.2389, lat: 25.958, minZoom: 9 },
  { id: "downtown", name: "Downtown Miami", blurb: "Glass towers over Biscayne Bay.", kind: "downtown", lon: -80.1918, lat: 25.7743, minZoom: 9.5 },
  { id: "brickell", name: "Brickell", blurb: "The financial district. Neon reflections after dark.", kind: "district", lon: -80.1918, lat: 25.7617, minZoom: 11 },
  { id: "wynwood", name: "Wynwood", blurb: "Murals, galleries, warehouses.", kind: "district", lon: -80.1994, lat: 25.801, minZoom: 10.5 },
  { id: "south-beach", name: "South Beach", blurb: "Ocean Drive. Art Deco. The postcard.", kind: "beach", lon: -80.13, lat: 25.7826, minZoom: 9.5 },
  { id: "north-miami", name: "North Miami", blurb: "Between the bay and the Oleta mangroves.", kind: "district", lon: -80.1867, lat: 25.8901, minZoom: 10.5 },
  { id: "hollywood", name: "Hollywood", blurb: "Broadwalk, beach, and the Guitar Hotel glow.", kind: "district", lon: -80.1495, lat: 26.0112, minZoom: 9.5 },
  { id: "fort-lauderdale", name: "Fort Lauderdale", blurb: "Venice of America. Canals and yachts.", kind: "downtown", lon: -80.1373, lat: 26.1224, minZoom: 9 },
  { id: "pompano", name: "Pompano Beach", blurb: "Pier town up the coast.", kind: "beach", lon: -80.1248, lat: 26.2379, minZoom: 10 },
  { id: "mia", name: "Miami International", blurb: "MIA. Big jets, long runways.", kind: "airport", lon: -80.287, lat: 25.7959, minZoom: 9.5 },
  { id: "fll", name: "Fort Lauderdale–Hollywood Intl", blurb: "FLL. Second gateway to the coast.", kind: "airport", lon: -80.1527, lat: 26.0726, minZoom: 10 },
  { id: "key-biscayne", name: "Key Biscayne", blurb: "Island living past the Rickenbacker.", kind: "beach", lon: -80.162, lat: 25.6926, minZoom: 10 },
];
