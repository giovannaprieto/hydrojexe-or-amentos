-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0007 - Textos fixos do PDF no template "Padrão"
-- =============================================================================
-- Transcrito de "exemplo - orçamento queluz.pdf". São os textos que se repetem
-- em todo orçamento (seções 1 a 6 + garantia). Editáveis depois por uma tela
-- de "modelos de texto".
-- =============================================================================

update public.templates_texto set
  sec_individualizacao_agua = $txt$Análise técnica: Trata-se de um edifício com as tubulações em PVC distribuídas verticalmente por colunas, alimentado cozinha e banheiros com vasos sanitários de caixa acoplada.

Pontos de desperdício de água no condomínio:
a) Rateio coletivo da conta de água, sem a responsabilidade pelo pagamento real ao que cada morador utilizou;
b) Morosidade para sanar pequenos vazamentos em torneiras e válvulas;
c) Hábitos "peculiares" como lavar roupa diariamente, tomar banhos muito demorados, escovar os dentes com a torneira aberta....$txt$,

  sec_objetivo = $txt$a) Reduzir a conta de água do condomínio em 30% a 40%;
b) Monitorar os apartamentos com possíveis focos de vazamentos de forma eletrônica;
c) Fazer justiça com os moradores pagando sua conta de água apenas pelo seu próprio consumo;
d) Possibilitar cada morador controlar e monitorar seu consumo de acordo com sua expectativa.$txt$,

  sec_procedimento_tecnico = $txt$a) Análise preliminar do abastecimento e distribuição de água do condomínio e execução de mapeamento com plano de ação para a intervenção.
b) Emissão de comunicado formal aos condôminos orientando quanto aos procedimentos executivos de intervenção em cada unidade residencial e disponibilizando o agendamento das vistorias internas.
c) Emissão de relatório de constatação de cada unidade alvo de intervenção em duas vias para identificação da pressão nos pontos internos, eventuais patologias pré-existentes e possíveis empecilhos.
d) Apresentação de cronograma detalhado da obra e agendamento individual de cada intervenção.$txt$,

  sec_intervencao = $txt$a) Instalação de hidrômetros de 2,5m³ com bitola de 3/4 equipados com sensor de telemetria. O Hidrômetro será provido de selo de inspeção do Inmetro e obedecerá às regulamentações da ABNT. O sensor será provido de selo de aprovação da Anatel.$txt$,

  sec_tramites_administrativos = $txt$a) Após a montagem e instalação de todos os hidrômetros, emitiremos um relatório de conclusão liberando o condomínio a iniciar a medição e gerenciamento de consumo mensal.
b) Decorridos 30 (trinta) dias a contar pelo vencimento da conta de água consecutiva a conclusão, apresentaremos um relatório de consumo de água individual do mês vigente em caráter de orientação. Com isso, os moradores tomarão conhecimento do consumo individual de cada unidade e a partir de então passarão a arcar individualmente com a conta de água em acordo com seu consumo real.$txt$,

  sec_gerenciamento_mensal = $txt$a) Mensalmente realizaremos a medição dos hidrômetros via telemetria obtendo as informações de consumo rateadas e repassaremos para a administradora do condomínio poder incluir no boleto mensal de taxa condominial.
b) O sistema estará equipado com sensores que identificam qualquer tentativa de fraude na leitura, ou ainda o surgimento de vazamentos ou qualquer outra anomalia.
c) Consultoria mensal para avaliação do sistema, do consumo e estratégias de economia de água.
d) Disponibilidade do site na internet para que cada morador possa acompanhar seu consumo mensal detalhado.$txt$,

  sec_garantia = $txt$a) Os serviços hidráulicos executados têm garantia de 01 (um) ano salvo danos ocasionados por terceiros.
b) Os equipamentos possuem garantia de 02 (dois) anos sob responsabilidade da fabricante.
c) Os valores dos hidrômetros possuem validade até 30 dias após sua execução.$txt$,

  updated_at = now()
where is_padrao;
