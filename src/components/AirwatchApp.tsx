"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ViceCityMapHandle } from "@/components/map/ViceCityMap";
import { useBlimpFeed } from "@/hooks/useBlimpFeed";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTicker } from "@/hooks/useTicker";
import type { TrailPoint } from "@/lib/aircraft/types";
import { POLL_INTERVAL_MS } from "@/lib/map/constants";
import { formatAltitude, formatMiamiTime, formatSpeed } from "@/lib/format";
import { BrandBadge } from "./hud/BrandBadge";
import { Controls } from "./hud/Controls";
import { DemoBadge } from "./hud/DemoBadge";
import { Attribution, Disclaimer, Footer } from "./hud/Footer";
import { InfoCard } from "./hud/InfoCard";
import { LoadingScreen } from "./hud/LoadingScreen";
import { LocateButton } from "./hud/LocateButton";
import { MobileSheet } from "./hud/MobileSheet";
import { StatusDot, statusLabel } from "./hud/StatusDot";
import { StatusPanel, StatusRows } from "./hud/StatusPanel";
import { ZoomControls } from "./hud/ZoomControls";

const ViceCityMap = dynamic(() => import("@/components/map/ViceCityMap"), { ssr: false });

const TRAIL_STORAGE_KEY = "airwatch.trail.v1";
const TRAIL_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const TRAIL_MAX_POINTS = 1500;

function loadStoredTrail(): TrailPoint[] {
  try {
    const raw = window.localStorage.getItem(TRAIL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrailPoint[];
    const cutoff = Date.now() - TRAIL_MAX_AGE_MS;
    return parsed.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Date.parse(p.observedAt) > cutoff);
  } catch {
    return [];
  }
}

function mergeTrail(a: TrailPoint[], b: TrailPoint[]): TrailPoint[] {
  const byTime = new Map<string, TrailPoint>();
  for (const p of [...a, ...b]) byTime.set(p.observedAt, p);
  const merged = [...byTime.values()].sort((x, y) => Date.parse(x.observedAt) - Date.parse(y.observedAt));
  return merged.length > TRAIL_MAX_POINTS ? merged.slice(merged.length - TRAIL_MAX_POINTS) : merged;
}

export default function AirwatchApp() {
  const compact = useMediaQuery("(max-width: 767px)");
  const demo = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("demo") === "1",
    () => false,
  );
  const feed = useBlimpFeed(POLL_INTERVAL_MS, demo);
  const now = useTicker(1000);
  const mapRef = useRef<ViceCityMapHandle>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [curtainDone, setCurtainDone] = useState(false);
  const [follow, setFollow] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [blimpInView, setBlimpInView] = useState(false);
  const [hasLocated, setHasLocated] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>(() => (typeof window === "undefined" ? [] : loadStoredTrail()));
  const [mergedFetchId, setMergedFetchId] = useState<string | null>(null);

  const data = feed.data;
  const position = data?.position ?? null;
  const status = data?.status ?? null;
  const isDemo = data?.demo ?? demo;

  // Freshness, re-derived every second from the real observation time.
  const ageSeconds = useMemo(() => {
    if (!position) return null;
    return Math.max(0, Math.floor((now - Date.parse(position.observedAt)) / 1000));
  }, [now, position]);

  // Loading curtain: lift once the map has rendered, with a minimum on-screen time.
  useEffect(() => {
    if (!mapLoaded && !mapError) return;
    const t = setTimeout(() => setCurtainDone(true), mapError ? 1800 : 900);
    return () => clearTimeout(t);
  }, [mapLoaded, mapError]);
  useEffect(() => {
    // Absolute cap so a wedged basemap never traps the visitor.
    const t = setTimeout(() => setCurtainDone(true), 9000);
    return () => clearTimeout(t);
  }, []);

  // Session trail: merge server-observed points (and this browser's earlier real
  // observations) whenever a new API response arrives. Demo points are kept in
  // memory only and never persisted as real history.
  if (data && data.fetchedAt !== mergedFetchId) {
    setMergedFetchId(data.fetchedAt);
    const incoming: TrailPoint[] = data.demo ? [] : [...data.trail];
    if (position) incoming.push({ lat: position.lat, lon: position.lon, observedAt: position.observedAt });
    setTrail((prev) => mergeTrail(prev, incoming));
  }
  useEffect(() => {
    if (demo || !data || data.demo) return;
    try {
      window.localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(trail));
    } catch {
      /* storage unavailable: trail stays in memory */
    }
  }, [trail, demo, data]);

  const locate = useCallback(() => {
    if (!position) return;
    mapRef.current?.flyToBlimp();
    setFollow(true);
    setHasLocated(true);
    // On phones the details live in the bottom sheet; opening it would cover the blimp.
    setInfoOpen(!compact);
  }, [position, compact]);

  // Keep the blimp inside the visible map area above the mobile sheet / controls.
  const sheetVisible = compact && (sheetOpen || infoOpen);
  useEffect(() => {
    if (!mapLoaded && !mapError) return;
    const px = compact ? (sheetVisible ? Math.round(window.innerHeight * 0.5) : 150) : 0;
    mapRef.current?.setBottomPadding(px);
  }, [compact, sheetVisible, mapLoaded, mapError]);

  const onBlimpClick = useCallback(() => {
    setInfoOpen(true);
    mapRef.current?.flyToBlimp({ zoom: Math.max(11.5, 0) });
    setHasLocated(true);
  }, []);

  const onReset = useCallback(() => {
    setFollow(false);
    setInfoOpen(false);
    mapRef.current?.resetView();
  }, []);

  const onUserInteract = useCallback(() => setFollow(false), []);
  const onViewChange = useCallback((s: { blimpInView: boolean }) => setBlimpInView(s.blimpInView), []);

  const showLocate = Boolean(position) && curtainDone && (!hasLocated || (!blimpInView && !follow));

  const mapTarget = useMemo(() => (position ? { lat: position.lat, lon: position.lon, headingDeg: position.headingDeg } : null), [position]);

  const summary = (
    <>
      <StatusDot status={status} />
      <span className="sheet-summary-status">{statusLabel(status)}</span>
      {position && (
        <span className="sheet-summary-data">
          {formatAltitude(position.altitudeFt, position.onGround)} · {formatSpeed(position.groundSpeedKt).split(" · ")[0]}
        </span>
      )}
      <span className="sheet-summary-clock" suppressHydrationWarning>
        {formatMiamiTime(new Date(now))}
      </span>
    </>
  );

  return (
    <div className="airwatch" data-compact={compact} data-status={status ?? "PENDING"} data-sheet-open={compact && (sheetOpen || infoOpen)}>
      <ViceCityMap
        ref={mapRef}
        position={mapTarget}
        status={status ?? "OFFLINE"}
        trail={trail}
        showTrail={showTrail}
        follow={follow}
        compact={compact}
        onLoaded={() => setMapLoaded(true)}
        onError={(m) => setMapError((prev) => prev ?? m)}
        onUserInteract={onUserInteract}
        onBlimpClick={onBlimpClick}
        onViewChange={onViewChange}
      />

      <div className="vignette" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      <div className={`hud ${curtainDone ? "is-ready" : ""}`}>
        <div className="hud-top-left">
          <BrandBadge status={status} ageSeconds={ageSeconds} fetching={feed.fetching} compact={compact} />
          {isDemo && <DemoBadge />}
        </div>

        {!compact && (
          <div className="hud-top-right">
            <StatusPanel data={data} status={status} ageSeconds={ageSeconds} error={feed.error} />
          </div>
        )}

        <div className="hud-right-mid">
          <ZoomControls onZoomIn={() => mapRef.current?.zoomBy(1)} onZoomOut={() => mapRef.current?.zoomBy(-1)} />
        </div>

        <div className="hud-center-bottom">
          {infoOpen && data && !compact && <InfoCard data={data} ageSeconds={ageSeconds} onClose={() => setInfoOpen(false)} compact={false} />}
          <LocateButton visible={showLocate} onClick={locate} label={hasLocated ? "RETURN TO BLIMP" : "LOCATE THE BLIMP"} />
        </div>

        <div className="hud-bottom-left">
          <Controls
            canTrack={Boolean(position)}
            follow={follow}
            showTrail={showTrail}
            onTrack={locate}
            onToggleFollow={() => {
              setFollow((f) => {
                if (!f) mapRef.current?.flyToBlimp();
                return !f;
              });
            }}
            onToggleTrail={() => setShowTrail((v) => !v)}
            onReset={onReset}
            compact={compact}
          />
        </div>

        {!compact && (
          <div className="hud-bottom-right">
            <Footer now={now} source={data?.source ?? null} demo={isDemo} />
          </div>
        )}

        {compact && (
          <MobileSheet open={sheetOpen || infoOpen} onToggle={() => { setSheetOpen((o) => !o); setInfoOpen(false); }} summary={summary}>
            <div className="sheet-title">
              <div>
                <div className="hud-eyebrow">TRACKING</div>
                <h2 className="hud-callsign">{(data?.aircraft.name ?? "Wingfoot Three").toUpperCase()}</h2>
              </div>
              <div className="hud-reg">
                <StatusDot status={status} />
                <span>{data?.aircraft.registration ?? "N3A"}</span>
              </div>
            </div>
            <StatusRows data={data} status={status} ageSeconds={ageSeconds} error={feed.error} />
            <Attribution source={data?.source ?? null} demo={isDemo} />
            <Disclaimer />
          </MobileSheet>
        )}
      </div>

      <LoadingScreen done={curtainDone} error={mapError} />
    </div>
  );
}
