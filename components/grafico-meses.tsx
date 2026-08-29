/** Linha "criados x aprovados" nos últimos meses. SVG puro. */
export function GraficoMeses({
  dados,
}: {
  dados: { rotulo: string; criados: number; aprovados: number }[];
}) {
  if (dados.length === 0) return null;
  const w = 320;
  const h = 120;
  const pad = { t: 12, r: 8, b: 20, l: 8 };
  const max = Math.max(1, ...dados.flatMap((d) => [d.criados, d.aprovados]));
  const n = dados.length;
  const x = (i: number) =>
    pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, n - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const linha = (key: "criados" | "aprovados") =>
    dados.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");

  return (
    <div className="hj-card hj-card-pad">
      <div className="mb-2 flex items-center gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-navy-700" /> Criados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-500" /> Aprovados
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" aria-hidden>
        <path
          d={linha("criados")}
          fill="none"
          stroke="var(--color-navy-700)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={linha("aprovados")}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dados.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={h - 6}
            textAnchor="middle"
            className="fill-ink-400 text-[9px]"
          >
            {d.rotulo}
          </text>
        ))}
      </svg>
    </div>
  );
}
