/** Mini gráfico de barras (sparkline). SVG puro, sem biblioteca. */
export function MiniTendencia({
  valores,
  className = "",
}: {
  valores: number[];
  className?: string;
}) {
  if (valores.length === 0) return null;
  const max = Math.max(1, ...valores);
  const w = 100;
  const h = 32;
  const gap = 3;
  const bw = (w - gap * (valores.length - 1)) / valores.length;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`h-8 w-full ${className}`}
      aria-hidden
    >
      {valores.map((v, i) => {
        const bh = Math.max(2, (v / max) * h);
        const ultimo = i === valores.length - 1;
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={1.5}
            className={ultimo ? "fill-brand-500" : "fill-ink-300"}
          />
        );
      })}
    </svg>
  );
}
