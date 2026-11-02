import type { Clinic, Exam } from '../types';

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'cli-01',
    name: 'Centro Médico São Lucas',
    cnes: '2849102',
    city: 'Campinas',
    state: 'SP',
    phone: '(19) 3456-7890',
    logoBadge: 'CMSL'
  },
  {
    id: 'cli-02',
    name: 'Hospital e Pronto Atendimento Vida',
    cnes: '7492810',
    city: 'Belo Horizonte',
    state: 'MG',
    phone: '(31) 3222-1100',
    logoBadge: 'HPAV'
  },
  {
    id: 'cli-03',
    name: 'Clínica CardioMed Diagnósticos',
    cnes: '1092834',
    city: 'Curitiba',
    state: 'PR',
    phone: '(41) 3340-9988',
    logoBadge: 'CMD'
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'ex-001',
    protocolNumber: 'ECG-2026-948102',
    clinicId: 'cli-02',
    clinicName: 'Hospital e Pronto Atendimento Vida',
    priority: 'EMERGENCIA',
    status: 'PENDENTE',
    receivedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 min atrás
    slaMinutesTotal: 15,
    remainingMinutes: 11,
    fileName: 'exame_ecg_paciente_antonio_emergencia.pdf',
    fileSize: '1.4 MB',
    fileType: 'PDF',
    simulatedEcgType: 'ISCHEMIA',
    patient: {
      id: 'pat-001',
      name: 'Antônio Carlos Silveira',
      cpf: '348.***.***-12',
      age: 62,
      gender: 'M',
      bloodPressure: '160/95 mmHg',
      symptoms: 'Dor precordial em aperto há 45 min, irradiada para mandíbula e MSE, acompanhada de sudorese fria.',
      medications: 'Losartana 50mg, AAS 100mg'
    }
  },
  {
    id: 'ex-002',
    protocolNumber: 'ECG-2026-481920',
    clinicId: 'cli-01',
    clinicName: 'Centro Médico São Lucas',
    priority: 'URGENCIA',
    status: 'PENDENTE',
    receivedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min atrás
    slaMinutesTotal: 120,
    remainingMinutes: 95,
    fileName: 'ecg_tracado_maria_helena.pdf',
    fileSize: '890 KB',
    fileType: 'PDF',
    simulatedEcgType: 'ARRHYTHMIA',
    patient: {
      id: 'pat-002',
      name: 'Maria Helena dos Santos',
      cpf: '582.***.***-89',
      age: 58,
      gender: 'F',
      bloodPressure: '135/85 mmHg',
      symptoms: 'Palpitações taquicárdicas irregulares de início súbito, sem dor torácica.',
      medications: 'Metoprolol 25mg'
    }
  },
  {
    id: 'ex-003',
    protocolNumber: 'ECG-2026-772109',
    clinicId: 'cli-03',
    clinicName: 'Clínica CardioMed Diagnósticos',
    priority: 'URGENCIA',
    status: 'EM_ANALISE',
    receivedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    slaMinutesTotal: 120,
    remainingMinutes: 80,
    lockedByDoctor: 'Dra. Gabriela Vasconcelos (CRM 139.842-SP)',
    fileName: 'tracado_ecg_roberto_lima.xml',
    fileSize: '450 KB',
    fileType: 'XML_DICOM',
    simulatedEcgType: 'LBBB',
    patient: {
      id: 'pat-003',
      name: 'Roberto Mendes de Lima',
      cpf: '194.***.***-45',
      age: 71,
      gender: 'M',
      bloodPressure: '140/90 mmHg',
      symptoms: 'Dispneia progressiva aos moderados esforços. Histórico de cardiopatia isquêmica.',
      medications: 'Enalapril 20mg, Carvedilol 12.5mg, Sinvastatina 20mg'
    }
  },
  {
    id: 'ex-004',
    protocolNumber: 'ECG-2026-382910',
    clinicId: 'cli-01',
    clinicName: 'Centro Médico São Lucas',
    priority: 'ELETIVO',
    status: 'PENDENTE',
    receivedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    slaMinutesTotal: 1440,
    remainingMinutes: 1350,
    fileName: 'ecg_rotina_juliana_paes.pdf',
    fileSize: '1.1 MB',
    fileType: 'PDF',
    simulatedEcgType: 'NORMAL',
    patient: {
      id: 'pat-004',
      name: 'Juliana Paes de Oliveira',
      cpf: '409.***.***-67',
      age: 34,
      gender: 'F',
      bloodPressure: '115/75 mmHg',
      symptoms: 'Avaliação cardiológica de rotina para liberação de atividade física.',
      medications: 'Nenhum'
    }
  },
  {
    id: 'ex-005',
    protocolNumber: 'ECG-2026-118942',
    clinicId: 'cli-02',
    clinicName: 'Hospital e Pronto Atendimento Vida',
    priority: 'ELETIVO',
    status: 'LAUDADO',
    receivedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    slaMinutesTotal: 1440,
    remainingMinutes: 0,
    fileName: 'ecg_marcos_aurelio_hipertensao.pdf',
    fileSize: '1.2 MB',
    fileType: 'PDF',
    simulatedEcgType: 'NORMAL',
    patient: {
      id: 'pat-005',
      name: 'Marcos Aurélio Nogueira',
      cpf: '228.***.***-33',
      age: 54,
      gender: 'M',
      bloodPressure: '150/95 mmHg',
      symptoms: 'Hipertensão arterial sistêmica de longa data. Acompanhamento ambulatorial.',
      medications: 'Anlodipino 5mg, Hidroclorotiazida 25mg'
    },
    report: {
      id: 'rep-005',
      examId: 'ex-005',
      doctorName: 'Dr. Fernando Albuquerque',
      doctorCrm: '112.540',
      doctorUf: 'SP',
      doctorRqe: '24910',
      rhythm: 'Ritmo sinusal regular',
      heartRate: 74,
      prInterval: '168 ms',
      qrsDuration: '98 ms',
      qtcInterval: '420 ms',
      qrsAxis: '+15°',
      findings: 'Ritmo sinusal com frequência cardíaca mantida em 74 bpm. Intervalo PR normal. Complexos QRS com sobrecarga ventricular esquerda moderada (índice de Sokolow-Lyon limítrofe de 33 mm). Sem alterações agudas da repolarização ventricular.',
      conclusion: 'Eletrocardiograma compatível com sobrecarga ventricular esquerda de grau leve a moderado em paciente hipertenso crônico.',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      signature: {
        doctorName: 'Dr. Fernando Albuquerque',
        crm: '112.540',
        uf: 'SP',
        rqe: '24910',
        certificateType: 'A1_ARQUIVO',
        signedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        sha256Hash: '4C9E7D810B225F88A19074EE49B062137D98944120A3815D839E6BC1092F348C',
        qrCodeValidationUrl: 'https://amlaudos.com.br/validar/ECG-2026-118942',
        certificateAuthority: 'AC Soluti Multipla v5 (ICP-Brasil)',
        serialNumber: '7482-9901-2834-0192',
        isQualifiedIcpBrasil: true
      }
    }
  }
];
