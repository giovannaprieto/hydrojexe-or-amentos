# Migrações

As migrações são aplicadas **à mão** no SQL Editor do Supabase (não há Supabase CLI
neste ambiente). O arquivo é a fonte da verdade; a tabela `public.schema_migrations`
registra o que já rodou.

## Rodar uma migração

1. Abrir o SQL Editor do projeto no Supabase.
2. Colar o conteúdo do arquivo `00XX_*.sql` e executar.
3. Conferir que a última linha registrou a versão:

   ```sql
   insert into public.schema_migrations (version, descricao)
     values ('00XX', 'resumo curto')
   on conflict (version) do nothing;
   ```

   (Migrações a partir da 0028 já devem terminar com esse `insert`.)

## Conferir o que falta

```sql
select version, descricao, aplicada_em
from public.schema_migrations
order by version;
```

Comparar com os arquivos em `supabase/migrations/`. Qualquer `00XX_*.sql` que não
apareça na tabela ainda não foi aplicado.

## Escrever uma migração nova

- Numerar em sequência: `0028_descricao_curta.sql`.
- Usar `if not exists` / `or replace` sempre que possível (idempotente).
- RLS: tabelas de configuração → `select` para autenticado, escrita via
  `public.is_admin()`; tabelas operacionais → `for all to authenticated`.
- Terminar com o `insert into public.schema_migrations (...)`.
- Depois de aplicar, rodar `npm run gen:types` para atualizar `types/database.ts`.
