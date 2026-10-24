import { Map as MlMap, Marker } from "maplibre-gl";
import { LANDMARKS, type Landmark, type LandmarkKind } from "@/lib/map/landmarks";

const ICONS: Record<LandmarkKind, string> = {
  stadium: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke="currentColor" stroke-width="2.4"/><ellipse cx="12" cy="12" rx="4" ry="2.4" fill="currentColor"/></svg>`,
  airport: `<svg viewBox="0 0 24 24"><path d="M12 2 L14 9 L22 12 L22 14 L14 12.5 L13.5 18 L16 20 L16 21.5 L12 20.5 L8 21.5 L8 20 L10.5 18 L10 12.5 L2 14 L2 12 L10 9 Z" fill="currentColor"/></svg>`,
  base: `<svg viewBox="0 0 24 24"><path d="M3 20 L3 11 Q12 2 21 11 L21 20 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="12" cy="14" rx="5" ry="2.6" fill="currentColor"/></svg>`,
  district: `<svg viewBox="0 0 24 24"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="currentColor"/><path d="M12 7 L17 12 L12 17 L7 12 Z" fill="#1b0b33"/></svg>`,
  beach: `<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5" fill="currentColor"/><path d="M2 20 Q7 16 12 20 T22 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  downtown: `<svg viewBox="0 0 24 24"><path d="M3 21 L3 12 L7 12 L7 7 L11 7 L11 3 L14 3 L14 9 L17 9 L17 14 L21 14 L21 21 Z" fill="currentColor"/></svg>`,
};

/** GTA-style pins for real Miami landmarks, revealed progressively by zoom. */
export class LandmarkMarkers {
  private markers: { marker: Marker; landmark: Landmark; el: HTMLElement }[] = [];
  private readonly onZoom: () => void;

  constructor(private readonly map: MlMap) {
    for (const landmark of LANDMARKS) {
      const el = document.createElement("div");
      el.className = `lm lm--${landmark.kind}`;
      el.innerHTML = `
        <div class="lm-pin">${ICONS[landmark.kind]}</div>
        <div class="lm-label">${landmark.name}</div>
        <div class="lm-card"><strong>${landmark.name}</strong><span>${landmark.blurb}</span></div>
      `;
      const marker = new Marker({ element: el, anchor: "bottom" }).setLngLat([landmark.lon, landmark.lat]).addTo(map);
      this.markers.push({ marker, landmark, el });
    }
    this.onZoom = () => this.update();
    map.on("zoom", this.onZoom);
    this.update();
  }

  private update() {
    const z = this.map.getZoom();
    for (const { landmark, el } of this.markers) {
      el.classList.toggle("is-hidden", z < landmark.minZoom);
      el.classList.toggle("lm--labels", z >= landmark.minZoom + 0.8);
    }
  }

  destroy() {
    this.map.off("zoom", this.onZoom);
    for (const { marker } of this.markers) marker.remove();
    this.markers = [];
  }
}
