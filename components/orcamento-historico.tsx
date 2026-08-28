import type { Json } from "@/types/database";

export type LinhaHistorico = {
  id: string;
  acao: string;
  campo: string | null;
  valor_antes: Json;
  valor_depois: Json;
  descricao: string | null;
  alterado_em: string;
  usuario: string | null;
};

function quando(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COR_ACAO: Record<string, string> = {
  criar: "bg-emerald-500",
  atualizar: "bg-brand-500",
  excluir: "bg-red-500",
};

export function OrcamentoHistorico({ linhas }: { linhas: LinhaHistorico[] }) {
  if (linhas.length === 0) {
    return (
      <div className="hj-card hj-card-pad text-sm text-ink-400">
        Sem alterações registradas.
      </div>
    );
  }

  return (
    <div className="hj-card hj-card-pad">
      <ol className="flex flex-col">
        {linhas.map((l, i) => {
          const temDetalhe =
            (l.valor_antes != null && l.valor_antes !== "") ||
            (l.valor_depois != null && l.valor_depois !== "");
          const ultimo = i === linhas.length - 1;
          return (
            <li key={l.id} className="relative flex gap-4 pb-5 last:pb-0">
              {/* linha do tempo */}
              {!ultimo ? (
                <span
                  aria-hidden
                  className="absolute top-4 bottom-0 left-[5px] w-px bg-ink-200"
                />
              ) : null}
              <span
                aria-hidden
                className={`relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white ${
                  COR_ACAO[l.acao] ?? "bg-ink-400"
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-sm font-medium text-navy-900">
                    {l.descricao ?? l.acao}
                  </span>
                  <span className="text-xs text-ink-400">
                    {quando(l.alterado_em)} · {l.usuario ?? "—"}
                  </span>
                </div>
                {temDetalhe ? (
                  <details className="mt-1.5 group">
                    <summary className="w-fit cursor-pointer text-xs font-medium text-brand-600 transition-colors hover:text-brand-700">
                      ver antes / depois
                    </summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <pre className="overflow-x-auto rounded-lg bg-ink-50 p-3 text-[0.7rem] leading-relaxed text-ink-700">
                        {JSON.stringify(l.valor_antes, null, 2)}
                      </pre>
                      <pre className="overflow-x-auto rounded-lg bg-ink-50 p-3 text-[0.7rem] leading-relaxed text-ink-700">
                        {JSON.stringify(l.valor_depois, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
