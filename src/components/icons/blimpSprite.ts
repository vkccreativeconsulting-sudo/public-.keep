/**
 * Original GTA-inspired blimp sprite modelled on the real Vice City livery of
 * Goodyear's Wingfoot Three: white envelope, black nose cap, black tail section
 * and fins, with "VICE CITY" lettering along the top of the envelope.
 *
 * Drawn from a slightly elevated top-down angle with the nose pointing up
 * (north). Returned as markup so it can be used both as a DOM map marker and
 * inside React via dangerouslySetInnerHTML.
 *
 * viewBox is 72×140; the geometric centre (36, 70) is the aircraft position.
 */
export const BLIMP_SPRITE_WIDTH = 72;
export const BLIMP_SPRITE_HEIGHT = 140;

let uid = 0;

const ENVELOPE = "M36 5 C 54 10, 62 44, 60 72 C 58 100, 48 122, 36 124 C 24 122, 14 100, 12 72 C 10 44, 18 10, 36 5 Z";
const INK = "#15121c";
const WHITE = "#fbfbff";

export function blimpSvgMarkup(opts: { id?: string; className?: string } = {}): string {
  const id = opts.id ?? `blimp-${++uid}`;
  const cls = opts.className ? ` class="${opts.className}"` : "";
  return `
<svg${cls} viewBox="0 0 ${BLIMP_SPRITE_WIDTH} ${BLIMP_SPRITE_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="${id}-clip"><path d="${ENVELOPE}"/></clipPath>
    <linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#2b2340" stop-opacity="0.28"/>
    </linearGradient>
    <linearGradient id="${id}-ink" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2a2535"/>
      <stop offset="0.5" stop-color="${INK}"/>
      <stop offset="1" stop-color="#05040a"/>
    </linearGradient>
  </defs>

  <!-- tail fins (X configuration seen from above) -->
  <path d="M36 104 L8 126 L17 132 L36 118 Z" fill="url(#${id}-ink)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M36 104 L64 126 L55 132 L36 118 Z" fill="url(#${id}-ink)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M33 100 L39 100 L41 134 L31 134 Z" fill="#2a2535" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <!-- fin tips -->
  <path d="M12 125 L17 128.5" stroke="${WHITE}" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
  <path d="M60 125 L55 128.5" stroke="${WHITE}" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>

  <!-- gondola (sits slightly aft and toward the viewer) -->
  <rect x="29" y="74" width="14" height="24" rx="5" fill="${INK}" stroke="${INK}" stroke-width="2"/>
  <rect x="31.5" y="78" width="9" height="5" rx="1.5" fill="#9fd9ff" opacity="0.95"/>

  <!-- envelope: white hull -->
  <path d="${ENVELOPE}" fill="${WHITE}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  <g clip-path="url(#${id}-clip)">
    <!-- black tail section with a swept leading edge -->
    <path d="M8 96 C 22 90, 50 90, 64 96 L 64 130 L 8 130 Z" fill="url(#${id}-ink)"/>
    <!-- black nose cap -->
    <path d="M8 22 C 22 26.5, 50 26.5, 64 22 L 64 0 L 8 0 Z" fill="url(#${id}-ink)"/>
    <!-- pinstripes -->
    <path d="M8 27.5 C 22 32, 50 32, 64 27.5" fill="none" stroke="${INK}" stroke-width="1.4"/>
    <path d="M8 90.5 C 22 84.5, 50 84.5, 64 90.5" fill="none" stroke="${INK}" stroke-width="1.4"/>
    <!-- VICE CITY lettering, running nose to tail along the top of the hull -->
    <g class="blimp-text">
      <text x="0" y="0" transform="translate(42 33) rotate(90)" fill="${INK}" font-family="var(--font-display), 'Bebas Neue', Impact, 'Arial Narrow', sans-serif" font-size="17" letter-spacing="0.6" font-weight="400">VICE CITY</text>
    </g>
    <!-- hull shading -->
    <path d="${ENVELOPE}" fill="url(#${id}-shade)"/>
  </g>

  <!-- nose badge -->
  <circle cx="36" cy="13" r="4.6" fill="${INK}" stroke="${WHITE}" stroke-width="1.2"/>
  <text x="36" y="15.6" text-anchor="middle" fill="${WHITE}" font-family="var(--font-display), 'Bebas Neue', Impact, sans-serif" font-size="6.8" letter-spacing="0.3">VI</text>
</svg>`;
}

/** Flat silhouette used for the drop shadow. */
export function blimpShadowMarkup(): string {
  return `
<svg viewBox="0 0 ${BLIMP_SPRITE_WIDTH} ${BLIMP_SPRITE_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M36 104 L8 126 L17 132 L36 118 Z M36 104 L64 126 L55 132 L36 118 Z M33 100 L39 100 L41 134 L31 134 Z" fill="#1b0b33"/>
  <path d="${ENVELOPE}" fill="#1b0b33"/>
</svg>`;
}
