import type { BlimpApiResponse, TrackingStatus } from "@/lib/aircraft/types";
import { formatAge, formatAltitude, formatHeading, formatMiamiDateTime, formatSpeed } from "@/lib/format";
import { compassLabel } from "@/lib/geo";
import { StatusDot, statusLabel } from "./StatusDot";

interface Props {
  data: BlimpApiResponse | null;
  status: TrackingStatus | null;
  ageSeconds: number | null;
  error: string | null;
}

export function StatusRows({ data, status, ageSeconds, error }: Props) {
  const pos = data?.position ?? null;
  const rows: Array<[string, string, string?]> = [
    ["STATUS", statusLabel(status), `status-${status ?? "PENDING"}`],
    ["ALTITUDE", pos ? formatAltitude(pos.altitudeFt, pos.onGround) : "—"],
    ["SPEED", pos ? formatSpeed(pos.groundSpeedKt) : "—"],
    ["HEADING", pos ? formatHeading(pos.headingDeg, compassLabel) : "—"],
    ["LAST SIGNAL", pos ? formatAge(ageSeconds) : data ? "NO SIGNAL" : "—"],
  ];
  return (
    <dl className="hud-rows">
      {rows.map(([k, v, cls]) => (
        <div key={k} className="hud-row">
          <dt>{k}</dt>
          <dd className={cls ?? ""}>{v}</dd>
        </div>
      ))}
      {pos && (
        <div className="hud-row hud-row--sub">
          <dt>OBSERVED</dt>
          <dd>{formatMiamiDateTime(pos.observedAt)}</dd>
        </div>
      )}
      {(data?.message || error) && (
        <p className="hud-note" role="status">
          {error && !data ? `Tracker unreachable: ${error}` : data?.message}
        </p>
      )}
    </dl>
  );
}

export function StatusPanel(props: Props) {
  const { data, status } = props;
  return (
    <section className="hud-panel hud-status pointer-events-auto" aria-label="Aircraft status">
      <header className="hud-status-head">
        <div>
          <div className="hud-eyebrow">TRACKING</div>
          <h2 className="hud-callsign">{(data?.aircraft.name ?? "Wingfoot Three").toUpperCase()}</h2>
        </div>
        <div className="hud-reg">
          <StatusDot status={status} />
          <span>{data?.aircraft.registration ?? "N3A"}</span>
        </div>
      </header>
      <StatusRows {...props} />
    </section>
  );
}
