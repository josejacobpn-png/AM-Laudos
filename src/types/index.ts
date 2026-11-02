export type Priority = 'EMERGENCIA' | 'URGENCIA' | 'ELETIVO';

export type ExamStatus = 'PENDENTE' | 'EM_ANALISE' | 'LAUDADO' | 'CANCELADO';

export type UserRole = 'MEDICO_LAUDISTA' | 'TECNICO_CLINICA' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId?: string;
  clinicName?: string;
  crm?: string;
  uf?: string;
  rqe?: string;
  specialty?: string;
  avatarUrl?: string;
  certificateType?: 'A1_ARQUIVO' | 'A3_NUVEM_BIRD_ID' | 'A3_TOKEN_NEOID';
  phone?: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  age: number;
  gender: 'M' | 'F';
  bloodPressure?: string;
  symptoms: string;
  medications?: string;
}

export interface Clinic {
  id: string;
  name: string;
  cnes: string;
  city: string;
  state: string;
  phone: string;
  logoBadge?: string;
  active?: boolean;
}

export interface DigitalSignature {
  doctorName: string;
  crm: string;
  uf: string;
  rqe?: string;
  certificateType: 'A1_ARQUIVO' | 'A3_NUVEM_BIRD_ID' | 'A3_TOKEN_NEOID';
  signedAt: string;
  sha256Hash: string;
  qrCodeValidationUrl: string;
  certificateAuthority: string;
  serialNumber: string;
  isQualifiedIcpBrasil: boolean;
}

export interface Report {
  id: string;
  examId: string;
  doctorName: string;
  doctorCrm: string;
  doctorUf: string;
  doctorRqe?: string;
  rhythm: string;
  heartRate: number;
  prInterval: string;
  qrsDuration: string;
  qtcInterval: string;
  qrsAxis: string;
  findings: string;
  conclusion: string;
  signature?: DigitalSignature;
  createdAt: string;
}

export interface Exam {
  id: string;
  protocolNumber: string;
  clinicId: string;
  clinicName: string;
  patient: Patient;
  priority: Priority;
  status: ExamStatus;
  receivedAt: string;
  slaMinutesTotal: number;
  remainingMinutes?: number;
  fileName: string;
  fileSize: string;
  fileType: 'PDF' | 'XML_DICOM' | 'RAW_ECG';
  simulatedEcgType?: 'NORMAL' | 'ARRHYTHMIA' | 'ISCHEMIA' | 'LBBB' | 'BRADYCARDIA';
  report?: Report;
  lockedByDoctor?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Normal' | 'Arritmias' | 'Bloqueios' | 'Sobrecargas' | 'Isquemia';
  rhythm: string;
  heartRate: number;
  prInterval: string;
  qrsDuration: string;
  qtcInterval: string;
  qrsAxis: string;
  findings: string;
  conclusion: string;
}

export interface EcgWavePoint {
  time: number; // in seconds or sample index
  amplitude: number; // in mV (-1.5 to +2.5 mV)
}

export interface EcgLeadData {
  leadName: string;
  points: EcgWavePoint[];
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
  details?: string;
}
