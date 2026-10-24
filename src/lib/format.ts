export const MIAMI_TZ = "America/New_York";

export function formatMiamiTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: MIAMI_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
}

export function formatMiamiDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: MIAMI_TZ, weekday: "short", month: "short", day: "2-digit", year: "numeric" }).format(date);
}

export function formatMiamiDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { timeZone: MIAMI_TZ, month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" }).format(d);
}

export function formatAge(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatAltitude(ft: number | null, onGround: boolean): string {
  if (onGround) return "GROUND";
  if (ft === null) return "—";
  return `${Math.round(ft).toLocaleString("en-US")} FT`;
}

export function formatSpeed(kt: number | null): string {
  if (kt === null) return "—";
  return `${Math.round(kt)} KT · ${Math.round(kt * 1.15078)} MPH`;
}

export function formatHeading(deg: number | null, compass: (d: number) => string): string {
  if (deg === null) return "—";
  return `${Math.round(deg).toString().padStart(3, "0")}° ${compass(deg)}`;
}

export function formatCoord(lat: number, lon: number): string {
  const f = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
  return `${f(lat, "N", "S")}, ${f(lon, "E", "W")}`;
}
