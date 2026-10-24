import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import type { Feature, LineString, FeatureCollection, Point } from "geojson";
import type { TrailPoint } from "@/lib/aircraft/types";
import { palette } from "@/lib/map/palette";

export const TRAIL_SOURCE = "blimp-trail";
export const TRAIL_POINTS_SOURCE = "blimp-trail-points";
const LAYERS = ["blimp-trail-glow", "blimp-trail-core", "blimp-trail-points"] as const;

function lineFeature(points: TrailPoint[]): Feature<LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points.map((p) => [p.lon, p.lat]) } };
}

function pointFeatures(points: TrailPoint[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({ type: "Feature", properties: { t: p.observedAt }, geometry: { type: "Point", coordinates: [p.lon, p.lat] } })),
  };
}

/** Neon-pink flight path drawn only from verified positions. */
export function ensureTrailLayers(map: MlMap) {
  if (map.getSource(TRAIL_SOURCE)) return;
  map.addSource(TRAIL_SOURCE, { type: "geojson", data: lineFeature([]) });
  map.addSource(TRAIL_POINTS_SOURCE, { type: "geojson", data: pointFeatures([]) });
  map.addLayer({
    id: "blimp-trail-glow",
    type: "line",
    source: TRAIL_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": palette.neonPink,
      "line-width": ["interpolate", ["linear"], ["zoom"], 8, 6, 14, 14],
      "line-blur": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 9],
      "line-opacity": 0.35,
    },
  });
  map.addLayer({
    id: "blimp-trail-core",
    type: "line",
    source: TRAIL_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#ffd1ea",
      "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.4, 14, 3],
      "line-opacity": 0.95,
    },
  });
  map.addLayer({
    id: "blimp-trail-points",
    type: "circle",
    source: TRAIL_POINTS_SOURCE,
    minzoom: 11,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 1.5, 15, 3.5],
      "circle-color": palette.neonPink,
      "circle-stroke-color": "#fff0f8",
      "circle-stroke-width": 0.8,
      "circle-opacity": 0.9,
    },
  });
}

export function updateTrail(map: MlMap, points: TrailPoint[]) {
  const line = map.getSource(TRAIL_SOURCE) as GeoJSONSource | undefined;
  const pts = map.getSource(TRAIL_POINTS_SOURCE) as GeoJSONSource | undefined;
  if (!line || !pts) return;
  line.setData(points.length >= 2 ? lineFeature(points) : lineFeature([]));
  pts.setData(pointFeatures(points));
}

export function setTrailVisible(map: MlMap, visible: boolean) {
  for (const id of LAYERS) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }
}
