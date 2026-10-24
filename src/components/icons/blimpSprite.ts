/**
 * Original GTA-inspired blimp sprite, drawn from a slightly elevated top-down
 * angle with the nose pointing up (north). Returned as markup so it can be used
 * both as a DOM map marker and inside React via dangerouslySetInnerHTML.
 *
 * viewBox is 72×140; the geometric centre (36, 70) is the aircraft position.
 */
export const BLIMP_SPRITE_WIDTH = 72;
export const BLIMP_SPRITE_HEIGHT = 140;

let uid = 0;

export function blimpSvgMarkup(opts: { id?: string; className?: string } = {}): string {
  const id = opts.id ?? `blimp-${++uid}`;
  const cls = opts.className ? ` class="${opts.className}"` : "";
  return `
<svg${cls} viewBox="0 0 ${BLIMP_SPRITE_WIDTH} ${BLIMP_SPRITE_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}-env" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff9fd0"/>
      <stop offset="0.38" stop-color="#ff3fa4"/>
      <stop offset="0.7" stop-color="#c04bff"/>
      <stop offset="1" stop-color="#5d27c9"/>
    </linearGradient>
    <linearGradient id="${id}-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe9f5"/>
      <stop offset="1" stop-color="#ffb3dd"/>
    </linearGradient>
    <radialGradient id="${id}-hl" cx="0.35" cy="0.3" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-fin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff5fb8"/>
      <stop offset="1" stop-color="#8e3cff"/>
    </linearGradient>
  </defs>

  <!-- tail fins (X configuration seen from above) -->
  <path d="M36 104 L8 126 L17 132 L36 118 Z" fill="url(#${id}-fin)" stroke="#2a0f45" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M36 104 L64 126 L55 132 L36 118 Z" fill="url(#${id}-fin)" stroke="#2a0f45" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M33 100 L39 100 L41 134 L31 134 Z" fill="#b84dff" stroke="#2a0f45" stroke-width="2.2" stroke-linejoin="round"/>

  <!-- gondola (sits slightly aft and toward the viewer) -->
  <rect x="29" y="74" width="14" height="24" rx="5" fill="#1d0b36" stroke="#2a0f45" stroke-width="2"/>
  <rect x="31.5" y="78" width="9" height="5" rx="1.5" fill="#3ee6ff" opacity="0.9"/>

  <!-- envelope -->
  <path d="M36 5 C 54 10, 62 44, 60 72 C 58 100, 48 122, 36 124 C 24 122, 14 100, 12 72 C 10 44, 18 10, 36 5 Z"
        fill="url(#${id}-env)" stroke="#2a0f45" stroke-width="2.6" stroke-linejoin="round"/>

  <!-- livery band + stripes -->
  <path d="M13.2 62 C 20 59, 52 59, 58.8 62 L 59.4 70 C 52 67, 20 67, 12.6 70 Z" fill="url(#${id}-band)" opacity="0.95"/>
  <path d="M15 84 C 24 81, 48 81, 57 84" fill="none" stroke="#ffe9f5" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
  <path d="M19 96 C 27 93.5, 45 93.5, 53 96" fill="none" stroke="#3ee6ff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>

  <!-- wordmark suggestion (abstract, non-legible on purpose) -->
  <g fill="#2a0f45" opacity="0.8">
    <rect x="24" y="63.2" width="4" height="4.4" rx="0.6"/>
    <rect x="30" y="63.2" width="4" height="4.4" rx="0.6"/>
    <rect x="36" y="63.2" width="4" height="4.4" rx="0.6"/>
    <rect x="42" y="63.2" width="4" height="4.4" rx="0.6"/>
  </g>

  <!-- highlight -->
  <ellipse cx="28" cy="48" rx="9" ry="30" fill="url(#${id}-hl)"/>

  <!-- nose cone + beacon -->
  <circle cx="36" cy="9" r="3.2" fill="#ffd166" stroke="#2a0f45" stroke-width="1.6"/>
</svg>`;
}

/** Flat silhouette used for the drop shadow. */
export function blimpShadowMarkup(): string {
  return `
<svg viewBox="0 0 ${BLIMP_SPRITE_WIDTH} ${BLIMP_SPRITE_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M36 104 L8 126 L17 132 L36 118 Z M36 104 L64 126 L55 132 L36 118 Z M33 100 L39 100 L41 134 L31 134 Z" fill="#1b0b33"/>
  <path d="M36 5 C 54 10, 62 44, 60 72 C 58 100, 48 122, 36 124 C 24 122, 14 100, 12 72 C 10 44, 18 10, 36 5 Z" fill="#1b0b33"/>
</svg>`;
}
