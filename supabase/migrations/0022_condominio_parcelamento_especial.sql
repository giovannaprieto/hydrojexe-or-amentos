-- Parcelamento especial por condomínio: nas propostas desse condomínio, cada
-- faixa de parcelamento >= 9x usa o preço da faixa uma abaixo:
--   9x  -> preço da coluna 6x
--   12x -> preço da coluna 9x
--   24x -> preço da coluna 12x (já é o comportamento das "formas extras")
-- À vista e 6x não mudam.
alter table public.condominios
  add column if not exists parcelamento_especial boolean not null default false;
