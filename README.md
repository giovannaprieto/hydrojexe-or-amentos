# Hydrojexe · Sistema de Orçamentos

Sistema web interno para gerar orçamentos de individualização de água/gás para condomínios.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth) · deploy futuro na Vercel.

> Estado atual: **completo de ponta a ponta** — auth, cadastros, preços, montagem de orçamento com cálculo, histórico de alterações e geração de PDF. Pendências: ajustes finos de layout do PDF e uma tela para editar os textos-modelo.

## Rodando localmente

Pré-requisito: Node.js 20+ (este ambiente usa a versão portátil em `~/nodejs`).

```bash
npm install
cp .env.local.example .env.local   # e preencha com as chaves do Supabase
npm run dev
```

App em http://localhost:3000.

## Deploy (Vercel)

Publicado em <https://hydrojexe-orcamentos.vercel.app>, com deploy automático a
cada `git push` na `main`.

`vercel.json` fixa as funções em **`gru1` (São Paulo)** — a mesma região do
projeto Supabase (`sa-east-1`). Sem isso as funções rodam em `iad1`
(Washington) e cada consulta ao banco atravessa o continente (medido: 243 ms →
132 ms por página).

Se a Vercel perder um push (não disparar o build), use o Deploy Hook em
Settings → Git → Deploy Hooks: um `POST` na URL do hook publica o commit mais
recente da `main`.

## Variáveis de ambiente

Ver `.env.local.example`. Valores em Supabase Dashboard → Project Settings → API.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable / anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | secret / service_role key — só server-side, nunca no client |

## Autenticação

- Login **e-mail + senha** (Supabase Auth). Sem cadastro público.
- Dois perfis: `comercial` e `admin`. Cada conta em `auth.users` gera automaticamente uma linha em `public.usuarios` (trigger da migration `0004`).
- `proxy.ts` (convenção do Next 16, ex-`middleware.ts`) renova a sessão e redireciona quem não está logado para `/login`.
- **Só o admin cria usuários**, em `/admin/usuarios`.

### Criar o primeiro admin (bootstrap)

Depois de aplicar as migrations, pelo terminal:

```bash
npm run create:user -- --email voce@hydrojexe.com.br --senha "umaSenhaForte" --nome "Seu Nome" --perfil admin
```

### Desativar cadastro público no Supabase

Dashboard → **Authentication → Sign In / Providers** (ou **Configuration → Auth**) → desligue **"Allow new users to sign up"**. A publishable key vai para o browser, então sem isso qualquer um poderia se cadastrar.

## Estrutura de pastas

```
proxy.ts                  Proxy do Next 16 (sessão + proteção de rota).
app/
  login/                  Página de login + server action.
  logout/route.ts         POST -> signOut -> /login.
  (app)/                  Grupo autenticado (layout com header + navegação).
    page.tsx              Home.
    orcamentos/           Lista, novo, builder [id] (montagem + cálculo + histórico), e [id]/pdf. Todos os usuários.
    condominios/          CRUD de condomínios (todos os usuários).
    admin/usuarios/       Lista + criação de usuários (só admin).
    admin/itens/          CRUD de itens precificáveis (só admin).
    admin/formas-pagamento/  CRUD de formas de pagamento (só admin).
    admin/precos/         Matriz de preços vigentes + "nova tabela em bloco" + histórico (só admin).
    admin/textos/         Edição dos textos-modelo dos PDFs: templates_texto (completo) + modelos_proposta (demais tipos) (só admin).
components/               login-form, app-header, ui (primitivos de form),
                         condominio-form, item-form, forma-pagamento-form,
                         nova-tabela-precos, orcamento-novo-form,
                         orcamento-cabecalho-form, orcamento-builder,
                         orcamento-historico, criar-usuario-form.
  pdf/orcamento-pdf.tsx   Documento @react-pdf do orçamento.
lib/
  auth.ts                 getUsuarioAtual / requireUsuario / requireAdmin.
  forms.ts                FormState + parsers + tradução de erro do Postgres.
  format.ts               formatBRL / formatDateBR / hojeISO.
  data-extenso.ts         "2026-08-03" -> "03 de agosto de 2026".
  pagamento.ts            textoParcelamento() (entrada 10% + N parcelas).
  slug.ts                 slugify().
  historico.ts            registrarHistorico() + diffCampos().
  orcamento-calc.ts       calcularOrcamento() — fórmula pura (preview + gravação).
  orcamento-precos.ts     resolver de preço (forma 24x->12x; congelado > vigente > tabela mais recente).
assets/                   logo-hydrojexe.png, logo-techem.png (embutidos no PDF).
  supabase/
    client.ts             Cliente p/ Client Components (anon key).
    server.ts             Cliente p/ Server Components / Route Handlers (cookies).
    admin.ts              Cliente service_role (ignora RLS) — server-side restrito.
    proxy.ts              Helper updateSession() usado pelo proxy.ts.
types/database.ts         Tipos do banco (gerados por `npm run gen:types`).
scripts/
  gen-types.mjs           Gera types/database.ts a partir do schema.
  create-user.mjs         Cria usuário no Auth (bootstrap / terminal).
supabase/
  migrations/
    0001_schema.sql        As 12 tabelas do modelo de dados.
    0002_rls.sql           RLS + helper is_admin() (política provisória).
    0003_grants.sql        GRANTs das roles da API + default privileges.
    0004_auth.sql          Trigger auth.users -> public.usuarios.
    0005_rls_perfis.sql    Políticas RLS por perfil (substitui a de 0002).
    0006_precos_fn.sql     Função aplicar_tabela_precos() (nova vigência em bloco).
    0007_templates_seed.sql  Textos fixos do PDF no template "Padrão".
    0008_orcamento_incluir_tss.sql  TSS opcional por orçamento.
    0009_orcamento_multiforma.sql   Sem "forma escolhida"; PDF traz as 4 formas; 24x opcional.
    0010_formas_extras_administradora.sql  orcamentos.parcelas_custom (formas extras); condominios.administradora.
    0011_tipo_proposta.sql  orcamentos.tipo_proposta + qtd_equipamentos; tabela modelos_proposta.
    0012_gestao_mensal.sql  gerenciamento_mensal.qtd_apartamentos + pontos_por_apartamento (propostas de gestão mensal água/gás).
    0013_tss_light.sql      orcamentos.tss_opcoes jsonb (até 4 opções de investimento da proposta TSS Light).
    0014_individualizacao_gas.sql  5º tipo de proposta: estende os CHECKs de tipo_proposta / modelos_proposta.tipo com 'individualizacao_gas'.
    0015_modelos_proposta_intro.sql  modelos_proposta.intro (texto de abertura editável; usado pela individualização de gás).
    0016_salvar_montagem_fn.sql  função salvar_montagem_orcamento() — grava a montagem do orçamento completo em 1 transação.
  seed.sql                Formas de pagamento + catálogo de itens.
  seed_precos.sql         Tabela de preços vigente (valores do JPEG, a partir de 27/08/2026).
  README.md               Como aplicar o schema e detalhe das entidades.
```

## Banco de dados

Ver [`supabase/README.md`](supabase/README.md). Regras de negócio: [`prompt-sistema-hydrojexe_3.md`](prompt-sistema-hydrojexe_3.md).

## Próximas etapas (não implementadas)

1. ~~Autenticação~~ ✅
2. ~~Cadastros: condomínios, itens, formas de pagamento~~ ✅
3. ~~Tela de preços (matriz item × forma, "nova vigência em bloco")~~ ✅
4. ~~Montagem de orçamento + cálculo (rateio TSS, Hidra, congelamento de preços, gerenciamento mensal)~~ ✅
5. ~~Histórico de alterações do orçamento~~ ✅
6. ~~Geração de PDF no padrão dos orçamentos Queluz / Aurora~~ ✅

### Refinamentos possíveis
- Ajustar layout do PDF (quebras de página, espaçamentos) olhando o resultado real.
- Tela de admin para editar os textos-modelo (`templates_texto`) sem SQL.
- Tornar `salvarOrcamento` atômico (função Postgres) em vez de sequência de queries.
- Deploy na Vercel.
