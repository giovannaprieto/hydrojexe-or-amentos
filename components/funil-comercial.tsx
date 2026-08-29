export function FunilComercial({
  etapas,
}: {
  etapas: { rotulo: string; total: number }[];
}) {
  const base = Math.max(1, etapas[0]?.total ?? 1);
  return (
    <div className="hj-card hj-card-pad">
      <ol className="flex flex-col gap-3">
        {etapas.map((e, i) => {
          const pct = Math.round((e.total / base) * 100);
          const anterior = i > 0 ? etapas[i - 1].total : null;
          const conv =
            anterior && anterior > 0
              ? Math.round((e.total / anterior) * 100)
              : null;
          return (
            <li key={e.rotulo} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium text-navy-900">
                {e.rotulo}
              </span>
              <div className="h-9 flex-1 overflow-hidden rounded-lg bg-ink-100">
                <div
                  className="flex h-full items-center rounded-lg bg-gradient-to-r from-navy-800 to-navy-600 px-3"
                  style={{ width: `${Math.max(pct, 6)}%` }}
                >
                  <span className="text-xs font-semibold text-white tabular-nums">
                    {e.total}
                  </span>
                </div>
              </div>
              <span className="w-16 shrink-0 text-right text-xs text-ink-500 tabular-nums">
                {conv != null ? `${conv}%` : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-ink-400">
        A % à direita é a passagem de uma etapa para a seguinte.
      </p>
    </div>
  );
}
