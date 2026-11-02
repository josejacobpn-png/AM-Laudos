import type { ReportTemplate } from '../types';

export const MEDICAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-normal',
    name: 'Eletrocardiograma Normal',
    category: 'Normal',
    description: 'Traçado sem alterações patológicas, ritmo sinusal preservado.',
    rhythm: 'Ritmo sinusal regular',
    heartRate: 72,
    prInterval: '160 ms (Normal)',
    qrsDuration: '88 ms (Normal)',
    qtcInterval: '412 ms (Normal - Bazzet)',
    qrsAxis: '+45° (Normal)',
    findings: 'Ondas P de morfologia e orientação normais em todas as derivações. Intervalo PR normal. Complexos QRS com amplitude, duração e morfologia preservadas. Segmento ST nivelado na linha de base. Ondas T assimétricas, concordantes com o QRS nas derivações periféricas e precordiais.',
    conclusion: 'Eletrocardiograma dentro dos limites da normalidade para a faixa etária.'
  },
  {
    id: 'tpl-af',
    name: 'Fibrilação Atrial (FA)',
    category: 'Arritmias',
    description: 'Ausência de onda P, ritmo irregular com ondas f de fibrilação.',
    rhythm: 'Fibrilação Atrial com resposta ventricular moderada',
    heartRate: 98,
    prInterval: 'Não mensurável (ausência de ondas P organizadas)',
    qrsDuration: '92 ms',
    qtcInterval: '425 ms',
    qrsAxis: '+30°',
    findings: 'Ausência de ondas P sinusais identificáveis, substituídas por ondulações irregulares da linha de base (ondas f). Intervalos R-R absolutamente irregulares. Complexos QRS estreitos, com repolarização ventricular sem evidência de supradesnivelamento agudo de ST.',
    conclusion: 'Fibrilação atrial de resposta ventricular moderada. Sugere-se correlação clínica e avaliação de escores de risco tromboembólico (CHA2DS2-VASc).'
  },
  {
    id: 'tpl-lbbb',
    name: 'Bloqueio de Ramo Esquerdo (BRE)',
    category: 'Bloqueios',
    description: 'QRS alargado >= 120ms com padrão rS em V1 e R alargado/entalhado em V6.',
    rhythm: 'Ritmo sinusal regular',
    heartRate: 68,
    prInterval: '180 ms',
    qrsDuration: '144 ms (Alargado)',
    qtcInterval: '468 ms (Prolongado secundário ao distúrbio de condução)',
    qrsAxis: '-15° (Desvio para a esquerda)',
    findings: 'QRS alargado com duração de 144 ms. Ausência de onda Q septal em D1, aVL e V6. Presença de onda R alargada e entalhada em D1, aVL, V5 e V6. Padrão rS com S profunda em V1 e V2. Alteração secundária da repolarização ventricular com desnivelamento do segmento ST oposto ao vetor principal do QRS.',
    conclusion: 'Bloqueio completo do ramo esquerdo (BRE de 3º grau). Recomenda-se correlação ecocardiográfica para avaliação da função ventricular esquerda.'
  },
  {
    id: 'tpl-sve',
    name: 'Sobrecarga Ventricular Esquerda (SVE)',
    category: 'Sobrecargas',
    description: 'Critérios de Sokolow-Lyon e Cornell positivos com padrão de strain.',
    rhythm: 'Ritmo sinusal regular',
    heartRate: 78,
    prInterval: '170 ms',
    qrsDuration: '104 ms',
    qtcInterval: '438 ms',
    qrsAxis: '+10°',
    findings: 'Aumento da voltagem dos complexos QRS nas derivações precordiais. Índice de Sokolow-Lyon positivo (S em V1 + R em V5/V6 = 42 mm, valor de referência > 35 mm). Alterações de repolarização ventricular tipo "strain" com infradesnivelamento assimétrico do segmento ST e inversão de onda T em V5, V6, D1 e aVL.',
    conclusion: 'Sobrecarga ventricular esquerda acentuada com padrão de sobrecarga sistólica (strain). Compatível com cardiopatia hipertensiva crônica.'
  },
  {
    id: 'tpl-ischemia',
    name: 'Isquemia Subepicárdica Anterior / IAM',
    category: 'Isquemia',
    description: 'Inversão simétrica de onda T ou supradesnivelamento de ST.',
    rhythm: 'Ritmo sinusal regular',
    heartRate: 88,
    prInterval: '165 ms',
    qrsDuration: '96 ms',
    qtcInterval: '455 ms',
    qrsAxis: '+60°',
    findings: 'Supradesnivelamento convexo do segmento ST de 3.5 mm nas derivações precordiais anteriores (V1 a V4), com imagem recíproca (infradesnivelamento em D2, D3 e aVF). Ondas T hiperagudas e simétricas.',
    conclusion: 'SÍNDROME CORONARIANA AGUDA COM SUPRADESNIVELAMENTO DO SEGMENTO ST (IAMCSST) DE PAREDE ANTERIOR EXTENSA. ACHADO CRÍTICO DE EMERGÊNCIA MÉDICA: ENCAMINHAMENTO IMEDIATO PARA SERVIÇO DE HEMODINÂMICA / PROTOCOLO DE DOR TORÁCICA.'
  },
  {
    id: 'tpl-brady',
    name: 'Bradicardia Sinusal',
    category: 'Arritmias',
    description: 'Ritmo sinusal com frequência cardíaca inferior a 50 bpm.',
    rhythm: 'Bradicardia sinusal',
    heartRate: 46,
    prInterval: '175 ms',
    qrsDuration: '86 ms',
    qtcInterval: '405 ms',
    qrsAxis: '+50°',
    findings: 'Ritmo sinusal de baixa frequência (46 bpm). Condução atrioventricular e intraventricular normais. Sem alterações agudas do segmento ST ou da onda T.',
    conclusion: 'Bradicardia sinusal. Sugere-se correlacionar com nível de condicionamento físico (atleta) ou uso de cronotrópicos negativos (beta-bloqueadores, bloqueadores de canal de cálcio).'
  }
];
