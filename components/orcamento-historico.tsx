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

export function OrcamentoHistorico({ linhas }: { linhas: LinhaHistorico[] }) {
  if (linhas.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        Sem alterações registradas.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {linhas.map((l) => {
        const temDetalhe =
          (l.valor_antes != null && l.valor_antes !== "") ||
          (l.valor_depois != null && l.valor_depois !== "");
        return (
          <li
            key={l.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-medium">{l.descricao ?? l.acao}</span>
              <span className="text-xs text-black/50 dark:text-white/50">
                {quando(l.alterado_em)} · {l.usuario ?? "—"}
              </span>
            </div>
            {temDetalhe ? (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-black/50 dark:text-white/50">
                  ver antes / depois
                </summary>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  <pre className="overflow-x-auto rounded bg-black/[0.04] p-2 text-xs dark:bg-white/[0.06]">
                    {JSON.stringify(l.valor_antes, null, 2)}
                  </pre>
                  <pre className="overflow-x-auto rounded bg-black/[0.04] p-2 text-xs dark:bg-white/[0.06]">
                    {JSON.stringify(l.valor_depois, null, 2)}
                  </pre>
                </div>
              </details>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
