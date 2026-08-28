-- Seção INTERVENÇÃO do PDF de individualização de água quando o condomínio
-- NÃO é preparado (retrofit / prédio de válvula hidra): texto a)–h) do modelo
-- "Ed. Aurora", com marcadores de foto nos pontos exatos:
--   {foto_antes_depois}   -> antes/depois (hidra x caixa acoplada, com X)
--   {foto_revestimento}   -> exemplos de faixa de pastilha decorativa
--   {foto_hidrometro}     -> hidrômetro + selos ANATEL/INMETRO
--   {foto_caixa_inspecao} -> caixa de inspeção aberta/fechada + legenda
-- Preparado (shafts) continua usando sec_intervencao (com {hidrometros}).
alter table public.templates_texto
  add column if not exists sec_intervencao_agua_nao_preparado text;

update public.templates_texto set
  sec_intervencao_agua_nao_preparado =
    'a) Remoção completa do vaso sanitário existente e da tubulação de alimentação até o registro interno de distribuição.' || E'\n\n' ||
    '{foto_antes_depois}' || E'\n\n' ||
    'b) Instalação de tubulação hidráulica em bitola de 3/4" de água fria desde o registro interno até a lateral do vaso sanitário com saída de 3/4" para 1/2".' || E'\n\n' ||
    'c) Compatibilização do tubo de 100 mm de esgoto no piso (área sob o vaso) para o posicionamento de acordo com o novo vaso sanitário.' || E'\n\n' ||
    'd) Recomposição do reboco e contra-piso nos pontos sob intervenção.' || E'\n\n' ||
    'e) Assentamento de revestimento cerâmico no piso e nas paredes sobre os pontos modificados. O fornecimento do revestimento deverá ser por cada morador. Se a unidade tiver reserva de revestimento similar ao existente faremos a recomposição pontual. Caso não tenha, sugerimos o fornecimento de pastilha decorativa para fazer uma faixa vertical com lay-out contemporâneo.' || E'\n\n' ||
    '{foto_revestimento}' || E'\n\n' ||
    'f) Instalação de hidrômetros com bitola de 3/4" equipados com sensor de telemetria em todos os apartamentos, contemplando todos os banheiros (nos pontos de água fria e quente) e cozinha / área de serviço. Apenas as sacadas estarão associadas a área comum. O Hidrômetro será provido de selo de inspeção do Inmetro e obedecerá às regulamentações da ABNT. O sensor será provido de selo de aprovação da Anatel.' || E'\n\n' ||
    '{foto_hidrometro}' || E'\n\n' ||
    '{foto_caixa_inspecao}' || E'\n\n' ||
    'g) Execução de teste de estanqueidade em todo o sistema e medição de pressão nos pontos internos das unidades.' || E'\n\n' ||
    'h) Regularização interna com argamassa da superfície envoltória do tubo e do hidrômetro e instalação de capa plástica na cor branca para cobertura e ocultação dos equipamentos, preservando um acabamento estético de alto padrão.',
  updated_at = now()
where is_padrao;
