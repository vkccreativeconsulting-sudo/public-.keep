import type { StyleSpecification, LayerSpecification, ExpressionSpecification } from "maplibre-gl";
import { palette as p } from "./palette";
import { GLYPHS_URL, TILE_ATTRIBUTION, TILE_JSON_URL } from "./constants";

/**
 * "Vice City" MapLibre style on top of the OpenMapTiles vector schema
 * (served by OpenFreeMap by default; MapTiler / self-hosted Planetiler tiles
 * use the same schema and can be swapped in with NEXT_PUBLIC_TILE_JSON_URL).
 *
 * Geography stays real; only the paint changes.
 */

const SRC = "omt";
const FONT_REGULAR = ["Noto Sans Regular"];
const FONT_BOLD = ["Noto Sans Bold"];
const FONT_ITALIC = ["Noto Sans Italic"];

const name: ExpressionSpecification = ["coalesce", ["get", "name:en"], ["get", "name"]];

/** Road width ramp shared by casing and fill; casing gets +2px. */
function roadWidth(base: Record<string, [number, number, number, number]>): ExpressionSpecification {
  // Returns an interpolate expression keyed on class.
  // base[class] = [w@z8, w@z12, w@z15, w@z18]
  const classes = Object.keys(base);
  const widthAt = (i: number): ExpressionSpecification => {
    const expr: unknown[] = ["match", ["get", "class"]];
    for (const c of classes) expr.push(c, base[c][i]);
    expr.push(0.5);
    return expr as ExpressionSpecification;
  };
  return ["interpolate", ["exponential", 1.4], ["zoom"], 8, widthAt(0), 12, widthAt(1), 15, widthAt(2), 18, widthAt(3)];
}

const roadBase = {
  motorway: [1.4, 3.5, 9, 26],
  trunk: [1.2, 3, 8, 22],
  primary: [0.9, 2.4, 7, 20],
  secondary: [0.5, 1.6, 5.5, 16],
  tertiary: [0.3, 1.2, 4.5, 14],
  minor: [0, 0.6, 3, 11],
  service: [0, 0, 1.4, 7],
  track: [0, 0, 1, 4],
} as Record<string, [number, number, number, number]>;

const roadColor: ExpressionSpecification = [
  "match",
  ["get", "class"],
  "motorway", p.roadMotorway,
  "trunk", p.roadTrunk,
  "primary", p.roadPrimary,
  "secondary", p.roadSecondary,
  "tertiary", p.roadSecondary,
  "minor", p.roadMinor,
  "service", p.roadService,
  "track", p.roadService,
  p.roadMinor,
];

const roadCasingColor: ExpressionSpecification = [
  "match",
  ["get", "class"],
  "motorway", p.roadMotorwayCasing,
  "trunk", p.roadMotorwayCasing,
  "primary", p.roadPrimaryCasing,
  "secondary", p.roadSecondaryCasing,
  "tertiary", p.roadSecondaryCasing,
  p.roadMinorCasing,
];

const roadFilter = (extra: unknown[] = []): ExpressionSpecification =>
  [
    "all",
    ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service", "track"], true, false],
    ["!=", ["get", "brunnel"], "tunnel"],
    ...extra,
  ] as ExpressionSpecification;

const layers: LayerSpecification[] = [
  { id: "background", type: "background", paint: { "background-color": p.land } },

  // ---- Land cover ---------------------------------------------------------
  {
    id: "landcover",
    type: "fill",
    source: SRC,
    "source-layer": "landcover",
    paint: {
      "fill-color": [
        "match",
        ["get", "class"],
        "wood", p.wood,
        "grass", p.park,
        "wetland", p.wetland,
        "sand", p.sand,
        "farmland", p.landLight,
        p.landLight,
      ],
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 12, 0.85],
      "fill-antialias": false,
    },
  },
  {
    id: "landuse",
    type: "fill",
    source: SRC,
    "source-layer": "landuse",
    paint: {
      "fill-color": [
        "match",
        ["get", "class"],
        "residential", p.residential,
        "commercial", p.commercial,
        "retail", p.commercial,
        "industrial", p.industrial,
        "railway", p.industrial,
        "cemetery", p.cemetery,
        "pitch", p.pitch,
        "playground", p.pitch,
        "stadium", p.pitch,
        "hospital", p.commercial,
        "school", p.landLight,
        "university", p.landLight,
        "college", p.landLight,
        p.landLight,
      ],
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.35, 13, 0.75],
      "fill-antialias": false,
    },
  },
  {
    id: "park",
    type: "fill",
    source: SRC,
    "source-layer": "park",
    paint: { "fill-color": p.park, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 13, 0.9] },
  },
  {
    id: "park-outline",
    type: "line",
    source: SRC,
    "source-layer": "park",
    minzoom: 11,
    paint: { "line-color": p.parkDark, "line-width": 0.8, "line-opacity": 0.6 },
  },
  {
    id: "aeroway-area",
    type: "fill",
    source: SRC,
    "source-layer": "aeroway",
    filter: ["match", ["get", "class"], ["aerodrome", "apron", "heliport"], true, false],
    paint: { "fill-color": p.airport, "fill-opacity": 0.8 },
  },

  // ---- Water --------------------------------------------------------------
  {
    id: "water",
    type: "fill",
    source: SRC,
    "source-layer": "water",
    paint: {
      "fill-color": [
        "match",
        ["get", "class"],
        "ocean", p.ocean,
        "lake", p.lagoon,
        "river", p.river,
        "pond", p.lagoon,
        "swimming_pool", p.cyan,
        p.oceanShallow,
      ],
      "fill-antialias": true,
    },
  },
  {
    id: "water-glow",
    type: "line",
    source: SRC,
    "source-layer": "water",
    minzoom: 8,
    paint: {
      "line-color": "#9ff5f8",
      "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 13, 1.8, 16, 3],
      "line-opacity": 0.55,
      "line-blur": ["interpolate", ["linear"], ["zoom"], 8, 1, 14, 3],
    },
  },
  {
    id: "waterway",
    type: "line",
    source: SRC,
    "source-layer": "waterway",
    minzoom: 9,
    paint: {
      "line-color": p.river,
      "line-width": ["interpolate", ["exponential", 1.3], ["zoom"], 9, 0.6, 13, 1.6, 17, 6],
      "line-opacity": 0.9,
    },
  },

  // ---- Aeroway lines -------------------------------------------------------
  {
    id: "aeroway-runway",
    type: "line",
    source: SRC,
    "source-layer": "aeroway",
    minzoom: 10,
    filter: ["match", ["get", "class"], ["runway", "taxiway"], true, false],
    paint: {
      "line-color": p.runway,
      "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 10, ["match", ["get", "class"], "runway", 1.5, 0.5], 16, ["match", ["get", "class"], "runway", 30, 8]],
    },
  },

  // ---- Buildings -----------------------------------------------------------
  {
    id: "building",
    type: "fill",
    source: SRC,
    "source-layer": "building",
    minzoom: 13.5,
    paint: {
      "fill-color": p.building,
      "fill-outline-color": p.buildingOutline,
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13.5, 0, 15, 0.55, 17, 0.75],
    },
  },

  // ---- Transportation ------------------------------------------------------
  {
    id: "tunnel",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 12,
    filter: ["all", ["==", ["get", "brunnel"], "tunnel"], ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary", "tertiary", "minor"], true, false]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": p.roadMinorCasing, "line-dasharray": [2, 2], "line-width": roadWidth(roadBase), "line-opacity": 0.5 },
  },
  {
    id: "path",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 14,
    filter: ["match", ["get", "class"], ["path"], true, false],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": p.path, "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 18, 2.2], "line-dasharray": [1.5, 1.5], "line-opacity": 0.8 },
  },
  {
    id: "rail",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 10,
    filter: ["all", ["match", ["get", "class"], ["rail", "transit"], true, false], ["!=", ["get", "brunnel"], "tunnel"]],
    paint: { "line-color": p.rail, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 1.6, 18, 3], "line-opacity": 0.7, "line-dasharray": [4, 2] },
  },
  {
    id: "road-casing",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 9,
    filter: roadFilter(),
    layout: { "line-cap": "butt", "line-join": "round" },
    paint: {
      "line-color": roadCasingColor,
      "line-gap-width": roadWidth(roadBase),
      "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.4, 13, 0.9, 17, 1.6],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 13, 0.85],
    },
  },
  {
    id: "road",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 6,
    filter: roadFilter(),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": roadColor,
      "line-width": roadWidth(roadBase),
      "line-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        7,
        ["match", ["get", "class"], ["motorway", "trunk"], 0.9, ["primary"], 0.5, 0],
        10,
        ["match", ["get", "class"], ["motorway", "trunk", "primary"], 1, ["secondary", "tertiary"], 0.75, 0.15],
        13,
        1,
      ],
    },
  },
  {
    id: "bridge-casing",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 11,
    filter: roadFilter([["==", ["get", "brunnel"], "bridge"]]),
    layout: { "line-cap": "butt", "line-join": "round" },
    paint: {
      "line-color": p.roadMotorwayCasing,
      "line-gap-width": roadWidth(roadBase),
      "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 16, 2.4],
      "line-opacity": 0.9,
    },
  },
  {
    id: "ferry",
    type: "line",
    source: SRC,
    "source-layer": "transportation",
    minzoom: 10,
    filter: ["==", ["get", "class"], "ferry"],
    paint: { "line-color": p.ferry, "line-width": 1, "line-dasharray": [2, 3], "line-opacity": 0.7 },
  },

  // ---- Boundaries -----------------------------------------------------------
  {
    id: "boundary-state",
    type: "line",
    source: SRC,
    "source-layer": "boundary",
    filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
    paint: { "line-color": p.purple, "line-width": 1, "line-dasharray": [3, 2], "line-opacity": 0.5 },
  },

  // ---- Labels -------------------------------------------------------------------
  {
    id: "water-name",
    type: "symbol",
    source: SRC,
    "source-layer": "water_name",
    minzoom: 8,
    filter: ["match", ["get", "class"], ["ocean", "sea", "bay", "lake"], true, false],
    layout: {
      "text-field": name,
      "text-font": FONT_ITALIC,
      "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 13, 15],
      "text-letter-spacing": 0.25,
      "text-transform": "uppercase",
      "symbol-placement": "point",
      "text-max-width": 7,
    },
    paint: { "text-color": p.labelWater, "text-halo-color": p.labelWaterHalo, "text-halo-width": 1.4 },
  },
  {
    id: "road-name",
    type: "symbol",
    source: SRC,
    "source-layer": "transportation_name",
    minzoom: 13,
    filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary", "tertiary", "minor"], true, false],
    layout: {
      "text-field": name,
      "text-font": FONT_REGULAR,
      "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 17, 14],
      "symbol-placement": "line",
      "text-letter-spacing": 0.08,
      "text-transform": "uppercase",
      "text-rotation-alignment": "map",
      "text-pitch-alignment": "viewport",
    },
    paint: { "text-color": p.labelRoad, "text-halo-color": p.labelRoadHalo, "text-halo-width": 1.3 },
  },
  {
    id: "motorway-shield",
    type: "symbol",
    source: SRC,
    "source-layer": "transportation_name",
    minzoom: 9,
    maxzoom: 14,
    filter: ["all", ["match", ["get", "class"], ["motorway", "trunk"], true, false], ["has", "ref"]],
    layout: {
      "text-field": ["get", "ref"],
      "text-font": FONT_BOLD,
      "text-size": 10,
      "symbol-placement": "line",
      "symbol-spacing": 350,
      "text-rotation-alignment": "viewport",
      "text-padding": 6,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": p.roadMotorwayCasing, "text-halo-width": 2.2 },
  },
  {
    id: "place-neighbourhood",
    type: "symbol",
    source: SRC,
    "source-layer": "place",
    minzoom: 11,
    filter: ["match", ["get", "class"], ["suburb", "quarter", "neighbourhood", "island"], true, false],
    layout: {
      "text-field": name,
      "text-font": FONT_BOLD,
      "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 14, 13],
      "text-transform": "uppercase",
      "text-letter-spacing": 0.2,
      "text-max-width": 8,
      "text-padding": 4,
    },
    paint: {
      "text-color": p.labelNeighborhood,
      "text-halo-color": p.labelNeighborhoodHalo,
      "text-halo-width": 1.4,
      "text-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 12.5, 1],
    },
  },
  {
    id: "place-town",
    type: "symbol",
    source: SRC,
    "source-layer": "place",
    minzoom: 8,
    maxzoom: 14.5,
    filter: ["match", ["get", "class"], ["town", "village"], true, false],
    layout: {
      "text-field": name,
      "text-font": FONT_BOLD,
      "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 13, 15],
      "text-transform": "uppercase",
      "text-letter-spacing": 0.18,
      "text-max-width": 8,
    },
    paint: { "text-color": p.labelCity, "text-halo-color": p.labelCityHalo, "text-halo-width": 1.6 },
  },
  {
    id: "place-city",
    type: "symbol",
    source: SRC,
    "source-layer": "place",
    minzoom: 5,
    maxzoom: 14,
    filter: ["==", ["get", "class"], "city"],
    layout: {
      "text-field": name,
      "text-font": FONT_BOLD,
      "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 9, 15, 13, 20],
      "text-transform": "uppercase",
      "text-letter-spacing": 0.22,
      "text-max-width": 8,
    },
    paint: { "text-color": p.labelCity, "text-halo-color": p.labelCityHalo, "text-halo-width": 1.8 },
  },
];

export function buildViceCityStyle(tileJsonUrl: string = TILE_JSON_URL): StyleSpecification {
  return {
    version: 8,
    name: "Vice City Airwatch",
    glyphs: GLYPHS_URL,
    sources: {
      [SRC]: { type: "vector", url: tileJsonUrl, attribution: TILE_ATTRIBUTION },
    },
    layers,
    transition: { duration: 300, delay: 0 },
  };
}
