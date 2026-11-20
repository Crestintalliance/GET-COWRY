/** A round country flag. Uses SVG files rather than emoji, which Windows doesn't display. */
export function Flag({ code, size = 40 }: { code: string; size?: number }) {
  return (
    <img
      className="flag-img"
      src={`/flags/${code.toUpperCase()}.svg`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
