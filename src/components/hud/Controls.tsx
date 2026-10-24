interface Props {
  canTrack: boolean;
  follow: boolean;
  showTrail: boolean;
  onTrack(): void;
  onToggleFollow(): void;
  onToggleTrail(): void;
  onReset(): void;
  compact: boolean;
}

const Icon = {
  track: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  follow: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l3.5 7.5L23 12l-7.5 1.5L12 21l-3.5-7.5L1 12l7.5-1.5z" fill="currentColor" />
    </svg>
  ),
  trail: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 18c4-1 5-7 9-7s5 5 9-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
      <circle cx="21" cy="7" r="2.2" fill="currentColor" />
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.5-5.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 4v5h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Controls({ canTrack, follow, showTrail, onTrack, onToggleFollow, onToggleTrail, onReset, compact }: Props) {
  const items = [
    { key: "track", label: "TRACK BLIMP", icon: Icon.track, onClick: onTrack, disabled: !canTrack, active: false },
    { key: "follow", label: `FOLLOW ${follow ? "ON" : "OFF"}`, icon: Icon.follow, onClick: onToggleFollow, disabled: !canTrack, active: follow },
    { key: "trail", label: showTrail ? "HIDE FLIGHT PATH" : "SHOW FLIGHT PATH", icon: Icon.trail, onClick: onToggleTrail, disabled: false, active: showTrail },
    { key: "reset", label: "RESET VIEW", icon: Icon.reset, onClick: onReset, disabled: false, active: false },
  ];
  return (
    <nav className={`hud-controls pointer-events-auto ${compact ? "hud-controls--compact" : ""}`} aria-label="Map controls">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          className="hud-btn"
          data-active={it.active}
          disabled={it.disabled}
          onClick={it.onClick}
          aria-pressed={it.key === "follow" || it.key === "trail" ? it.active : undefined}
          aria-label={it.label}
          title={it.label}
        >
          <span className="hud-btn-icon">{it.icon}</span>
          <span className="hud-btn-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
