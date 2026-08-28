import { OrcamentoNovoForm } from "@/components/orcamento-novo-form";
import { Alert, PageHeader } from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { hojeISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Novo orçamento · Hydrojexe" };

function sugerirNumero(numeros: string[], ano: number): string {
  let maior = 0;
  for (const n of numeros) {
    const m = n.match(/^(\d+)/);
    if (m) maior = Math.max(maior, Number(m[1]));
  }
  return `${String(maior + 1).padStart(3, "0")}.${ano}`;
}

export default async function NovoOrcamentoPage() {
  await requireUsuario();

  const hoje = hojeISO();
  const ano = Number(hoje.slice(0, 4));
  const supabase = await createClient();

  const [{ data: condominios }, { data: doAno }] = await Promise.all([
    supabase.from("condominios").select("id, nome").order("nome"),
    supabase.from("orcamentos").select("numero").eq("ano", ano),
  ]);

  const numeroSugerido = sugerirNumero(
    (doAno ?? []).map((o) => o.numero),
    ano,
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Novo orçamento"
        descricao="Escolha o tipo de proposta e o condomínio. Depois de criar, você monta a composição e gera o PDF."
        voltar={{ href: "/orcamentos", rotulo: "Orçamentos" }}
      />

      {(condominios ?? []).length === 0 ? (
        <Alert tom="warn">
          Cadastre um condomínio antes de criar um orçamento.
        </Alert>
      ) : (
        <OrcamentoNovoForm
          condominios={condominios ?? []}
          numeroSugerido={numeroSugerido}
          hoje={hoje}
        />
      )}
    </div>
  );
}
