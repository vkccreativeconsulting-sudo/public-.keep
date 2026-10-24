# VICE CITY AIRWATCH — Live GTA VI Blimp Tracker

> **THE SKIES ARE OURS.** A GTA-inspired, geographically accurate live map of Miami and South Florida that tracks the Vice City–branded Goodyear blimp **Wingfoot Three (N3A)** using real ADS-B aircraft data.

Unofficial fan project. Not affiliated with Rockstar Games, Take-Two Interactive, or Goodyear.

![stack](https://img.shields.io/badge/Next.js-16-black) ![stack](https://img.shields.io/badge/MapLibre_GL-6-blue) ![stack](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## What it does

- **Vice City map of real Miami.** OpenStreetMap vector tiles (OpenMapTiles schema, served by OpenFreeMap) restyled with teal water, lavender land, cream/pink roads and neon accents. Real WGS84 coordinates, so the blimp lands where it actually is.
- **Real-time tracking.** A server-side route (`/api/blimp`) polls a public ADS-B network for aircraft `N3A` / ICAO hex `A31AA0`, normalizes the response and caches it so the upstream is called at most once per window regardless of visitor count.
- **Honest status.** `LIVE` (fresh fix), `LAST SEEN` (real position, but stale, with its true timestamp), `OFFLINE` (no position known) or `DEMO` (synthetic, loudly labeled). Positions are never invented; the marker only eases *between* two verified fixes.
- **Original animated blimp sprite** (SVG, top-down GTA map-icon style) with heading rotation, floating bob, drop shadow and pink pulse ring.
- **GTA-style HUD.** Brand badge with freshness indicator, aircraft status panel, pause-menu style controls (`TRACK BLIMP`, `FOLLOW ON/OFF`, `SHOW FLIGHT PATH`, `RESET VIEW`), Miami clock, attribution and disclaimer. Collapsible bottom sheet on phones.
- **Flight path** drawn only from positions actually observed (server-side trail for this instance + positions this browser has seen, kept for 12 h in `localStorage`).
- **Shareable view**: the URL hash (`#map=zoom/lat/lon`) follows the camera.
- **Loading sequence**: synthwave sunrise → map → HUD → `LOCATE THE BLIMP`.

---

## Quick start

```bash
npm install          # also copies MapLibre's web worker into /public (postinstall)
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (prebuild copies the worker too)
npm start            # serve the production build
npm test             # vitest: normalizer, tracker service, providers, style validation
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

### Demo mode (development only)

`http://localhost:3000/?demo=1` renders a synthetic loop over Biscayne Bay so you can exercise animations without a live signal. The HUD shows a striped **DEMO** badge and every status reads `DEMO`. The query flag is ignored in production builds unless `ALLOW_DEMO_QUERY=true`. Setting `AIRCRAFT_PROVIDER=demo` makes the whole deployment demo-only (also labeled).

---

## Aircraft data providers

The tracker talks to any **readsb / tar1090-compatible REST API** through a small provider abstraction (`src/lib/aircraft/providers/`). Two public networks are wired in; both return the same JSON shape and need no API key:

| Provider | Endpoint used | Key | Rate limit (public) | Docs |
| --- | --- | --- | --- | --- |
| **airplanes.live** (default) | `GET https://api.airplanes.live/v2/hex/a31aa0` | none | 1 request / second per IP | https://airplanes.live/api-guide/ |
| **ADSB.lol** (fallback) | `GET https://api.adsb.lol/v2/hex/a31aa0` | none | be gentle (≤ 1 req/s) | https://api.adsb.lol/docs |

How the server stays polite and accurate:

- All visitors share one cached upstream call per `UPSTREAM_CACHE_MS` (default 15 s). The response also carries `Cache-Control: s-maxage` so Vercel's CDN coalesces further.
- If the primary provider errors or rate-limits, the fallback is tried in the same request.
- Providers only return aircraft they currently hear. When the blimp drops out (hangared, out of receiver range), the server keeps the **last verified position and its real timestamp** and reports `LAST_SEEN`; after a cold start with nothing known it reports `OFFLINE`.
- Positions include `seen_pos`, so `observedAt` is the time of the fix, not the time of the request.
- A trail of observed positions (bounded) is accumulated in memory and returned to clients.

> **Serverless note.** Server state (cache, last-known position, trail) lives in module memory and therefore per warm instance on Vercel. That is fine for the live view; for guaranteed continuity across cold starts, back `TrackerStore` with Vercel KV / Upstash — the interface is a single object in `src/lib/aircraft/service.ts`.

### Response shape (`GET /api/blimp`)

```jsonc
{
  "ok": true,
  "demo": false,
  "status": "LIVE",                 // LIVE | LAST_SEEN | OFFLINE | DEMO
  "aircraft": { "name": "Wingfoot Three", "registration": "N3A", "icaoHex": "A31AA0", "typeCode": "ZEPP", "typeDescription": "ZEPPELIN LZ N07-101", "callsign": "N3A" },
  "position": { "lat": 25.79, "lon": -80.16, "headingDeg": 75, "altitudeFt": 1520, "groundSpeedKt": 38.2, "verticalRateFpm": 64, "onGround": false, "observedAt": "2026-10-24T18:06:40.924Z" },
  "ageSeconds": 1,
  "inRegion": true,                 // inside the South Florida bounding box
  "message": "Live signal received.",
  "source": { "id": "airplaneslive", "name": "airplanes.live", "url": "https://airplanes.live/", "attribution": "…" },
  "trail": [{ "lat": 25.79, "lon": -80.16, "observedAt": "…" }],
  "fetchedAt": "…",
  "nextPollMs": 15000,
  "upstreamError": null
}
```

### Adding another provider

Implement `AircraftFeedProvider` (`src/lib/aircraft/types.ts`) and register it in `src/lib/aircraft/providers/index.ts`. If the API is readsb-shaped (FlightAware's AeroAPI is not), `ReadsbRestProvider` can be reused with a different base URL. Nothing in the UI changes.

---

## Configuration

Copy `.env.example` to `.env.local`. Everything has a default; the important ones:

| Variable | Default | Purpose |
| --- | --- | --- |
| `AIRCRAFT_PROVIDER` | `airplaneslive` | `airplaneslive` · `adsblol` · `demo` |
| `AIRCRAFT_FALLBACK_PROVIDER` | `adsblol` | Tried when the primary fails (`none` to disable) |
| `AIRCRAFT_REGISTRATION` / `AIRCRAFT_ICAO_HEX` | `N3A` / `A31AA0` | Aircraft to follow |
| `AIRCRAFT_API_KEY` / `AIRCRAFT_API_KEY_HEADER` | empty / `auth` | Optional key for paid tiers; public endpoints need none |
| `UPSTREAM_CACHE_MS` | `15000` | Minimum spacing between upstream calls |
| `LIVE_MAX_AGE_SECONDS` | `120` | Fresher than this ⇒ `LIVE`, else `LAST_SEEN` |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | `15000` | Browser poll interval |
| `NEXT_PUBLIC_TILE_JSON_URL` | OpenFreeMap planet | Any OpenMapTiles-schema TileJSON (MapTiler, self-hosted Planetiler…) |
| `NEXT_PUBLIC_GLYPHS_URL` | OpenFreeMap fonts | Glyph PBF template |
| `NEXT_PUBLIC_TILE_ATTRIBUTION` | OSM · OpenFreeMap · OpenMapTiles | HTML attribution shown in the HUD |

### Map tiles

[OpenFreeMap](https://openfreemap.org) serves OpenStreetMap vector tiles for free with no key and no usage cap, and asks only for attribution (already shown in the HUD). To switch to MapTiler, set
`NEXT_PUBLIC_TILE_JSON_URL=https://api.maptiler.com/tiles/v3/tiles.json?key=YOUR_KEY` and update the attribution variable; the custom style targets the shared OpenMapTiles schema so it renders unchanged.

---

## Deploying to Vercel

1. Push this repository to GitHub and **Import Project** in Vercel. Framework preset: **Next.js** (auto-detected). Build command `npm run build`, output default.
2. Add environment variables from `.env.example` (at minimum none are required; set `AIRCRAFT_PROVIDER` / tile URL if you want to change defaults).
3. Deploy. `/api/blimp` runs as a Node.js serverless function; the page is static and hydrates on the client.
4. Optional: for cross-instance continuity, add Vercel KV and swap `createMemoryStore()` for a KV-backed store.

Keep `UPSTREAM_CACHE_MS ≥ 10000` so a busy deployment never exceeds the providers' 1 request/second guidance.

---

## Project layout

```
src/
  app/
    page.tsx, layout.tsx, globals.css   # shell, fonts (Bebas Neue + Rajdhani), full HUD styling
    api/blimp/route.ts                   # normalized tracking endpoint
  components/
    AirwatchApp.tsx                      # client orchestrator: feed, follow, trail, HUD state
    map/ViceCityMap.tsx                  # MapLibre instance + imperative handle
    map/blimpMarker.ts                   # DOM marker, tweening, rotation, zoom scale
    map/trailLayer.ts, landmarkMarkers.ts
    hud/*                                # BrandBadge, StatusPanel, Controls, Footer, InfoCard, LoadingScreen, MobileSheet…
    icons/blimpSprite.ts                 # original SVG blimp
  lib/
    aircraft/{types,config,normalize,service}.ts, providers/*   # data layer (+ tests)
    map/{viceCityStyle,palette,landmarks,constants}.ts           # Vice City MapLibre style (+ validation test)
    geo.ts, format.ts
scripts/copy-maplibre-worker.mjs         # serves MapLibre's worker from /public (bundler-safe)
```

### Why the worker copy?

MapLibre resolves its web worker relative to `import.meta.url`, which bundlers rewrite. `scripts/copy-maplibre-worker.mjs` copies the worker into `/public` on install/build and the map calls `setWorkerUrl("/maplibre-gl-worker.mjs")`. The copied files are git-ignored.

---

## Roadmap-ready

The architecture leaves room for, without rebuilding the core:

- Historical playback (the trail already carries timestamps; add a KV-backed store and a scrubber).
- Appearance schedule and community sightings (new GeoJSON sources + HUD panels).
- Day/night styling (`palette.ts` → second palette, `buildViceCityStyle(tileUrl, palette)`).
- Promo-activation markers (reuse `LandmarkMarkers` with a new kind).
- Shareable links already work via the URL hash.

---

## Attribution & disclaimer

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors · tiles by [OpenFreeMap](https://openfreemap.org) · schema by [OpenMapTiles](https://openmaptiles.org/). Aircraft data by [airplanes.live](https://airplanes.live/) and/or [ADSB.lol](https://adsb.lol/) volunteer ADS-B networks; positions can be delayed or incomplete.

This is an unofficial fan project. "Grand Theft Auto" and "Vice City" are trademarks of Take-Two Interactive / Rockstar Games; "Goodyear" is a trademark of The Goodyear Tire & Rubber Company. All artwork here is original and GTA-*inspired*; no copyrighted game assets are used.
