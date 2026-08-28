-- O texto-modelo de individualização de água tinha "\n\n\r\n" antes de
-- "Pontos de desperdício...", o que gerava DUAS linhas em branco no PDF
-- (espaçamento exagerado após a Análise técnica). Regrava o bloco só com
-- \n. A renderização do PDF também passou a normalizar \r\n e a colapsar
-- linhas em branco, mas manter o valor limpo no banco evita a pegadinha.
update public.templates_texto set
  sec_individualizacao_agua =
    '{analise_tecnica}' || E'\n\n' ||
    'Pontos de desperdício de água no condomínio:' || E'\n' ||
    'a) Rateio coletivo da conta de água, sem a responsabilidade pelo pagamento real ao que cada morador utilizou;' || E'\n' ||
    'b) Morosidade para sanar pequenos vazamentos em torneiras e válvulas;' || E'\n' ||
    'c) Hábitos "peculiares" como lavar roupa diariamente, tomar banhos muito demorados, escovar os dentes com a torneira aberta....',
  updated_at = now()
where is_padrao;
