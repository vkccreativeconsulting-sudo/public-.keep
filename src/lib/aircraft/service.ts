import { getAircraftConfig, REGION_OF_INTEREST, type AircraftConfig } from "./config";
import { createProvider } from "./providers";
import type {
  AircraftFeedProvider,
  AircraftIdentity,
  AircraftPosition,
  BlimpApiResponse,
  DataSourceInfo,
  ProviderId,
  ProviderObservation,
  TrackingStatus,
  TrailPoint,
} from "./types";

/**
 * Tracking service.
 *
 * - Coalesces all visitors onto one upstream request per `upstreamCacheMs`.
 * - Remembers the last real position so the UI can show "LAST SEEN" after the
 *   aircraft drops out of the live feed (providers only return aircraft they
 *   currently hear).
 * - Accumulates a trail of observed positions (never synthesized).
 * - Falls back to a secondary provider when the primary fails.
 *
 * State lives in module memory, which on serverless hosts persists per warm
 * instance. A KV store can replace `MemoryStore` later without touching the UI.
 */

export interface TrackerStore {
  lastObservation: { position: AircraftPosition; identity: Partial<AircraftIdentity>; source: DataSourceInfo } | null;
  trail: TrailPoint[];
  cache: { response: BlimpApiResponse; expiresAt: number } | null;
  inflight: Promise<BlimpApiResponse> | null;
}

export function createMemoryStore(): TrackerStore {
  return { lastObservation: null, trail: [], cache: null, inflight: null };
}

export interface TrackerDeps {
  cfg?: AircraftConfig;
  store?: TrackerStore;
  now?: () => number;
  providerFactory?: (id: ProviderId, cfg: AircraftConfig) => AircraftFeedProvider;
}

export function isInRegion(pos: { lat: number; lon: number }): boolean {
  return (
    pos.lat >= REGION_OF_INTEREST.south &&
    pos.lat <= REGION_OF_INTEREST.north &&
    pos.lon >= REGION_OF_INTEREST.west &&
    pos.lon <= REGION_OF_INTEREST.east
  );
}

export function deriveStatus(position: AircraftPosition | null, nowMs: number, liveMaxAgeSeconds: number, demo: boolean): TrackingStatus {
  if (demo) return "DEMO";
  if (!position) return "OFFLINE";
  const age = (nowMs - Date.parse(position.observedAt)) / 1000;
  return age <= liveMaxAgeSeconds ? "LIVE" : "LAST_SEEN";
}

export function describeStatus(status: TrackingStatus, position: AircraftPosition | null, inRegion: boolean | null, ageSeconds: number | null, upstreamError: string | null): string {
  switch (status) {
    case "DEMO":
      return "DEMO MODE — synthetic positions. This is not the real blimp.";
    case "LIVE":
      if (position?.onGround) return inRegion ? "Live signal — the blimp is on the ground." : "Live signal — on the ground outside South Florida.";
      if (inRegion === false) return "Live signal — the blimp is currently outside South Florida.";
      return "Live signal received.";
    case "LAST_SEEN": {
      const mins = ageSeconds !== null ? Math.floor(ageSeconds / 60) : null;
      const when = mins === null ? "" : mins < 1 ? " under a minute ago" : mins < 60 ? ` ${mins} min ago` : ` ${Math.round(mins / 60)} h ago`;
      const where = inRegion === false ? " outside South Florida" : "";
      return `No current signal. Showing the last verified position${where}, received${when}.${upstreamError ? " Data provider unavailable." : ""}`;
    }
    case "OFFLINE":
      return upstreamError
        ? "The tracking provider is unreachable right now. The blimp cannot currently be located."
        : "The blimp is not currently transmitting a position. It may be hangared or out of receiver range.";
  }
}

function appendTrail(trail: TrailPoint[], position: AircraftPosition, max: number): TrailPoint[] {
  const last = trail[trail.length - 1];
  if (last && last.observedAt === position.observedAt) return trail;
  if (last && Math.abs(last.lat - position.lat) < 1e-6 && Math.abs(last.lon - position.lon) < 1e-6) return trail;
  if (last && Date.parse(position.observedAt) < Date.parse(last.observedAt)) return trail;
  const next = [...trail, { lat: position.lat, lon: position.lon, observedAt: position.observedAt }];
  return next.length > max ? next.slice(next.length - max) : next;
}

function mergeIdentity(cfg: AircraftConfig, ...parts: Array<Partial<AircraftIdentity> | undefined>): AircraftIdentity {
  const merged: AircraftIdentity = {
    name: cfg.name,
    registration: cfg.registration,
    icaoHex: cfg.icaoHex.toUpperCase(),
    typeCode: null,
    typeDescription: null,
    callsign: null,
  };
  for (const p of parts) {
    if (!p) continue;
    if (p.registration) merged.registration = p.registration;
    if (p.icaoHex) merged.icaoHex = p.icaoHex.toUpperCase();
    if (p.typeCode) merged.typeCode = p.typeCode;
    if (p.typeDescription) merged.typeDescription = p.typeDescription;
    if (p.callsign) merged.callsign = p.callsign;
  }
  return merged;
}

export class BlimpTracker {
  private readonly cfg: AircraftConfig;
  private readonly store: TrackerStore;
  private readonly now: () => number;
  private readonly providerFactory: (id: ProviderId, cfg: AircraftConfig) => AircraftFeedProvider;

  constructor(deps: TrackerDeps = {}) {
    this.cfg = deps.cfg ?? getAircraftConfig();
    this.store = deps.store ?? createMemoryStore();
    this.now = deps.now ?? (() => Date.now());
    this.providerFactory = deps.providerFactory ?? ((id, cfg) => createProvider(id, cfg));
  }

  /** Returns the current state, using the cache when fresh and coalescing concurrent calls. */
  async getState(opts: { forceDemo?: boolean } = {}): Promise<BlimpApiResponse> {
    const demo = opts.forceDemo === true || this.cfg.provider === "demo";
    const nowMs = this.now();

    if (!demo && this.store.cache && this.store.cache.expiresAt > nowMs) {
      return this.store.cache.response;
    }
    if (this.store.inflight) return this.store.inflight;

    const run = this.refresh(demo).finally(() => {
      this.store.inflight = null;
    });
    this.store.inflight = run;
    return run;
  }

  private async refresh(demo: boolean): Promise<BlimpApiResponse> {
    const nowMs = this.now();
    const providerIds: ProviderId[] = demo
      ? ["demo"]
      : [this.cfg.provider, ...(this.cfg.fallbackProvider && this.cfg.fallbackProvider !== this.cfg.provider ? [this.cfg.fallbackProvider] : [])];

    let observation: ProviderObservation | null = null;
    let source: DataSourceInfo | null = null;
    const errors: string[] = [];

    for (const id of providerIds) {
      const provider = this.providerFactory(id, this.cfg);
      try {
        observation = await provider.fetchObservation();
        source = provider.info;
        break;
      } catch (err) {
        errors.push(`${provider.info.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const upstreamError = observation ? null : errors.join(" | ") || "unknown error";

    if (!demo && observation?.position) {
      this.store.lastObservation = { position: observation.position, identity: observation.identity, source: source! };
      this.store.trail = appendTrail(this.store.trail, observation.position, this.cfg.trailMaxPoints);
    }

    const effective = demo
      ? observation?.position ?? null
      : observation?.position ?? this.store.lastObservation?.position ?? null;
    const effectiveSource: DataSourceInfo =
      source ?? this.store.lastObservation?.source ?? this.providerFactory(this.cfg.provider, this.cfg).info;

    const status = deriveStatus(effective, nowMs, this.cfg.liveMaxAgeSeconds, demo);
    const ageSeconds = effective ? Math.max(0, Math.round((nowMs - Date.parse(effective.observedAt)) / 1000)) : null;
    const inRegion = effective ? isInRegion(effective) : null;

    const response: BlimpApiResponse = {
      ok: observation !== null,
      demo,
      status,
      aircraft: mergeIdentity(this.cfg, this.store.lastObservation?.identity, observation?.identity),
      position: effective,
      ageSeconds,
      inRegion,
      message: describeStatus(status, effective, inRegion, ageSeconds, upstreamError),
      source: effectiveSource,
      trail: demo ? [] : this.store.trail,
      fetchedAt: new Date(nowMs).toISOString(),
      nextPollMs: this.cfg.upstreamCacheMs,
      upstreamError,
    };

    // Cache even failures briefly so a flapping upstream is not hammered.
    const ttl = observation ? this.cfg.upstreamCacheMs : Math.min(this.cfg.upstreamCacheMs, 10_000);
    if (!demo) this.store.cache = { response, expiresAt: nowMs + ttl };
    return response;
  }
}

// Module-level singleton used by the API route.
const globalStore = globalThis as unknown as { __airwatchStore?: TrackerStore; __airwatchTracker?: BlimpTracker };
export function getTracker(): BlimpTracker {
  if (!globalStore.__airwatchTracker) {
    globalStore.__airwatchStore ??= createMemoryStore();
    globalStore.__airwatchTracker = new BlimpTracker({ store: globalStore.__airwatchStore });
  }
  return globalStore.__airwatchTracker;
}
