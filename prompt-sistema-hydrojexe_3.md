# Contexto do projeto: Sistema de Orçamentos Hydrojexe

Quero que você me ajude a planejar e depois construir um sistema web interno para a Hydrojexe, que gera orçamentos de individualização de água/gás (hidrômetros, válvulas hidra, TSS etc.) para condomínios, no mesmo padrão dos orçamentos anexos (nº 091.2026 - Queluz e nº 093/2026 - Aurora).

Antes de escrever qualquer código, quero que você trabalhe comigo nisto:

1. Valide o entendimento do modelo de negócio abaixo (já confirmado comigo).
2. Proponha o modelo de dados (banco) baseado nisso.
3. Só depois disso partimos para código.

Não pule direto para código. Primeiro discuta comigo o modelo de dados.

---

## 1. Modelo de negócio — CONFIRMADO

### Estrutura geral de um orçamento

Um orçamento é feito para **um condomínio**, tem um número (ex: 091.2026) e data. Ele é dividido em **um ou mais "tipos de apartamento"** (ex: no Queluz: "Apartamento padrão" e "Cobertura 111,112,113,114"; no Aurora: "Apartamento Frente" e "Apartamento Fundos").

Cada **tipo de apartamento** tem:
- Uma **quantidade de unidades** daquele tipo no condomínio (informada manualmente pelo comercial — não há regra fixa).
- Uma **composição de itens/pontos** própria (ex: "01 Hidrômetro + TSS", "02 Hidrômetros + 02 Válvulas Hidras", "02 Hidrômetros + 01 Válvula Hidra"). Essa composição é **informada manualmente pelo comercial**, sem regra automática.
- Um **valor por apartamento**, calculado a partir da composição de itens (ver abaixo), para cada forma de pagamento.

O valor total do orçamento = soma, para cada tipo de apartamento, de (quantidade de unidades × valor por apartamento daquele tipo, na forma de pagamento escolhida).

### Itens/produtos e tabela de preços (ÚNICA para todos os condomínios)

Existe uma tabela de preços única (igual para todos os clientes), com os seguintes itens, cada um com valores conforme forma de pagamento (À vista / 6x / 9x / 12x — 24x também apareceu em um caso, então o sistema deve suportar formas de pagamento configuráveis, não fixas em 4):

- **Caixa acoplada** (ponto/hidrômetro padrão)
- **Hidra** (H = válvula hidra — troca de válvula hidra por caixa acoplada branca; NÃO é sinônimo de "hidrômetro")
- **Hidrômetro Visual**
- **Preparado 1,5m³**
- **Preparado 2,5m³**
- **Preparado 1,5m³ Água quente**
- **Gás 1.6**
- **Gás 2.5**
- **TSS**

Cada um desses itens tem sua própria linha de preço por forma de pagamento na "Tabela" (ver planilha anexada como referência).

### Regra do "H" / Hidra — CONFIRMADO

- H = Hidra é uma **válvula** que, quando presente no apartamento, é **trocada** por uma caixa acoplada (cor branca). Isso gera uma cobrança adicional por "troca de válvula hidra", com valor próprio na tabela (linha "Hidra"), diferente do valor do hidrômetro.
- Um tipo de apartamento pode ter 0, 1 ou mais válvulas Hidra a trocar — isso é definido manualmente pelo comercial ao montar o orçamento (ex: Aurora "Frente" = 2 válvulas; "Fundos" = 1 válvula).
- Custo do tipo de apartamento = (qtd hidrômetros × valor do hidrômetro) + (qtd válvulas hidra × valor da troca de hidra) + (rateio de TSS — ver abaixo), tudo na forma de pagamento escolhida.

### TSS — CONFIRMADO (fórmula validada)

- TSS é cobrado **uma única vez por orçamento**, com valor da tabela **na forma de pagamento escolhida para aquele orçamento** (o comercial define se o orçamento inteiro será à vista, 6x, 9x, 12x — TSS acompanha essa mesma forma de pagamento).
- Esse valor é **dividido pela quantidade total de unidades do condomínio** (não por ponto/hidrômetro).
- **Rateio de TSS por unidade = valor do TSS (na forma de pagamento escolhida) ÷ total de unidades do condomínio.**
- Esse rateio é **somado ao valor do(s) ponto(s)** de cada tipo de apartamento.
- **Exemplo validado (Queluz, à vista):** TSS à vista = R$ 3.150,00 ÷ 45 unidades = R$ 70,00 por unidade. Valor do ponto (Caixa acoplada, à vista) = R$ 1.025,64. Total por apartamento = R$ 1.025,64 + R$ 70,00 = **R$ 1.095,64** ✓ (bate exatamente com o orçamento real).
- Fórmula geral por tipo de apartamento: `valor_por_apto = (qtd_hidrômetros × valor_hidrômetro) + (qtd_válvulas_hidra × valor_hidra) + (valor_TSS_na_forma_pagamento ÷ total_unidades_condomínio)`, tudo na mesma forma de pagamento.

### Gerenciamento mensal — CONFIRMADO (varia por orçamento)

- Existe uma cobrança recorrente de "gerenciamento mensal de leitura e monitoramento", cobrada **por hidrômetro instalado**.
- O valor **não é fixo/global** — no Queluz foi R$ 4,00/hidrômetro, no Aurora foi R$ 7,00/hidrômetro. Ou seja, é um valor definido **por orçamento/contrato**, não uma constante do sistema.

### Formas de pagamento — CONFIRMADO (configuráveis)

- Formas de pagamento **não são fixas em 4 opções**. O sistema deve permitir cadastrar/editar formas de pagamento livremente (à vista, 6x, 9x, 12x, 24x, ou outras que surjam), cada uma com seu próprio valor na tabela de preços por item.
- Regra específica: a forma **24x usa o mesmo valor-base que a forma 12x** da tabela (ou seja, ao cadastrar preços, 24x não precisa de uma linha de preço própria — reaproveita o valor de 12x). Isso deve ser algo configurável/documentado no cadastro da forma de pagamento, não hard-coded.
- Cada orçamento tem **uma forma de pagamento escolhida pelo comercial** (não múltiplas simultâneas no mesmo documento) — mas o comercial pode gerar orçamentos diferentes para formas diferentes, se quiser comparar.

### Textos padrão do PDF — CONFIRMADO

- Os textos fixos (itens 1 a 6: Individualização de água, Objetivo, Procedimento técnico, Intervenção, Trâmites administrativos finais, Gerenciamento mensal, Garantia) **são realmente sempre iguais**, não mudam de condomínio para condomínio. Podem ser tratados como um "modelo" único e reaproveitado em todo orçamento, sem necessidade de edição por orçamento.

### Apartamentos fora do padrão — CONFIRMADO

- Ajustes de apartamentos fora do padrão (reforma, zeladoria etc., com mais ou menos pontos) **só são registrados no sistema se o condomínio pedir uma atualização do orçamento inicial**. Ou seja: não é um fluxo automático pós-vistoria dentro do sistema de orçamentos — é tratado como uma **edição normal do orçamento existente** (usando o histórico de alterações já previsto), a pedido do cliente. Não precisa de um fluxo/tela separada para isso.

### Regras de edição e histórico — CONFIRMADO

- Um orçamento **pode ser editado** depois de gerado/enviado.
- Toda edição precisa ser **rastreável** (log de alterações: quem alterou, quando, o que mudou, valores antes/depois). Não é necessário bloquear edição, mas é obrigatório ter histórico de mudanças.
- Isso é adicional (não substitui) à regra já definida antes: se a **tabela de preços global** mudar, orçamentos já criados **não devem ser recalculados automaticamente** — eles guardam os valores praticados no momento da criação.

### Geração de PDF — CONFIRMADO (obrigatório)

- O sistema **precisa gerar PDF no mesmo padrão visual** dos orçamentos anexos (cabeçalho Hydrojexe + Techem, numeração "Orçamento nº XXX/AAAA", seções numeradas: Individualização de água, Objetivo, Procedimento técnico, Intervenção, Trâmites administrativos finais, Gerenciamento mensal, Prazo, Investimento com tabelas por tipo de apartamento, Garantia).
- Esse layout tem **textos padrão/fixos** (itens 1, 2, 3, 4, 5, 8/9 - garantia) que se repetem em todo orçamento, e **partes variáveis** (dados do condomínio, tabelas de investimento, valor do gerenciamento mensal por hidrômetro). O sistema deveria permitir editar os textos padrão como "modelo", sem precisar reescrever tudo a cada orçamento.

### Perfis de usuário — CONFIRMADO

- Apenas **dois perfis**: Funcionário/Comercial e Administrador.
- "Gerência" = Administrador (não é perfil separado).

### Volume / escala — CONFIRMADO

- No máximo **4 funcionários** usando o sistema. Isso significa que a infraestrutura pode (e deve) ser bem enxuta — nada de arquitetura para milhares de usuários simultâneos.

### Hospedagem — EM ABERTO, com sugestão

- Ainda não decidido. Sugestão inicial: **Supabase** (Postgres + autenticação + backup automático prontos, gratuito nesse volume de uso, fácil de configurar com segurança desde o início). Vale abrir essa conversa com o Claude durante o planejamento técnico, mas não é bloqueante para desenhar o modelo de dados.

---

## 2. Status das regras de negócio

**Todas as regras de negócio necessárias para modelar o sistema já estão confirmadas.** Não há mais perguntas em aberto sobre cálculo, TSS, formas de pagamento, textos do PDF ou fluxo de ajustes. A única decisão realmente em aberto é a de **hospedagem** (sugestão: Supabase), que pode ser resolvida durante o planejamento técnico, sem bloquear a modelagem de dados.

---

## O que eu quero que você faça agora

1. Leia o modelo de negócio confirmado acima e me diga se restou algo ambíguo ou contraditório.
2. Proponha uma modelagem inicial do banco de dados (entidades sugeridas: condomínio, orçamento, tipo de apartamento, item/produto, tabela de preços por item e forma de pagamento, forma de pagamento, histórico de alterações do orçamento, usuários/perfis) — primeiro em texto/diagrama, sem código ainda.
3. Depois de eu validar o modelo de dados, comece a estruturar o projeto (stack sugerida, estrutura de pastas) antes de gerar qualquer arquivo de código.
