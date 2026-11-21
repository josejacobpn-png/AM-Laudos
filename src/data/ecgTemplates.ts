export interface EcgTemplate {
  code: string;
  title: string;
  description: string;
  conclusion: string;
}

export const ECG_TEMPLATES: EcgTemplate[] = [
  {
    code: '001',
    title: 'ECG dentro dos limites da normalidade',
    description: 'Ritmo sinusal; eixo do QRS e intervalos dentro dos limites de referência; sem alterações significativas de ST-T.',
    conclusion: 'ECG dentro dos limites da normalidade.'
  },
  {
    code: '002',
    title: 'Bradicardia sinusal',
    description: 'Ritmo sinusal com frequência inferior a 60 bpm; avaliar contexto clínico e medicamentos.',
    conclusion: 'Bradicardia sinusal.'
  },
  {
    code: '003',
    title: 'Taquicardia sinusal',
    description: 'Ritmo sinusal com frequência superior a 100 bpm; pesquisar causa clínica.',
    conclusion: 'Taquicardia sinusal.'
  },
  {
    code: '004',
    title: 'Arritmia sinusal respiratória',
    description: 'Variação cíclica dos intervalos RR com ondas P sinusais.',
    conclusion: 'Arritmia sinusal respiratória.'
  },
  {
    code: '005',
    title: 'Ritmo sinusal com baixa voltagem periférica',
    description: 'Complexos QRS de baixa amplitude nas derivações dos membros; investigar causas.',
    conclusion: 'Ritmo sinusal com baixa voltagem periférica.'
  },
  {
    code: '006',
    title: 'Ritmo sinusal com baixa voltagem difusa',
    description: 'Baixa amplitude dos complexos QRS nas derivações periféricas e precordiais.',
    conclusion: 'Ritmo sinusal com baixa voltagem difusa.'
  },
  {
    code: '007',
    title: 'Ritmo sinusal com desvio do eixo à esquerda',
    description: 'Eixo frontal do QRS desviado à esquerda, sem definição isolada de bloqueio fascicular.',
    conclusion: 'Ritmo sinusal com desvio do eixo à esquerda.'
  },
  {
    code: '008',
    title: 'Ritmo sinusal com desvio do eixo à direita',
    description: 'Eixo frontal do QRS desviado à direita; correlacionar com idade e contexto.',
    conclusion: 'Ritmo sinusal com desvio do eixo à direita.'
  },
  {
    code: '009',
    title: 'Progressão lenta da onda R',
    description: 'Progressão da onda R reduzida nas precordiais; achado inespecífico.',
    conclusion: 'Progressão lenta da onda R.'
  },
  {
    code: '010',
    title: 'Transição precordial precoce',
    description: 'Zona de transição do QRS deslocada para derivações precordiais direitas.',
    conclusion: 'Transição precordial precoce.'
  },
  {
    code: '011',
    title: 'Extrassístoles atriais isoladas',
    description: 'Batimentos prematuros com onda P de morfologia distinta da sinusal e QRS geralmente estreito.',
    conclusion: 'Extrassístoles atriais isoladas.'
  },
  {
    code: '012',
    title: 'Extrassístoles atriais frequentes',
    description: 'Múltiplos batimentos supraventriculares prematuros no registro.',
    conclusion: 'Extrassístoles atriais frequentes.'
  },
  {
    code: '013',
    title: 'Bigeminismo atrial',
    description: 'Alternância de batimentos sinusais e extrassístoles atriais.',
    conclusion: 'Bigeminismo atrial.'
  },
  {
    code: '014',
    title: 'Pares de extrassístoles atriais',
    description: 'Dois batimentos atriais prematuros consecutivos.',
    conclusion: 'Pares de extrassístoles atriais.'
  },
  {
    code: '015',
    title: 'Taquicardia atrial focal',
    description: 'Taquicardia regular com ondas P não sinusais identificáveis.',
    conclusion: 'Taquicardia atrial focal.'
  },
  {
    code: '016',
    title: 'Taquicardia atrial multifocal',
    description: 'Ritmo atrial irregular com pelo menos três morfologias de onda P e frequência elevada.',
    conclusion: 'Taquicardia atrial multifocal.'
  },
  {
    code: '017',
    title: 'Taquicardia supraventricular regular de QRS estreito',
    description: 'Taquicardia regular com QRS estreito; mecanismo não definido apenas pelo traçado.',
    conclusion: 'Taquicardia supraventricular regular de QRS estreito.'
  },
  {
    code: '018',
    title: 'Fibrilação atrial com resposta ventricular controlada',
    description: 'Ausência de ondas P sinusais e irregularidade dos intervalos RR, com frequência ventricular controlada.',
    conclusion: 'Fibrilação atrial com resposta ventricular controlada.'
  },
  {
    code: '019',
    title: 'Fibrilação atrial com resposta ventricular rápida',
    description: 'Ausência de ondas P sinusais e ritmo ventricular irregular com frequência elevada.',
    conclusion: 'Fibrilação atrial com resposta ventricular rápida.'
  },
  {
    code: '020',
    title: 'Fibrilação atrial com resposta ventricular lenta',
    description: 'Ritmo irregular sem ondas P sinusais e frequência ventricular reduzida.',
    conclusion: 'Fibrilação atrial com resposta ventricular lenta.'
  },
  {
    code: '021',
    title: 'Flutter atrial com condução 2:1',
    description: 'Atividade atrial organizada em ondas F com condução atrioventricular predominantemente 2:1.',
    conclusion: 'Flutter atrial com condução 2:1.'
  },
  {
    code: '022',
    title: 'Flutter atrial com condução variável',
    description: 'Ondas F regulares com resposta ventricular variável.',
    conclusion: 'Flutter atrial com condução variável.'
  },
  {
    code: '023',
    title: 'Ritmo atrial ectópico',
    description: 'Ondas P não sinusais, com frequência inferior à faixa de taquicardia atrial.',
    conclusion: 'Ritmo atrial ectópico.'
  },
  {
    code: '024',
    title: 'Ritmo juncional',
    description: 'QRS geralmente estreito, sem ondas P sinusais precedentes; ondas P retrógradas podem ocorrer.',
    conclusion: 'Ritmo juncional.'
  },
  {
    code: '025',
    title: 'Taquicardia juncional',
    description: 'Ritmo de origem juncional com frequência elevada e ondas P ausentes ou retrógradas.',
    conclusion: 'Taquicardia juncional.'
  },
  {
    code: '026',
    title: 'Extrassístoles ventriculares isoladas',
    description: 'Complexos QRS prematuros, alargados e sem onda P sinusal precedente.',
    conclusion: 'Extrassístoles ventriculares isoladas.'
  },
  {
    code: '027',
    title: 'Extrassístoles ventriculares frequentes',
    description: 'Múltiplos complexos ventriculares prematuros no traçado.',
    conclusion: 'Extrassístoles ventriculares frequentes.'
  },
  {
    code: '028',
    title: 'Extrassístoles ventriculares monomórficas',
    description: 'Batimentos ventriculares prematuros de morfologia semelhante.',
    conclusion: 'Extrassístoles ventriculares monomórficas.'
  },
  {
    code: '029',
    title: 'Extrassístoles ventriculares polimórficas',
    description: 'Batimentos ventriculares prematuros com morfologias distintas.',
    conclusion: 'Extrassístoles ventriculares polimórficas.'
  },
  {
    code: '030',
    title: 'Bigeminismo ventricular',
    description: 'Alternância entre batimento conduzido e extrassístole ventricular.',
    conclusion: 'Bigeminismo ventricular.'
  },
  {
    code: '031',
    title: 'Trigeminismo ventricular',
    description: 'Extrassístole ventricular após dois batimentos conduzidos, de modo repetitivo.',
    conclusion: 'Trigeminismo ventricular.'
  },
  {
    code: '032',
    title: 'Pares ventriculares',
    description: 'Duas extrassístoles ventriculares consecutivas.',
    conclusion: 'Pares ventriculares.'
  },
  {
    code: '033',
    title: 'Taquicardia ventricular não sustentada',
    description: 'Três ou mais batimentos ventriculares consecutivos, frequência superior a 100 bpm e duração inferior a 30 s, quando o registro permitir comprovar.',
    conclusion: 'Taquicardia ventricular não sustentada.'
  },
  {
    code: '034',
    title: 'Taquicardia ventricular monomórfica',
    description: 'Taquicardia de QRS largo com morfologia predominantemente uniforme, compatível com origem ventricular.',
    conclusion: 'Taquicardia ventricular monomórfica.'
  },
  {
    code: '035',
    title: 'Taquicardia ventricular polimórfica',
    description: 'Taquicardia de QRS largo com morfologia variável, compatível com origem ventricular.',
    conclusion: 'Taquicardia ventricular polimórfica.'
  },
  {
    code: '036',
    title: 'Ritmo idioventricular acelerado',
    description: 'Ritmo ventricular com QRS largo e frequência tipicamente entre 50 e 110 bpm.',
    conclusion: 'Ritmo idioventricular acelerado.'
  },
  {
    code: '037',
    title: 'Ritmo de escape ventricular',
    description: 'Ritmo de escape de QRS largo e frequência baixa, na ausência de comando supraventricular eficaz.',
    conclusion: 'Ritmo de escape ventricular.'
  },
  {
    code: '038',
    title: 'Bloqueio AV de primeiro grau',
    description: 'Intervalo PR superior a 200 ms, com condução 1:1.',
    conclusion: 'Bloqueio AV de primeiro grau.'
  },
  {
    code: '039',
    title: 'Bloqueio AV de segundo grau Mobitz I',
    description: 'Alongamento progressivo do PR antes de onda P não conduzida.',
    conclusion: 'Bloqueio AV de segundo grau Mobitz I.'
  },
  {
    code: '040',
    title: 'Bloqueio AV de segundo grau Mobitz II',
    description: 'Ondas P não conduzidas sem alongamento progressivo do PR nos batimentos conduzidos.',
    conclusion: 'Bloqueio AV de segundo grau Mobitz II.'
  },
  {
    code: '041',
    title: 'Bloqueio AV de segundo grau 2:1',
    description: 'Uma onda P conduzida para cada onda P bloqueada; subtipo não definido apenas pela relação 2:1.',
    conclusion: 'Bloqueio AV de segundo grau 2:1.'
  },
  {
    code: '042',
    title: 'Bloqueio AV avançado',
    description: 'Duas ou mais ondas P consecutivas não conduzidas, com condução AV intermitente.',
    conclusion: 'Bloqueio AV avançado.'
  },
  {
    code: '043',
    title: 'Bloqueio AV total',
    description: 'Dissociação atrioventricular com ritmo de escape independente.',
    conclusion: 'Bloqueio AV total.'
  },
  {
    code: '044',
    title: 'PR curto',
    description: 'Intervalo PR inferior a 120 ms; avaliar presença de pré-excitação.',
    conclusion: 'PR curto.'
  },
  {
    code: '045',
    title: 'Padrão de pré-excitação ventricular',
    description: 'PR curto, início lentificado do QRS (onda delta) e QRS alargado, quando presentes.',
    conclusion: 'Padrão de pré-excitação ventricular.'
  },
  {
    code: '046',
    title: 'Dissociação atrioventricular',
    description: 'Ondas P e complexos QRS sem relação fixa; identificar mecanismo e frequência de cada ritmo.',
    conclusion: 'Dissociação atrioventricular.'
  },
  {
    code: '047',
    title: 'Pausa sinusal',
    description: 'Pausa sem atividade atrial sinusal; medir duração e diferenciar de bloqueio sinoatrial.',
    conclusion: 'Pausa sinusal.'
  },
  {
    code: '048',
    title: 'Bloqueio completo de ramo direito',
    description: 'QRS ≥120 ms, padrão terminal positivo em V1 e onda S terminal larga em I/V6.',
    conclusion: 'Bloqueio completo de ramo direito.'
  },
  {
    code: '049',
    title: 'Bloqueio incompleto de ramo direito',
    description: 'Morfologia de bloqueio de ramo direito com QRS abaixo de 120 ms.',
    conclusion: 'Bloqueio incompleto de ramo direito.'
  },
  {
    code: '050',
    title: 'Bloqueio completo de ramo esquerdo',
    description: 'QRS ≥120 ms com morfologia típica de bloqueio de ramo esquerdo.',
    conclusion: 'Bloqueio completo de ramo esquerdo.'
  },
  {
    code: '051',
    title: 'Bloqueio divisional anterossuperior esquerdo',
    description: 'Desvio do eixo para a esquerda com padrão qR em I/aVL e rS em derivações inferiores, após exclusão de outras causas.',
    conclusion: 'Bloqueio divisional anterossuperior esquerdo.'
  },
  {
    code: '052',
    title: 'Bloqueio divisional posteroinferior esquerdo',
    description: 'Desvio do eixo para a direita com padrão compatível, após exclusão de causas mais comuns de eixo direito.',
    conclusion: 'Bloqueio divisional posteroinferior esquerdo.'
  },
  {
    code: '053',
    title: 'Bloqueio bifascicular',
    description: 'Bloqueio de ramo direito associado a bloqueio divisional esquerdo.',
    conclusion: 'Bloqueio bifascicular.'
  },
  {
    code: '054',
    title: 'Distúrbio inespecífico da condução intraventricular',
    description: 'QRS alargado sem critérios morfológicos completos para bloqueio de ramo específico.',
    conclusion: 'Distúrbio inespecífico da condução intraventricular.'
  },
  {
    code: '055',
    title: 'Atraso final de condução pelo ramo direito',
    description: 'Atraso terminal de ativação do ventrículo direito sem critérios de bloqueio completo.',
    conclusion: 'Atraso final de condução pelo ramo direito.'
  },
  {
    code: '056',
    title: 'QRS fragmentado',
    description: 'Entalhes ou fragmentação do complexo QRS em derivações contíguas; achado inespecífico.',
    conclusion: 'QRS fragmentado.'
  },
  {
    code: '057',
    title: 'Bloqueio de ramo esquerdo com alterações secundárias de ST-T',
    description: 'Morfologia de bloqueio de ramo esquerdo acompanhada de discordância secundária da repolarização.',
    conclusion: 'Bloqueio de ramo esquerdo com alterações secundárias de ST-T.'
  },
  {
    code: '058',
    title: 'Sinais de anormalidade atrial esquerda',
    description: 'Onda P com características sugestivas de anormalidade atrial esquerda.',
    conclusion: 'Sinais de anormalidade atrial esquerda.'
  },
  {
    code: '059',
    title: 'Sinais de anormalidade atrial direita',
    description: 'Onda P de amplitude aumentada em derivações inferiores, quando presentes critérios.',
    conclusion: 'Sinais de anormalidade atrial direita.'
  },
  {
    code: '060',
    title: 'Critérios de hipertrofia ventricular esquerda por voltagem',
    description: 'Voltagens do QRS que satisfazem critérios eletrocardiográficos de hipertrofia ventricular esquerda.',
    conclusion: 'Critérios de hipertrofia ventricular esquerda por voltagem.'
  },
  {
    code: '061',
    title: 'Hipertrofia ventricular esquerda com padrão de strain',
    description: 'Critérios de hipertrofia ventricular esquerda associados a alterações secundárias de ST-T.',
    conclusion: 'Hipertrofia ventricular esquerda com padrão de strain.'
  },
  {
    code: '062',
    title: 'Critérios de hipertrofia ventricular direita',
    description: 'Desvio do eixo e predomínio de forças direitas, com critérios compatíveis.',
    conclusion: 'Critérios de hipertrofia ventricular direita.'
  },
  {
    code: '063',
    title: 'Possível sobrecarga biventricular',
    description: 'Critérios eletrocardiográficos que sugerem sobrecarga de ambos os ventrículos; confirmação por imagem.',
    conclusion: 'Possível sobrecarga biventricular.'
  },
  {
    code: '064',
    title: 'Sinais sugestivos de sobrecarga direita',
    description: 'Conjunto de achados de eixo, onda P e forças ventriculares direitas; correlacionar clinicamente.',
    conclusion: 'Sinais sugestivos de sobrecarga direita.'
  },
  {
    code: '065',
    title: 'Voltagens aumentadas sem alterações de repolarização',
    description: 'Amplitudes elevadas do QRS sem alterações secundárias de ST-T; considerar variante fisiológica.',
    conclusion: 'Voltagens aumentadas sem alterações de repolarização.'
  },
  {
    code: '066',
    title: 'Alterações inespecíficas de ST-T',
    description: 'Alterações discretas do segmento ST e/ou onda T sem padrão etiológico específico.',
    conclusion: 'Alterações inespecíficas de ST-T.'
  },
  {
    code: '067',
    title: 'Inversão de T anterior',
    description: 'Ondas T negativas em derivações precordiais anteriores; avaliar distribuição e contexto.',
    conclusion: 'Inversão de T anterior.'
  },
  {
    code: '068',
    title: 'Inversão de T inferior',
    description: 'Ondas T negativas em derivações inferiores.',
    conclusion: 'Inversão de T inferior.'
  },
  {
    code: '069',
    title: 'Inversão de T lateral',
    description: 'Ondas T negativas em I, aVL e/ou V5-V6.',
    conclusion: 'Inversão de T lateral.'
  },
  {
    code: '070',
    title: 'Infradesnivelamento de ST',
    description: 'Depressão do segmento ST em derivações especificadas; caracterizar amplitude e morfologia.',
    conclusion: 'Infradesnivelamento de ST.'
  },
  {
    code: '071',
    title: 'Supradesnivelamento de ST',
    description: 'Elevação do segmento ST em derivações especificadas; avaliar critérios e diagnósticos diferenciais.',
    conclusion: 'Supradesnivelamento de ST.'
  },
  {
    code: '072',
    title: 'Padrão de repolarização precoce',
    description: 'Elevação do ponto J com morfologia compatível em contexto apropriado.',
    conclusion: 'Padrão de repolarização precoce.'
  },
  {
    code: '073',
    title: 'QTc prolongado',
    description: 'Intervalo QT corrigido acima do limite de referência conforme sexo, frequência e método.',
    conclusion: 'QTc prolongado.'
  },
  {
    code: '074',
    title: 'QTc curto',
    description: 'Intervalo QT corrigido abaixo do limite de referência, após confirmação da medida.',
    conclusion: 'QTc curto.'
  },
  {
    code: '075',
    title: 'Ondas U proeminentes',
    description: 'Ondas U evidentes, especialmente precordiais; considerar distúrbios eletrolíticos e fármacos.',
    conclusion: 'Ondas U proeminentes.'
  },
  {
    code: '076',
    title: 'Alterações sugestivas de hipercalemia',
    description: 'Ondas T apiculadas e/ou alterações de condução compatíveis; confirmar potássio urgentemente se suspeito.',
    conclusion: 'Alterações sugestivas de hipercalemia.'
  },
  {
    code: '077',
    title: 'Alterações sugestivas de hipocalemia',
    description: 'Achatamento de T, depressão de ST e ondas U proeminentes, quando presentes.',
    conclusion: 'Alterações sugestivas de hipocalemia.'
  },
  {
    code: '078',
    title: 'Padrão sugestivo de pericardite aguda',
    description: 'Supradesnivelamento difuso de ST e depressão de PR, quando presentes; correlacionar com clínica.',
    conclusion: 'Padrão sugestivo de pericardite aguda.'
  },
  {
    code: '079',
    title: 'Alternância elétrica',
    description: 'Variação alternante da amplitude ou eixo do QRS; correlacionar com achados clínicos.',
    conclusion: 'Alternância elétrica.'
  },
  {
    code: '080',
    title: 'Ondas Q patológicas inferiores',
    description: 'Ondas Q com critérios patológicos em derivações inferiores; possível sequela de infarto.',
    conclusion: 'Ondas Q patológicas inferiores.'
  },
  {
    code: '081',
    title: 'Ondas Q patológicas anteriores',
    description: 'Ondas Q patológicas em derivações anteriores; possível sequela de infarto.',
    conclusion: 'Ondas Q patológicas anteriores.'
  },
  {
    code: '082',
    title: 'Ondas Q patológicas laterais',
    description: 'Ondas Q patológicas em derivações laterais; possível sequela de infarto.',
    conclusion: 'Ondas Q patológicas laterais.'
  },
  {
    code: '083',
    title: 'Padrão sugestivo de IAM com supra inferior',
    description: 'Supradesnivelamento de ST em derivações inferiores contíguas, conforme critérios; avaliar alterações recíprocas.',
    conclusion: 'Padrão sugestivo de IAM com supra inferior.'
  },
  {
    code: '084',
    title: 'Padrão sugestivo de IAM com supra anterior',
    description: 'Supradesnivelamento de ST em derivações anteriores contíguas, conforme critérios.',
    conclusion: 'Padrão sugestivo de IAM com supra anterior.'
  },
  {
    code: '085',
    title: 'Padrão sugestivo de IAM com supra lateral',
    description: 'Supradesnivelamento de ST em derivações laterais contíguas, conforme critérios.',
    conclusion: 'Padrão sugestivo de IAM com supra lateral.'
  },
  {
    code: '086',
    title: 'Suspeita de isquemia subendocárdica',
    description: 'Infradesnivelamento horizontal ou descendente de ST em derivações contíguas, em contexto compatível.',
    conclusion: 'Suspeita de isquemia subendocárdica.'
  },
  {
    code: '087',
    title: 'Padrão sugestivo de infarto posterior',
    description: 'Infradesnivelamento de ST em V1-V3 com ondas R proeminentes; considerar V7-V9.',
    conclusion: 'Padrão sugestivo de infarto posterior.'
  },
  {
    code: '088',
    title: 'Padrão de Wellens suspeito',
    description: 'Ondas T bifásicas ou profundamente negativas em V2-V3 em contexto clínico apropriado; alto risco.',
    conclusion: 'Padrão de Wellens suspeito.'
  },
  {
    code: '089',
    title: 'Padrão de de Winter suspeito',
    description: 'Infradesnivelamento ascendente do ST precordial com ondas T altas e simétricas, em contexto compatível.',
    conclusion: 'Padrão de de Winter suspeito.'
  },
  {
    code: '090',
    title: 'Padrão de Brugada tipo 1 suspeito',
    description: 'Supradesnivelamento côncavo para baixo do ST com morfologia em cúpula em V1-V2; requer avaliação especializada.',
    conclusion: 'Padrão de Brugada tipo 1 suspeito.'
  },
  {
    code: '091',
    title: 'Ritmo estimulado ventricular',
    description: 'Espículas de estimulação precedendo complexos QRS com morfologia estimulada.',
    conclusion: 'Ritmo estimulado ventricular.'
  },
  {
    code: '092',
    title: 'Ritmo estimulado atrial',
    description: 'Espículas atriais precedendo ondas P com condução ventricular subsequente.',
    conclusion: 'Ritmo estimulado atrial.'
  },
  {
    code: '093',
    title: 'Estimulação atrioventricular sequencial',
    description: 'Espículas atriais e ventriculares com captura correspondente, quando visíveis.',
    conclusion: 'Estimulação atrioventricular sequencial.'
  },
  {
    code: '094',
    title: 'Possível falha de captura de marca-passo',
    description: 'Espícula sem despolarização correspondente; confirmar artefatos e avaliar dispositivo urgentemente.',
    conclusion: 'Possível falha de captura de marca-passo.'
  },
  {
    code: '095',
    title: 'Artefato de registro',
    description: 'Interferência técnica que limita a interpretação de parte do traçado; repetir registro quando necessário.',
    conclusion: 'Artefato de registro.'
  },
  {
    code: '096',
    title: 'Ritmo de escape atrial',
    description: 'Batimentos de escape com onda P não sinusal após pausa do ritmo dominante.',
    conclusion: 'Ritmo de escape atrial.'
  },
  {
    code: '097',
    title: 'Bloqueio sinoatrial suspeito',
    description: 'Pausa compatível com ausência transitória de saída do impulso sinusal; avaliar múltiplos ciclos.',
    conclusion: 'Bloqueio sinoatrial suspeito.'
  },
  {
    code: '098',
    title: 'Desvio extremo do eixo do QRS',
    description: 'Eixo frontal em quadrante superior direito; verificar troca de eletrodos e causas clínicas.',
    conclusion: 'Desvio extremo do eixo do QRS.'
  },
  {
    code: '099',
    title: 'Posicionamento incorreto de eletrodos suspeito',
    description: 'Padrão discordante de ondas P/QRS ou progressão precordial que sugere inversão de eletrodos; repetir ECG.',
    conclusion: 'Posicionamento incorreto de eletrodos suspeito.'
  },
  {
    code: '100',
    title: 'Ritmo de marca-passo com fusão ventricular',
    description: 'Complexos com características combinadas de ativação intrínseca e estimulada.',
    conclusion: 'Ritmo de marca-passo com fusão ventricular.'
  }
];
