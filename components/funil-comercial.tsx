export function FunilComercial({
  etapas,
}: {
  etapas: { rotulo: string; total: number }[];
}) {
  const maximo = Math.max(1, ...etapas.map((e) => e.total));
  return (
    <div className="hj-card hj-card-pad">
      <ol className="flex flex-col gap-2.5">
        {etapas.map((e, i) => {
          const pct = Math.round((e.total / maximo) * 100);
          const anterior = i > 0 ? etapas[i - 1].total : null;
          const queda =
            anterior && anterior > 0
              ? Math.round((e.total / anterior) * 100)
              : null;
          return (
            <li key={e.rotulo} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium text-navy-900">
                {e.rotulo}
              </span>
              <div className="h-8 flex-1 overflow-hidden rounded-lg bg-ink-100">
                <div
                  className="flex h-full items-center rounded-lg bg-navy-800 px-3"
                  style={{ width: `${Math.max(pct, 8)}%` }}
                >
                  <span className="text-xs font-semibold text-white tabular-nums">
                    {e.total}
                  </span>
                </div>
              </div>
              <span className="w-12 shrink-0 text-right text-xs text-ink-500 tabular-nums">
                {queda != null ? `${queda}%` : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
