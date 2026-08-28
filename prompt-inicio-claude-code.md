# Início do projeto: Sistema de Orçamentos Hydrojexe

Contexto completo do negócio está no arquivo `prompt-sistema-hydrojexe.md` nesta pasta — leia esse arquivo primeiro, ele já tem todas as regras de cálculo, TSS, formas de pagamento e o modelo de dados que já validei.

Stack já decidida:
- Next.js (React)
- Supabase (Postgres + autenticação)
- Tailwind CSS
- Geração de PDF (sugestão: @react-pdf/renderer, mas pode sugerir alternativa se achar melhor)
- Deploy futuro: Vercel

Modelo de dados já aprovado (12 entidades): usuarios, condominios, formas_pagamento, itens_precificaveis, precos (com histórico de vigência por data), orcamentos, tipos_apartamento, tipo_apartamento_itens, orcamento_valores_congelados, historico_alteracoes, gerenciamento_mensal, templates_texto.

## O que eu quero AGORA (só isso, nada além):

1. Crie a estrutura inicial do projeto Next.js + Tailwind (`npx create-next-app` configurado corretamente).
2. Configure a conexão com Supabase (vou te passar a URL e a chave do projeto quando você pedir — não invente credenciais).
3. Crie os arquivos SQL de criação das 12 tabelas do modelo de dados, seguindo exatamente o que está descrito no `prompt-sistema-hydrojexe.md`.
4. Monte a estrutura de pastas básica (app/, components/, lib/, types/) sem ainda implementar as telas.
5. Pare aí e me mostre o que foi criado, antes de seguir para qualquer tela ou lógica de cálculo.

Não implemente login, telas de orçamento, cálculo de preços, nem geração de PDF ainda — isso vem depois, em etapas separadas, para eu conseguir revisar cada parte com calma.

Se precisar de alguma decisão minha (ex: nome do projeto no Supabase, alguma escolha técnica), pergunte antes de prosseguir, não assuma.
