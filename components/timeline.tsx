import type { Json } from "@/types/database";

export type LinhaTimeline = {
  id: string;
  /** título curto da linha */
  titulo: string;
  /** data/hora ISO */
  quando: string;
  /** autor da ação */
  autor?: string | null;
  /** cor do marcador */
  tom?: "criar" | "atualizar" | "excluir" | "snapshot";
  /** contexto opcional (ex.: número do orçamento) */
  contexto?: string | null;
  /** detalhe antes/depois (opcional) */
  antes?: Json;
  depois?: Json;
};

const COR: Record<string, string> = {
  criar: "bg-emerald-500",
  atualizar: "bg-brand-500",
  excluir: "bg-red-500",
  snapshot: "bg-navy-700",
};

function quandoFmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function temValor(v: Json | undefined): boolean {
  return v != null && v !== "";
}

export function Timeline({
  linhas,
  vazio = "Sem registros.",
}: {
  linhas: LinhaTimeline[];
  vazio?: string;
}) {
  if (linhas.length === 0) {
    return (
      <div className="hj-card hj-card-pad text-sm text-ink-400">{vazio}</div>
    );
  }

  return (
    <div className="hj-card hj-card-pad">
      <ol className="flex flex-col">
        {linhas.map((l, i) => {
          const detalhe = temValor(l.antes) || temValor(l.depois);
          const ultimo = i === linhas.length - 1;
          return (
            <li key={l.id} className="relative flex gap-4 pb-5 last:pb-0">
              {!ultimo ? (
                <span
                  aria-hidden
                  className="absolute top-4 bottom-0 left-[5px] w-px bg-ink-200"
                />
              ) : null}
              <span
                aria-hidden
                className={`relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white ${
                  COR[l.tom ?? "atualizar"] ?? "bg-ink-400"
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-sm font-medium text-navy-900">
                    {l.contexto ? (
                      <span className="text-ink-500">{l.contexto} · </span>
                    ) : null}
                    {l.titulo}
                  </span>
                  <span className="text-xs text-ink-400">
                    {quandoFmt(l.quando)} · {l.autor ?? "—"}
                  </span>
                </div>
                {detalhe ? (
                  <details className="group mt-1.5">
                    <summary className="w-fit cursor-pointer text-xs font-medium text-brand-600 transition-colors hover:text-brand-700">
                      ver antes / depois
                    </summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <pre className="overflow-x-auto rounded-lg bg-ink-50 p-3 text-[0.7rem] leading-relaxed text-ink-700">
                        {JSON.stringify(l.antes ?? null, null, 2)}
                      </pre>
                      <pre className="overflow-x-auto rounded-lg bg-ink-50 p-3 text-[0.7rem] leading-relaxed text-ink-700">
                        {JSON.stringify(l.depois ?? null, null, 2)}
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
