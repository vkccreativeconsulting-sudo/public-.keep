import { Map as MlMap, Marker } from "maplibre-gl";
import { blimpShadowMarkup, blimpSvgMarkup } from "@/components/icons/blimpSprite";
import { clamp, easeInOutCubic, lerp, lerpAngle } from "@/lib/geo";
import type { TrackingStatus } from "@/lib/aircraft/types";

export interface BlimpTarget {
  lat: number;
  lon: number;
  headingDeg: number | null;
}

interface Displayed {
  lat: number;
  lon: number;
  heading: number;
}

/**
 * Owns the DOM marker for the blimp: smooth tweening between reported
 * positions, heading rotation, zoom-dependent scale and status styling.
 * Never moves the marker anywhere a real position was not reported —
 * it only eases *between* two verified positions.
 */
export class BlimpMarkerController {
  readonly element: HTMLDivElement;
  private readonly marker: Marker;
  private readonly rotor: HTMLDivElement;
  private readonly shadowRotor: HTMLDivElement;
  private readonly map: MlMap;
  private displayed: Displayed | null = null;
  private raf = 0;
  private scale = 1;
  private reducedMotion: boolean;
  private onZoom: () => void;

  constructor(map: MlMap, onClick: () => void) {
    this.map = map;
    this.reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const el = document.createElement("div");
    el.className = "blimp-marker";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "Wingfoot Three blimp. Open details.");
    el.innerHTML = `
      <div class="blimp-pulse"></div>
      <div class="blimp-pulse blimp-pulse--delay"></div>
      <div class="blimp-shadow-rotor"><div class="blimp-shadow">${blimpShadowMarkup()}</div></div>
      <div class="blimp-rotor"><div class="blimp-float">${blimpSvgMarkup({ id: "blimp-marker-sprite" })}</div></div>
    `;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });
    this.element = el;
    this.rotor = el.querySelector(".blimp-rotor") as HTMLDivElement;
    this.shadowRotor = el.querySelector(".blimp-shadow-rotor") as HTMLDivElement;

    this.marker = new Marker({ element: el, anchor: "center", pitchAlignment: "viewport", rotationAlignment: "viewport" });
    this.onZoom = () => this.applyZoomScale();
    map.on("zoom", this.onZoom);
    this.applyZoomScale();
  }

  get current(): Displayed | null {
    return this.displayed;
  }

  setStatus(status: TrackingStatus) {
    this.element.dataset.status = status;
  }

  hide() {
    cancelAnimationFrame(this.raf);
    this.marker.remove();
    this.displayed = null;
  }

  /**
   * Move toward a newly reported position. The first position snaps; later
   * ones tween over `durationMs` (clamped) so the sprite glides between fixes.
   */
  setTarget(target: BlimpTarget, durationMs = 2200) {
    const heading = target.headingDeg ?? this.displayed?.heading ?? 0;
    if (!this.displayed) {
      this.displayed = { lat: target.lat, lon: target.lon, heading };
      this.marker.setLngLat([target.lon, target.lat]).addTo(this.map);
      this.applyTransform();
      return;
    }

    const from = { ...this.displayed };
    const to: Displayed = { lat: target.lat, lon: target.lon, heading };
    if (from.lat === to.lat && from.lon === to.lon && from.heading === to.heading) return;

    cancelAnimationFrame(this.raf);
    if (this.reducedMotion) {
      this.displayed = to;
      this.marker.setLngLat([to.lon, to.lat]);
      this.applyTransform();
      return;
    }

    const duration = clamp(durationMs, 400, 4000);
    const start = performance.now();
    const step = (now: number) => {
      const t = easeInOutCubic(clamp((now - start) / duration, 0, 1));
      this.displayed = {
        lat: lerp(from.lat, to.lat, t),
        lon: lerp(from.lon, to.lon, t),
        heading: lerpAngle(from.heading, to.heading, t),
      };
      this.marker.setLngLat([this.displayed.lon, this.displayed.lat]);
      this.applyTransform();
      if (t < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  private applyZoomScale() {
    const z = this.map.getZoom();
    // Reads as a map icon when zoomed out, grows as streets appear.
    this.scale = clamp(0.42 + (z - 7) * 0.11, 0.42, 1.55);
    this.element.style.setProperty("--blimp-scale", this.scale.toFixed(3));
    this.applyTransform();
  }

  private applyTransform() {
    const h = this.displayed?.heading ?? 0;
    // Keep the hull lettering readable: flip it when the nose points east-ish.
    this.element.classList.toggle("is-flipped", h > 0 && h < 180);
    this.rotor.style.transform = `rotate(${h}deg) scale(${this.scale})`;
    this.shadowRotor.style.transform = `translate(${(10 * this.scale).toFixed(1)}px, ${(14 * this.scale).toFixed(1)}px) rotate(${h}deg) scale(${this.scale})`;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.map.off("zoom", this.onZoom);
    this.marker.remove();
  }
}
