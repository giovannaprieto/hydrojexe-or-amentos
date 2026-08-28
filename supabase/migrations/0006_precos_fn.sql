-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0006 - Função para aplicar uma nova tabela de preços em bloco
-- =============================================================================
-- aplicar_tabela_precos(p_vigencia, p_precos) -> nº de células efetivamente alteradas
--
--   Para cada célula {item_id, forma_pagamento_id, valor}:
--     - linha ABERTA que começa exatamente em p_vigencia  -> atualiza o valor;
--     - valor igual ao já vigente                          -> ignora (não polui histórico);
--     - caso contrário -> fecha a vigência aberta anterior (vigencia_fim = p_vigencia)
--       e insere a nova linha [p_vigencia, ∞).
--   Rejeita se já existir qualquer preço com vigência de início POSTERIOR a
--   p_vigencia (nova tabela não pode ser retroativa a uma já cadastrada).
--
--   security invoker: a RLS de `precos` (escrita só admin) continua valendo.
-- =============================================================================

create or replace function public.aplicar_tabela_precos(
  p_vigencia date,
  p_precos   jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
  alteradas integer := 0;
begin
  if p_vigencia is null then
    raise exception 'Informe a data de início de vigência.' using errcode = 'check_violation';
  end if;

  if jsonb_typeof(p_precos) <> 'array' or jsonb_array_length(p_precos) = 0 then
    raise exception 'Nenhum preço informado.' using errcode = 'check_violation';
  end if;

  if exists (select 1 from public.precos where vigencia_inicio > p_vigencia) then
    raise exception 'Já existe tabela de preços com vigência posterior a %. Escolha outra data.', p_vigencia
      using errcode = 'check_violation';
  end if;

  for r in
    select (e->>'item_id')::uuid            as item_id,
           (e->>'forma_pagamento_id')::uuid as forma_pagamento_id,
           round((e->>'valor')::numeric, 2) as valor
    from jsonb_array_elements(p_precos) e
  loop
    if r.item_id is null or r.forma_pagamento_id is null or r.valor is null then
      raise exception 'Célula inválida no payload de preços.' using errcode = 'check_violation';
    end if;
    if r.valor < 0 then
      raise exception 'Valor negativo não é permitido.' using errcode = 'check_violation';
    end if;

    -- reedição no mesmo dia
    update public.precos
       set valor = r.valor, updated_at = now()
     where item_id = r.item_id
       and forma_pagamento_id = r.forma_pagamento_id
       and vigencia_inicio = p_vigencia
       and vigencia_fim is null
       and valor is distinct from r.valor;
    if found then
      alteradas := alteradas + 1;
      continue;
    end if;

    -- valor já vigente e igual -> nada a fazer
    if exists (
      select 1 from public.precos
       where item_id = r.item_id
         and forma_pagamento_id = r.forma_pagamento_id
         and vigencia_fim is null
         and vigencia_inicio <= p_vigencia
         and valor = r.valor
    ) then
      continue;
    end if;

    -- fecha a vigência aberta anterior e cria a nova
    update public.precos
       set vigencia_fim = p_vigencia, updated_at = now()
     where item_id = r.item_id
       and forma_pagamento_id = r.forma_pagamento_id
       and vigencia_fim is null
       and vigencia_inicio < p_vigencia;

    insert into public.precos (item_id, forma_pagamento_id, valor, vigencia_inicio, vigencia_fim)
    values (r.item_id, r.forma_pagamento_id, r.valor, p_vigencia, null);

    alteradas := alteradas + 1;
  end loop;

  return alteradas;
end;
$$;

grant execute on function public.aplicar_tabela_precos(date, jsonb) to authenticated, service_role;
