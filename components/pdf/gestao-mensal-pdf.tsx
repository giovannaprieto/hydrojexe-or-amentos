/* eslint-disable jsx-a11y/alt-text -- <Image> aqui é do @react-pdf, não é <img> HTML */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CORES, paginaBase, Timbre } from "@/components/pdf/timbre";
import type { SecaoModelo } from "@/lib/modelos-proposta";
import { linhasParagrafo } from "@/lib/pdf-texto";

const C_BAR = CORES.bar;
const C_LINE = CORES.line;

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
  tabela: {
    borderTop: `0.5 solid ${C_LINE}`,
    borderLeft: `0.5 solid ${C_LINE}`,
    marginTop: 8,
    marginBottom: 6,
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

export type GestaoMensalPdfAssets = {
  header: string;
  footer: string;
  watermark: string;
  foto: string;
};

export type GestaoMensalPdfProps = {
  numero: string;
  cidade: string;
  dataExtenso: string;
  condominioNome: string;
  condominioEndereco: string;
  administradora: string | null;
  /** "água" | "gás" */
  sistema: string;
  /** "hidrômetro" | "gasômetro" */
  ponto: string;
  /** "Hidrômetros" | "Gasômetros" */
  pontoPlural: string;
  ref: string;
  secoes: SecaoModelo[];
  demonstrativos: string;
  outrasDisposicoes: string;
  assets: GestaoMensalPdfAssets;
  // números
  qtdApartamentos: number;
  pontosPorApartamento: number;
  valorPorApartamento: number;
  totalPontos: number;
  valorTotalMensal: number;
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

export function GestaoMensalPdf(props: GestaoMensalPdfProps) {
  const {
    numero,
    cidade,
    dataExtenso,
    condominioNome,
    condominioEndereco,
    administradora,
    sistema,
    ponto,
    pontoPlural,
    ref,
    secoes,
    demonstrativos,
    outrasDisposicoes,
    assets,
    qtdApartamentos,
    pontosPorApartamento,
    valorPorApartamento,
    totalPontos,
    valorTotalMensal,
  } = props;

  const investIntro =
    `a) O valor para o gerenciamento mensal de leitura e monitoramento completo do sistema de ${sistema} é de ` +
    `${brl(valorPorApartamento)} por ${ponto}. O condomínio possui ${qtdApartamentos} ` +
    `${qtdApartamentos === 1 ? "apartamento" : "apartamentos"} sendo que cada apartamento possui ` +
    `${doisDig(pontosPorApartamento)} ${pontosPorApartamento === 1 ? ponto : ponto + "s"}.`;

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

        <Text style={s.ref}>Ref.: {ref}</Text>
        <Text style={{ marginBottom: 4 }}>
          Prezados, seguem detalhes de nossa proposta comercial.
        </Text>

        {secoes.map((sec, i) => (
          <Secao key={i} n={i + 1} titulo={sec.titulo}>
            <Paragrafos texto={sec.corpo} />
          </Secao>
        ))}

        <View wrap={false}>
          <View style={s.secaoBar}>
            <Text style={s.secaoTitulo}>
              {secoes.length + 1}. INVESTIMENTO
            </Text>
          </View>
          <Paragrafos texto={investIntro} />
          <View style={s.tabela}>
            <View style={s.linha}>
              <Text style={s.celRot}>Pontos a serem lidos</Text>
              <Text style={s.celVal}>
                {totalPontos} {pontoPlural}
              </Text>
            </View>
            <View style={s.linha}>
              <Text style={s.celRot}>Valor por apartamento</Text>
              <Text style={s.celVal}>{brl(valorPorApartamento)}</Text>
            </View>
            <View style={s.linha}>
              <Text style={s.celRot}>Valor total mensal</Text>
              <Text style={s.celVal}>{brl(valorTotalMensal)}</Text>
            </View>
          </View>
        </View>

        <View wrap={false}>
          <View style={s.secaoBar}>
            <Text style={s.secaoTitulo}>DEMONSTRATIVOS INDIVIDUAIS</Text>
          </View>
          <Paragrafos texto={demonstrativos} />
          <Image src={assets.foto} style={[s.fotoSecao, { width: 260 }]} />
          <Text style={[s.par, { marginTop: 4 }]}>
            Estes demonstrativos individuais são encaminhados via e-mail através
            do nosso sistema diretamente aos condôminos para conferência mensal.
          </Text>
        </View>

        <Secao n={secoes.length + 2} titulo="OUTRAS DISPOSIÇÕES">
          <Paragrafos texto={outrasDisposicoes} />
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
