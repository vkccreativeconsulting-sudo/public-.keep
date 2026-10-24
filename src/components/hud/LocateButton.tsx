interface Props {
  onClick(): void;
  visible: boolean;
  label?: string;
}

export function LocateButton({ onClick, visible, label = "LOCATE THE BLIMP" }: Props) {
  return (
    <button type="button" className={`locate-btn pointer-events-auto ${visible ? "is-visible" : ""}`} onClick={onClick} aria-hidden={!visible} tabIndex={visible ? 0 : -1}>
      <span className="locate-btn-ring" aria-hidden="true" />
      <span className="locate-btn-label">{label}</span>
    </button>
  );
}
