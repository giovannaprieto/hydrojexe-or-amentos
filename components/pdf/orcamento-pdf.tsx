/* eslint-disable jsx-a11y/alt-text -- <Image> aqui é do @react-pdf, não é <img> HTML */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CORES, paginaBase, Timbre } from "@/components/pdf/timbre";

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
  fotoSecao: { marginTop: 8, marginBottom: 4, alignSelf: "center" },
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
  const linhas = (texto ?? "").split("\n");
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
        const negrito = l.trimStart().startsWith("Análise técnica:");
        return (
          <Text key={i} style={negrito ? [s.par, s.bold] : s.par}>
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
    <View wrap={false}>
      <View style={s.secaoBar}>
        <Text style={s.secaoTitulo}>
          {n}. {titulo}
        </Text>
      </View>
      {children}
    </View>
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
          <Paragrafos texto={textos.intervencao} />
          <Image src={assets.fotoIntervencao} style={[s.fotoSecao, { width: 300 }]} />
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

        <Text style={{ marginTop: 14 }}>
          Ficamos à disposição para esclarecer todas as dúvidas que possam
          surgir, assim como realizar uma apresentação coletiva em reunião
          condominial.
        </Text>
        <Text style={{ marginTop: 10 }}>Atenciosamente,</Text>
        <Text style={s.assinatura}>
          HYDROJEXE - INDIVIDUALIZAÇÃO DE MEDIÇÃO DE ÁGUA E GÁS LTDA
        </Text>
      </Page>
    </Document>
  );
}
