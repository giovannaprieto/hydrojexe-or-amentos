import Link from "next/link";

import { Badge } from "@/components/ui-layout";
import { TIPOS_PROPOSTA, rotuloTipoProposta } from "@/lib/orcamento-tipos";

const STATUS = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "cancelado", rotulo: "Cancelado" },
];

export type FiltrosOrcamento = {
  q?: string;
  status?: string;
  responsavel?: string;
  tipo?: string;
  de?: string;
  ate?: string;
};

export function OrcamentosFiltros({
  valores,
  usuarios,
}: {
  valores: FiltrosOrcamento;
  usuarios: { id: string; nome: string }[];
}) {
  const algum = Object.values(valores).some((v) => v);
  const nomeResp = usuarios.find((u) => u.id === valores.responsavel)?.nome;

  return (
    <div className="hj-card hj-card-pad flex flex-col gap-4">
      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="hj-hint">Condomínio, CNPJ, administradora ou nº</span>
          <input
            type="text"
            name="q"
            defaultValue={valores.q ?? ""}
            placeholder="Ex.: Queluz, Auxiliadora, 0110…"
            className="hj-control"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="hj-hint">Status</span>
          <select
            name="status"
            defaultValue={valores.status ?? ""}
            className="hj-control"
          >
            <option value="">Todos</option>
            {STATUS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="hj-hint">Tipo de serviço</span>
          <select
            name="tipo"
            defaultValue={valores.tipo ?? ""}
            className="hj-control"
          >
            <option value="">Todos</option>
            {TIPOS_PROPOSTA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="hj-hint">Responsável</span>
          <select
            name="responsavel"
            defaultValue={valores.responsavel ?? ""}
            className="hj-control"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="hj-hint">De</span>
          <input
            type="date"
            name="de"
            defaultValue={valores.de ?? ""}
            className="hj-control"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="hj-hint">Até</span>
          <input
            type="date"
            name="ate"
            defaultValue={valores.ate ?? ""}
            className="hj-control"
          />
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="hj-btn hj-btn-primary">
            Filtrar
          </button>
          {algum ? (
            <Link href="/orcamentos" className="hj-btn hj-btn-secondary">
              Limpar
            </Link>
          ) : null}
        </div>
      </form>

      {algum ? (
        <div className="flex flex-wrap gap-1.5">
          {valores.q ? <Badge tom="info">“{valores.q}”</Badge> : null}
          {valores.status ? (
            <Badge tom="neutral">
              Status:{" "}
              {STATUS.find((s) => s.valor === valores.status)?.rotulo ??
                valores.status}
            </Badge>
          ) : null}
          {valores.tipo ? (
            <Badge tom="neutral">{rotuloTipoProposta(valores.tipo)}</Badge>
          ) : null}
          {nomeResp ? <Badge tom="neutral">Resp.: {nomeResp}</Badge> : null}
          {valores.de || valores.ate ? (
            <Badge tom="neutral">
              {valores.de || "…"} — {valores.ate || "…"}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
