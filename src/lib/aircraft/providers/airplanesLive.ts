import type { AircraftConfig } from "../config";
import type { DataSourceInfo } from "../types";
import { ReadsbRestProvider } from "./readsb";

export const AIRPLANES_LIVE_INFO: DataSourceInfo = {
  id: "airplaneslive",
  name: "airplanes.live",
  url: "https://airplanes.live/",
  attribution: "Aircraft data: airplanes.live community ADS-B network",
};

/**
 * airplanes.live REST API — https://airplanes.live/api-guide/
 * Public endpoints need no key and are limited to 1 request per second per IP.
 */
export function createAirplanesLiveProvider(cfg: AircraftConfig, fetchImpl?: typeof fetch) {
  return new ReadsbRestProvider({
    id: "airplaneslive",
    info: AIRPLANES_LIVE_INFO,
    baseUrl: cfg.airplanesLiveBaseUrl,
    registration: cfg.registration,
    icaoHex: cfg.icaoHex || null,
    apiKey: cfg.apiKey,
    apiKeyHeader: cfg.apiKeyHeader,
    timeoutMs: cfg.upstreamTimeoutMs,
    fetchImpl,
  });
}
