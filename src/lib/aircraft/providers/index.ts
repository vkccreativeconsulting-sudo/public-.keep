import type { AircraftConfig } from "../config";
import type { AircraftFeedProvider, ProviderId } from "../types";
import { createAdsbLolProvider } from "./adsbLol";
import { createAirplanesLiveProvider } from "./airplanesLive";
import { createDemoProvider } from "./demo";

/**
 * Provider registry. Add a new upstream by implementing `AircraftFeedProvider`
 * and registering a factory here; nothing in the UI needs to change.
 */
export function createProvider(id: ProviderId, cfg: AircraftConfig, fetchImpl?: typeof fetch): AircraftFeedProvider {
  switch (id) {
    case "airplaneslive":
      return createAirplanesLiveProvider(cfg, fetchImpl);
    case "adsblol":
      return createAdsbLolProvider(cfg, fetchImpl);
    case "demo":
      return createDemoProvider(cfg);
  }
}
