import { normalizeReadsb, type ReadsbResponse } from "../normalize";
import type { AircraftFeedProvider, DataSourceInfo, ProviderId, ProviderObservation } from "../types";

export interface ReadsbProviderOptions {
  id: ProviderId;
  info: DataSourceInfo;
  baseUrl: string;
  registration: string;
  icaoHex: string | null;
  apiKey?: string | null;
  apiKeyHeader?: string;
  timeoutMs: number;
  /** Prefer the hex endpoint when a hex is configured; registration is the fallback. */
  preferHex?: boolean;
  fetchImpl?: typeof fetch;
}

/**
 * Generic provider for any readsb-compatible REST API
 * (airplanes.live and ADSB.lol both expose `/v2/hex/{hex}` and `/v2/reg/{reg}`).
 */
export class ReadsbRestProvider implements AircraftFeedProvider {
  readonly id: ProviderId;
  readonly info: DataSourceInfo;
  private readonly opts: ReadsbProviderOptions;

  constructor(opts: ReadsbProviderOptions) {
    this.id = opts.id;
    this.info = opts.info;
    this.opts = opts;
  }

  endpoint(): string {
    const { baseUrl, icaoHex, registration, preferHex = true } = this.opts;
    if (preferHex && icaoHex) return `${baseUrl}/hex/${encodeURIComponent(icaoHex)}`;
    return `${baseUrl}/reg/${encodeURIComponent(registration)}`;
  }

  async fetchObservation(signal?: AbortSignal): Promise<ProviderObservation> {
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("upstream timeout")), this.opts.timeoutMs);
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", onAbort, { once: true });

    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent": "VICE-CITY-AIRWATCH/1.0 (fan project; single-aircraft tracker)",
    };
    if (this.opts.apiKey) headers[this.opts.apiKeyHeader ?? "auth"] = this.opts.apiKey;

    try {
      const res = await fetchImpl(this.endpoint(), { headers, signal: controller.signal, cache: "no-store" });
      if (res.status === 429) throw new Error(`${this.info.name} rate limited (429)`);
      if (!res.ok) throw new Error(`${this.info.name} responded ${res.status}`);
      const payload = (await res.json()) as ReadsbResponse;
      return normalizeReadsb(payload, { icaoHex: this.opts.icaoHex, registration: this.opts.registration }, Date.now());
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}
