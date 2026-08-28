/* eslint-disable jsx-a11y/alt-text -- <Image> aqui é do @react-pdf, não é <img> HTML */
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

/** cores compartilhadas dos PDFs */
export const CORES = {
  bar: "#dbe4ea",
  line: "#333333",
  mut: "#555555",
  red: "#c00000",
};

/** estilo base da <Page> — deixa espaço p/ cabeçalho e rodapé do timbre */
export const paginaBase = {
  paddingTop: 100,
  paddingBottom: 74,
  paddingHorizontal: 48,
  fontSize: 10,
  fontFamily: "Times-Roman",
  color: "#1a1a1a",
  lineHeight: 1.4,
  textAlign: "justify",
} as const;

export type TimbreAssets = {
  header: string; // faixa HydroJEXE (sem Techem) — recorte
  footer: string; // faixa azul do rodapé (largura total)
  watermark: string; // gota azul clara ao fundo
};

const s = StyleSheet.create({
  watermark: { position: "absolute", top: 210, left: 100, width: 400 },
  headerClip: {
    position: "absolute",
    top: 24,
    left: 48,
    width: 130,
    height: 74,
    overflow: "hidden",
  },
  headerImg: { width: 345 },
  numeroTopo: {
    position: "absolute",
    top: 44,
    right: 48,
    fontSize: 8,
    color: CORES.mut,
  },
  footerImg: { position: "absolute", bottom: 0, left: 0, right: 0, width: "100%" },
});

/** Cabeçalho + rodapé + marca d'água, fixos em toda página. */
export function Timbre({
  numero,
  assets,
}: {
  numero: string;
  assets: TimbreAssets;
}) {
  return (
    <>
      <Image src={assets.watermark} style={s.watermark} fixed />
      <View style={s.headerClip} fixed>
        <Image src={assets.header} style={s.headerImg} />
      </View>
      <Text style={s.numeroTopo} fixed>
        Orçamento nº {numero}.
      </Text>
      <Image src={assets.footer} style={s.footerImg} fixed />
    </>
  );
}
