import { useState, useEffect } from 'react';
import type { Exam, Clinic, Report, UserProfile } from './types';
import { INITIAL_CLINICS, INITIAL_EXAMS } from './data/mockData';
import { DEMO_USERS } from './data/mockUsers';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/Auth/LoginPage';
import { Header } from './components/Header';
import { DemandQueue } from './components/LaudistaPortal/DemandQueue';
import { ClinicDashboard } from './components/ClinicPortal/ClinicDashboard';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { ReportEditor } from './components/Editor/ReportEditor';
import { ExamUploadModal } from './components/ClinicPortal/ExamUploadModal';
import { ReportViewModal } from './components/ReportViewModal';
import { generateLaudoPdf } from './utils/pdfGenerator';
import { supabase, isSupabaseConfigured } from './services/supabase';
import './App.css';

function MainAppContent() {
  const { isAuthenticated, currentUser, role } = useAuth();

  // Limpar dados de teste antigos do storage ao inicializar
  useEffect(() => {
    localStorage.removeItem('am_laudos_clinics_v1');
    localStorage.removeItem('am_laudos_doctors_v1');
    localStorage.removeItem('am_laudos_exams_v1');
  }, []);

  const [clinics, setClinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('am_laudos_clinics_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao restaurar clínicas locais:', e);
      }
    }
    return INITIAL_CLINICS;
  });

  const [doctors, setDoctors] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('am_laudos_doctors_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao restaurar médicos locais:', e);
      }
    }
    return DEMO_USERS.filter(u => u.role === 'MEDICO_LAUDISTA');
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('am_laudos_exams_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao restaurar exames locais:', e);
      }
    }
    return INITIAL_EXAMS;
  });

  // Modo de visualização do Administrador (permite ao Admin alternar entre telas)
  const [adminView, setAdminView] = useState<'admin' | 'laudista' | 'clinica'>('admin');

  // Visão estrita e inegociável por perfil:
  // - MEDICO_LAUDISTA: visualiza ESTRITAMENTE a Central de Laudos ('laudista')
  // - TECNICO_CLINICA: visualiza ESTRITAMENTE o Portal das Clínicas ('clinica')
  // - ADMIN: pode alternar conforme adminView
  const currentView: 'laudista' | 'clinica' | 'admin' = (() => {
    if (role === 'MEDICO_LAUDISTA') return 'laudista';
    if (role === 'TECNICO_CLINICA') return 'clinica';
    if (role === 'ADMIN') return adminView;
    return 'laudista';
  })();

  const [selectedExamToReport, setSelectedExamToReport] = useState<Exam | null>(null);
  const [viewingReportExam, setViewingReportExam] = useState<Exam | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [initialUploadFiles, setInitialUploadFiles] = useState<File[]>([]);

  // Sincronizar exames no localStorage (remove fileDataUrl para nunca exceder cota do localStorage)
  useEffect(() => {
    try {
      const sanitizedExams = exams.map(e => {
        const { fileDataUrl, ...rest } = e;
        return rest;
      });
      localStorage.setItem('am_laudos_exams_v2', JSON.stringify(sanitizedExams));
    } catch (e) {
      console.warn('Aviso ao sincronizar exames no localStorage:', e);
    }
  }, [exams]);

  // Sincronizar clínicas no localStorage
  useEffect(() => {
    localStorage.setItem('am_laudos_clinics_v2', JSON.stringify(clinics));
  }, [clinics]);

  // Sincronizar médicos no localStorage
  useEffect(() => {
    localStorage.setItem('am_laudos_doctors_v2', JSON.stringify(doctors));
  }, [doctors]);

  // Carregar dados reais do Supabase ao iniciar
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Carregar clínicas do banco
    supabase
      .from('clinicas')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const remoteClinics: Clinic[] = data.map((c: any) => ({
            id: c.id,
            name: c.nome,
            cnes: c.cnes,
            city: c.cidade,
            state: c.estado,
            phone: c.telefone || '(11) 3000-0000',
            email: c.email,
            active: c.ativo !== false
          }));
          setClinics(remoteClinics);
        }
      });

    // Carregar médicos cadastrados do banco
    supabase
      .from('perfis')
      .select('*')
      .eq('tipo', 'MEDICO_LAUDISTA')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const savedDocs: UserProfile[] = (() => {
            try {
              return JSON.parse(localStorage.getItem('am_laudos_doctors_v2') || '[]');
            } catch {
              return [];
            }
          })();

          const remoteDocs: UserProfile[] = data.map((p: any) => {
            const matchedSaved = savedDocs.find(s => s.id === p.id || (s.crm && s.crm === p.crm));
            return {
              id: p.id,
              name: p.nome_completo,
              email: matchedSaved?.email || p.email || 'medico@amlaudos.com.br',
              role: 'MEDICO_LAUDISTA',
              crm: p.crm || '',
              uf: p.uf_crm || 'SP',
              specialty: p.especialidade || 'Cardiologia Clínica',
              phone: p.telefone || matchedSaved?.phone
            };
          });
          setDoctors(remoteDocs);
        }
      });
  }, []);

  // Ajustar visão inicial do Admin ao logar
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role === 'ADMIN') {
      setAdminView('admin');
    }
    setSelectedExamToReport(null);
  }, [role, isAuthenticated]);

  // Handler de abertura de upload (com suporte a arquivos pré-selecionados) - NUNCA para Médicos
  const handleOpenUpload = (files?: File[]) => {
    if (role === 'MEDICO_LAUDISTA') return; // Bloqueio estrito: Médicos não realizam envio de exames
    if (files && files.length > 0) {
      setInitialUploadFiles(files);
    } else {
      setInitialUploadFiles([]);
    }
    setIsUploadModalOpen(true);
  };

  // Handler de criação de novo(s) exame(s) via upload
  const handleExamCreated = (newExam: Exam | Exam[]) => {
    if (Array.isArray(newExam)) {
      setExams(prev => [...newExam, ...prev]);
    } else {
      setExams(prev => [newExam, ...prev]);
    }
  };

  // Handler de cadastro de nova clínica pelo Admin
  const handleAddClinic = (newClinic: Clinic) => {
    setClinics(prev => [...prev, newClinic]);
  };

  // Handler de atualização de clínica existente pelo Admin
  const handleUpdateClinic = (updatedClinic: Clinic) => {
    setClinics(prev => prev.map(c => c.id === updatedClinic.id ? updatedClinic : c));
  };

  // Handler de exclusão de clínica pelo Admin
  const handleDeleteClinic = (clinicId: string) => {
    setClinics(prev => prev.filter(c => c.id !== clinicId));
  };

  // Handler de cadastro de novo médico laudista pelo Admin
  const handleAddDoctor = (newDoctor: UserProfile) => {
    setDoctors(prev => {
      const idx = prev.findIndex(d => d.id === newDoctor.id || (d.crm && d.crm === newDoctor.crm && d.uf === newDoctor.uf));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newDoctor };
        return updated;
      }
      return [...prev, newDoctor];
    });
  };

  // Handler de atualização de médico existente pelo Admin
  const handleUpdateDoctor = (updatedDoctor: UserProfile) => {
    setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
  };

  // Handler de exclusão de médico laudista pelo Admin
  const handleDeleteDoctor = (doctorId: string) => {
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
  };

  // Abrir editor para laudar (Apenas Médicos ou Admin)
  const handleSelectExamToReport = (exam: Exam) => {
    if (role !== 'MEDICO_LAUDISTA' && role !== 'ADMIN') return; // Bloqueio estrito: Clínicas não laudam exames
    const doctorLabel = currentUser?.role === 'MEDICO_LAUDISTA'
      ? `${currentUser.name} (CRM ${currentUser.crm}-${currentUser.uf})`
      : 'Dr. Fernando Albuquerque (CRM 112.540-SP)';

    if (exam.status === 'PENDENTE') {
      const updated = exams.map(e => e.id === exam.id ? { ...e, status: 'EM_ANALISE' as const, lockedByDoctor: doctorLabel } : e);
      setExams(updated);
      setSelectedExamToReport({ ...exam, status: 'EM_ANALISE', lockedByDoctor: doctorLabel });
    } else {
      setSelectedExamToReport(exam);
    }
  };

  // Salvar laudo e assinatura
  const handleSaveReportAndSign = (examId: string, report: Report) => {
    const updated = exams.map(e => {
      if (e.id === examId) {
        return {
          ...e,
          status: 'LAUDADO' as const,
          report,
          remainingMinutes: 0
        };
      }
      return e;
    });

    setExams(updated);
    const completedExam = updated.find(e => e.id === examId);
    setSelectedExamToReport(null);

    if (completedExam) {
      setViewingReportExam(completedExam);
    }
  };

  // Download do PDF oficial
  const handleDownloadPdf = (exam: Exam) => {
    if (!exam.report) return;
    const doc = generateLaudoPdf(exam, exam.report);
    doc.save(`AM_Laudos_${exam.patient.name.replace(/\s+/g, '_')}_${exam.protocolNumber}.pdf`);
  };

  // Visualizar laudo
  const handleViewReport = (exam: Exam) => {
    setViewingReportExam(exam);
  };

  // Se o usuário não estiver autenticado, exibe a tela de Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="telemed-app">
      {/* Header Fixo Global */}
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          setSelectedExamToReport(null);
          // Apenas o Administrador pode alternar entre telas de outros perfis
          if (role === 'ADMIN') {
            setAdminView(view);
          }
        }}
        exams={exams}
        onOpenUpload={() => handleOpenUpload()}
      />

      {/* Conteúdo Principal com Blindagem Estrita */}
      <main className="main-content-layout">
        {selectedExamToReport && (role === 'MEDICO_LAUDISTA' || role === 'ADMIN') ? (
          <ReportEditor
            exam={selectedExamToReport}
            onBackToQueue={() => setSelectedExamToReport(null)}
            onSaveReportAndSign={handleSaveReportAndSign}
          />
        ) : (
          <>
            {/* 1. Painel Administrativo: APENAS ADMIN */}
            {role === 'ADMIN' && currentView === 'admin' && (
              <AdminDashboard
                clinics={clinics}
                exams={exams}
                doctors={doctors}
                onAddClinic={handleAddClinic}
                onUpdateClinic={handleUpdateClinic}
                onDeleteClinic={handleDeleteClinic}
                onAddDoctor={handleAddDoctor}
                onUpdateDoctor={handleUpdateDoctor}
                onDeleteDoctor={handleDeleteDoctor}
                onViewReport={handleViewReport}
              />
            )}

            {/* 2. Central de Laudos: APENAS Médicos Laudistas (e Admin em modo auditoria) */}
            {(role === 'MEDICO_LAUDISTA' || (role === 'ADMIN' && currentView === 'laudista')) && (
              <DemandQueue
                exams={exams}
                onSelectExamToReport={handleSelectExamToReport}
                onViewFinishedReport={handleViewReport}
              />
            )}

            {/* 3. Portal das Clínicas: APENAS Clínicas (e Admin em modo auditoria) */}
            {(role === 'TECNICO_CLINICA' || (role === 'ADMIN' && currentView === 'clinica')) && (
              <ClinicDashboard
                exams={
                  // Se for clínica, filtra rigorosamente apenas os exames pertencentes à respectiva clínica logada
                  role === 'TECNICO_CLINICA'
                    ? exams.filter(e => {
                        if (currentUser?.clinicId && e.clinicId === currentUser.clinicId) return true;
                        if (currentUser?.clinicName && e.clinicName?.toLowerCase() === currentUser.clinicName.toLowerCase()) return true;
                        if (currentUser?.name && e.clinicName?.toLowerCase() === currentUser.name.toLowerCase()) return true;
                        return false;
                      })
                    : exams
                }
                onOpenUpload={handleOpenUpload}
                onViewReport={handleViewReport}
                onDownloadPdf={handleDownloadPdf}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de Captura e Upload */}
      <ExamUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setInitialUploadFiles([]);
        }}
        clinics={clinics}
        initialFiles={initialUploadFiles}
        onExamCreated={handleExamCreated}
      />

      {/* Modal de Visualização de Laudo e Exportação */}
      <ReportViewModal
        isOpen={!!viewingReportExam}
        onClose={() => setViewingReportExam(null)}
        exam={viewingReportExam}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
