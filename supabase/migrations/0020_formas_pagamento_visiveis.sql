-- Seleção, por orçamento, de quais formas de pagamento base entram no PDF.
-- Guarda o nº de parcelas (1 = à vista, 6, 9, 12). Default = todas as 4.
-- Condições fora do padrão continuam via orcamentos.parcelas_custom.
alter table public.orcamentos
  add column if not exists formas_pagamento_visiveis int[]
    not null default array[1, 6, 9, 12];
