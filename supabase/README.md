# Banco de dados (Supabase)

Modelo de dados do sistema de orçamentos Hydrojexe — 12 entidades.
Regras de negócio de referência: [`../prompt-sistema-hydrojexe_3.md`](../prompt-sistema-hydrojexe_3.md).

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `migrations/0001_schema.sql` | Extensões, função `set_updated_at`, as 12 tabelas, índices e constraints. |
| `migrations/0002_rls.sql` | Habilita RLS em todas as tabelas + `is_admin()` + política "autenticado tem acesso total" (provisória, refinada na etapa de login). |
| `migrations/0003_grants.sql` | GRANTs das roles da API (`service_role`, `authenticated`) + default privileges. Normalmente o Supabase faz isso sozinho; neste projeto não veio. |
| `migrations/0004_auth.sql` | Trigger em `auth.users` que cria/sincroniza a linha em `public.usuarios` (nome/perfil vêm do `user_metadata`). |
| `migrations/0005_rls_perfis.sql` | Substitui a política provisória de `0002` por regras por perfil (ver matriz no topo do arquivo). |
| `migrations/0006_precos_fn.sql` | `aplicar_tabela_precos(vigencia, precos jsonb)`: aplica uma nova tabela de preços em bloco — pula células sem mudança, fecha a vigência anterior e cria a nova, rejeita data retroativa. |
| `migrations/0007_templates_seed.sql` | Preenche os textos fixos do PDF no template `Padrão` (seções 1–6 + garantia), transcritos do PDF de exemplo. `UPDATE` idempotente. |
| `seed.sql` | Dados de referência: formas de pagamento (à vista, 6x, 9x, 12x, 24x) e catálogo único de itens precificáveis. **Não** insere preços nem orçamentos. |
| `seed_precos.sql` | Tabela de preços vigente (36 valores do `tabela - orçamento.jpeg`, vigência a partir de 2026-08-27). Idempotente. Rodar depois de `seed.sql`. |

| `migrations/0008_orcamento_incluir_tss.sql` | Coluna `orcamentos.incluir_tss` — TSS opcional por orçamento. |
| `migrations/0009_orcamento_multiforma.sql` | Remove `orcamentos.forma_pagamento_id`; adiciona `incluir_24x` (depois removido na 0010). Orçamento não elege forma; PDF traz as 4; snapshots = à vista. |
| `migrations/0010_formas_extras_administradora.sql` | Troca `incluir_24x` por `orcamentos.parcelas_custom int[]` (formas extras, base 12x); adiciona `condominios.administradora`. |

Ordem de execução: `0001` … `0010` → `seed.sql` → `seed_precos.sql`.

## Como aplicar

### Opção A — SQL Editor do Dashboard
1. Supabase Dashboard → **SQL Editor**.
2. Cole e rode, nesta ordem: `0001_schema.sql`, `0002_rls.sql`, `seed.sql`.

### Opção B — Supabase CLI
```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push          # aplica migrations/
npx supabase db execute --file supabase/seed.sql
```

## Depois de aplicar: gerar os tipos TypeScript

`types/database.ts` é gerado a partir do schema. Duas formas:

```bash
# sem login (usa a service_role do .env.local):
npm run gen:types

# ou CLI oficial (requer `npx supabase login`):
npx supabase gen types typescript --project-id javbjxmqqbfcuynzxmgd --schema public > types/database.ts
```

## As 12 entidades

1. **usuarios** — espelha `auth.users`; perfis `comercial` | `admin`.
2. **condominios** — identificação do cliente.
3. **formas_pagamento** — configuráveis; `usa_preco_de_forma_id` faz 24x reaproveitar preços de 12x.
4. **itens_precificaveis** — catálogo único; `is_tss` marca o item TSS.
5. **precos** — histórico por item × forma × vigência (`daterange`, sem sobreposição).
6. **orcamentos** — 1 condomínio + 1 forma de pagamento; snapshots `total_unidades`, `valor_tss`, `valor_total`.
7. **tipos_apartamento** — divisões do orçamento; `unidades` = qtd de apartamentos do tipo.
8. **tipo_apartamento_itens** — composição de pontos/itens de cada tipo (manual).
9. **orcamento_valores_congelados** — preço unitário praticado na criação (não recalcula).
10. **historico_alteracoes** — log de auditoria (quem, quando, antes/depois).
11. **gerenciamento_mensal** — taxa mensal por hidrômetro; valor varia por orçamento.
12. **templates_texto** — textos fixos do PDF (seções 1–6 + garantia), modelo único.

## Fórmula (referência, ainda não implementada)

```
valor_por_apto = Σ(qtd_item × valor_item_na_forma)
               + (valor_TSS_na_forma ÷ total_unidades_condominio)

valor_total_orcamento = Σ_tipos (unidades_do_tipo × valor_por_apto_do_tipo)
```
