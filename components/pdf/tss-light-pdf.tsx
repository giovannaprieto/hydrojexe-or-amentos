import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CORES, paginaBase, Timbre } from "@/components/pdf/timbre";
import {
  textoFormaTss,
  TSS_LIGHT,
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
  bold: { fontFamily: "Plex", fontWeight: 700 },
  ref: {
    fontFamily: "Plex", fontWeight: 700,
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
  secaoTitulo: { fontFamily: "PlexSerif", fontWeight: 700, fontSize: 11 },
  par: { marginBottom: 3, textIndent: 18 },
  opcaoTitulo: {
    fontFamily: "Plex", fontWeight: 700,
    textAlign: "center",
    marginTop: 10,
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
  nota: { color: C_RED, fontSize: 8.5, marginTop: 6 },
  disposicoes: { marginTop: 10 },
  assinatura: {
    fontFamily: "Plex", fontWeight: 700,
    textDecoration: "underline",
    textAlign: "left",
    textIndent: 0,
    marginTop: 18,
  },
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const doisDig = (n: number) => String(n).padStart(2, "0");

export type TssLightPdfAssets = {
  header: string;
  footer: string;
  watermark: string;
  techem: string;
};

export type TssLightPdfProps = {
  numero: string;
  cidade: string;
  dataExtenso: string;
  condominioNome: string;
  condominioEndereco: string;
  administradora: string | null;
  prazo: string;
  secoes: SecaoModelo[];
  qtdEquipamentos: number;
  opcoes: TssOpcao[];
  assets: TssLightPdfAssets;
};

function Paragrafos({ texto }: { texto: string }) {
  return (
    <>
      {linhasParagrafo(texto).map((l, i) => (
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

export function TssLightPdf(props: TssLightPdfProps) {
  const {
    numero,
    cidade,
    dataExtenso,
    condominioNome,
    condominioEndereco,
    administradora,
    prazo,
    secoes,
    qtdEquipamentos,
    opcoes,
    assets,
  } = props;

  const unidadeTxt = `${doisDig(qtdEquipamentos)} ${qtdEquipamentos === 1 ? "unidade" : "unidades"}`;

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

        <Text style={s.ref}>Ref.: {TSS_LIGHT.ref}</Text>
        <Text style={{ marginBottom: 4 }}>
          Seguem detalhes de nossa proposta comercial:
        </Text>

        {secoes.map((sec, i) => (
          <Secao key={i} n={i + 1} titulo={sec.titulo}>
            <Paragrafos texto={sec.corpo} />
          </Secao>
        ))}

        <Secao n={secoes.length + 1} titulo="PRAZO PARA IMPLANTAÇÃO">
          <Paragrafos texto={prazo} />
        </Secao>

        <View style={s.secaoBar}>
          <Text style={s.secaoTitulo}>{secoes.length + 2}. INVESTIMENTO</Text>
        </View>
        {opcoes.map((op, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 6 }}>
            <Text style={s.opcaoTitulo}>Opção {i + 1}</Text>
            <View style={s.tabela}>
              <View style={s.linha}>
                <Text style={s.celRot}>Equipamento instalado</Text>
                <Text style={s.celVal}>{unidadeTxt}</Text>
              </View>
              <View style={s.linha}>
                <Text style={s.celRot}>Valor por unidade</Text>
                <Text style={s.celVal}>{brl(op.valor)}</Text>
              </View>
              <View style={s.linha}>
                <Text style={s.celRot}>Forma de pagamento</Text>
                <Text style={s.celVal}>{textoFormaTss(op)}</Text>
              </View>
            </View>
          </View>
        ))}
        <Text style={s.nota}>* {TSS_LIGHT.notaQtd} *</Text>

        <View style={s.disposicoes} wrap={false}>
          <Paragrafos texto={TSS_LIGHT.disposicoes} />
        </View>

        <View wrap={false}>
          <Text style={{ marginTop: 14 }}>
            Ficamos à disposição para esclarecer todas as dúvidas que possam
            surgir.
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
