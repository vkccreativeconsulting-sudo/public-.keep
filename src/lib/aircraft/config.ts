import type { ProviderId } from "./types";

function num(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function providerId(value: string | undefined, fallback: ProviderId | null): ProviderId | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "airplaneslive" || v === "airplanes.live" || v === "airplanes_live") return "airplaneslive";
  if (v === "adsblol" || v === "adsb.lol" || v === "adsb_lol") return "adsblol";
  if (v === "demo") return "demo";
  if (v === "none" || v === "off") return null;
  return fallback;
}

/** South Florida bounding box used for the "in region" flag. */
export const REGION_OF_INTEREST = {
  west: -81.2,
  south: 24.9,
  east: -79.7,
  north: 27.2,
} as const;

export function getAircraftConfig() {
  const env = process.env;
  return {
    provider: providerId(env.AIRCRAFT_PROVIDER, "airplaneslive") ?? "airplaneslive",
    fallbackProvider: providerId(env.AIRCRAFT_FALLBACK_PROVIDER, "adsblol"),
    registration: (env.AIRCRAFT_REGISTRATION ?? "N3A").trim().toUpperCase(),
    icaoHex: (env.AIRCRAFT_ICAO_HEX ?? "A31AA0").trim().toLowerCase(),
    name: env.AIRCRAFT_NAME ?? "Wingfoot Three",
    apiKey: env.AIRCRAFT_API_KEY?.trim() || null,
    apiKeyHeader: env.AIRCRAFT_API_KEY_HEADER?.trim() || "auth",
    airplanesLiveBaseUrl: (env.AIRPLANES_LIVE_BASE_URL ?? "https://api.airplanes.live/v2").replace(/\/$/, ""),
    adsbLolBaseUrl: (env.ADSB_LOL_BASE_URL ?? "https://api.adsb.lol/v2").replace(/\/$/, ""),
    /** Minimum spacing between upstream requests, regardless of visitor count. */
    upstreamCacheMs: Math.max(5_000, num(env.UPSTREAM_CACHE_MS, 15_000)),
    /** Observations younger than this are LIVE; older ones are LAST_SEEN. */
    liveMaxAgeSeconds: Math.max(15, num(env.LIVE_MAX_AGE_SECONDS, 120)),
    upstreamTimeoutMs: Math.max(2_000, num(env.UPSTREAM_TIMEOUT_MS, 8_000)),
    trailMaxPoints: Math.max(10, num(env.TRAIL_MAX_POINTS, 720)),
    /** Allow `?demo=1` on the API outside production builds. */
    allowDemoQuery: env.NODE_ENV !== "production" || env.ALLOW_DEMO_QUERY === "true",
  };
}

export type AircraftConfig = ReturnType<typeof getAircraftConfig>;
