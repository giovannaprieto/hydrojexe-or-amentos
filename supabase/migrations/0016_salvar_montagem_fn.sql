-- =============================================================================
-- 0016_salvar_montagem_fn.sql
-- salvar_montagem_orcamento(...) — grava a montagem do orçamento "completo"
-- (tipos + composição + preços congelados + snapshots + gerenciamento +
-- histórico) numa ÚNICA transação. Substitui a sequência de ~10 queries do
-- server action salvarOrcamento. O cálculo continua no TS; a função só persiste.
--
-- security invoker: a RLS das tabelas envolvidas continua valendo (o usuário
-- autenticado já tem permissão de escrita nelas pelas políticas de 0005).
-- =============================================================================
create or replace function public.salvar_montagem_orcamento(
  p_id               uuid,
  p_tipos            jsonb,   -- [{nome,unidades,ordem,valor_por_apartamento,itens:[{item_id,quantidade,ordem}]}]
  p_congelados       jsonb,   -- [{item_id,forma_pagamento_id,valor_unitario,preco_id}]
  p_total_unidades   integer,
  p_valor_tss        numeric,
  p_valor_total      numeric,
  p_gm_qtd           integer,
  p_gm_total_mensal  numeric,
  p_hist             jsonb    -- {valor_antes,valor_depois,descricao,alterado_por}
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  t         jsonb;
  ci        jsonb;
  v_tipo_id uuid;
  v_autor   uuid := nullif(p_hist->>'alterado_por','')::uuid;
begin
  if p_id is null then
    raise exception 'Orçamento inválido.' using errcode = 'check_violation';
  end if;

  delete from public.tipos_apartamento where orcamento_id = p_id;

  for t in select * from jsonb_array_elements(coalesce(p_tipos, '[]'::jsonb))
  loop
    insert into public.tipos_apartamento
      (orcamento_id, nome, unidades, ordem, valor_por_apartamento)
    values
      (p_id, t->>'nome', (t->>'unidades')::int, (t->>'ordem')::int,
       (t->>'valor_por_apartamento')::numeric)
    returning id into v_tipo_id;

    for ci in select * from jsonb_array_elements(coalesce(t->'itens', '[]'::jsonb))
    loop
      insert into public.tipo_apartamento_itens
        (tipo_apartamento_id, item_id, quantidade, ordem)
      values
        (v_tipo_id, (ci->>'item_id')::uuid, (ci->>'quantidade')::int,
         (ci->>'ordem')::int);
    end loop;
  end loop;

  if jsonb_array_length(coalesce(p_congelados, '[]'::jsonb)) > 0 then
    insert into public.orcamento_valores_congelados
      (orcamento_id, item_id, forma_pagamento_id, valor_unitario, preco_id)
    select p_id,
           (e->>'item_id')::uuid,
           (e->>'forma_pagamento_id')::uuid,
           (e->>'valor_unitario')::numeric,
           nullif(e->>'preco_id','')::uuid
    from jsonb_array_elements(p_congelados) e
    on conflict (orcamento_id, item_id, forma_pagamento_id)
    do update set valor_unitario = excluded.valor_unitario,
                  preco_id       = excluded.preco_id;
  end if;

  update public.orcamentos
     set total_unidades = p_total_unidades,
         valor_tss      = p_valor_tss,
         valor_total    = p_valor_total,
         atualizado_por = v_autor
   where id = p_id;

  update public.gerenciamento_mensal
     set qtd_hidrometros    = p_gm_qtd,
         valor_total_mensal = p_gm_total_mensal
   where orcamento_id = p_id;

  insert into public.historico_alteracoes
    (orcamento_id, entidade, entidade_id, acao, campo,
     valor_antes, valor_depois, descricao, alterado_por)
  values
    (p_id, 'orcamentos', p_id, 'atualizar', 'composicao',
     p_hist->'valor_antes', p_hist->'valor_depois', p_hist->>'descricao', v_autor);
end;
$$;

grant execute on function public.salvar_montagem_orcamento(
  uuid, jsonb, jsonb, integer, numeric, numeric, integer, numeric, jsonb
) to authenticated, service_role;
