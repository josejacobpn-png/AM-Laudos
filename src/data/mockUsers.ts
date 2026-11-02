import type { UserProfile } from '../types';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-medico-01',
    email: 'medico@amlaudos.com.br',
    name: 'Dr. Fernando Albuquerque',
    role: 'MEDICO_LAUDISTA',
    crm: '112.540',
    uf: 'SP',
    rqe: '24910',
    specialty: 'Cardiologia Clínica e Eletrofisiologia',
    avatarUrl: ''
  },
  {
    id: 'usr-clinica-01',
    email: 'clinica@saolucas.com.br',
    name: 'Posto Central São Lucas',
    role: 'TECNICO_CLINICA',
    clinicId: 'cli-01',
    clinicName: 'Centro Médico São Lucas',
    avatarUrl: ''
  },
  {
    id: 'usr-clinica-02',
    email: 'clinica@hospitalvida.com.br',
    name: 'PA Hospital Vida',
    role: 'TECNICO_CLINICA',
    clinicId: 'cli-02',
    clinicName: 'Hospital e Pronto Atendimento Vida',
    avatarUrl: ''
  },
  {
    id: 'usr-admin-01',
    email: 'g2autodev@gmail.com',
    name: 'G2 Auto Dev (Administrador Geral)',
    role: 'ADMIN',
    avatarUrl: ''
  }
];
