/** Festive decoration for the home page hero. Purely visual, hidden from screen readers. */

const BUNTING = ["#F5C542", "#FF7A59", "#46C2E8", "#B8F35A", "#F7EBDD", "#FF7A59", "#F5C542", "#46C2E8"];

/** A string of pennants across the top of the hero, like a street party. */
export function Bunting() {
  const flags = 24;
  const w = 1200 / flags;
  return (
    <svg className="bunting" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 8 Q600 46 1200 8" fill="none" stroke="#F7EBDD" strokeOpacity="0.5" strokeWidth="2" />
      {Array.from({ length: flags }, (_, i) => {
        const x = i * w + 4;
        const t = (x + w / 2) / 1200;
        // Follow the sagging string: y on the quadratic curve at t.
        const y = 8 + 2 * t * (1 - t) * 38;
        return (
          <polygon
            key={i}
            className="pennant"
            style={{ animationDelay: `${i * 35}ms` }}
            points={`${x},${y} ${x + w - 8},${y} ${x + (w - 8) / 2},${y + 34}`}
            fill={BUNTING[i % BUNTING.length]}
          />
        );
      })}
    </svg>
  );
}

/** A cowry shell, JoinCowry's namesake: once money across West Africa, still a sign of good fortune. */
function Cowry({ x, y, size, rotate }: { x: string; y: string; size: number; rotate: number }) {
  return (
    <svg
      className="cowry"
      style={{ left: x, top: y, width: size, height: size * 1.35, transform: `rotate(${rotate}deg)` }}
      viewBox="0 0 40 54"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="20" cy="27" rx="18" ry="25" fill="#F7EBDD" />
      <ellipse cx="13" cy="18" rx="5" ry="9" fill="#FFFFFF" opacity="0.55" />
      <path d="M20 9 C16.5 19 16.5 35 20 45 C23.5 35 23.5 19 20 9 Z" fill="#7A5A3A" />
      {[14, 20, 26, 32, 38].map((cy) => (
        <g key={cy}>
          <line x1="16.5" y1={cy} x2="19" y2={cy} stroke="#F7EBDD" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="21" y1={cy} x2="23.5" y2={cy} stroke="#F7EBDD" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

export function CowryScatter() {
  return (
    <div className="cowries" aria-hidden="true">
      <Cowry x="7%" y="40%" size={40} rotate={-24} />
      <Cowry x="12%" y="72%" size={22} rotate={18} />
      <Cowry x="86%" y="36%" size={36} rotate={28} />
      <Cowry x="91%" y="68%" size={20} rotate={-12} />
      <Cowry x="78%" y="82%" size={16} rotate={40} />
    </div>
  );
}

/** "GN" → 🇬🇳. Systems without flag emoji show the two letters instead. */
export function flag(code: string): string {
  const cc = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return cc;
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
