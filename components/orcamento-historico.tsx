import { Timeline, type LinhaTimeline } from "@/components/timeline";
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

function paraTimeline(l: LinhaHistorico): LinhaTimeline {
  return {
    id: l.id,
    titulo: l.descricao ?? l.acao,
    quando: l.alterado_em,
    autor: l.usuario,
    tom:
      l.acao === "criar"
        ? "criar"
        : l.acao === "excluir"
          ? "excluir"
          : "atualizar",
    antes: l.valor_antes,
    depois: l.valor_depois,
  };
}

export function OrcamentoHistorico({ linhas }: { linhas: LinhaHistorico[] }) {
  return (
    <Timeline
      linhas={linhas.map(paraTimeline)}
      vazio="Sem alterações registradas."
    />
  );
}
