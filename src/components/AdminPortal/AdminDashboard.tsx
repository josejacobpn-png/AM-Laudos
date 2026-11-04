import React, { useState } from 'react';
import { 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  Plus, 
  Search, 
  CheckCircle, 
  FileText, 
  AlertTriangle,
  Layers,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Clinic, Exam, UserProfile } from '../../types';
import { DEMO_USERS } from '../../data/mockUsers';
import { formatDateTimeBR } from '../../utils/cryptoSim';
import { supabase, isSupabaseConfigured, createIsolatedAuthClient } from '../../services/supabase';

export const BRAZILIAN_UFS = [
  { sigla: 'AC', nome: 'Acre (AC)' },
  { sigla: 'AL', nome: 'Alagoas (AL)' },
  { sigla: 'AP', nome: 'Amapá (AP)' },
  { sigla: 'AM', nome: 'Amazonas (AM)' },
  { sigla: 'BA', nome: 'Bahia (BA)' },
  { sigla: 'CE', nome: 'Ceará (CE)' },
  { sigla: 'DF', nome: 'Distrito Federal (DF)' },
  { sigla: 'ES', nome: 'Espírito Santo (ES)' },
  { sigla: 'GO', nome: 'Goiás (GO)' },
  { sigla: 'MA', nome: 'Maranhão (MA)' },
  { sigla: 'MT', nome: 'Mato Grosso (MT)' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul (MS)' },
  { sigla: 'MG', nome: 'Minas Gerais (MG)' },
  { sigla: 'PA', nome: 'Pará (PA)' },
  { sigla: 'PB', nome: 'Paraíba (PB)' },
  { sigla: 'PR', nome: 'Paraná (PR)' },
  { sigla: 'PE', nome: 'Pernambuco (PE)' },
  { sigla: 'PI', nome: 'Piauí (PI)' },
  { sigla: 'RJ', nome: 'Rio de Janeiro (RJ)' },
  { sigla: 'RN', nome: 'Rio Grande do Norte (RN)' },
  { sigla: 'RS', nome: 'Rio Grande do Sul (RS)' },
  { sigla: 'RO', nome: 'Rondônia (RO)' },
  { sigla: 'RR', nome: 'Roraima (RR)' },
  { sigla: 'SC', nome: 'Santa Catarina (SC)' },
  { sigla: 'SP', nome: 'São Paulo (SP)' },
  { sigla: 'SE', nome: 'Sergipe (SE)' },
  { sigla: 'TO', nome: 'Tocantins (TO)' }
];

interface AdminDashboardProps {
  clinics: Clinic[];
  exams: Exam[];
  doctors?: UserProfile[];
  onAddClinic: (newClinic: Clinic) => void;
  onUpdateClinic?: (updatedClinic: Clinic) => void;
  onDeleteClinic?: (clinicId: string) => void;
  onAddDoctor?: (newDoctor: UserProfile) => void;
  onUpdateDoctor?: (updatedDoctor: UserProfile) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  onViewReport: (exam: Exam) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  clinics,
  exams,
  doctors,
  onAddClinic,
  onUpdateClinic,
  onDeleteClinic,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onViewReport
}) => {
  const [activeTab, setActiveTab] = useState<'clinicas' | 'medicos' | 'auditoria' | 'exames_geral'>('clinicas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewClinicModalOpen, setIsNewClinicModalOpen] = useState(false);

  // Form states para nova clínica
  const [newNome, setNewNome] = useState('');
  const [newCnes, setNewCnes] = useState('');
  const [newCidade, setNewCidade] = useState('');
  const [newEstado, setNewEstado] = useState('SP');
  const [newTelefone, setNewTelefone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [isSubmittingClinic, setIsSubmittingClinic] = useState(false);
  const [clinicFormError, setClinicFormError] = useState('');

  // Form states para editar clínica existente
  const [isEditClinicModalOpen, setIsEditClinicModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [editClinicNome, setEditClinicNome] = useState('');
  const [editClinicCnes, setEditClinicCnes] = useState('');
  const [editClinicCidade, setEditClinicCidade] = useState('');
  const [editClinicEstado, setEditClinicEstado] = useState('SP');
  const [editClinicTelefone, setEditClinicTelefone] = useState('');
  const [editClinicEmail, setEditClinicEmail] = useState('');
  const [editClinicAtivo, setEditClinicAtivo] = useState(true);
  const [isSubmittingEditClinic, setIsSubmittingEditClinic] = useState(false);
  const [editClinicError, setEditClinicError] = useState('');

  // Médicos cadastrados
  const [localDoctors, setLocalDoctors] = useState<UserProfile[]>(() => {
    return DEMO_USERS.filter(u => u.role === 'MEDICO_LAUDISTA');
  });

  const doctorsList = doctors || localDoctors;

  // Estados para cadastro e busca de médicos
  const [isNewDoctorModalOpen, setIsNewDoctorModalOpen] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [newDocNome, setNewDocNome] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocSenha, setNewDocSenha] = useState('');
  const [newDocCrm, setNewDocCrm] = useState('');
  const [newDocUf, setNewDocUf] = useState('SP');
  const [newDocEspecialidade, setNewDocEspecialidade] = useState('Cardiologia Clínica e Eletrofisiologia');
  const [newDocTelefone, setNewDocTelefone] = useState('');
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);
  const [doctorFormError, setDoctorFormError] = useState('');

  // Form states para editar médico existente
  const [isEditDoctorModalOpen, setIsEditDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<UserProfile | null>(null);
  const [editDocNome, setEditDocNome] = useState('');
  const [editDocEmail, setEditDocEmail] = useState('');
  const [editDocCrm, setEditDocCrm] = useState('');
  const [editDocUf, setEditDocUf] = useState('SP');
  const [editDocEspecialidade, setEditDocEspecialidade] = useState('Cardiologia Clínica e Eletrofisiologia');
  const [editDocTelefone, setEditDocTelefone] = useState('');
  const [isSubmittingEditDoctor, setIsSubmittingEditDoctor] = useState(false);
  const [editDoctorError, setEditDoctorError] = useState('');

  // Estados para modal de confirmação / bloqueio de exclusão
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    type: 'CLINICA' | 'MEDICO';
    id: string;
    name: string;
    detail: string;
    linkedCount: number;
    canDelete: boolean;
    reasonText?: string;
  }>({
    isOpen: false,
    type: 'CLINICA',
    id: '',
    name: '',
    detail: '',
    linkedCount: 0,
    canDelete: false
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Métricas
  const totalClinics = clinics.length;
  const totalDoctors = doctorsList.length;
  const totalExams = exams.length;
  const criticalExams = exams.filter(e => e.priority === 'EMERGENCIA' && e.status === 'PENDENTE').length;

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome || !newCnes || !newEmail) return;

    if (!newSenha || newSenha.length < 6) {
      setClinicFormError('A senha de acesso da clínica deve ter no mínimo 6 caracteres.');
      return;
    }

    setClinicFormError('');
    setIsSubmittingClinic(true);

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanNome = newNome.trim();
    let clinicId = `cli-${Date.now()}`;

    // Sincronizar criação no Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Inserir na tabela public.clinicas
        const { data: clinicData, error: clinicErr } = await supabase
          .from('clinicas')
          .insert({
            nome: cleanNome,
            cnes: newCnes.trim(),
            cidade: newCidade.trim() || 'São Paulo',
            estado: newEstado || 'SP',
            telefone: newTelefone.trim() || '(11) 3000-0000',
            email: cleanEmail,
            ativo: true
          })
          .select('id')
          .single();

        if (clinicErr) {
          console.warn('Erro ao inserir clínica no Supabase:', clinicErr.message);
          setIsSubmittingClinic(false);
          setClinicFormError(`Erro ao salvar no banco Supabase: ${clinicErr.message}`);
          return;
        }

        if (clinicData) {
          clinicId = clinicData.id;
        }

        // 2. Criar usuário no Supabase Auth para a clínica usando cliente isolado (não desloga o admin)
        const authClient = createIsolatedAuthClient();
        const { data: authData, error: authErr } = await authClient.auth.signUp({
          email: cleanEmail,
          password: newSenha,
          options: {
            data: {
              nome_completo: cleanNome,
              tipo: 'TECNICO_CLINICA',
              clinica_id: clinicId
            }
          }
        });

        if (authErr) {
          console.warn('Aviso Supabase Auth ao registrar clínica:', authErr.message);
          const isAlready = authErr.message?.toLowerCase().includes('already registered') || (authErr as any)?.status === 422;
          if (isAlready) {
            setIsSubmittingClinic(false);
            setClinicFormError(`O e-mail "${cleanEmail}" já está cadastrado no sistema. Por favor, utilize outro e-mail para o acesso desta clínica.`);
            return;
          }
        } else if (authData.user) {
          await supabase.from('perfis').upsert({
            id: authData.user.id,
            nome_completo: cleanNome,
            tipo: 'TECNICO_CLINICA',
            clinica_id: clinicId,
            telefone: newTelefone.trim() || undefined
          });
        }
      } catch (err: any) {
        console.warn('Erro ao conectar clínica com Supabase:', err);
        setIsSubmittingClinic(false);
        setClinicFormError(`Falha na conexão com o banco de dados: ${err.message || err}`);
        return;
      }
    }

    const created: Clinic = {
      id: clinicId,
      name: cleanNome,
      cnes: newCnes.trim(),
      city: newCidade.trim() || 'São Paulo',
      state: newEstado || 'SP',
      phone: newTelefone.trim() || '(11) 3000-0000',
      email: cleanEmail,
      active: true
    };

    onAddClinic(created);
    setIsSubmittingClinic(false);
    setIsNewClinicModalOpen(false);
    setClinicFormError('');
    setNewNome('');
    setNewCnes('');
    setNewCidade('');
    setNewEstado('SP');
    setNewTelefone('');
    setNewEmail('');
    setNewSenha('');
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newDocNome.trim();
    const cleanEmail = newDocEmail.trim().toLowerCase();
    const cleanCrm = newDocCrm.trim();

    if (!trimmedName) {
      setDoctorFormError('Por favor, informe o nome completo do médico(a).');
      return;
    }
    if (!cleanEmail) {
      setDoctorFormError('Por favor, informe o e-mail de acesso do médico.');
      return;
    }
    if (!cleanCrm) {
      setDoctorFormError('Por favor, informe o número do CRM.');
      return;
    }
    if (!newDocSenha || newDocSenha.length < 6) {
      setDoctorFormError('A senha de acesso do médico deve ter no mínimo 6 caracteres.');
      return;
    }

    setDoctorFormError('');
    setIsSubmittingDoctor(true);

    const formattedName = trimmedName.startsWith('Dr.') || trimmedName.startsWith('Dra.')
      ? trimmedName
      : `Dr(a). ${trimmedName}`;

    let createdId = `usr-medico-${Date.now()}`;

    // Sincronizar criação no Supabase Auth usando cliente isolado (não encerra nem sobrescreve a sessão do Admin)
    if (isSupabaseConfigured && supabase) {
      try {
        const authClient = createIsolatedAuthClient();
        const { data: authData, error: authErr } = await authClient.auth.signUp({
          email: cleanEmail,
          password: newDocSenha,
          options: {
            data: {
              nome_completo: formattedName,
              tipo: 'MEDICO_LAUDISTA',
              crm: cleanCrm,
              uf_crm: newDocUf,
              especialidade: newDocEspecialidade
            }
          }
        });

        let existingUserId: string | null = null;

        if (authErr) {
          const isAlreadyRegistered =
            authErr.message?.toLowerCase().includes('already registered') ||
            authErr.message?.toLowerCase().includes('already exists') ||
            (authErr as any)?.status === 422;

          if (isAlreadyRegistered) {
            // 1. Tentar login direto no authClient com a senha fornecida para recuperar o ID
            try {
              const { data: signInData } = await authClient.auth.signInWithPassword({
                email: cleanEmail,
                password: newDocSenha
              });
              if (signInData?.user?.id) {
                existingUserId = signInData.user.id;
                await authClient.auth.signOut();
              }
            } catch {
              // Segue para verificação pelo CRM
            }

            // 2. Se não autenticou pela senha, busca perfil existente no banco pelo CRM
            if (!existingUserId) {
              const { data: profByCrm } = await supabase
                .from('perfis')
                .select('id')
                .eq('tipo', 'MEDICO_LAUDISTA')
                .eq('crm', cleanCrm)
                .maybeSingle();

              if (profByCrm?.id) {
                existingUserId = profByCrm.id;
              }
            }

            // Se identificamos o registro do médico, atualizamos o perfil e habilitamos sem erro
            if (existingUserId) {
              createdId = existingUserId;
              await supabase.from('perfis').upsert({
                id: existingUserId,
                nome_completo: formattedName,
                tipo: 'MEDICO_LAUDISTA',
                crm: cleanCrm,
                uf_crm: newDocUf,
                especialidade: newDocEspecialidade,
                telefone: newDocTelefone.trim() || undefined
              });
            } else {
              setIsSubmittingDoctor(false);
              setDoctorFormError(`O e-mail "${cleanEmail}" já está cadastrado no sistema. Se o médico já existe, edite seus dados diretamente na tabela abaixo. Caso contrário, utilize outro e-mail.`);
              return;
            }
          } else {
            console.warn('Aviso Supabase Auth ao registrar médico:', authErr.message);
            setIsSubmittingDoctor(false);
            setDoctorFormError(`Falha ao registrar médico no Supabase: ${authErr.message}`);
            return;
          }
        } else if (authData?.user?.identities && authData.user.identities.length === 0) {
          // Caso o Supabase retorne identities vazio (e-mail já cadastrado)
          try {
            const { data: signInData } = await authClient.auth.signInWithPassword({
              email: cleanEmail,
              password: newDocSenha
            });
            if (signInData?.user?.id) {
              existingUserId = signInData.user.id;
              await authClient.auth.signOut();
            }
          } catch {
            // Segue para verificação por CRM
          }

          if (!existingUserId) {
            const { data: profByCrm } = await supabase
              .from('perfis')
              .select('id')
              .eq('tipo', 'MEDICO_LAUDISTA')
              .eq('crm', cleanCrm)
              .maybeSingle();

            if (profByCrm?.id) {
              existingUserId = profByCrm.id;
            }
          }

          if (existingUserId) {
            createdId = existingUserId;
            await supabase.from('perfis').upsert({
              id: existingUserId,
              nome_completo: formattedName,
              tipo: 'MEDICO_LAUDISTA',
              crm: cleanCrm,
              uf_crm: newDocUf,
              especialidade: newDocEspecialidade,
              telefone: newDocTelefone.trim() || undefined
            });
          } else {
            setIsSubmittingDoctor(false);
            setDoctorFormError(`O e-mail "${cleanEmail}" já está cadastrado no sistema. Se o médico já existe, edite seus dados diretamente na tabela abaixo. Caso contrário, utilize outro e-mail.`);
            return;
          }
        } else if (authData?.user) {
          createdId = authData.user.id;

          // Autenticar com o próprio authClient para contornar RLS de perfis (auth.uid() = id)
          let savedPerfil = false;
          try {
            const { data: docLogin } = await authClient.auth.signInWithPassword({
              email: cleanEmail,
              password: newDocSenha
            });

            if (docLogin?.user) {
              const { error: insertErr } = await authClient.from('perfis').upsert({
                id: authData.user.id,
                nome_completo: formattedName,
                tipo: 'MEDICO_LAUDISTA',
                crm: cleanCrm,
                uf_crm: newDocUf,
                especialidade: newDocEspecialidade,
                telefone: newDocTelefone.trim() || undefined
              });
              if (!insertErr) {
                savedPerfil = true;
              }
              await authClient.auth.signOut();
            }
          } catch (e) {
            console.warn('Erro ao autenticar cliente isolado para upsert:', e);
          }

          if (!savedPerfil) {
            const { error: perfilErr } = await supabase.from('perfis').upsert({
              id: authData.user.id,
              nome_completo: formattedName,
              tipo: 'MEDICO_LAUDISTA',
              crm: cleanCrm,
              uf_crm: newDocUf,
              especialidade: newDocEspecialidade,
              telefone: newDocTelefone.trim() || undefined
            });

            if (perfilErr) {
              console.warn('Erro ao criar perfil de médico no Supabase:', perfilErr.message);
            }
          }
        }
      } catch (err: any) {
        console.warn('Erro ao conectar com Supabase:', err);
        setIsSubmittingDoctor(false);
        setDoctorFormError(`Falha de conexão com o banco de dados: ${err.message || err}`);
        return;
      }
    }

    const created: UserProfile = {
      id: createdId,
      name: formattedName,
      email: cleanEmail,
      role: 'MEDICO_LAUDISTA',
      crm: cleanCrm,
      uf: newDocUf,
      specialty: newDocEspecialidade,
      phone: newDocTelefone.trim() || undefined
    };

    try {
      const currentSaved: UserProfile[] = JSON.parse(localStorage.getItem('am_laudos_doctors_v2') || '[]');
      const filtered = currentSaved.filter(d => d.id !== created.id && d.email?.toLowerCase() !== cleanEmail);
      localStorage.setItem('am_laudos_doctors_v2', JSON.stringify([...filtered, created]));
    } catch {}

    if (onAddDoctor) {
      onAddDoctor(created);
    } else {
      setLocalDoctors(prev => [...prev, created]);
    }

    setIsSubmittingDoctor(false);
    setIsNewDoctorModalOpen(false);
    setDoctorFormError('');
    setNewDocNome('');
    setNewDocEmail('');
    setNewDocSenha('');
    setNewDocCrm('');
    setNewDocUf('SP');
    setNewDocEspecialidade('Cardiologia Clínica e Eletrofisiologia');
    setNewDocTelefone('');
  };

  // Handlers para Edição de Clínica
  const handleOpenEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setEditClinicNome(clinic.name);
    setEditClinicCnes(clinic.cnes);
    setEditClinicCidade(clinic.city);
    setEditClinicEstado(clinic.state);
    setEditClinicTelefone(clinic.phone);
    setEditClinicEmail(clinic.email || '');
    setEditClinicAtivo(clinic.active !== false);
    setEditClinicError('');
    setIsEditClinicModalOpen(true);
  };

  const handleSaveEditClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinic || !editClinicNome || !editClinicCnes) return;

    setIsSubmittingEditClinic(true);
    setEditClinicError('');

    const updated: Clinic = {
      ...editingClinic,
      name: editClinicNome.trim(),
      cnes: editClinicCnes.trim(),
      city: editClinicCidade.trim() || 'São Paulo',
      state: editClinicEstado || 'SP',
      phone: editClinicTelefone.trim() || '(11) 3000-0000',
      email: editClinicEmail.trim().toLowerCase(),
      active: editClinicAtivo
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('clinicas').update({
          nome: updated.name,
          cnes: updated.cnes,
          cidade: updated.city,
          estado: updated.state,
          telefone: updated.phone,
          email: updated.email,
          ativo: updated.active
        }).eq('id', updated.id);
      } catch (err) {
        console.warn('Erro ao atualizar clínica no Supabase:', err);
      }
    }

    if (onUpdateClinic) {
      onUpdateClinic(updated);
    }

    setIsSubmittingEditClinic(false);
    setIsEditClinicModalOpen(false);
    setEditingClinic(null);
  };

  // Handlers para Edição de Médico Laudista
  const handleOpenEditDoctor = (doctor: UserProfile) => {
    setEditingDoctor(doctor);
    setEditDocNome(doctor.name);
    setEditDocEmail(doctor.email || '');
    setEditDocCrm(doctor.crm || '');
    setEditDocUf(doctor.uf || 'SP');
    setEditDocEspecialidade(doctor.specialty || 'Cardiologia Clínica e Eletrofisiologia');
    setEditDocTelefone(doctor.phone || '');
    setEditDoctorError('');
    setIsEditDoctorModalOpen(true);
  };

  const handleSaveEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor || !editDocNome || !editDocCrm || !editDocEmail) return;

    setIsSubmittingEditDoctor(true);
    setEditDoctorError('');

    const trimmedName = editDocNome.trim();
    const formattedName = trimmedName.startsWith('Dr.') || trimmedName.startsWith('Dra.')
      ? trimmedName
      : `Dr(a). ${trimmedName}`;

    const updated: UserProfile = {
      ...editingDoctor,
      name: formattedName,
      email: editDocEmail.trim().toLowerCase(),
      crm: editDocCrm.trim(),
      uf: editDocUf,
      specialty: editDocEspecialidade,
      phone: editDocTelefone.trim() || undefined
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('perfis').update({
          nome_completo: updated.name,
          crm: updated.crm,
          uf_crm: updated.uf,
          especialidade: updated.specialty,
          telefone: updated.phone
        }).eq('id', updated.id);
      } catch (err) {
        console.warn('Erro ao atualizar perfil do médico no Supabase:', err);
      }
    }

    if (onUpdateDoctor) {
      onUpdateDoctor(updated);
    } else {
      setLocalDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
    }

    setIsSubmittingEditDoctor(false);
    setIsEditDoctorModalOpen(false);
    setEditingDoctor(null);
  };

  // Solicitar exclusão de clínica
  const handleRequestDeleteClinic = (clinic: Clinic) => {
    const linkedExams = exams.filter(e => 
      e.clinicId === clinic.id || 
      (e.clinicName && e.clinicName.toLowerCase() === clinic.name.toLowerCase())
    );
    const count = linkedExams.length;
    const canDelete = count === 0;

    setDeleteModalData({
      isOpen: true,
      type: 'CLINICA',
      id: clinic.id,
      name: clinic.name,
      detail: `CNES ${clinic.cnes}`,
      linkedCount: count,
      canDelete,
      reasonText: canDelete 
        ? undefined 
        : `Esta clínica possui ${count} exame(s) registrado(s) no sistema. Por conformidade com as normas do CFM e LGPD, unidades com histórico de exames não podem ser excluídas para preservar a rastreabilidade médica.`
    });
  };

  // Solicitar exclusão de médico laudista
  const handleRequestDeleteDoctor = (doctor: UserProfile) => {
    const linkedExams = exams.filter(e => {
      const isDoctorReport = e.report && (
        e.report.doctorCrm === doctor.crm ||
        (doctor.crm && e.report.doctorCrm?.includes(doctor.crm)) ||
        e.report.doctorName.toLowerCase().includes(doctor.name.toLowerCase()) ||
        doctor.name.toLowerCase().includes(e.report.doctorName.toLowerCase())
      );
      const isLocked = e.lockedByDoctor && (
        (doctor.crm && e.lockedByDoctor.includes(doctor.crm)) ||
        e.lockedByDoctor.toLowerCase().includes(doctor.name.toLowerCase())
      );
      return isDoctorReport || isLocked;
    });
    const count = linkedExams.length;
    const canDelete = count === 0;

    setDeleteModalData({
      isOpen: true,
      type: 'MEDICO',
      id: doctor.id,
      name: doctor.name,
      detail: `CRM ${doctor.crm || 'N/A'}-${doctor.uf || 'UF'}`,
      linkedCount: count,
      canDelete,
      reasonText: canDelete 
        ? undefined 
        : `Este profissional possui ${count} laudo(s) ou atendimento(s) associado(s) a ele no sistema. Por exigência regulatória do CFM, o cadastro não pode ser excluído para garantir a validade e auditoria de documentos já emitidos.`
    });
  };

  // Executar exclusão definitiva (quando canDelete === true)
  const handleConfirmDelete = async () => {
    if (!deleteModalData.canDelete || !deleteModalData.id) return;

    setIsDeleting(true);

    if (deleteModalData.type === 'CLINICA') {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('perfis').delete().eq('clinica_id', deleteModalData.id);
          await supabase.from('clinicas').delete().eq('id', deleteModalData.id);
        } catch (err) {
          console.warn('Erro ao excluir clínica no Supabase:', err);
        }
      }

      if (onDeleteClinic) {
        onDeleteClinic(deleteModalData.id);
      }
    } else {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('perfis').delete().eq('id', deleteModalData.id);
        } catch (err) {
          console.warn('Erro ao excluir perfil de médico no Supabase:', err);
        }
      }

      if (onDeleteDoctor) {
        onDeleteDoctor(deleteModalData.id);
      } else {
        setLocalDoctors(prev => prev.filter(d => d.id !== deleteModalData.id));
      }
    }

    setIsDeleting(false);
    setDeleteModalData(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="admin-portal-wrap animate-fade-in">
      {/* Banner de Gestão e Governança */}
      <div className="admin-hero-card">
        <div className="admin-hero-content">
          <div className="admin-badge-icon">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2>Painel de Gestão & Governança AM Laudos</h2>
            <p>Controle centralizado de postos conveniados, credenciamento médico e auditoria técnica</p>
          </div>
        </div>

        <div className="admin-sla-badge">
          <span className="sla-rate">0%</span>
          <span className="sla-label">Conformidade SLA 2026</span>
        </div>
      </div>

      {/* Métricas Globais do Sistema */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <Building2 size={24} />
          </div>
          <div>
            <span className="metric-value">{totalClinics}</span>
            <span className="metric-label">Clínicas Conectadas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon teal">
            <Stethoscope size={24} />
          </div>
          <div>
            <span className="metric-value">{totalDoctors}</span>
            <span className="metric-label">Cardiologistas Laudistas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <FileText size={24} />
          </div>
          <div>
            <span className="metric-value">{totalExams}</span>
            <span className="metric-label">Exames Transmitidos</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon red">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="metric-value">{criticalExams}</span>
            <span className="metric-label">Urgências Ativas no Sistema</span>
          </div>
        </div>
      </div>

      {/* Navegação de Abas do Administrador */}
      <div className="admin-nav-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'clinicas' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinicas')}
        >
          <Building2 size={17} />
          <span>Clínicas Conveniadas ({clinics.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'medicos' ? 'active' : ''}`}
          onClick={() => setActiveTab('medicos')}
        >
          <Stethoscope size={17} />
          <span>Corpo Clínico Laudista ({doctorsList.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'exames_geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('exames_geral')}
        >
          <Layers size={17} />
          <span>Monitor Global de Exames ({exams.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
          onClick={() => setActiveTab('auditoria')}
        >
          <ShieldCheck size={17} />
          <span>Trilha de Auditoria (LGPD/CFM)</span>
        </button>
      </div>

      {/* Aba 1: Clínicas Conveniadas */}
      {activeTab === 'clinicas' && (
        <div className="table-card animate-fade-in">
          <div className="table-header-toolbar">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar clínica por nome, cidade ou CNES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-field"
              />
            </div>

            <button
              className="btn-add-primary"
              onClick={() => {
                setClinicFormError('');
                setIsNewClinicModalOpen(true);
              }}
            >
              <Plus size={17} />
              <span>Cadastrar Nova Clínica</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nome da Clínica / Posto</th>
                  <th>CNES</th>
                  <th>Cidade / UF</th>
                  <th>E-mail de Acesso</th>
                  <th>Telefone</th>
                  <th>Exames Emitidos</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clinics
                  .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnes.includes(searchTerm))
                  .map(c => {
                    const count = exams.filter(e => e.clinicId === c.id).length;
                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>
                          <code>{c.cnes}</code>
                        </td>
                        <td>{c.city} / {c.state}</td>
                        <td>{c.email ? <code>{c.email}</code> : <span className="text-muted">—</span>}</td>
                        <td>{c.phone}</td>
                        <td>
                          <span className="exam-count-badge">{count} exames</span>
                        </td>
                        <td>
                          {c.active !== false ? (
                            <span className="badge-status-ready">
                              <CheckCircle size={13} /> Ativa
                            </span>
                          ) : (
                            <span className="badge-status-waiting">Inativa</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="table-actions-group">
                            <button
                              type="button"
                              className="btn-table-edit"
                              onClick={() => handleOpenEditClinic(c)}
                              title="Editar cadastro da clínica"
                            >
                              <Pencil size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              className={`btn-table-delete ${count > 0 ? 'blocked' : ''}`}
                              onClick={() => handleRequestDeleteClinic(c)}
                              title={
                                count > 0 
                                  ? `Não é possível excluir: existem ${count} exame(s) vinculado(s)` 
                                  : 'Excluir cadastro da clínica'
                              }
                            >
                              <Trash2 size={13} />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba 2: Corpo Clínico Laudista */}
      {activeTab === 'medicos' && (
        <div className="table-card animate-fade-in">
          <div className="table-header-toolbar">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar médico por nome, CRM, UF ou especialidade..."
                value={doctorSearchTerm}
                onChange={(e) => setDoctorSearchTerm(e.target.value)}
                className="search-field"
              />
            </div>

            <button
              type="button"
              className="btn-add-primary"
              onClick={() => {
                setDoctorFormError('');
                setIsNewDoctorModalOpen(true);
              }}
            >
              <Plus size={17} />
              <span>Cadastrar Novo Médico Laudista</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nome do Médico / Especialista</th>
                  <th>E-mail de Acesso</th>
                  <th>CRM / UF</th>
                  <th>Especialidade</th>
                  <th>Telefone / Contato</th>
                  <th>Status no CFM</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {doctorsList
                  .filter(d => 
                    d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
                    (d.crm && d.crm.includes(doctorSearchTerm)) ||
                    (d.email && d.email.toLowerCase().includes(doctorSearchTerm.toLowerCase())) ||
                    (d.specialty && d.specialty.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                  )
                  .map(d => {
                    const docLinkedCount = exams.filter(e => {
                      const isDoctorReport = e.report && (
                        e.report.doctorCrm === d.crm ||
                        (d.crm && e.report.doctorCrm?.includes(d.crm)) ||
                        e.report.doctorName.toLowerCase().includes(d.name.toLowerCase()) ||
                        d.name.toLowerCase().includes(e.report.doctorName.toLowerCase())
                      );
                      const isLocked = e.lockedByDoctor && (
                        (d.crm && e.lockedByDoctor.includes(d.crm)) ||
                        e.lockedByDoctor.toLowerCase().includes(d.name.toLowerCase())
                      );
                      return isDoctorReport || isLocked;
                    }).length;

                    return (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.name}</strong>
                        </td>
                        <td>{d.email}</td>
                        <td>
                          <code>CRM {d.crm}-{d.uf}</code>
                        </td>
                        <td>{d.specialty || 'Cardiologia'}</td>
                        <td>{d.phone || '—'}</td>
                        <td>
                          <span className="badge-status-ready">
                            <CheckCircle size={13} /> Regular
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="table-actions-group">
                            <button
                              type="button"
                              className="btn-table-edit"
                              onClick={() => handleOpenEditDoctor(d)}
                              title="Editar cadastro do médico"
                            >
                              <Pencil size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              className={`btn-table-delete ${docLinkedCount > 0 ? 'blocked' : ''}`}
                              onClick={() => handleRequestDeleteDoctor(d)}
                              title={
                                docLinkedCount > 0 
                                  ? `Não é possível excluir: existem ${docLinkedCount} laudo(s) ou exame(s) associado(s)` 
                                  : 'Excluir cadastro do médico'
                              }
                            >
                              <Trash2 size={13} />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba 3: Monitor Global de Exames */}
      {activeTab === 'exames_geral' && (
        <div className="table-card animate-fade-in">
          <div className="table-header-toolbar">
            <h3>Todos os Exames no Sistema em Tempo Real</h3>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Paciente</th>
                  <th>Clínica Solicitante</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Recebido em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.id}>
                    <td><code>{e.protocolNumber}</code></td>
                    <td><strong>{e.patient.name}</strong></td>
                    <td>{e.clinicName}</td>
                    <td>
                      <span className={`badge-priority ${e.priority.toLowerCase()}`}>
                        {e.priority}
                      </span>
                    </td>
                    <td>
                      {e.status === 'LAUDADO' ? (
                        <span className="badge-status-ready">Laudado</span>
                      ) : (
                        <span className="badge-status-waiting">{e.status}</span>
                      )}
                    </td>
                    <td>{formatDateTimeBR(e.receivedAt)}</td>
                    <td>
                      {e.status === 'LAUDADO' && (
                        <button
                          className="btn-action view"
                          onClick={() => onViewReport(e)}
                        >
                          Ver Laudo
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba 4: Trilha de Auditoria (LGPD e CFM) */}
      {activeTab === 'auditoria' && (
        <div className="table-card animate-fade-in">
          <div className="table-header-toolbar">
            <h3>Logs de Auditoria Imutáveis (LGPD & Resolução CFM nº 2.314/2022)</h3>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Data / Hora (Brasília)</th>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Ação Realizada</th>
                  <th>Registro / Protocolo</th>
                  <th>Endereço IP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatDateTimeBR(new Date(Date.now() - 5 * 60 * 1000).toISOString())}</td>
                  <td>Dr. Fernando Albuquerque</td>
                  <td>Médico Laudista</td>
                  <td><strong>ASSINATURA DIGITAL DO LAUDO</strong></td>
                  <td><code>ECG-2026-948102</code></td>
                  <td>187.32.19.45</td>
                </tr>
                <tr>
                  <td>{formatDateTimeBR(new Date(Date.now() - 25 * 60 * 1000).toISOString())}</td>
                  <td>Posto Central São Lucas</td>
                  <td>Clínica / Posto</td>
                  <td><strong>UPLOAD DE EXAME NATIVO (PDF)</strong></td>
                  <td><code>ECG-2026-481920</code></td>
                  <td>201.86.11.90</td>
                </tr>
                <tr>
                  <td>{formatDateTimeBR(new Date(Date.now() - 50 * 60 * 1000).toISOString())}</td>
                  <td>Gestor Clínico & Admin</td>
                  <td>Administrador</td>
                  <td><strong>CONSULTA AUDITORIA SLA</strong></td>
                  <td>Fila Geral</td>
                  <td>177.102.34.12</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Nova Clínica */}
      {isNewClinicModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-dialog" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Building2 size={22} className="text-primary" />
                <h3>Cadastrar Nova Unidade / Clínica</h3>
              </div>
              <button className="btn-close" onClick={() => setIsNewClinicModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateClinic} className="modal-body-form">
              {clinicFormError && (
                <div className="login-error-banner animate-fade-in" style={{ marginBottom: '1rem' }}>
                  {clinicFormError}
                </div>
              )}

              <div className="form-group">
                <label>Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clínica CardioVida Diagnósticos"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>E-mail de Acesso da Clínica *</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@clinicadiagnosticos.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Senha de Acesso da Clínica *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newSenha}
                    onChange={(e) => setNewSenha(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '-0.35rem', marginBottom: '0.85rem', display: 'block' }}>
                A clínica utilizará este e-mail e senha para acessar o portal e enviar exames para laudo.
              </small>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>CNES (Cadastro Nacional) *</label>
                  <input
                    type="text"
                    required
                    placeholder="7 dígitos (ex: 8492019)"
                    value={newCnes}
                    onChange={(e) => setNewCnes(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Telefone de Contato</label>
                  <input
                    type="text"
                    placeholder="(11) 3456-7890"
                    value={newTelefone}
                    onChange={(e) => setNewTelefone(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={newCidade}
                    onChange={(e) => setNewCidade(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Estado (UF)</label>
                  <select
                    value={newEstado}
                    onChange={(e) => setNewEstado(e.target.value)}
                    className="form-control"
                  >
                    {BRAZILIAN_UFS.map(uf => (
                      <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {clinicFormError && (
                <div className="login-error-banner animate-fade-in" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {clinicFormError}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsNewClinicModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingClinic} className="btn-primary-action">
                  {isSubmittingClinic ? 'Credenciando Unidade...' : 'Salvar e Credenciar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Novo Médico Laudista */}
      {isNewDoctorModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-dialog" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Stethoscope size={22} className="text-primary" />
                <h3>Cadastrar Novo Médico Laudista</h3>
              </div>
              <button className="btn-close" onClick={() => setIsNewDoctorModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateDoctor} className="modal-body-form">
              {doctorFormError && (
                <div className="login-error-banner animate-fade-in" style={{ marginBottom: '1rem' }}>
                  {doctorFormError}
                </div>
              )}

              <div className="form-group">
                <label>Nome Completo do Médico(a) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Silveira Mendes"
                  value={newDocNome}
                  onChange={(e) => setNewDocNome(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: juliana.mendes@amlaudos.com.br"
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Senha de Acesso do Médico *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newDocSenha}
                    onChange={(e) => setNewDocSenha(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '-0.35rem', marginBottom: '0.85rem', display: 'block' }}>
                O médico utilizará este e-mail e senha para fazer login na Central de Laudos.
              </small>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Número do CRM *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 148.920"
                    value={newDocCrm}
                    onChange={(e) => setNewDocCrm(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>UF do CRM *</label>
                  <select
                    value={newDocUf}
                    onChange={(e) => setNewDocUf(e.target.value)}
                    className="form-control"
                  >
                    {BRAZILIAN_UFS.map(uf => (
                      <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Especialidade Médica Principal</label>
                  <select
                    value={newDocEspecialidade}
                    onChange={(e) => setNewDocEspecialidade(e.target.value)}
                    className="form-control"
                  >
                    <option value="Cardiologia Clínica e Eletrofisiologia">Cardiologia Clínica e Eletrofisiologia</option>
                    <option value="Cardiologia Clínica">Cardiologia Clínica</option>
                    <option value="Eletrocardiografia de Alta Resolução">Eletrocardiografia de Alta Resolução</option>
                    <option value="Ergometria e Métodos Gráficos">Ergometria e Métodos Gráficos</option>
                    <option value="Ecocardiografia e Imagem Cardiovascular">Ecocardiografia e Imagem Cardiovascular</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Telefone / WhatsApp Profissional</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={newDocTelefone}
                    onChange={(e) => setNewDocTelefone(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              {doctorFormError && (
                <div className="login-error-banner animate-fade-in" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {doctorFormError}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsNewDoctorModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingDoctor} className="btn-primary-action">
                  {isSubmittingDoctor ? 'Cadastrando e Habilitando...' : 'Salvar e Habilitar Médico Laudista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Clínica */}
      {isEditClinicModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-dialog" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Building2 size={22} className="text-primary" />
                <h3>Editar Dados da Unidade / Clínica</h3>
              </div>
              <button className="btn-close" onClick={() => setIsEditClinicModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveEditClinic} className="modal-body-form">
              {editClinicError && (
                <div className="login-error-banner animate-fade-in" style={{ marginBottom: '1rem' }}>
                  {editClinicError}
                </div>
              )}

              <div className="form-group">
                <label>Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clínica CardioVida Diagnósticos"
                  value={editClinicNome}
                  onChange={(e) => setEditClinicNome(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>E-mail de Acesso da Clínica *</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@clinicadiagnosticos.com.br"
                    value={editClinicEmail}
                    onChange={(e) => setEditClinicEmail(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>CNES (Cadastro Nacional) *</label>
                  <input
                    type="text"
                    required
                    placeholder="7 dígitos (ex: 8492019)"
                    value={editClinicCnes}
                    onChange={(e) => setEditClinicCnes(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={editClinicCidade}
                    onChange={(e) => setEditClinicCidade(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Estado (UF)</label>
                  <select
                    value={editClinicEstado}
                    onChange={(e) => setEditClinicEstado(e.target.value)}
                    className="form-control"
                  >
                    {BRAZILIAN_UFS.map(uf => (
                      <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Telefone de Contato</label>
                  <input
                    type="text"
                    placeholder="(11) 3456-7890"
                    value={editClinicTelefone}
                    onChange={(e) => setEditClinicTelefone(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Status do Credenciamento</label>
                  <select
                    value={editClinicAtivo ? 'true' : 'false'}
                    onChange={(e) => setEditClinicAtivo(e.target.value === 'true')}
                    className="form-control"
                  >
                    <option value="true">Ativa no Sistema</option>
                    <option value="false">Inativa / Suspensa</option>
                  </select>
                </div>
              </div>

              {editClinicError && (
                <div className="login-error-banner animate-fade-in" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {editClinicError}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditClinicModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingEditClinic} className="btn-primary-action">
                  {isSubmittingEditClinic ? 'Salvando Alterações...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Médico Laudista */}
      {isEditDoctorModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-dialog" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Stethoscope size={22} className="text-primary" />
                <h3>Editar Cadastro do Médico Laudista</h3>
              </div>
              <button className="btn-close" onClick={() => setIsEditDoctorModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveEditDoctor} className="modal-body-form">
              {editDoctorError && (
                <div className="login-error-banner animate-fade-in" style={{ marginBottom: '1rem' }}>
                  {editDoctorError}
                </div>
              )}

              <div className="form-group">
                <label>Nome Completo do Médico(a) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Silveira Mendes"
                  value={editDocNome}
                  onChange={(e) => setEditDocNome(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: juliana.mendes@amlaudos.com.br"
                    value={editDocEmail}
                    onChange={(e) => setEditDocEmail(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Telefone / WhatsApp Profissional</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={editDocTelefone}
                    onChange={(e) => setEditDocTelefone(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Número do CRM *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 148.920"
                    value={editDocCrm}
                    onChange={(e) => setEditDocCrm(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>UF do CRM *</label>
                  <select
                    value={editDocUf}
                    onChange={(e) => setEditDocUf(e.target.value)}
                    className="form-control"
                  >
                    {BRAZILIAN_UFS.map(uf => (
                      <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Especialidade Médica Principal</label>
                <select
                  value={editDocEspecialidade}
                  onChange={(e) => setEditDocEspecialidade(e.target.value)}
                  className="form-control"
                >
                  <option value="Cardiologia Clínica e Eletrofisiologia">Cardiologia Clínica e Eletrofisiologia</option>
                  <option value="Cardiologia Clínica">Cardiologia Clínica</option>
                  <option value="Eletrocardiografia de Alta Resolução">Eletrocardiografia de Alta Resolução</option>
                  <option value="Ergometria e Métodos Gráficos">Ergometria e Métodos Gráficos</option>
                  <option value="Ecocardiografia e Imagem Cardiovascular">Ecocardiografia e Imagem Cardiovascular</option>
                </select>
              </div>

              {editDoctorError && (
                <div className="login-error-banner animate-fade-in" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {editDoctorError}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditDoctorModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingEditDoctor} className="btn-primary-action">
                  {isSubmittingEditDoctor ? 'Salvando Alterações...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação ou Bloqueio de Exclusão */}
      {deleteModalData.isOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-dialog" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                {deleteModalData.canDelete ? (
                  <Trash2 size={22} style={{ color: '#dc2626' }} />
                ) : (
                  <AlertTriangle size={22} style={{ color: '#d97706' }} />
                )}
                <h3>
                  {deleteModalData.canDelete
                    ? `Confirmar Exclusão de ${deleteModalData.type === 'CLINICA' ? 'Clínica' : 'Médico'}`
                    : 'Exclusão Não Permitida'}
                </h3>
              </div>
              <button
                className="btn-close"
                onClick={() => setDeleteModalData(prev => ({ ...prev, isOpen: false }))}
              >
                ×
              </button>
            </div>

            <div className="modal-body-form" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!deleteModalData.canDelete ? (
                /* Caso Bloqueado: Existem dados vinculados */
                <>
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '1rem',
                    color: '#92400e',
                    fontSize: '0.875rem',
                    lineHeight: '1.45'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#b45309' }}>
                      Não é possível excluir este cadastro
                    </strong>
                    O cadastro de <strong>{deleteModalData.name}</strong> ({deleteModalData.detail}) possui{' '}
                    <strong>{deleteModalData.linkedCount} exame(s)/laudo(s) associado(s)</strong> a ele no sistema.
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    Por exigência do CFM e normas de conformidade LGPD, unidades ou profissionais que possuem histórico médico registrado não podem ser excluídos, a fim de preservar a validade jurídica e a rastreabilidade dos laudos já emitidos.
                  </p>

                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#475569'
                  }}>
                    💡 <strong>O que fazer?</strong> Caso a clínica ou o médico não deva mais realizar atendimentos, você pode <strong>inativar o cadastro</strong> clicando no botão <strong>Editar</strong>.
                  </div>

                  <div className="modal-footer" style={{ marginTop: '0.5rem', padding: 0 }}>
                    <button
                      type="button"
                      className="btn-primary-action"
                      style={{ width: '100%' }}
                      onClick={() => setDeleteModalData(prev => ({ ...prev, isOpen: false }))}
                    >
                      Entendido
                    </button>
                  </div>
                </>
              ) : (
                /* Caso Permitido: Sem dados vinculados */
                <>
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '1rem',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    lineHeight: '1.45'
                  }}>
                    Tem certeza que deseja excluir permanentemente o cadastro de{' '}
                    <strong>{deleteModalData.name}</strong> ({deleteModalData.detail})?
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    Esta unidade/profissional não possui nenhum exame ou laudo associado. Esta ação é definitiva e removerá todos os dados e credenciais de acesso vinculados.
                  </p>

                  <div className="modal-footer" style={{ marginTop: '0.5rem', padding: 0 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setDeleteModalData(prev => ({ ...prev, isOpen: false }))}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      className="btn-primary-action"
                      style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
                      onClick={handleConfirmDelete}
                    >
                      {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
