interface Props {
  done: boolean;
  error: string | null;
}

export function LoadingScreen({ done, error }: Props) {
  return (
    <div className={`loading ${done ? "is-done" : ""}`} aria-hidden={done} role="status" aria-live="polite">
      <div className="loading-sky" />
      <div className="loading-sun" />
      <div className="loading-grid" />
      <div className="loading-content">
        <div className="loading-kicker">NOW ENTERING</div>
        <div className="loading-title">
          <span>VICE CITY</span>
          <span className="loading-title-air">AIRWATCH</span>
        </div>
        <div className="loading-sub">THE SKIES ARE OURS</div>
        <div className="loading-bar">
          <span />
        </div>
        <div className="loading-hint">{error ? `MAP TILES UNAVAILABLE — ${error}` : "LOADING MAP · ACQUIRING SIGNAL"}</div>
      </div>
    </div>
  );
}
