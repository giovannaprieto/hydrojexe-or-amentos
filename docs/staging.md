# Ambiente de staging (para revisão de design)

Ambiente isolado, **só com dados fictícios** — nenhum dado de cliente. Serve para
o Claude (ou qualquer pessoa) abrir o sistema, navegar e trabalhar no visual sem
risco para produção.

## 1. Projeto Supabase de staging

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** → nome
   `hydrojexe-staging` (plano grátis serve). Guarde a senha do banco.
2. **SQL Editor** → cole e rode, **um de cada vez**, nesta ordem:
   1. `supabase/staging-schema.sql` — todas as migrações 0001..0031 de uma vez.
   2. `supabase/seed.sql` — formas de pagamento + catálogo de itens.
   3. `supabase/seed_precos.sql` — tabela de preços.
   4. `supabase/seed-staging.sql` — condomínios, orçamentos e obra fictícios.
3. **Authentication → Users → Add user**:
   - Email: `design@exemplo.com`, senha à sua escolha.
   - *Auto Confirm User*: ligado.
   - *User metadata*: `{"perfil":"admin","nome":"Design"}`
   - O gatilho do banco cria a linha em `public.usuarios` sozinho.
4. **Project Settings → API**: anote `Project URL` e a chave `anon` `public`.
   (A `service_role` só é necessária se quiser testar o link público de PDF.)

## 2. Deploy de staging na Vercel

Opção A — **projeto Vercel separado** apontando para o mesmo repositório GitHub,
build branch `main`.
Opção B — no projeto atual, usar o ambiente **Preview** de um branch `staging`.

Em **Settings → Environment Variables** (escopo *Preview*/staging):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do **staging** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` do **staging** |
| `SUPABASE_SERVICE_ROLE_KEY` | *(opcional)* `service_role` do **staging** |

**Settings → Deployment Protection** → ativar *Vercel Authentication* ou *Password*
para a URL não ficar pública.

## 3. Passar o acesso

- URL do staging + senha da proteção da Vercel.
- Login de demonstração (`design@exemplo.com` + senha).

Qualquer alteração feita ali afeta só os dados fictícios. Para **resetar**: no SQL
Editor do staging, descomente o bloco `LIMPEZA` no topo de `seed-staging.sql`,
rode, e rode o seed de novo.

## Alternativa sem deploy

`.env.local` apontando para o Supabase de staging + `npm run dev` na sua máquina.
Mesma segurança (dados fictícios), sem publicar nada.

## Nunca compartilhar

- `.env.local` de produção / `SUPABASE_SERVICE_ROLE_KEY` de produção.
- Logins de usuários reais e a URL de produção.
