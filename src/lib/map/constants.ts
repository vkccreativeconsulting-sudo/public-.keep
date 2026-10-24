import type { LngLatBoundsLike, LngLatLike } from "maplibre-gl";

/** Default "Vice City" viewpoint: Biscayne Bay with Miami Beach and Downtown framed. */
export const DEFAULT_CENTER: LngLatLike = [-80.175, 25.86];
export const DEFAULT_ZOOM = 10.2;
export const DEFAULT_PITCH = 0;
export const DEFAULT_BEARING = 0;

/** Framing used on small screens so the whole metro fits. */
export const SOUTH_FLORIDA_BOUNDS: LngLatBoundsLike = [
  [-80.52, 25.56],
  [-79.98, 26.34],
];

/** Hard limits so visitors do not pan off into the Atlantic. */
export const MAX_BOUNDS: LngLatBoundsLike = [
  [-83.5, 23.5],
  [-77.5, 29.0],
];

export const MIN_ZOOM = 6.5;
export const MAX_ZOOM = 17.5;

/** Zoom used when flying to the blimp. */
export const TRACK_ZOOM = 12.2;

export const TILE_JSON_URL = process.env.NEXT_PUBLIC_TILE_JSON_URL ?? "https://tiles.openfreemap.org/planet";
export const GLYPHS_URL = process.env.NEXT_PUBLIC_GLYPHS_URL ?? "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ??
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors · <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>';

export const POLL_INTERVAL_MS = Math.max(5_000, Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 15_000);
