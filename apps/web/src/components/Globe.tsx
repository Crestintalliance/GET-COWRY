import createGlobe from "cobe";
import { useEffect, useRef } from "react";

// Where JoinCowry customers fly home to, and where many of them live.
const HOMES: [number, number][] = [
  [9.64, -13.58], // Conakry
  [14.72, -17.47], // Dakar
  [5.36, -4.01], // Abidjan
  [12.64, -8.0], // Bamako
  [6.52, 3.38], // Lagos
  [5.6, -0.19], // Accra
  [-15.42, 28.28], // Lusaka
  [18.0, -76.79], // Kingston
  [18.54, -72.34], // Port-au-Prince
  [18.49, -69.93], // Santo Domingo
  [10.65, -61.51], // Port of Spain
  [8.98, -79.52], // Panama City
  [4.71, -74.07], // Bogotá
  [-23.55, -46.63], // São Paulo
  [19.43, -99.13], // Mexico City
];
const DIASPORA: [number, number][] = [
  [40.71, -74.0], // New York
  [33.75, -84.39], // Atlanta
  [35.05, -78.88], // Fayetteville
  [48.86, 2.35], // Paris
];

const ARCS = [
  { from: DIASPORA[0]!, to: HOMES[0]! },
  { from: DIASPORA[1]!, to: HOMES[7]! },
  { from: DIASPORA[2]!, to: HOMES[11]! },
  { from: DIASPORA[3]!, to: HOMES[1]! },
  { from: DIASPORA[0]!, to: HOMES[8]! },
];

/** A slowly turning globe with the trips home drawn as arcs. Drag to spin it. */
export function Globe({ size = 520 }: { size?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Start facing the Atlantic: the Americas on the left, West Africa on the right.
    let phi = 4.75;
    let drag: number | null = null;
    let dragDelta = 0;

    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(el, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta: 0.18,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 18000,
        mapBrightness: 5,
        mapBaseBrightness: 0.04,
        baseColor: [0.09, 0.3, 0.22],
        markerColor: [0.72, 0.95, 0.35],
        glowColor: [0.2, 0.45, 0.33],
        markers: [
          ...HOMES.map((location) => ({ location, size: 0.045 })),
          ...DIASPORA.map((location) => ({ location, size: 0.03, color: [0.96, 0.77, 0.26] as [number, number, number] })),
        ],
        arcs: ARCS,
        arcColor: [0.96, 0.77, 0.26],
        arcWidth: 0.6,
        arcHeight: 0.35,
      });
    } catch {
      // No WebGL: leave the space empty rather than break the page.
      el.style.display = "none";
      return;
    }

    let frame = 0;
    const tick = () => {
      if (drag === null && !still) phi += 0.0035;
      globe.update({ phi: phi + dragDelta });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    el.style.opacity = "1";

    const down = (e: PointerEvent) => {
      drag = e.clientX - dragDelta * 200;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (drag !== null) dragDelta = (e.clientX - drag) / 200;
    };
    const up = () => {
      drag = null;
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [size]);

  return (
    <canvas
      ref={canvas}
      className="globe"
      style={{ width: "100%", maxWidth: size, aspectRatio: "1 / 1" }}
      aria-hidden="true"
    />
  );
}
