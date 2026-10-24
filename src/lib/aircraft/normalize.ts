import type { AircraftPosition, ProviderObservation } from "./types";

/**
 * Shape of a readsb / tar1090 style aircraft record as served by
 * airplanes.live and ADSB.lol (`/v2/reg/…`, `/v2/hex/…`).
 * Only the fields we use are typed; everything else is passed through.
 */
export interface ReadsbAircraft {
  hex?: string;
  r?: string;
  t?: string;
  desc?: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  alt_geom?: number;
  gs?: number;
  track?: number;
  true_heading?: number;
  mag_heading?: number;
  baro_rate?: number;
  geom_rate?: number;
  seen?: number;
  seen_pos?: number;
  lastPosition?: { lat: number; lon: number; seen_pos?: number };
  [key: string]: unknown;
}

export interface ReadsbResponse {
  ac?: ReadsbAircraft[];
  aircraft?: ReadsbAircraft[];
  now?: number;
  msg?: string;
  total?: number;
  [key: string]: unknown;
}

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** readsb emits `now` in seconds (aircraft.json) or milliseconds (REST APIs). Normalize to ms. */
export function readsbNowToMs(now: unknown, fallbackMs: number): number {
  if (!isFiniteNumber(now) || now <= 0) return fallbackMs;
  return now < 1e11 ? Math.round(now * 1000) : Math.round(now);
}

export function normalizeHeading(value: unknown): number | null {
  if (!isFiniteNumber(value)) return null;
  const h = ((value % 360) + 360) % 360;
  return Math.round(h * 10) / 10;
}

/**
 * Pick the record that matches our aircraft. Providers may return several
 * records for a registration query (e.g. stale duplicates); prefer the one
 * with the freshest position.
 */
export function selectAircraft(
  records: ReadsbAircraft[] | undefined,
  match: { icaoHex?: string | null; registration?: string | null },
): ReadsbAircraft | null {
  if (!records?.length) return null;
  const hex = match.icaoHex?.toLowerCase() ?? null;
  const reg = match.registration?.toUpperCase() ?? null;
  const candidates = records.filter((r) => {
    const rHex = typeof r.hex === "string" ? r.hex.toLowerCase().replace(/^~/, "") : null;
    const rReg = typeof r.r === "string" ? r.r.toUpperCase().trim() : null;
    return (hex !== null && rHex === hex) || (reg !== null && rReg === reg);
  });
  const pool = candidates.length ? candidates : records;
  return [...pool].sort((a, b) => positionAge(a) - positionAge(b))[0] ?? null;
}

function positionAge(r: ReadsbAircraft): number {
  if (isFiniteNumber(r.seen_pos)) return r.seen_pos;
  if (isFiniteNumber(r.lastPosition?.seen_pos)) return r.lastPosition.seen_pos;
  if (isFiniteNumber(r.seen)) return r.seen;
  return Number.POSITIVE_INFINITY;
}

/** Convert a readsb record into our normalized observation. */
export function normalizeReadsb(
  payload: ReadsbResponse,
  match: { icaoHex?: string | null; registration?: string | null },
  receivedAtMs: number = Date.now(),
): ProviderObservation {
  const nowMs = readsbNowToMs(payload.now, receivedAtMs);
  const record = selectAircraft(payload.ac ?? payload.aircraft, match);
  const providerTime = new Date(nowMs).toISOString();

  if (!record) {
    return { identity: {}, position: null, providerTime };
  }

  const identity = {
    registration: typeof record.r === "string" ? record.r.trim().toUpperCase() : undefined,
    icaoHex: typeof record.hex === "string" ? record.hex.replace(/^~/, "").toLowerCase() : undefined,
    typeCode: typeof record.t === "string" ? record.t : null,
    typeDescription: typeof record.desc === "string" ? record.desc : null,
    callsign: typeof record.flight === "string" && record.flight.trim() ? record.flight.trim() : null,
  };

  let lat: number | null = null;
  let lon: number | null = null;
  let seenPos: number | null = null;

  if (isFiniteNumber(record.lat) && isFiniteNumber(record.lon)) {
    lat = record.lat;
    lon = record.lon;
    seenPos = isFiniteNumber(record.seen_pos) ? record.seen_pos : isFiniteNumber(record.seen) ? record.seen : 0;
  } else if (record.lastPosition && isFiniteNumber(record.lastPosition.lat) && isFiniteNumber(record.lastPosition.lon)) {
    lat = record.lastPosition.lat;
    lon = record.lastPosition.lon;
    seenPos = isFiniteNumber(record.lastPosition.seen_pos) ? record.lastPosition.seen_pos : null;
  }

  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return { identity, position: null, providerTime };
  }

  const onGround = record.alt_baro === "ground";
  const altitudeFt = onGround
    ? 0
    : isFiniteNumber(record.alt_baro)
      ? Math.round(record.alt_baro)
      : isFiniteNumber(record.alt_geom)
        ? Math.round(record.alt_geom)
        : null;

  const position: AircraftPosition = {
    lat,
    lon,
    headingDeg: normalizeHeading(record.track) ?? normalizeHeading(record.true_heading) ?? normalizeHeading(record.mag_heading),
    altitudeFt,
    groundSpeedKt: isFiniteNumber(record.gs) ? Math.round(record.gs * 10) / 10 : null,
    verticalRateFpm: isFiniteNumber(record.baro_rate) ? Math.round(record.baro_rate) : isFiniteNumber(record.geom_rate) ? Math.round(record.geom_rate) : null,
    onGround,
    observedAt: new Date(nowMs - Math.max(0, seenPos ?? 0) * 1000).toISOString(),
  };

  return { identity, position, providerTime };
}
