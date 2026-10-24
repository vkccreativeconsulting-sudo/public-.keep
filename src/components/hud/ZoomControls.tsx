interface Props {
  onZoomIn(): void;
  onZoomOut(): void;
}

export function ZoomControls({ onZoomIn, onZoomOut }: Props) {
  return (
    <div className="hud-zoom pointer-events-auto" aria-label="Zoom">
      <button type="button" className="hud-zoom-btn" onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" className="hud-zoom-btn" onClick={onZoomOut} aria-label="Zoom out">
        −
      </button>
    </div>
  );
}
