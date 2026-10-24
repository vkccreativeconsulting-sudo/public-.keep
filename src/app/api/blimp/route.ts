import { NextResponse } from "next/server";
import { getAircraftConfig } from "@/lib/aircraft/config";
import { getTracker } from "@/lib/aircraft/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/blimp
 *
 * Normalized position of the tracked aircraft. The upstream provider is
 * queried at most once per `UPSTREAM_CACHE_MS` regardless of visitor count,
 * and the CDN is allowed to share the result for the same window.
 *
 * `?demo=1` returns clearly-labeled synthetic data and is only honoured in
 * non-production builds (or when ALLOW_DEMO_QUERY=true).
 */
export async function GET(request: Request) {
  const cfg = getAircraftConfig();
  const url = new URL(request.url);
  const wantsDemo = url.searchParams.get("demo") === "1";
  const forceDemo = wantsDemo && cfg.allowDemoQuery;

  try {
    const state = await getTracker().getState({ forceDemo });
    const maxAge = Math.max(5, Math.floor(cfg.upstreamCacheMs / 1000));
    return NextResponse.json(state, {
      status: 200,
      headers: {
        "cache-control": state.demo
          ? "no-store"
          : `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}, max-age=0`,
        "x-airwatch-status": state.status,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unexpected error" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
