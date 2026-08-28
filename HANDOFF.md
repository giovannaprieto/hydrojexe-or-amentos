# Handoff — Sistema de Orçamentos Hydrojexe

Documento de contexto completo. Estado em **2026-08-27**. Serve para outro
desenvolvedor (ou outra sessão de IA) continuar sem depender do histórico da
conversa.

---

## 1. O que é

Sistema web **interno** da Hydrojexe para gerar orçamentos de individualização
de água/gás para condomínios, no padrão dos orçamentos em papel timbrado da
empresa (ex.: nº 091.2026 Queluz, nº 093/2026 Aurora).

- Máx. ~4 usuários simultâneos. Infra enxuta de propósito.
- Regras de negócio originais: [`prompt-sistema-hydrojexe_3.md`](prompt-sistema-hydrojexe_3.md).
  **Algumas regras evoluíram na conversa** — ver seção 6 (a versão deste
  documento prevalece sobre o prompt original onde houver conflito).

### Stack

| Camada | Tecnologia |
|---|---|
| Front + back | **Next.js 16.3.3** (App Router, Server Actions, Route Handlers), React 19, TypeScript |
| Estilo | Tailwind CSS v4 |
| Banco + Auth | **Supabase** (Postgres + Auth + PostgREST + RLS) |
| PDF | **@react-pdf/renderer** 4.x (decisão firmada — ver seção 11) |
| Deploy | Vercel (ainda **não** feito) |

---

## 2. Ambiente / como rodar

### Máquina da usuária (Windows, sem admin)

- **Não há Node instalado no sistema.** Node **v24.20.0** portátil em
  `C:\Users\giovanna.prieto\nodejs`, adicionado ao PATH do usuário.
  Se `node`/`npm` sumirem num shell: `$env:Path = "$env:Path;$env:USERPROFILE\nodejs"` (PowerShell).
- **PowerShell com execution policy Restricted** → `npm`/`npx` (shims `.ps1`) falham.
  Alternativas: chamar `node` direto, usar `npm.cmd`/`npx.cmd`, ou a usuária rodar
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` (sem admin).
- `winget` não funciona (UAC bloqueado). Instalações: preferir portátil/zip.
- `git` está disponível. O projeto **não** é repo git ainda (`create-next-app` rodou com `--disable-git`).

### Rodar o app

```bash
cd "C:\Users\giovanna.prieto\Downloads\hydrojexe-orçamentos"
npm install                     # 1ª vez
npm run dev                     # http://localhost:3000
```

Se `npm run dev` for bloqueado pela execution policy: `node node_modules\next\dist\bin\next dev`.
Há um wrapper `.claude/dev.cmd` + `.claude/launch.json` usado só pelas ferramentas
de preview do assistente (prepende o dir do Node no PATH).

### Scripts

| Comando | O quê |
|---|---|
| `npm run dev` / `build` / `start` / `lint` | padrão Next |
| `npm run gen:types` | regenera `types/database.ts` a partir do schema (via OpenAPI do PostgREST, usa `SUPABASE_SERVICE_ROLE_KEY`). Roda `scripts/gen-types.mjs`. Alternativa oficial exige `supabase login`. |
| `npm run create:user -- --email X --senha Y --nome "N" --perfil admin\|comercial` | cria usuário no Supabase Auth pelo terminal (bootstrap do 1º admin). Roda `scripts/create-user.mjs`. |

### Variáveis de ambiente — `.env.local` (git-ignored; `.env.local.example` versionado)

| Var | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://javbjxmqqbfcuynzxmgd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (`sb_publishable_...`) — vai pro browser |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key — **só server-side**, nunca no client |

Projeto Supabase: ref `javbjxmqqbfcuynzxmgd`, região São Paulo (Free).

### Admin criado (bootstrap)

- **e-mail:** `gerencia@hydrojexe.com.br`
- **senha provisória:** `JEkWqTgxzicGpsvU` (trocar em produção)

---

## 3. Banco de dados

### As 12 entidades (migration `0001_schema.sql`)

| Tabela | Papel |
|---|---|
| `usuarios` | espelha `auth.users`. `perfil` = `comercial` \| `admin`. `ativo`. |
| `condominios` | identificação do cliente. **+ `administradora`** (0010). |
| `formas_pagamento` | configuráveis. `slug`, `num_parcelas`, `usa_preco_de_forma_id` (24x → 12x), `ordem`, `ativo`. |
| `itens_precificaveis` | catálogo único. `slug`, `unidade` (`ponto`\|`valvula`\|`orcamento`), `is_tss` (só 1 linha true), `ativo`, `ordem`. |
| `precos` | histórico por (item × forma × vigência). `EXCLUDE` impede sobreposição de vigência. `vigencia_fim` NULL = aberto. |
| `orcamentos` | 1 condomínio. `numero` único, `ano`, `data_orcamento`, `status` (rascunho/enviado/aprovado/recusado/cancelado). Snapshots: `total_unidades`, `valor_tss`, `valor_total` (= **à vista**). **+ `incluir_tss`** (0008), **+ `parcelas_custom int[]`** (0010). `template_texto_id`. `criado_por` / `atualizado_por`. **`forma_pagamento_id` foi REMOVIDA** (0009). |
| `tipos_apartamento` | divisões do orçamento. `nome`, `unidades` (qtd de aptos do tipo, manual), `ordem`, `valor_por_apartamento` (snapshot à vista). |
| `tipo_apartamento_itens` | composição: (tipo × item × quantidade). unique (tipo, item). |
| `orcamento_valores_congelados` | preço unitário congelado por **(orçamento × item × forma)**. `valor_unitario`, `preco_id` (origem). unique (orcamento, item, forma). Congela-se **todas as formas próprias** ao salvar. |
| `historico_alteracoes` | log. `entidade`, `entidade_id`, `acao`, `campo`, `valor_antes`/`valor_depois` (jsonb), `descricao`, `alterado_por`, `alterado_em`. Append-only via RLS. |
| `gerenciamento_mensal` | 1:1 com orçamento. `valor_por_hidrometro` (varia por contrato), `qtd_hidrometros`, `valor_total_mensal`. |
| `templates_texto` | textos fixos do PDF: 7 colunas `sec_*` (individualização, objetivo, procedimento_tecnico, intervencao, tramites_administrativos, gerenciamento_mensal, garantia). `is_padrao` (só 1). |

### Migrations (rodadas **manualmente pela usuária no SQL Editor** do Supabase — não há senha do banco/CLI logada)

| # | O quê | Status |
|---|---|---|
| `0001_schema.sql` | extensões (`pgcrypto`, `btree_gist`), `set_updated_at()`, as 12 tabelas, índices, constraints | aplicada |
| `0002_rls.sql` | habilita RLS em todas as tabelas + `is_admin()` + política provisória "autenticado tem acesso total" | aplicada |
| `0003_grants.sql` | GRANTs para `service_role` / `authenticated` + default privileges (o Supabase não concedeu sozinho neste projeto) | aplicada |
| `0004_auth.sql` | trigger `auth.users` → cria/sincroniza linha em `public.usuarios` (nome/perfil vêm do `user_metadata`) | aplicada |
| `0005_rls_perfis.sql` | substitui a política de 0002 por regras por perfil (ver matriz no topo do arquivo) | aplicada |
| `0006_precos_fn.sql` | função `aplicar_tabela_precos(vigencia, precos jsonb)` — nova tabela de preços em bloco (pula células iguais, fecha vigência anterior, rejeita data retroativa) | aplicada |
| `0007_templates_seed.sql` | textos fixos do PDF no template "Padrão" | **aplicada via script `service_role`** (é UPDATE, não DDL); o `.sql` fica só pro histórico |
| `0008_orcamento_incluir_tss.sql` | `orcamentos.incluir_tss boolean default true` | aplicada |
| `0009_orcamento_multiforma.sql` | **remove** `orcamentos.forma_pagamento_id`; adiciona `incluir_24x` (depois removido na 0010) | aplicada |
| `0010_formas_extras_administradora.sql` | **remove** `incluir_24x`; adiciona `orcamentos.parcelas_custom int[]` e `condominios.administradora` | aplicada |
| `seed.sql` | formas de pagamento (à vista, 6x, 9x, 12x, 24x) + catálogo dos 9 itens | aplicada |
| `seed_precos.sql` | tabela de preços vigente (36 valores de `tabela - orçamento.jpeg`, vigência a partir de 2026-08-27) | aplicada |

**Ordem para recriar do zero:** `0001` … `0010` → `seed.sql` → `seed_precos.sql` → `0007` (ou o script de templates).

### RLS por perfil (`0005`)

- `usuarios`, `formas_pagamento`, `itens_precificaveis`, `precos`, `templates_texto`: SELECT p/ autenticado, WRITE só `is_admin()`.
- `condominios` + tabelas de orçamento (`orcamentos`, `tipos_apartamento`, `tipo_apartamento_itens`, `orcamento_valores_congelados`, `gerenciamento_mensal`): ALL p/ autenticado.
- `historico_alteracoes`: SELECT + INSERT p/ autenticado (append-only).
- `service_role` ignora RLS (BYPASSRLS) — usado no `lib/supabase/admin.ts` e nos scripts.

### Pendência de config no Supabase (recomendada, não bloqueante)

Authentication → desligar **"Allow new users to sign up"** (a publishable key roda no browser).

---

## 4. Autenticação

- **E-mail + senha** (Supabase Auth). Sem cadastro público.
- 2 perfis: `comercial` (funcionário) e `admin` (gerência).
- `proxy.ts` (raiz — convenção do Next 16, ex-`middleware.ts`) renova sessão e
  redireciona quem não está logado para `/login`.
- **Só admin cria usuários** — tela `/admin/usuarios` (usa `service_role` server-side).
- Helpers em `lib/auth.ts`: `getUsuarioAtual()` (memoizado por request), `requireUsuario()`, `requireAdmin()`.
- Trigger `handle_new_user` (0004) cria a linha em `public.usuarios`.

---

## 5. Rotas / telas

| Rota | Acesso | O quê |
|---|---|---|
| `/login`, `/logout` | público / autenticado | login (server action), logout (POST → signOut) |
| `/` | autenticado | home |
| `/condominios`, `/condominios/novo`, `/condominios/[id]` | todos | CRUD de condomínios (nome, cnpj, endereço, cidade/uf, síndico, **administradora**, contato, obs). Delete bloqueado se houver orçamento vinculado. |
| `/orcamentos` | todos | lista (número, condomínio, status, **total à vista**, data) |
| `/orcamentos/novo` | todos | condomínio + número sugerido (`NNN.AAAA`, editável) + data + R$/hidrômetro + `incluir_tss` + formas extras → cria rascunho |
| `/orcamentos/[id]` | todos | **builder**: cabeçalho editável, tipos de apartamento c/ composição, cálculo ao vivo **por forma**, gerenciamento, histórico, "Gerar PDF", "Recongelar preços", excluir |
| `/orcamentos/[id]/pdf` | todos | Route Handler que retorna `application/pdf` |
| `/admin/itens`, `/admin/itens/[id]` | admin | CRUD itens precificáveis |
| `/admin/formas-pagamento`, `/admin/formas-pagamento/[id]` | admin | CRUD formas de pagamento |
| `/admin/precos` | admin | matriz item × forma vigente + "Nova tabela em bloco" (`aplicar_tabela_precos`) + histórico |
| `/admin/usuarios` | admin | lista + criação de usuários |

Header (`components/app-header.tsx`): links Orçamentos, Condomínios (todos) + Formas de pagamento, Itens, Preços, Usuários (admin).

---

## 6. Regras de negócio — **versão atual** (após ajustes na conversa)

### Cálculo do orçamento (`lib/orcamento-calc.ts`, função pura usada no preview e na gravação)

```
rateio_TSS_por_unidade = incluir_tss ? (valor_TSS_na_forma / total_unidades) : 0
valor_por_apartamento  = round2( Σ(qtd_item × preço_unit_item_na_forma)  +  rateio_TSS_por_unidade )
subtotal_tipo          = round2( unidades × valor_por_apartamento )
valor_total            = Σ subtotal_tipo
```

- `total_unidades` = **soma de `unidades` de todos os tipos** do orçamento.
- O rateio de TSS é **SOMADO** ao valor do apartamento (nunca subtraído — dúvida da usuária esclarecida). Bate com o exemplo Queluz: 1.025,64 (caixa acoplada à vista) + 70,00 (3.150/45) = **1.095,64**.
- Itens `is_tss` **não** entram na composição do apartamento (o TSS é rateado, não somado por ponto).

### TSS opcional

- `orcamentos.incluir_tss` (default `true`). Se `false`: sem rateio, `valor_tss` snapshot = 0, TSS não é congelado.

### Formas de pagamento

- **O orçamento NÃO elege uma forma.** (`forma_pagamento_id` foi removida.)
- Formas "próprias" (com preço na tabela): **à vista, 6x, 9x, 12x** (slug `a_vista`, `6x`, `9x`, `12x`).
- `24x` tem `usa_preco_de_forma_id` → id do `12x` (reaproveita os preços de 12x).
- **Formas extras por orçamento:** `orcamentos.parcelas_custom int[]` (ex.: `{18,24,36}`), editadas no cabeçalho (`components/parcelas-custom.tsx`). **Todas usam a base de preço do 12x.** (Substituíram o antigo checkbox "24x" — para ter 24x, adiciona-se `24`.)
- **PDF e preview mostram**: as 4 próprias + cada forma extra (ordenadas). Nenhuma é destacada.

### Congelamento de preços

- Ao **Salvar orçamento**, congela em `orcamento_valores_congelados` o preço unitário
  de cada item referenciado (+ TSS se `incluir_tss`) para **todas as 4 formas próprias**.
- Edições posteriores usam o valor **congelado** se existir; senão o vigente na `data_orcamento`.
- Botão **"Recongelar preços pela tabela atual"** limpa os congelados (o próximo salvar recongela).
- **Snapshots** (`orcamentos.valor_total`, `valor_tss`, `tipos_apartamento.valor_por_apartamento`) = valores **à vista** (`formaBase` = slug `a_vista`, fallback = 1ª forma própria).

### Resolução de preço (`lib/orcamento-precos.ts`)

Por (item, forma), na `data_orcamento`: **congelado > vigente na data > tabela mais recente** daquele item (fallback para orçamento datado antes da 1ª tabela).

### Parcelamento (texto no PDF — `lib/pagamento.ts`)

- à vista (`num_parcelas <= 1`): `"À vista"`.
- parcelado: `"Entrada de R$ X e saldo em Nx de R$ Y"` onde `X = 10% do valor_por_apartamento` (`PERCENTUAL_ENTRADA = 0.1`) e `Y = (valor - X) / N`.

### Gerenciamento mensal

- `valor_por_hidrometro` varia por orçamento/contrato (ex.: Queluz R$ 4,00; Aurora R$ 7,00).
- `qtd_hidrometros` = **automático** (Σ sobre tipos: `unidades × Σ qtd de itens com `unidade = 'ponto'`), com **campo de override** no builder.
- `valor_total_mensal = qtd_hidrometros × valor_por_hidrometro`.

### Número do orçamento

- Sugerido `NNN.AAAA` (maior nº do ano + 1, zero-pad 3), **editável**, único.

### PDF — regras específicas (ver seção 7 para o estado)

- Seção INVESTIMENTO: "Opções" = as 4 formas + as extras (`Primeira`/`Segunda`/… Opção). Cada uma: tabela de 3 linhas (Quantidade de pontos por apartamento / Valor por apartamento / Forma de pagamento).
- "Quantidade de pontos por apartamento" = **auto** da composição: `"NN Hidrômetro(s)"` + `" + Tss"` (só se `incluir_tss`) + `" + NN Válvula(s) Hidra"` (se houver Hidra).
- **Nota vermelha** abaixo de cada opção, **quando o tipo tem Caixa acoplada + Hidra**:
  `* Considerar os valores de R$ X por hidrômetro e R$ Y para cada troca de válvula hidra para caixa acoplada cor branca. *`
  (X = preço da caixa acoplada naquela forma; Y = preço da Hidra naquela forma).
- **Linha do gerenciamento** ("a) O valor para o gerenciamento mensal de leitura…") = **vermelha e negrito**, frase inteira.
- **Administradora** do condomínio (se preenchida) → linha no cabeçalho ("Administradora: …").
- Prazo: usa `orcamentos.prazo` se preenchido; senão texto padrão "45 (quarenta e cinco) dias úteis…".

---

## 7. PDF — estado atual e o que falta

### Como funciona hoje

- `app/(app)/orcamentos/[id]/pdf/route.ts` (runtime `nodejs`, `force-dynamic`):
  carrega orçamento + condomínio + tipos + itens + gerenciamento + formas + template +
  congelados; computa opções por forma (4 próprias + `parcelas_custom` usando preços de 12x);
  monta as notas vermelhas; lê os logos de `assets/`; renderiza com `renderToBuffer(createElement(OrcamentoPdf, {...}))`.
- `components/pdf/orcamento-pdf.tsx` — o documento `@react-pdf`. Fonte `Times-Roman`/`Times-Bold` (built-in).
  Header fixo (logos Hydrojexe+Techem de `assets/`), footer fixo (endereço em texto), seções 1–9,
  tabelas de investimento, garantia, fecho.
- Textos fixos vêm de `templates_texto` (linha `is_padrao`), semeados de
  `exemplo - orçamento queluz.pdf`.
- `next.config.ts`: `serverExternalPackages: ["@react-pdf/renderer"]`.
- Verificado: gera PDF válido, N páginas, e os valores batem **exatamente** com o
  PDF de exemplo do Queluz (à vista 1.095,64 / 6x 1.189,44 / 9x 1.377,74 / 12x 1.424,92).

### O modelo atual = **"Individualização completa"** (formato Queluz)

Tem: análise técnica detalhada, seções Intervenção / Trâmites / Gerenciamento / Prazo /
Garantia, investimento com opções e parcelamento, gerenciamento mensal por hidrômetro.

### Assets disponíveis (adicionados pela usuária na pasta do projeto)

| Pasta / arquivo | Conteúdo |
|---|---|
| `papel timbrado.docx` | timbre. 3 imagens em `word/media/`: **image1** = marca d'água azul clara (gota), **image2** = cabeçalho (HydroJEXE + **Techem** + tagline "individualização de água e gás"), **image3** = rodapé (faixa azul c/ endereço/tel/e-mail + aba "www hydrojexe.com.br"). Copiadas em `assets/timbre-src/`. |
| `fotos-orcamentos/` | 10 fotos: capa branca "patola" (x2), demonstrativo individual (visual), gerenciamento mensal (x2), medidor de gás, medidor + Anatel, vaso sanitário (x3). |
| `modelos-orcamentos/` | 6 PDFs = os cenários: `não preparado`, `individualização de gás`, `preparado - água`, `tsslight`, `visual - agua`, `visual - gás`. |
| `Logomarca/` | logos Hydrojexe (vários formatos). `Várias/`: Techem e SICON em PNG; **Inmetro, Anatel, HydroMetro só em `.cdr`** → recortar do PDF de exemplo, ou a usuária exporta PNG. |
| `assets/logo-hydrojexe.png`, `assets/logo-techem.png` | usados hoje no header do PDF. |

### DECISÃO DE ARQUITETURA DO PDF

**@react-pdf/renderer** (não gerar a partir do Word). Motivos: já está pronto/rodando,
um clique → PDF sem conversão, roda na Vercel sem infra extra, versionável, tabelas
variáveis são naturais em código, textos fixos editáveis por tela. A abordagem Word
foi descartada (exigiria serviço de conversão .docx→PDF na Vercel e um molde frágil de manter).

### DESCOBERTA IMPORTANTE — os 6 modelos NÃO são "mesmo layout, textos diferentes"

O `orcamento visual - agua.pdf` (analisado) é **outro documento**:
- só 6 seções, nomes diferentes (sem Intervenção/Prazo/Garantia; tem "Outras disposições");
- **INVESTIMENTO totalmente diferente**: sem opções à vista/6x/9x/12x, sem tabela por tipo
  de apartamento, sem parcelamento. É só *"R$ X por hidrômetro, o condomínio tem N apartamentos"*
  + tabelinha de 3 linhas (Pontos a serem lidos / Valor por apartamento / Valor total mensal).
  É um serviço **só mensal** (leitura), sem instalação.
- seção "Demonstrativos individuais" com foto própria.

Provavelmente: `preparado / não preparado / gás` seguem o formato Queluz (com parcelamento);
`visual - agua / visual - gás / tsslight` seguem o formato "só leitura".

---

## 8. Próximas etapas (pendentes) — fatiamento acordado

### 8a — Timbre + fotos no modelo atual (Queluz) — *médio* — CONFIRMADA, a fazer

- Cabeçalho, rodapé e marca d'água do `papel timbrado.docx` como imagens fixas em toda página.
  **Remover o símbolo da Techem** do cabeçalho (recortar/gerar versão sem Techem — só HydroJEXE + tagline).
- Embutir a fonte real (identificar qual; hoje é Times built-in).
- Colocar as fotos fixas nas seções certas: hidrômetro + selos **Inmetro/Anatel** (recortar do PDF de exemplo) na seção "Intervenção"; coletor Techem na "Gerenciamento mensal".
- Ajuste fino de margens/espaçamento contra o PDF de exemplo (1–2 rodadas).

### 8b — Modelos por situação — *grande* — CONFIRMADA, depois

- Cada um dos 6 modelos = **template próprio** (conjunto de seções, lógica de investimento e fotos diferentes), compartilhando timbre + primitivos.
- **Seletor "Tipo de proposta"** no orçamento.
- Extrair os textos fixos dos 6 PDFs de `modelos-orcamentos/`.
- Mapear qual foto entra em qual seção de cada modelo (o assistente infere pelos PDFs, a usuária revisa).
- **Modelos "só leitura/visual" (confirmado):** SEM montagem de tipos de apartamento e SEM parcelamento — é só **nº de hidrômetros × valor mensal**. Precisa de um fluxo/tela mais simples e de mudança no modelo de dados (o schema atual assume um formato de documento; `templates_texto` vira algo mais rico, ex.: tabela `modelos_proposta` com `tipo` + config).

### Outras pendências (menores, sem etapa marcada)

- Tela de admin para **editar `templates_texto`** sem SQL.
- Tornar `salvarOrcamento` **atômico** (hoje é sequência de queries sem transação — aceitável p/ ~4 usuários; candidato a virar função Postgres).
- **Deploy na Vercel** (configurar env vars lá; desligar signup público no Supabase).
- Inicializar **git** e versionar.

---

## 9. Estrutura de arquivos (fora `node_modules`/`.next`)

```
proxy.ts                    Proxy do Next 16 (sessão + proteção de rota)
next.config.ts              serverExternalPackages: @react-pdf/renderer
app/
  login/  logout/           auth
  (app)/                    grupo autenticado (layout com header)
    page.tsx                home
    orcamentos/             lista, novo, [id] (builder), [id]/pdf (route handler)
    condominios/            CRUD
    admin/itens|formas-pagamento|precos|usuarios/
components/
  ui.tsx                    primitivos de form (Field, TextInput, Select, Checkbox, SubmitButton, FormError)
  app-header.tsx  login-form.tsx  criar-usuario-form.tsx
  condominio-form.tsx  item-form.tsx  forma-pagamento-form.tsx
  nova-tabela-precos.tsx
  orcamento-novo-form.tsx  orcamento-cabecalho-form.tsx  orcamento-builder.tsx
  orcamento-historico.tsx  parcelas-custom.tsx
  pdf/orcamento-pdf.tsx     documento @react-pdf
lib/
  auth.ts                   getUsuarioAtual / requireUsuario / requireAdmin
  forms.ts                  FormState + parsers + mensagemErroBanco (traduz códigos Postgres)
  format.ts                 formatBRL / formatDateBR / hojeISO
  data-extenso.ts           "2026-08-03" -> "03 de agosto de 2026"
  pagamento.ts              textoParcelamento (entrada 10% + N parcelas)
  slug.ts                   slugify
  historico.ts              registrarHistorico + diffCampos
  orcamento-calc.ts         calcularOrcamento (fórmula pura)
  orcamento-precos.ts       resolverFormaPreco, precosVigentes, precosCongeladosPorForma
  supabase/
    client.ts               browser client (anon key)
    server.ts               server client (cookies; cookies() é async no Next 15+)
    admin.ts                service_role client (ignora RLS) — server-side restrito
    proxy.ts                updateSession() usado pelo proxy.ts raiz
types/database.ts           tipos do banco (gerados por npm run gen:types)
scripts/
  gen-types.mjs             gera types/database.ts do OpenAPI do PostgREST
  create-user.mjs           cria usuário no Auth
supabase/
  migrations/0001..0010     ver seção 3
  seed.sql  seed_precos.sql
  README.md                 como aplicar
assets/
  logo-hydrojexe.png  logo-techem.png      (usados no PDF hoje)
  timbre-src/image1..3.png                 (extraídos do papel timbrado.docx — trabalho)
HANDOFF.md                  este arquivo
README.md                   visão geral
prompt-sistema-hydrojexe_3.md              regras de negócio ORIGINAIS
tabela - orçamento.jpeg                    tabela de preços de referência
exemplo - orçamento queluz.pdf / aurora    orçamentos de referência (formato "completo")
papel timbrado.docx  fotos-orcamentos/  modelos-orcamentos/   assets p/ etapa 8
```

---

## 10. Memórias do assistente (contexto persistente entre sessões)

`C:\Users\giovanna.prieto\.claude\projects\C--Users-giovanna-prieto-Downloads-hydrojexe-or-amentos\memory\`

- `hydrojexe-env-setup.md` — Node portátil, execution policy, winget bloqueado.
- `hydrojexe-projeto.md` — estado do sistema + decisões de negócio não óbvias.
- `MEMORY.md` — índice.

---

## 11. Decisões e "gotchas" para não tropeçar

- **Migrations = SQL Editor manual** (não há senha do banco nem CLI logada). Seeds de
  dados (não-DDL) podem ir por script com `service_role`.
- **`gen:types` custom**: PostgREST não expõe args de RPC nem sempre bem; `scripts/gen-types.mjs`
  tem heurísticas. Arrays Postgres (`int[]`) são mapeados como `number[]` (fix já feito no script).
- **@react-pdf**: `<Image>` acusa `jsx-a11y/alt-text` (falso positivo, é do react-pdf) — há
  `/* eslint-disable */` no topo de `orcamento-pdf.tsx`. Route usa `createElement` (arquivo `.ts`, sem JSX)
  + cast `as Parameters<typeof renderToBuffer>[0]`.
- **`proxy.ts`** (não `middleware.ts`) — Next 16 renomeou a convenção.
- **`cookies()` é async** no Next 15+ (`lib/supabase/server.ts`).
- **Congelamento é por forma** agora (4 linhas por item em `orcamento_valores_congelados`).
- **Snapshots = à vista.** A lista de orçamentos mostra "Total à vista".
- Dados de teste no banco: condomínios "Centro Empresarial Queluz" e "Ed. Aurora";
  orçamentos 001–004/2026 (criados nos testes). O 002.2026 tem uma forma extra `18x` e um item
  `Hidra` adicionados para testar a nota vermelha. Podem ser excluídos.
- `.claude/dev.cmd` + `.claude/launch.json` existem só para as ferramentas de preview do
  assistente contornarem o PATH; não são necessários para a usuária.

---

## 12. Como continuar

- **Com o assistente (Claude Code):** abrir a pasta e descrever o que quer. Foi assim o projeto todo.
- **Com um dev:** o `README.md` tem o essencial; este `HANDOFF.md` tem o detalhe; as memórias
  em `~/.claude/.../memory/` têm as decisões. Stack padrão Next.js + Supabase.
- Antes de mudar cálculo/PDF/schema: reler seção 6 e 7 deste documento.
