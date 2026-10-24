/**
 * Original GTA-inspired blimp sprite modelled on the real Vice City wrap of
 * Goodyear's Wingfoot Three: black envelope, "Vice City" in pink script,
 * yellow tail fins carrying the N3A registration, a light gondola and a
 * small VI badge near the nose. No third-party logos are reproduced.
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
const INK = "#0d0b12";
const RIM = "#f3f1f7";
const PINK = "#ff3fb3";
const SCRIPT_FONT = "var(--font-script), 'Pacifico', 'Brush Script MT', cursive";
const DISPLAY_FONT = "var(--font-display), 'Bebas Neue', Impact, 'Arial Narrow', sans-serif";

export function blimpSvgMarkup(opts: { id?: string; className?: string } = {}): string {
  const id = opts.id ?? `blimp-${++uid}`;
  const cls = opts.className ? ` class="${opts.className}"` : "";
  return `
<svg${cls} viewBox="0 0 ${BLIMP_SPRITE_WIDTH} ${BLIMP_SPRITE_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="${id}-clip"><path d="${ENVELOPE}"/></clipPath>
    <linearGradient id="${id}-hull" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4a4656"/>
      <stop offset="0.3" stop-color="#1c1924"/>
      <stop offset="0.75" stop-color="${INK}"/>
      <stop offset="1" stop-color="#2a2735"/>
    </linearGradient>
    <linearGradient id="${id}-fin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe66b"/>
      <stop offset="1" stop-color="#f2b900"/>
    </linearGradient>
    <linearGradient id="${id}-gondola" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#c9c7d2"/>
    </linearGradient>
  </defs>

  <!-- tail fins (X configuration seen from above): Goodyear-yellow with N3A -->
  <path d="M36 104 L8 126 L17 132 L36 118 Z" fill="url(#${id}-fin)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M36 104 L64 126 L55 132 L36 118 Z" fill="url(#${id}-fin)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M33 100 L39 100 L41 134 L31 134 Z" fill="url(#${id}-fin)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <text transform="translate(52 125) rotate(38)" text-anchor="middle" fill="${INK}" font-family="${DISPLAY_FONT}" font-size="6" letter-spacing="0.4">N3A</text>
  <text transform="translate(20 125) rotate(-38)" text-anchor="middle" fill="${INK}" font-family="${DISPLAY_FONT}" font-size="6" letter-spacing="0.4">N3A</text>

  <!-- gondola (light, sits slightly aft and toward the viewer) -->
  <rect x="29" y="74" width="14" height="24" rx="5" fill="url(#${id}-gondola)" stroke="${INK}" stroke-width="2"/>
  <rect x="31.5" y="78" width="9" height="5" rx="1.5" fill="#1b2a3a" opacity="0.9"/>
  <rect x="31.5" y="85" width="9" height="3" rx="1.2" fill="#1b2a3a" opacity="0.6"/>

  <!-- envelope: black hull with rim light -->
  <path d="${ENVELOPE}" fill="url(#${id}-hull)" stroke="${RIM}" stroke-width="2" stroke-linejoin="round"/>
  <path d="${ENVELOPE}" fill="none" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>
  <g clip-path="url(#${id}-clip)">
    <!-- subtle panel seams -->
    <path d="M8 40 C 22 44, 50 44, 64 40" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
    <path d="M8 98 C 22 93, 50 93, 64 98" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
    <!-- "Vice City" script, running nose to tail along the top of the hull -->
    <g class="blimp-text">
      <text x="0" y="0" transform="translate(43 30) rotate(90)" fill="${PINK}" stroke="#ffffff" stroke-width="1.1" paint-order="stroke" stroke-linejoin="round" font-family="${SCRIPT_FONT}" font-size="15.5" letter-spacing="-0.2">Vice City</text>
    </g>
  </g>

  <!-- VI badge near the nose -->
  <circle cx="36" cy="16" r="5" fill="${RIM}" stroke="${INK}" stroke-width="1.2"/>
  <text x="36" y="18.6" text-anchor="middle" fill="${INK}" font-family="${DISPLAY_FONT}" font-size="7" letter-spacing="0.3">VI</text>
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
