import { join } from "node:path";

import { Font } from "@react-pdf/renderer";

/**
 * Registra as fontes dos PDFs uma vez por processo. Importado por
 * components/pdf/timbre.tsx (que todo PDF usa).
 *
 * IBM Plex Sans — corpo.  IBM Plex Serif — títulos de seção e "Ref.".
 * Arquivos .ttf em assets/fonts (IBM Plex, licença OFL, grátis).
 */
let registrado = false;

export function registrarFontesPdf(): void {
  if (registrado) return;
  registrado = true;

  const dir = join(process.cwd(), "assets", "fonts");

  Font.register({
    family: "Plex",
    fonts: [
      { src: join(dir, "IBMPlexSans-Regular.ttf"), fontWeight: 400 },
      { src: join(dir, "IBMPlexSans-Medium.ttf"), fontWeight: 500 },
      { src: join(dir, "IBMPlexSans-SemiBold.ttf"), fontWeight: 600 },
      { src: join(dir, "IBMPlexSans-Bold.ttf"), fontWeight: 700 },
    ],
  });

  Font.register({
    family: "PlexSerif",
    fonts: [
      { src: join(dir, "IBMPlexSerif-Regular.ttf"), fontWeight: 400 },
      { src: join(dir, "IBMPlexSerif-SemiBold.ttf"), fontWeight: 600 },
      { src: join(dir, "IBMPlexSerif-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // Plex tem hifenização ruim em pt-BR nos PDFs; desliga (quebra por palavra).
  Font.registerHyphenationCallback((w) => [w]);
}
