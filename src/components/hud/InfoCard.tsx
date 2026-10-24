import type { BlimpApiResponse } from "@/lib/aircraft/types";
import { formatAge, formatAltitude, formatCoord, formatHeading, formatMiamiDateTime, formatSpeed } from "@/lib/format";
import { compassLabel } from "@/lib/geo";
import { blimpSvgMarkup } from "@/components/icons/blimpSprite";
import { StatusDot, statusLabel } from "./StatusDot";

interface Props {
  data: BlimpApiResponse;
  ageSeconds: number | null;
  onClose(): void;
  compact: boolean;
}

const SPRITE = blimpSvgMarkup({ id: "blimp-card-sprite", className: "info-sprite" });

export function InfoCard({ data, ageSeconds, onClose, compact }: Props) {
  const pos = data.position;
  return (
    <section className={`hud-panel info-card pointer-events-auto ${compact ? "info-card--compact" : ""}`} aria-label="Blimp details" role="dialog">
      <button type="button" className="info-close" onClick={onClose} aria-label="Close details">
        ×
      </button>
      <div className="info-head">
        <div className="info-sprite-wrap" dangerouslySetInnerHTML={{ __html: SPRITE }} />
        <div>
          <div className="hud-eyebrow">GOODYEAR AIRSHIP</div>
          <h3 className="info-name">{data.aircraft.name.toUpperCase()}</h3>
          <div className="info-meta">
            <span>{data.aircraft.registration}</span>
            <span>·</span>
            <span>{data.aircraft.typeDescription ?? data.aircraft.typeCode ?? "Zeppelin NT"}</span>
          </div>
          <div className="hud-live info-status" data-status={data.status}>
            <StatusDot status={data.status} />
            <span className="hud-live-label">{statusLabel(data.status)}</span>
          </div>
        </div>
      </div>
      <dl className="hud-rows info-rows">
        <div className="hud-row"><dt>ALTITUDE</dt><dd>{pos ? formatAltitude(pos.altitudeFt, pos.onGround) : "—"}</dd></div>
        <div className="hud-row"><dt>SPEED</dt><dd>{pos ? formatSpeed(pos.groundSpeedKt) : "—"}</dd></div>
        <div className="hud-row"><dt>HEADING</dt><dd>{pos ? formatHeading(pos.headingDeg, compassLabel) : "—"}</dd></div>
        <div className="hud-row"><dt>POSITION</dt><dd>{pos ? formatCoord(pos.lat, pos.lon) : "UNKNOWN"}</dd></div>
        <div className="hud-row"><dt>LAST UPDATE</dt><dd>{pos ? `${formatAge(ageSeconds)} · ${formatMiamiDateTime(pos.observedAt)}` : "—"}</dd></div>
        <div className="hud-row"><dt>SOURCE</dt><dd>{data.demo ? "DEMO (synthetic)" : data.source.name}</dd></div>
      </dl>
      <p className="hud-note">{data.message}</p>
    </section>
  );
}
