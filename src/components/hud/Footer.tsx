import type { DataSourceInfo } from "@/lib/aircraft/types";
import { formatMiamiDate, formatMiamiTime } from "@/lib/format";
import { TILE_ATTRIBUTION } from "@/lib/map/constants";

interface Props {
  now: number;
  source: DataSourceInfo | null;
  demo: boolean;
}

export function Disclaimer() {
  return (
    <p className="hud-disclaimer">
      Unofficial fan project. Not affiliated with, endorsed by, or connected to Rockstar Games, Take-Two Interactive, or The Goodyear Tire &amp; Rubber Company.
      “Grand Theft Auto” and “Vice City” are trademarks of their respective owners. Aircraft positions come from volunteer ADS-B receivers and may be delayed or incomplete.
    </p>
  );
}

export function Attribution({ source, demo }: { source: DataSourceInfo | null; demo: boolean }) {
  return (
    <div className="hud-attrib">
      <span dangerouslySetInnerHTML={{ __html: TILE_ATTRIBUTION }} />
      <span>
        {demo
          ? "Aircraft data: DEMO MODE (synthetic)"
          : source ? (
            <>
              Aircraft data:{" "}
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.name}
                </a>
              ) : (
                source.name
              )}
            </>
          ) : (
            "Aircraft data: connecting…"
          )}
      </span>
    </div>
  );
}

export function Footer({ now, source, demo }: Props) {
  const d = new Date(now);
  return (
    <aside className="hud-panel hud-footer pointer-events-auto" aria-label="Clock and attribution">
      <div className="hud-clock">
        <div className="hud-clock-time" suppressHydrationWarning>
          {formatMiamiTime(d)}
        </div>
        <div className="hud-clock-date" suppressHydrationWarning>
          {formatMiamiDate(d)} · MIAMI
        </div>
      </div>
      <Attribution source={source} demo={demo} />
      <Disclaimer />
    </aside>
  );
}
