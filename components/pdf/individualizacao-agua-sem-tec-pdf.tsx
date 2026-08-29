/* eslint-disable jsx-a11y/alt-text -- <Image> aqui é do @react-pdf, não é <img> HTML */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CORES, paginaBase, Timbre } from "@/components/pdf/timbre";
import {
  INDIVIDUALIZACAO_AGUA_SEM_TEC,
  textoFormaParcelas,
  type SecaoModelo,
  type TssOpcao,
} from "@/lib/modelos-proposta";
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
  opcaoTitulo: {
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  centroTitulo: {
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 4,
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

export type IndividualizacaoAguaSemTecPdfAssets = {
  header: string;
  footer: string;
  watermark: string;
  fotoMedidor: string;
  fotoDemonstrativo: string;
};

export type IndividualizacaoAguaSemTecPdfProps = {
  numero: string;
  cidade: string;
  dataExtenso: string;
  condominioNome: string;
  condominioEndereco: string;
  administradora: string | null;
  secoes: SecaoModelo[];
  prazo: string;
  totalHidrometros: number;
  hidrometrosPorApartamento: number;
  valorGestaoMensal: number;
  opcoes: TssOpcao[];
  assets: IndividualizacaoAguaSemTecPdfAssets;
};

function Paragrafos({ texto }: { texto: string }) {
  return (
    <>
      {linhasParagrafo(texto).map((l, i) => {
        const vazia = l.trim() === "";
        if (vazia) {
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

export function IndividualizacaoAguaSemTecPdf(
  props: IndividualizacaoAguaSemTecPdfProps,
) {
  const {
    numero,
    cidade,
    dataExtenso,
    condominioNome,
    condominioEndereco,
    administradora,
    secoes,
    prazo,
    totalHidrometros,
    hidrometrosPorApartamento,
    valorGestaoMensal,
    opcoes,
    assets,
  } = props;

  const n = secoes.length;

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

        <Text style={s.ref}>Ref.: {INDIVIDUALIZACAO_AGUA_SEM_TEC.ref}</Text>
        <Text style={{ marginBottom: 4 }}>
          Seguem detalhes de nossa proposta comercial:
        </Text>

        {secoes.map((sec, i) => (
          <Secao key={i} n={i + 1} titulo={sec.titulo}>
            <Paragrafos
              texto={sec.corpo.replace(
                /\{qtd_hidrometros\}/g,
                String(totalHidrometros),
              )}
            />
            {sec.titulo.toUpperCase().includes("INTERVENÇÃO") ? (
              <>
                <Image
                  src={assets.fotoMedidor}
                  style={[s.fotoSecao, { width: 130 }]}
                />
                <Text style={s.par}>
                  b) Execução de teste de estanqueidade em todo o sistema.
                </Text>
              </>
            ) : null}
          </Secao>
        ))}

        <Secao n={n + 1} titulo="PRAZO PARA IMPLANTAÇÃO">
          <Paragrafos texto={prazo} />
        </Secao>

        <View style={s.secaoBar} wrap={false} minPresenceAhead={60}>
          <Text style={s.secaoTitulo}>{n + 2}. INVESTIMENTO</Text>
        </View>
        {opcoes.map((op, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 6 }}>
            {i === 0 ? (
              <Text style={s.centroTitulo}>VALOR POR APARTAMENTO</Text>
            ) : null}
            <Text style={s.opcaoTitulo}>Opção {i + 1}</Text>
            <View style={s.tabela}>
              <View style={s.linha}>
                <Text style={s.celRot}>
                  Pontos a serem instalados por apartamento
                </Text>
                <Text style={s.celVal}>
                  {hidrometrosPorApartamento}{" "}
                  {hidrometrosPorApartamento === 1 ? "Hidrômetro" : "Hidrômetros"}
                </Text>
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
          {INDIVIDUALIZACAO_AGUA_SEM_TEC.gerenciamentoNota(valorGestaoMensal)}
        </Text>

        <Secao n={n + 3} titulo="DEMONSTRATIVOS INDIVIDUAIS">
          <Paragrafos texto={INDIVIDUALIZACAO_AGUA_SEM_TEC.demonstrativos} />
          <Image
            src={assets.fotoDemonstrativo}
            style={[s.fotoSecao, { width: 300 }]}
          />
          <Text style={[s.par, { marginTop: 4 }]}>
            {INDIVIDUALIZACAO_AGUA_SEM_TEC.demonstrativosNota}
          </Text>
        </Secao>

        <Secao n={n + 4} titulo="GARANTIA">
          <Paragrafos texto={INDIVIDUALIZACAO_AGUA_SEM_TEC.garantia} />
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
