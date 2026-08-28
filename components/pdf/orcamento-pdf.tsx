/* eslint-disable jsx-a11y/alt-text -- <Image> aqui é do @react-pdf, não é <img> HTML */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CORES, paginaBase, Timbre } from "@/components/pdf/timbre";
import { linhasParagrafo } from "@/lib/pdf-texto";

const C_BAR = CORES.bar;
const C_LINE = CORES.line;
const C_RED = CORES.red;

const s = StyleSheet.create({
  page: paginaBase,
  destinatarioRight: { textAlign: "right", marginBottom: 12 },
  bold: { fontFamily: "Times-Bold" },
  ref: {
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    marginTop: 8,
    marginBottom: 8,
  },
  secaoBar: {
    backgroundColor: C_BAR,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 14,
    marginBottom: 6,
  },
  secaoTitulo: { fontFamily: "Times-Bold", fontSize: 10.5 },
  par: { marginBottom: 3, textIndent: 18 },
  fotoSecao: { marginTop: 5, marginBottom: 5, alignSelf: "center" },
  fotosLinha: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 5,
    marginBottom: 3,
  },
  legendaFoto: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    lineHeight: 1.3,
    textAlign: "center",
    textIndent: 0,
    marginTop: 5,
    marginBottom: 8,
  },
  centroTitulo: {
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  opcaoTitulo: {
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  tabela: { borderTop: `0.5 solid ${C_LINE}`, borderLeft: `0.5 solid ${C_LINE}` },
  linha: { flexDirection: "row" },
  celRot: {
    width: "55%",
    padding: 5,
    borderRight: `0.5 solid ${C_LINE}`,
    borderBottom: `0.5 solid ${C_LINE}`,
  },
  celVal: {
    width: "45%",
    padding: 5,
    borderRight: `0.5 solid ${C_LINE}`,
    borderBottom: `0.5 solid ${C_LINE}`,
    textAlign: "center",
  },
  assinatura: {
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    textAlign: "left",
    textIndent: 0,
    marginTop: 18,
  },
  notaVermelha: {
    color: C_RED,
    fontSize: 8.5,
    marginTop: 2,
    marginBottom: 2,
  },
  gerVermelho: {
    color: C_RED,
    fontFamily: "Times-Bold",
    marginTop: 8,
  },
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ORDINAIS = [
  "Primeira",
  "Segunda",
  "Terceira",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sétima",
  "Oitava",
];

export type FormaOpcao = {
  formaNome: string;
  valorPorApartamento: number;
  textoPagamento: string;
  /** nota em vermelho abaixo da opção (ex.: quando há hidrômetro + hidra) */
  nota: string | null;
};

export type TipoPdf = {
  nome: string;
  descricaoPontos: string;
  opcoes: FormaOpcao[];
};

export type OrcamentoPdfAssets = {
  header: string;
  footer: string;
  watermark: string;
  fotoIntervencao: string;
  fotoGerenciamento: string;
  techem: string;
  /** fotos de obra — só entram quando o prédio NÃO é preparado */
  retrofitAntesDepois: string;
  retrofitRevestimento: string;
  retrofitCaixaAberta: string;
  retrofitCaixaFechada: string;
};

export type OrcamentoPdfProps = {
  numero: string;
  cidade: string;
  dataExtenso: string;
  condominioNome: string;
  condominioEndereco: string;
  administradora: string | null;
  valorPorHidrometro: number;
  assets: OrcamentoPdfAssets;
  textos: {
    individualizacao: string;
    objetivo: string;
    procedimento: string;
    intervencao: string;
    tramites: string;
    gerenciamento: string;
    prazo: string;
    garantia: string;
  };
  tipos: TipoPdf[];
};

function Paragrafos({ texto }: { texto: string }) {
  const linhas = linhasParagrafo(texto);
  return (
    <>
      {linhas.map((l, i) => {
        if (l.trim() === "") {
          return (
            <Text key={i} style={{ marginBottom: 3 }}>
              {" "}
            </Text>
          );
        }
        const rotulo = "Análise técnica:";
        if (l.trimStart().startsWith(rotulo)) {
          const i0 = l.indexOf(rotulo);
          return (
            <Text key={i} style={s.par}>
              {l.slice(0, i0)}
              <Text style={s.bold}>{rotulo}</Text>
              {l.slice(i0 + rotulo.length)}
            </Text>
          );
        }
        return (
          <Text key={i} style={s.par}>
            {l}
          </Text>
        );
      })}
    </>
  );
}

function Secao({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={s.secaoBar} wrap={false} minPresenceAhead={60}>
        <Text style={s.secaoTitulo}>
          {n}. {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** marcadores de foto que podem aparecer no meio do texto da INTERVENÇÃO */
const FOTOS_INTERVENCAO = [
  "{foto_antes_depois}",
  "{foto_revestimento}",
  "{foto_hidrometro}",
  "{foto_caixa_inspecao}",
] as const;

function ConteudoIntervencao({
  texto,
  assets,
}: {
  texto: string;
  assets: OrcamentoPdfAssets;
}) {
  const temMarcador = FOTOS_INTERVENCAO.some((m) => texto.includes(m));
  const partes = texto.split(
    /(\{foto_antes_depois\}|\{foto_revestimento\}|\{foto_hidrometro\}|\{foto_caixa_inspecao\})/g,
  );

  return (
    <>
      {partes.map((p, i) => {
        if (p === "{foto_antes_depois}") {
          return (
            <View key={i} wrap={false}>
              <Image
                src={assets.retrofitAntesDepois}
                style={[s.fotoSecao, { width: 290 }]}
              />
            </View>
          );
        }
        if (p === "{foto_revestimento}") {
          return (
            <View key={i} wrap={false}>
              <Image
                src={assets.retrofitRevestimento}
                style={[s.fotoSecao, { width: 330 }]}
              />
            </View>
          );
        }
        if (p === "{foto_hidrometro}") {
          return (
            <View key={i} wrap={false}>
              <Image
                src={assets.fotoIntervencao}
                style={[s.fotoSecao, { width: 300 }]}
              />
            </View>
          );
        }
        if (p === "{foto_caixa_inspecao}") {
          return (
            <View key={i} wrap={false}>
              <View style={s.fotosLinha}>
                <Image
                  src={assets.retrofitCaixaAberta}
                  style={{ width: 120 }}
                />
                <Image
                  src={assets.retrofitCaixaFechada}
                  style={{ width: 78 }}
                />
              </View>
              <Text style={s.legendaFoto}>
                Exemplos dos hidrômetros já instalados, sob as caixas de inspeção
                na cor branca, com porta retrátil que permite a conferência
                mensal do extrato cobrado por cada morador. No modelo da esquerda
                a caixa está destampada e na direita fechada.
              </Text>
            </View>
          );
        }
        if (p.trim() === "") return null;
        return <Paragrafos key={i} texto={p.trim()} />;
      })}

      {/* sem marcadores (preparado / modelo genérico) -> foto padrão do medidor */}
      {temMarcador ? null : (
        <Image
          src={assets.fotoIntervencao}
          style={[s.fotoSecao, { width: 300 }]}
        />
      )}
    </>
  );
}

function TabelaTipo({ tipo }: { tipo: TipoPdf }) {
  return (
    <View style={{ marginTop: 8 }}>
      {tipo.opcoes.map((op, i) => (
        // o título "VALOR POR ..." vai junto da 1ª opção (nunca sozinho no fim da página)
        <View key={i} wrap={false} style={{ marginBottom: 6 }}>
          {i === 0 ? (
            <Text style={s.centroTitulo}>
              VALOR POR {tipo.nome.toUpperCase()}
            </Text>
          ) : null}
          <Text style={s.opcaoTitulo}>{ORDINAIS[i] ?? `${i + 1}ª`} Opção</Text>
          <View style={s.tabela}>
            <View style={s.linha}>
              <Text style={s.celRot}>Quantidade de pontos por apartamento</Text>
              <Text style={s.celVal}>{tipo.descricaoPontos}</Text>
            </View>
            <View style={s.linha}>
              <Text style={s.celRot}>Valor por apartamento</Text>
              <Text style={s.celVal}>{brl(op.valorPorApartamento)}</Text>
            </View>
            <View style={s.linha}>
              <Text style={s.celRot}>Forma de pagamento</Text>
              <Text style={s.celVal}>{op.textoPagamento}</Text>
            </View>
          </View>
          {op.nota ? (
            <Text style={s.notaVermelha}>* {op.nota} *</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function OrcamentoPdf(props: OrcamentoPdfProps) {
  const {
    numero,
    cidade,
    dataExtenso,
    condominioNome,
    condominioEndereco,
    administradora,
    valorPorHidrometro,
    assets,
    textos,
    tipos,
  } = props;

  return (
    <Document title={`Orçamento ${numero}`}>
      <Page size="A4" style={s.page}>
        <Timbre numero={numero} assets={assets} />

        <View style={s.destinatarioRight}>
          <Text>
            {cidade}, {dataExtenso}.
          </Text>
        </View>

        <Text>Ao</Text>
        <Text style={s.bold}>{condominioNome}</Text>
        {condominioEndereco ? <Text>{condominioEndereco}</Text> : null}
        {administradora ? (
          <Text>Administradora: {administradora}</Text>
        ) : null}

        <Text style={s.ref}>
          Ref.: Proposta para implantação do sistema de individualização do
          consumo de água
        </Text>
        <Text style={{ marginBottom: 4 }}>
          Prezados, seguem detalhes de nossa proposta comercial.
        </Text>

        <Secao n={1} titulo="INDIVIDUALIZAÇÃO DE ÁGUA">
          <Paragrafos texto={textos.individualizacao} />
        </Secao>
        <Secao n={2} titulo="OBJETIVO DA NOSSA PROPOSTA COMERCIAL">
          <Paragrafos texto={textos.objetivo} />
        </Secao>
        <Secao
          n={3}
          titulo="PROCEDIMENTO TÉCNICO DA INDIVIDUALIZAÇÃO DOS APARTAMENTOS"
        >
          <Paragrafos texto={textos.procedimento} />
        </Secao>
        <Secao n={4} titulo="INTERVENÇÃO">
          <ConteudoIntervencao texto={textos.intervencao} assets={assets} />
        </Secao>
        <Secao n={5} titulo="TRÂMITES ADMINISTRATIVOS FINAIS">
          <Paragrafos texto={textos.tramites} />
        </Secao>
        <Secao n={6} titulo="GERENCIAMENTO MENSAL">
          <Paragrafos texto={textos.gerenciamento} />
          <Image
            src={assets.fotoGerenciamento}
            style={[s.fotoSecao, { width: 230 }]}
          />
        </Secao>
        <Secao n={7} titulo="PRAZO PARA IMPLANTAÇÃO">
          <Paragrafos texto={textos.prazo} />
        </Secao>

        <View style={s.secaoBar}>
          <Text style={s.secaoTitulo}>8. INVESTIMENTO</Text>
        </View>
        {tipos.length === 0 ? (
          <Text>Orçamento sem tipos de apartamento.</Text>
        ) : (
          tipos.map((t, i) => <TabelaTipo key={i} tipo={t} />)
        )}
        <Text style={s.gerVermelho}>
          a) O valor para o gerenciamento mensal de leitura e monitoramento
          completo do sistema de água é de {brl(valorPorHidrometro)} por
          hidrômetro.
        </Text>

        <Secao n={9} titulo="GARANTIA">
          <Paragrafos texto={textos.garantia} />
        </Secao>

        <View wrap={false}>
          <Text style={{ marginTop: 14 }}>
            Ficamos à disposição para esclarecer todas as dúvidas que possam
            surgir, assim como realizar uma apresentação coletiva em reunião
            condominial.
          </Text>
          <Text style={{ marginTop: 10 }}>Atenciosamente,</Text>
          <Text style={s.assinatura}>
            HYDROJEXE - INDIVIDUALIZAÇÃO DE MEDIÇÃO DE ÁGUA E GÁS LTDA.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
