import type { AircraftConfig } from "../config";
import type { AircraftFeedProvider, DataSourceInfo, ProviderObservation } from "../types";

export const DEMO_INFO: DataSourceInfo = {
  id: "demo",
  name: "DEMO (synthetic)",
  url: "",
  attribution: "DEMO MODE — synthetic positions for testing. Not real tracking.",
};

/**
 * Development-only provider. Generates a deterministic loop over Biscayne Bay
 * so marker animation, follow mode and the trail can be exercised without a
 * live signal. Everything it emits is labeled DEMO by the service.
 */
export class DemoProvider implements AircraftFeedProvider {
  readonly id = "demo" as const;
  readonly info = DEMO_INFO;
  constructor(private readonly cfg: AircraftConfig) {}

  async fetchObservation(): Promise<ProviderObservation> {
    const now = Date.now();
    const period = 20 * 60 * 1000; // one lap every 20 minutes
    const t = ((now % period) / period) * Math.PI * 2;
    // Ellipse over Biscayne Bay between Downtown Miami and Miami Beach.
    const centerLat = 25.79;
    const centerLon = -80.16;
    const lat = centerLat + Math.sin(t) * 0.055;
    const lon = centerLon + Math.cos(t) * 0.035;
    // Heading = tangent of the ellipse (dLat/dt, dLon/dt), converted to compass bearing.
    const dLat = Math.cos(t) * 0.055;
    const dLon = -Math.sin(t) * 0.035 * Math.cos((centerLat * Math.PI) / 180);
    const heading = (Math.atan2(dLon, dLat) * 180) / Math.PI;

    return {
      identity: {
        registration: this.cfg.registration,
        icaoHex: this.cfg.icaoHex,
        typeCode: "ZEPP",
        typeDescription: "Zeppelin LZ N07-101 (demo)",
        callsign: "DEMO",
      },
      position: {
        lat,
        lon,
        headingDeg: ((heading % 360) + 360) % 360,
        altitudeFt: 1500 + Math.round(Math.sin(t * 3) * 200),
        groundSpeedKt: 38 + Math.round(Math.cos(t * 2) * 6),
        verticalRateFpm: Math.round(Math.cos(t * 3) * 120),
        onGround: false,
        observedAt: new Date(now).toISOString(),
      },
      providerTime: new Date(now).toISOString(),
    };
  }
}

export function createDemoProvider(cfg: AircraftConfig) {
  return new DemoProvider(cfg);
}
