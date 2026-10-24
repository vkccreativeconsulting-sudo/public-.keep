/**
 * Vice City palette. Shared between the MapLibre style and the HUD so the map
 * and interface read as one object.
 */
export const palette = {
  // Water
  oceanDeep: "#0e7f93",
  ocean: "#19a7b8",
  oceanShallow: "#2cc3cf",
  lagoon: "#49d4d8",
  river: "#3ccbd2",

  // Land
  land: "#cdbbe9",
  landLight: "#d8c9ef",
  residential: "#d4c3ed",
  commercial: "#dcc4e6",
  industrial: "#c7b4dc",
  park: "#a7dccb",
  parkDark: "#8fcfbb",
  wood: "#9fd3c3",
  sand: "#f4dfc0",
  wetland: "#b4d6d5",
  airport: "#c1afe0",
  runway: "#f2e6ff",
  building: "#bba6dd",
  buildingOutline: "#a68fd0",
  pitch: "#b6e3cf",
  cemetery: "#bcd7d0",

  // Roads
  roadMotorway: "#ff9bb8",
  roadMotorwayCasing: "#e1628e",
  roadTrunk: "#ffb6c8",
  roadPrimary: "#ffe3ec",
  roadPrimaryCasing: "#e693ae",
  roadSecondary: "#fff3f6",
  roadSecondaryCasing: "#e6a8bc",
  roadMinor: "#fff8f0",
  roadMinorCasing: "#d9b6cb",
  roadService: "#f7eef7",
  path: "#f0d2e0",
  rail: "#b092d6",
  ferry: "#2fbfd4",

  // Labels
  labelCity: "#2b1348",
  labelCityHalo: "rgba(255, 244, 251, 0.92)",
  labelNeighborhood: "#5a2d82",
  labelNeighborhoodHalo: "rgba(248, 236, 255, 0.85)",
  labelWater: "#eafcff",
  labelWaterHalo: "rgba(11, 110, 125, 0.6)",
  labelRoad: "#5b3b6f",
  labelRoadHalo: "rgba(255, 250, 252, 0.9)",

  // Neon accents
  neonPink: "#ff2d95",
  hotPink: "#ff5fb8",
  magenta: "#ff4fd8",
  violet: "#8a4dff",
  purple: "#5b2a9f",
  deepPurple: "#1b0b33",
  sunset: "#ff8c42",
  gold: "#ffd166",
  mint: "#4ff0c8",
  cyan: "#3ee6ff",
} as const;
