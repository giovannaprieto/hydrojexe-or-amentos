/* eslint-disable jsx-a11y/alt-text -- <Image> aqui é do @react-pdf, não é <img> HTML */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CORES, paginaBase, Timbre } from "@/components/pdf/timbre";
import {
  INDIVIDUALIZACAO_GAS,
  textoFormaParcelas,
  type SecaoModelo,
  type TssOpcao,
} from "@/lib/modelos-proposta";

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
  opcaoTitulo: {
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  tabela: {
    borderTop: `0.5 solid ${C_LINE}`,
    borderLeft: `0.5 solid ${C_LINE}`,
  },
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
  fotoSecao: { marginTop: 8, marginBottom: 4, alignSelf: "center" },
  gerVermelho: { color: C_RED, fontFamily: "Times-Bold", marginTop: 8 },
  assinatura: {
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    textAlign: "left",
    textIndent: 0,
    marginTop: 18,
  },
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const doisDig = (n: number) => String(n).padStart(2, "0");

const EXTENSO: Record<number, string> = {
  1: "uma",
  2: "duas",
  3: "três",
  4: "quatro",
  5: "cinco",
  6: "seis",
  7: "sete",
  8: "oito",
  9: "nove",
  10: "dez",
};

export type IndividualizacaoGasPdfAssets = {
  header: string;
  footer: string;
  watermark: string;
  fotoMedidor: string;
};

export type IndividualizacaoGasPdfProps = {
  numero: string;
  cidade: string;
  dataExtenso: string;
  condominioNome: string;
  condominioEndereco: string;
  administradora: string | null;
  analiseTecnica: string;
  secoes: SecaoModelo[];
  prazo: string;
  pontosPorApartamento: number;
  totalMedidores: number;
  valorGerenciamento: number;
  opcoes: TssOpcao[];
  assets: IndividualizacaoGasPdfAssets;
};

function Paragrafos({ texto }: { texto: string }) {
  return (
    <>
      {(texto ?? "").split("\n").map((l, i) => (
        <Text key={i} style={l.trim() === "" ? { marginBottom: 3 } : s.par}>
          {l.trim() === "" ? " " : l}
        </Text>
      ))}
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

export function IndividualizacaoGasPdf(props: IndividualizacaoGasPdfProps) {
  const {
    numero,
    cidade,
    dataExtenso,
    condominioNome,
    condominioEndereco,
    administradora,
    analiseTecnica,
    secoes,
    prazo,
    pontosPorApartamento,
    totalMedidores,
    valorGerenciamento,
    opcoes,
    assets,
  } = props;

  const ext = EXTENSO[totalMedidores] ? ` (${EXTENSO[totalMedidores]})` : "";
  const nUlt = secoes.length; // nº da última seção de texto (Procedimento executivo)

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
        {administradora ? <Text>Administradora: {administradora}</Text> : null}

        <Text style={s.ref}>Ref.: {INDIVIDUALIZACAO_GAS.ref}</Text>
        <Text style={[s.par, { marginBottom: 4 }]}>
          {analiseTecnica.trimStart().startsWith("Análise técnica:") ? (
            <>
              <Text style={s.bold}>Análise técnica:</Text>
              {analiseTecnica.slice(
                analiseTecnica.indexOf("Análise técnica:") +
                  "Análise técnica:".length,
              )}
            </>
          ) : (
            analiseTecnica
          )}
        </Text>

        {secoes.map((sec, i) => (
          <Secao key={i} n={i + 1} titulo={sec.titulo}>
            <Paragrafos texto={sec.corpo} />
            {i === nUlt - 1 ? (
              <>
                <Image
                  src={assets.fotoMedidor}
                  style={[s.fotoSecao, { width: 150 }]}
                />
                <Text style={s.par}>
                  a) A quantidade de medidores será de {doisDig(totalMedidores)}
                  {ext} unidades.
                </Text>
                <Text style={s.par}>
                  b) Execução de teste de estanqueidade em todo o sistema.
                </Text>
              </>
            ) : null}
          </Secao>
        ))}

        <Secao n={nUlt + 1} titulo="PRAZO PARA IMPLANTAÇÃO">
          <Paragrafos texto={prazo} />
        </Secao>

        <View style={s.secaoBar} wrap={false} minPresenceAhead={60}>
          <Text style={s.secaoTitulo}>
            {nUlt + 2}. INVESTIMENTO DOS MEDIDORES DE GÁS
          </Text>
        </View>
        {opcoes.map((op, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 6 }}>
            <Text style={s.opcaoTitulo}>Opção {i + 1}</Text>
            <View style={s.tabela}>
              <View style={s.linha}>
                <Text style={s.celRot}>Pontos a serem instalados</Text>
                <Text style={s.celVal}>{totalMedidores} Medidores</Text>
              </View>
              <View style={s.linha}>
                <Text style={s.celRot}>
                  Quantidade de pontos por apartamento
                </Text>
                <Text style={s.celVal}>{pontosPorApartamento}</Text>
              </View>
              <View style={s.linha}>
                <Text style={s.celRot}>Valor por apartamento</Text>
                <Text style={s.celVal}>{brl(op.valor)}</Text>
              </View>
              <View style={s.linha}>
                <Text style={s.celRot}>Forma de pagamento</Text>
                <Text style={s.celVal}>{textoFormaParcelas(op)}</Text>
              </View>
            </View>
          </View>
        ))}
        <Text style={s.gerVermelho}>
          {INDIVIDUALIZACAO_GAS.gerenciamentoNota(valorGerenciamento)}
        </Text>

        <Secao n={nUlt + 3} titulo="GARANTIA">
          <Paragrafos texto={INDIVIDUALIZACAO_GAS.garantia} />
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
