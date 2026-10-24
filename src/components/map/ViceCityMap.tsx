"use client";

import { Map as MlMap, setWorkerUrl } from "maplibre-gl";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { TrackingStatus, TrailPoint } from "@/lib/aircraft/types";
import { easeInOutCubic } from "@/lib/geo";
import {
  DEFAULT_BEARING,
  DEFAULT_CENTER,
  DEFAULT_PITCH,
  DEFAULT_ZOOM,
  MAX_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  SOUTH_FLORIDA_BOUNDS,
  TRACK_ZOOM,
} from "@/lib/map/constants";
import { buildViceCityStyle } from "@/lib/map/viceCityStyle";
import { BlimpMarkerController, type BlimpTarget } from "./blimpMarker";
import { LandmarkMarkers } from "./landmarkMarkers";
import { ensureTrailLayers, setTrailVisible, updateTrail } from "./trailLayer";

export interface ViceCityMapHandle {
  flyToBlimp(opts?: { zoom?: number }): void;
  resetView(): void;
  zoomBy(delta: number): void;
  resetNorth(): void;
  isBlimpInView(): boolean;
  /** Reserve space for overlays (mobile sheet) so centering keeps the blimp visible. */
  setBottomPadding(px: number): void;
}

interface Props {
  position: BlimpTarget | null;
  status: TrackingStatus;
  trail: TrailPoint[];
  showTrail: boolean;
  follow: boolean;
  compact: boolean;
  /** Fired once the style has loaded and the first frame rendered. */
  onLoaded(): void;
  /** Fired if the basemap fails to load (tiles unreachable, etc.). */
  onError(message: string): void;
  onUserInteract(): void;
  onBlimpClick(): void;
  onViewChange(state: { blimpInView: boolean; zoom: number }): void;
}

const MOVE_DURATION = 2000;

// MapLibre resolves its worker relative to import.meta.url, which bundlers
// rewrite. Serve the worker from /public instead (see scripts/copy-maplibre-worker.mjs).
if (typeof window !== "undefined") setWorkerUrl("/maplibre-gl-worker.mjs");

function parseHash(): { center: [number, number]; zoom: number } | null {
  if (typeof window === "undefined") return null;
  const m = /map=([\d.]+)\/(-?[\d.]+)\/(-?[\d.]+)/.exec(window.location.hash);
  if (!m) return null;
  const zoom = Number(m[1]);
  const lat = Number(m[2]);
  const lon = Number(m[3]);
  if (![zoom, lat, lon].every(Number.isFinite)) return null;
  return { center: [lon, lat], zoom };
}

const ViceCityMap = forwardRef<ViceCityMapHandle, Props>(function ViceCityMap(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const blimpRef = useRef<BlimpMarkerController | null>(null);
  const landmarksRef = useRef<LandmarkMarkers | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const styleReadyRef = useRef(false);

  // ---- create map ---------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const hash = parseHash();
    const map = new MlMap({
      container: containerRef.current,
      style: buildViceCityStyle(),
      center: hash?.center ?? DEFAULT_CENTER,
      zoom: hash?.zoom ?? DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: MAX_BOUNDS,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      fadeDuration: 250,
      cooperativeGestures: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    if (!hash && propsRef.current.compact) {
      map.fitBounds(SOUTH_FLORIDA_BOUNDS, { padding: { top: 90, bottom: 180, left: 20, right: 20 }, duration: 0 });
    }

    const computeInView = (m: MlMap) => {
      const cur = blimpRef.current?.current;
      if (!cur) return false;
      return m.getBounds().contains([cur.lon, cur.lat]);
    };

    let loadedFired = false;
    const fireLoaded = () => {
      if (loadedFired) return;
      loadedFired = true;
      propsRef.current.onLoaded();
    };

    // `style.load` fires as soon as the style JSON is parsed, before tiles arrive,
    // so the blimp, trail and landmarks appear even if the basemap is slow or down.
    map.on("style.load", () => {
      if (styleReadyRef.current) return;
      styleReadyRef.current = true;
      ensureTrailLayers(map);
      setTrailVisible(map, propsRef.current.showTrail);
      updateTrail(map, propsRef.current.trail);
      landmarksRef.current = new LandmarkMarkers(map);
      blimpRef.current = new BlimpMarkerController(map, () => propsRef.current.onBlimpClick());
      blimpRef.current.setStatus(propsRef.current.status);
      if (propsRef.current.position) blimpRef.current.setTarget(propsRef.current.position, 0);
      propsRef.current.onViewChange({ blimpInView: computeInView(map), zoom: map.getZoom() });
    });
    map.once("load", () => map.once("idle", fireLoaded));
    // Safety net: never leave the loading curtain up if tiles are slow.
    setTimeout(fireLoaded, 6000);

    map.on("error", (e: { error?: { message?: string } }) => {
      const msg = e?.error?.message ?? "map error";
      // Tile 404s over open ocean are normal; only surface style/source/network failures.
      if (!/\(404\)/.test(msg) && /style|source|glyph|Failed to fetch|NetworkError/i.test(msg)) propsRef.current.onError(msg);
    });

    // User-initiated interaction disables follow mode.
    const userMove = (e: { originalEvent?: unknown }) => {
      if (e?.originalEvent) propsRef.current.onUserInteract();
    };
    map.on("dragstart", () => propsRef.current.onUserInteract());
    map.on("zoomstart", userMove);
    map.on("rotatestart", userMove);
    map.on("pitchstart", userMove);
    map.on("wheel", () => propsRef.current.onUserInteract());

    let hashTimer: ReturnType<typeof setTimeout> | undefined;
    map.on("moveend", () => {
      const c = map.getCenter();
      const z = map.getZoom();
      const inView = computeInView(map);
      propsRef.current.onViewChange({ blimpInView: inView, zoom: z });
      clearTimeout(hashTimer);
      hashTimer = setTimeout(() => {
        const next = `#map=${z.toFixed(2)}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`;
        if (window.location.hash !== next) window.history.replaceState(null, "", next);
      }, 250);
    });

    return () => {
      clearTimeout(hashTimer);
      blimpRef.current?.destroy();
      landmarksRef.current?.destroy();
      map.remove();
      mapRef.current = null;
      blimpRef.current = null;
      styleReadyRef.current = false;
    };
  }, []);

  // ---- react to data ------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const blimp = blimpRef.current;
    if (!map || !blimp || !styleReadyRef.current) return;
    blimp.setStatus(props.status);
    if (!props.position) return;
    const hadPosition = blimp.current !== null;
    blimp.setTarget(props.position, MOVE_DURATION);
    if (props.follow && hadPosition) {
      map.easeTo({ center: [props.position.lon, props.position.lat], duration: MOVE_DURATION, easing: easeInOutCubic, essential: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.position?.lat, props.position?.lon, props.position?.headingDeg, props.status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    updateTrail(map, props.trail);
  }, [props.trail]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    setTrailVisible(map, props.showTrail);
  }, [props.showTrail]);

  // ---- imperative API -----------------------------------------------------
  useImperativeHandle(ref, () => ({
    flyToBlimp(opts) {
      const map = mapRef.current;
      const cur = blimpRef.current?.current ?? (props.position ? { lat: props.position.lat, lon: props.position.lon } : null);
      if (!map || !cur) return;
      const zoom = opts?.zoom ?? Math.max(map.getZoom(), TRACK_ZOOM);
      map.flyTo({ center: [cur.lon, cur.lat], zoom, bearing: 0, pitch: 0, speed: 0.9, curve: 1.3, essential: true });
    },
    resetView() {
      const map = mapRef.current;
      if (!map) return;
      if (propsRef.current.compact) {
        map.fitBounds(SOUTH_FLORIDA_BOUNDS, { padding: { top: 90, bottom: 180, left: 20, right: 20 }, duration: 1400, essential: true });
      } else {
        map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, bearing: DEFAULT_BEARING, pitch: DEFAULT_PITCH, speed: 0.9, essential: true });
      }
    },
    zoomBy(delta) {
      mapRef.current?.zoomTo((mapRef.current.getZoom() ?? DEFAULT_ZOOM) + delta, { duration: 350 });
    },
    resetNorth() {
      mapRef.current?.resetNorthPitch({ duration: 500 });
    },
    isBlimpInView() {
      const map = mapRef.current;
      const cur = blimpRef.current?.current;
      if (!map || !cur) return false;
      return map.getBounds().contains([cur.lon, cur.lat]);
    },
    setBottomPadding(px) {
      const map = mapRef.current;
      if (!map) return;
      const current = map.getPadding();
      if (current.bottom === px) return;
      const cur = blimpRef.current?.current;
      if (propsRef.current.follow && cur) {
        map.easeTo({ center: [cur.lon, cur.lat], padding: { ...current, bottom: px }, duration: 450, essential: true });
      } else {
        map.easeTo({ padding: { ...current, bottom: px }, duration: 450, essential: true });
      }
    },
  }));

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Map of Miami and South Florida" />;
});

export default ViceCityMap;
