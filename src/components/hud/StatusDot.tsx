import type { TrackingStatus } from "@/lib/aircraft/types";

export function statusLabel(status: TrackingStatus | null): string {
  switch (status) {
    case "LIVE":
      return "LIVE";
    case "LAST_SEEN":
      return "LAST SEEN";
    case "DEMO":
      return "DEMO";
    case "OFFLINE":
      return "OFFLINE";
    default:
      return "CONNECTING";
  }
}

export function StatusDot({ status, className = "" }: { status: TrackingStatus | null; className?: string }) {
  return <span className={`status-dot ${className}`} data-status={status ?? "PENDING"} aria-hidden="true" />;
}
