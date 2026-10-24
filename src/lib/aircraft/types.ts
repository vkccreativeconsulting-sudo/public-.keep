/**
 * Normalized aircraft tracking types.
 *
 * Every provider (airplanes.live, ADSB.lol, demo, …) is adapted into these
 * shapes so the map UI never has to know which upstream is in use.
 */

export type TrackingStatus =
  /** A position was observed within the configured live window. */
  | "LIVE"
  /** We have a real, timestamped position but it is older than the live window. */
  | "LAST_SEEN"
  /** No position is known at all. */
  | "OFFLINE"
  /** Development-only synthetic data. Never real tracking. */
  | "DEMO";

export interface AircraftIdentity {
  name: string;
  registration: string;
  icaoHex: string;
  typeCode: string | null;
  typeDescription: string | null;
  callsign: string | null;
}

export interface AircraftPosition {
  lat: number;
  lon: number;
  /** Direction of travel in degrees true, 0 = north. */
  headingDeg: number | null;
  /** Barometric altitude in feet. null when unknown. */
  altitudeFt: number | null;
  /** Ground speed in knots. */
  groundSpeedKt: number | null;
  /** Vertical rate in feet per minute. */
  verticalRateFpm: number | null;
  /** True when the transponder reports the aircraft is on the ground. */
  onGround: boolean;
  /** ISO timestamp of when this position was observed by the provider. */
  observedAt: string;
}

export interface TrailPoint {
  lat: number;
  lon: number;
  observedAt: string;
}

export interface DataSourceInfo {
  id: ProviderId;
  name: string;
  url: string;
  attribution: string;
}

export type ProviderId = "airplaneslive" | "adsblol" | "demo";

/** What a provider returns: either a fresh observation or nothing. */
export interface ProviderObservation {
  identity: Partial<AircraftIdentity>;
  position: AircraftPosition | null;
  /** Provider-side wall clock at the time of the response, ISO. */
  providerTime: string;
}

export interface AircraftFeedProvider {
  readonly id: ProviderId;
  readonly info: DataSourceInfo;
  /** Fetch the latest observation for the configured aircraft. Throws on transport failure. */
  fetchObservation(signal?: AbortSignal): Promise<ProviderObservation>;
}

export interface BlimpApiResponse {
  ok: boolean;
  demo: boolean;
  status: TrackingStatus;
  aircraft: AircraftIdentity;
  position: AircraftPosition | null;
  /** Seconds between the last observation and the time this response was generated. */
  ageSeconds: number | null;
  /** True when the position is inside the South Florida region of interest. */
  inRegion: boolean | null;
  /** Human-readable status explanation. */
  message: string;
  source: DataSourceInfo;
  /** Positions this server instance has actually observed, oldest first. */
  trail: TrailPoint[];
  fetchedAt: string;
  /** Milliseconds the client should wait before polling again. */
  nextPollMs: number;
  /** Set when the upstream call failed and we are serving the last known data. */
  upstreamError: string | null;
}
