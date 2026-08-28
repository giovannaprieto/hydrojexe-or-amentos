// Textos-modelo das propostas de "gestão mensal" (leitura visual) — água e gás.
// Fonte: modelos-orcamentos/orcamento visual - agua.pdf e ...gás.pdf.
// O banco (tabela public.modelos_proposta) pode sobrescrever via "secoes";
// enquanto não houver linha ativa, usa-se o padrão abaixo.

export type SecaoModelo = { titulo: string; corpo: string };

export type ModeloGestao = {
  /** rótulo do sistema, minúsculo: "água" | "gás" */
  sistema: string;
  /** nome do ponto lido, singular minúsculo: "hidrômetro" | "gasômetro" */
  ponto: string;
  /** nome do ponto, plural com inicial maiúscula: "Hidrômetros" | "Gasômetros" */
  pontoPlural: string;
  ref: string;
  /** seções 1 a 4 (texto fixo). A 5 (INVESTIMENTO) e a 6 são montadas no PDF. */
  secoes: SecaoModelo[];
  /** texto da seção final "OUTRAS DISPOSIÇÕES" */
  outrasDisposicoes: string;
  /** texto do bloco "DEMONSTRATIVOS INDIVIDUAIS" */
  demonstrativos: string;
};

const AGUA: ModeloGestao = {
  sistema: "água",
  ponto: "hidrômetro",
  pontoPlural: "Hidrômetros",
  ref: "Proposta para implantação do sistema de individualização do consumo de água",
  secoes: [
    {
      titulo: "INDIVIDUALIZAÇÃO DE ÁGUA",
      corpo:
        "Análise técnica: Trata-se de uma proposta para assumir a gestão mensal dos hidrômetros do condomínio pelo sistema de leitura visual.",
    },
    {
      titulo: "OBJETIVO DA NOSSA PROPOSTA COMERCIAL",
      corpo:
        "• Monitorar os conjuntos residenciais com possíveis focos de vazamentos de forma eletrônica;\n" +
        "• Fazer justiça com os moradores pagando sua conta de água apenas pelo seu próprio consumo;\n" +
        "• Possibilitar cada morador controlar e monitorar seu consumo de acordo com sua expectativa.",
    },
    {
      titulo: "PROCEDIMENTO TÉCNICO DA INDIVIDUALIZAÇÃO DOS APARTAMENTOS",
      corpo:
        "a) Cadastramento de todos os hidrômetros existentes nos apartamentos;\n" +
        "b) Leitura mensal, no mesmo dia da Sabesp, pelo sistema visual, identificando o consumo, vazamentos ou mau funcionamento dos equipamentos;\n" +
        "c) Envio eletrônico da planilha de consumo individual de todos os apartamentos com seus respectivos valores conforme a tabela Sabesp;\n" +
        "d) Consultoria mensal para avaliação do sistema, do consumo e estratégias de economia de água;\n" +
        "e) Disponibilidade da leitura mensal com foto por meio do e-mail.",
    },
    {
      titulo: "TRÂMITES ADMINISTRATIVOS FINAIS",
      corpo:
        "a) Decorridos 30 (trinta) dias a contar pelo vencimento da conta de água consecutiva à conclusão, apresentaremos um relatório de consumo de água individual do mês vigente em caráter de orientação. Com isso, os moradores tomarão conhecimento do consumo individual de cada unidade e a partir de então passarão a arcar individualmente com a conta de água em acordo com seu consumo real.",
    },
  ],
  demonstrativos:
    "Após as medições mensais, emitimos um demonstrativo individual para cada unidade do condomínio com todas as informações referente à medição, como por exemplo: a foto do medidor, consumo (m³), período de leitura, valor final para pagamento, histórico de consumo, data da próxima medição, conforme exemplo abaixo:",
  outrasDisposicoes:
    "a) O valor mensal de leitura sofrerá reajuste pelo IPCA a cada 12 (doze) meses.\n" +
    "b) A validade deste orçamento é de 30 dias a partir da emissão do mesmo.",
};

const GAS: ModeloGestao = {
  sistema: "gás",
  ponto: "gasômetro",
  pontoPlural: "Gasômetros",
  ref: "Proposta para implantação do sistema de individualização do consumo de gás",
  secoes: [
    {
      titulo: "INDIVIDUALIZAÇÃO DE GÁS",
      corpo:
        "Análise técnica: Trata-se de uma proposta para assumir a gestão mensal dos gasômetros do condomínio pelo sistema de leitura visual.",
    },
    {
      titulo: "OBJETIVO DA NOSSA PROPOSTA COMERCIAL",
      corpo:
        "1) Promover a justiça na cobrança das despesas de gás, evitando cobranças indevidas ou dissociadas do consumo efetivo de cada unidade;\n" +
        "2) Capacitar os moradores a controlar e monitorar seu consumo de gás, incentivando o uso consciente e a economia;\n" +
        "3) Facilitar a gestão e fiscalização do consumo de gás pelo condomínio, com informações transparentes e acessíveis.",
    },
    {
      titulo: "PROCEDIMENTO TÉCNICO DA INDIVIDUALIZAÇÃO DOS APARTAMENTOS",
      corpo:
        "1) Cadastramento de todos os gasômetros existentes nos apartamentos;\n" +
        "2) Leitura mensal, no mesmo dia da concessionária fornecedora de gás, pelo sistema visual, identificando o consumo, ou mau funcionamento dos equipamentos;\n" +
        "3) Envio eletrônico da planilha de consumo individual de todos os apartamentos com seus respectivos valores conforme a da concessionária de gás;\n" +
        "4) Consultoria mensal para avaliação do sistema, do consumo e estratégias de economia de gás;\n" +
        "5) Disponibilidade da leitura mensal com foto por meio do e-mail.",
    },
    {
      titulo: "TRÂMITES ADMINISTRATIVOS FINAIS",
      corpo:
        "a) Decorridos 30 (trinta) dias a contar pelo vencimento do gás consecutivo às conclusões, apresentaremos um relatório de consumo de gás no mês vigente em caráter de orientação. Com isso, os moradores tomarão conhecimento do consumo individual de cada unidade e a partir de então passarão a arcar individualmente com a conta de gás em acordo com seu consumo real.",
    },
  ],
  demonstrativos:
    "Após as medições mensais, emitimos um demonstrativo individual para cada unidade do condomínio com todas as informações referente à medição, como por exemplo: a foto do medidor, consumo (m³), período de leitura, valor final para pagamento, histórico de consumo, data da próxima medição, conforme exemplo abaixo:",
  outrasDisposicoes:
    "a) O valor mensal de leitura sofrerá reajuste pelo IPCA a cada 12 (doze) meses.\n" +
    "b) A validade deste orçamento é de 30 dias a partir da emissão do mesmo.",
};

export const MODELOS_GESTAO: Record<string, ModeloGestao> = {
  gestao_mensal_agua: AGUA,
  gestao_mensal_gas: GAS,
};

export function isGestaoMensal(tipo: string): boolean {
  return tipo === "gestao_mensal_agua" || tipo === "gestao_mensal_gas";
}

// ---------------------------------------------------------------------------
// TSS Light — fonte: modelos-orcamentos/orcamento - tsslight.pdf
// ---------------------------------------------------------------------------
export const TSS_LIGHT = {
  ref: "Proposta para implantação do sistema TSS Light",
  secoes: [
    {
      titulo: "AUTOMAÇÃO DA LEITURA ATRAVÉS DO TSS LIGHT",
      corpo:
        "Como compromisso de sempre buscar ideias inovadoras para nossos clientes, a Hydrojexe está lançando o TSS Light, um dispositivo que deixa o condomínio com sua leitura autônoma, dispensando assim a necessidade do leiturista.",
    },
    {
      titulo: "O QUE É E COMO FUNCIONA",
      corpo:
        "O TSS Light é um concentrador de dados que recebe os sinais de rádio dos medidores e os envia, via rede de dados móveis (3G/4G), para nossos servidores, que disponibilizam a informação de consumo diário no Portal do Cliente.\n" +
        "Após análise técnica, o equipamento, normalmente, é instalado em um dos elevadores do condomínio que, durante seu movimento entre os andares, realiza a captura dos sinais de rádio dos medidores.",
    },
  ] as SecaoModelo[],
  prazoPadrao:
    "a) O sistema será implantado em 35 (trinta e cinco) dias úteis, de acordo com cronograma a ser desenvolvido de forma conjunta com o condomínio.",
  notaQtd:
    "Quantidade de equipamentos a ser definida após análise técnica para medição total do condomínio.",
  disposicoes:
    "• O TSS Light possui garantia de 02 (dois) anos após a emissão de nota fiscal do fabricante;\n" +
    "• Este orçamento tem validade de 30 (trinta) dias após a data de emissão do mesmo.",
};

export type TssOpcao = { valor: number; parcelas: number };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "à vista" | "Em 06x de R$ 540,00" (sem entrada) */
export function textoFormaTss(o: TssOpcao): string {
  if (!o.parcelas || o.parcelas <= 1) return "à vista";
  return `Em ${String(o.parcelas).padStart(2, "0")}x de ${brl(o.valor / o.parcelas)}`;
}

/** "à vista" | "Em 06 parcelas de R$ 198,60" (sem entrada) */
export function textoFormaParcelas(o: TssOpcao): string {
  if (!o.parcelas || o.parcelas <= 1) return "à vista";
  return `Em ${String(o.parcelas).padStart(2, "0")} parcelas de ${brl(o.valor / o.parcelas)}`;
}

export function isIndividualizacaoGas(tipo: string): boolean {
  return tipo === "individualizacao_gas";
}

// ---------------------------------------------------------------------------
// Individualização de gás — fonte: modelos-orcamentos/orcamento - individualizacao de gás.pdf
// ---------------------------------------------------------------------------
export const INDIVIDUALIZACAO_GAS = {
  ref: "Instalação de gasômetros individualizados para medição de gás pelo sistema de telemetria",
  analiseTecnicaPadrao:
    "Análise técnica: Trata-se de um edifício com toda a infraestrutura individualizada de gás, viabilizando a instalação de um equipamento por unidade sem haver necessidade de qualquer intervenção de retrofit.",
  secoes: [
    {
      titulo: "PROCEDIMENTO TÉCNICO DE INSTALAÇÃO DO MEDIDOR DE GÁS",
      corpo: "• Instalação de 01 (um) medidor de gás por unidade.",
    },
    {
      titulo: "TRÂMITES ADMINISTRATIVOS INICIAIS",
      corpo:
        "a) Análise preliminar do abastecimento e distribuição de gás do condomínio e execução de mapeamento com plano de ação para a intervenção.\n" +
        "b) Emissão de comunicado formal aos condôminos orientando quanto aos procedimentos executivos de intervenção a serem realizados em cada unidade.\n" +
        "c) Apresentação de cronograma detalhado da obra e agendamento de acesso em cada unidade.",
    },
    {
      titulo: "PROCEDIMENTO EXECUTIVO",
      corpo:
        "Medidor de gás tipo diafragma com vazão nominal de {vazao_gas}, com saída de pulso indutivo, deslocamento positivo em uma unidade de medição interna com duas câmaras. O equipamento possui vida útil prolongada e segura, alta resistência a intempéries e baixo nível de ruído. O medidor possui homologação INMETRO no Brasil, estando em conformidade com a Portaria Nº 089 do INMETRO. Projetado sob o conceito de modularidade com acoplagem direta, gasômetro/rádio, sem o uso de cabos de conexão (Reed Switch).\n" +
        "\n" +
        "Outras informações:\n" +
        "• Modularidade com rede de transmissão sem fio da Techem;\n" +
        "• Alta precisão de medição, com tecnologia comprovada;\n" +
        "• Compatibilidade total com o sistema de rádio frequência mais testado e utilizado.",
    },
  ] as SecaoModelo[],
  prazoPadrao:
    "a) O sistema será implantado em 30 (trinta) dias úteis, de acordo com cronograma a ser desenvolvido de forma conjunta com o condomínio. Este prazo está associado à liberação das unidades privadas para os nossos funcionários, uma vez que o medidor fica dentro de cada apartamento.",
  garantia:
    "a) Os equipamentos possuem garantia de 02 (dois) anos conforme orientação do fabricante;\n" +
    "b) Os valores dos gasômetros possuem validade de até 30 dias após sua execução.",
  /** linha em vermelho abaixo das opções de investimento */
  gerenciamentoNota(valorPorGasometro: number): string {
    return `O valor para o gerenciamento mensal de leitura e monitoramento completo do sistema de gás é de ${brl(valorPorGasometro)} por gasômetro.`;
  },
};

// ---------------------------------------------------------------------------
// Overrides pela tabela public.modelos_proposta (editáveis na tela de admin)
// ---------------------------------------------------------------------------
export const MODELOS_PROPOSTA_TIPOS: { tipo: string; nome: string }[] = [
  { tipo: "gestao_mensal_agua", nome: "Gestão mensal — água" },
  { tipo: "gestao_mensal_gas", nome: "Gestão mensal — gás" },
  { tipo: "tss_light", nome: "TSS Light" },
  { tipo: "individualizacao_gas", nome: "Individualização de gás" },
];

/** Seções-padrão (do código) para um tipo de proposta não-completa. */
export function secoesDefault(tipo: string): SecaoModelo[] {
  if (tipo === "gestao_mensal_agua" || tipo === "gestao_mensal_gas") {
    return MODELOS_GESTAO[tipo].secoes;
  }
  if (tipo === "tss_light") return TSS_LIGHT.secoes;
  if (tipo === "individualizacao_gas") return INDIVIDUALIZACAO_GAS.secoes;
  return [];
}

/** Filtra um jsonb qualquer para um array de seções válidas. */
export function sanitizeSecoes(raw: unknown): SecaoModelo[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => x as { titulo?: unknown; corpo?: unknown })
    .filter((x) => typeof x.titulo === "string" && typeof x.corpo === "string")
    .map((x) => ({ titulo: x.titulo as string, corpo: x.corpo as string }));
}

/** Seções efetivas: override do banco se houver, senão o padrão do código. */
export function secoesEfetivas(tipo: string, override: unknown): SecaoModelo[] {
  const ov = sanitizeSecoes(override);
  return ov.length > 0 ? ov : secoesDefault(tipo);
}
