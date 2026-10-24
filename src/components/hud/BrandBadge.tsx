import type { TrackingStatus } from "@/lib/aircraft/types";
import { StatusDot, statusLabel } from "./StatusDot";

interface Props {
  status: TrackingStatus | null;
  ageSeconds: number | null;
  fetching: boolean;
  compact: boolean;
}

export function BrandBadge({ status, ageSeconds, fetching, compact }: Props) {
  const fresh = ageSeconds === null ? "" : ageSeconds < 60 ? `${ageSeconds}s` : ageSeconds < 3600 ? `${Math.floor(ageSeconds / 60)}m` : `${Math.floor(ageSeconds / 3600)}h`;
  return (
    <div className="hud-panel hud-brand pointer-events-auto" data-compact={compact}>
      <h1 className="hud-title">
        <span className="hud-title-vice">VICE CITY</span>
        <span className="hud-title-air">AIRWATCH</span>
      </h1>
      <p className="hud-subtitle">THE SKIES ARE OURS</p>
      <div className="hud-live" data-status={status ?? "PENDING"} aria-live="polite">
        <StatusDot status={status} />
        <span className="hud-live-label">{statusLabel(status)}</span>
        {fresh && <span className="hud-live-age">· {fresh}</span>}
        <span className={`hud-live-spinner ${fetching ? "is-on" : ""}`} aria-hidden="true" />
      </div>
    </div>
  );
}
