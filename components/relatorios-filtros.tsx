import Link from "next/link";

import { TIPOS_PROPOSTA } from "@/lib/orcamento-tipos";

const STATUS = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "cancelado", rotulo: "Cancelado" },
];

export type FiltrosRelatorio = {
  de?: string;
  ate?: string;
  responsavel?: string;
  administradora?: string;
  tipo?: string;
  status?: string;
};

export function RelatoriosFiltros({
  valores,
  usuarios,
  administradoras,
}: {
  valores: FiltrosRelatorio;
  usuarios: { id: string; nome: string }[];
  administradoras: string[];
}) {
  const algum = Object.values(valores).some((v) => v);
  return (
    <div className="hj-card hj-card-pad">
      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <span className="hj-hint">Administradora</span>
          <input
            type="text"
            name="administradora"
            list="lista-administradoras"
            defaultValue={valores.administradora ?? ""}
            className="hj-control"
          />
          <datalist id="lista-administradoras">
            {administradoras.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
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

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" className="hj-btn hj-btn-primary">
            Aplicar
          </button>
          {algum ? (
            <Link href="/relatorios" className="hj-btn hj-btn-secondary">
              Limpar
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
