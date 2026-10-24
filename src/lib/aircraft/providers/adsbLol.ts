import type { AircraftConfig } from "../config";
import type { DataSourceInfo } from "../types";
import { ReadsbRestProvider } from "./readsb";

export const ADSB_LOL_INFO: DataSourceInfo = {
  id: "adsblol",
  name: "ADSB.lol",
  url: "https://adsb.lol/",
  attribution: "Aircraft data: ADSB.lol open ADS-B network",
};

/**
 * ADSB.lol REST API — https://api.adsb.lol/docs
 * Open API, no key required; please keep request rates modest (≤ 1 req/s).
 */
export function createAdsbLolProvider(cfg: AircraftConfig, fetchImpl?: typeof fetch) {
  return new ReadsbRestProvider({
    id: "adsblol",
    info: ADSB_LOL_INFO,
    baseUrl: cfg.adsbLolBaseUrl,
    registration: cfg.registration,
    icaoHex: cfg.icaoHex || null,
    apiKey: null,
    timeoutMs: cfg.upstreamTimeoutMs,
    fetchImpl,
  });
}
