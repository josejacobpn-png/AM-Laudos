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
import { PublicValidator } from './components/PublicValidator';
import { generateLaudoPdf } from './utils/pdfGenerator';
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

  // Visão padrão com base no perfil do usuário logado
  const [currentView, setCurrentView] = useState<'laudista' | 'clinica' | 'admin' | 'validador'>('admin');
  const [selectedExamToReport, setSelectedExamToReport] = useState<Exam | null>(null);
  const [viewingReportExam, setViewingReportExam] = useState<Exam | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [initialUploadFiles, setInitialUploadFiles] = useState<File[]>([]);

  // Sincronizar exames no localStorage
  useEffect(() => {
    localStorage.setItem('am_laudos_exams_v2', JSON.stringify(exams));
  }, [exams]);

  // Sincronizar clínicas no localStorage
  useEffect(() => {
    localStorage.setItem('am_laudos_clinics_v2', JSON.stringify(clinics));
  }, [clinics]);

  // Sincronizar médicos no localStorage
  useEffect(() => {
    localStorage.setItem('am_laudos_doctors_v2', JSON.stringify(doctors));
  }, [doctors]);

  // Ajustar visão inicial ao logar ou mudar de perfil
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role === 'ADMIN') {
      setCurrentView('admin');
    } else if (role === 'TECNICO_CLINICA') {
      setCurrentView('clinica');
    } else {
      setCurrentView('laudista');
    }
    setSelectedExamToReport(null);
  }, [role, isAuthenticated]);

  // Handler de abertura de upload (com suporte a arquivos pré-selecionados)
  const handleOpenUpload = (files?: File[]) => {
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
    setDoctors(prev => [...prev, newDoctor]);
  };

  // Handler de atualização de médico existente pelo Admin
  const handleUpdateDoctor = (updatedDoctor: UserProfile) => {
    setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
  };

  // Handler de exclusão de médico laudista pelo Admin
  const handleDeleteDoctor = (doctorId: string) => {
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
  };

  // Abrir editor para laudar
  const handleSelectExamToReport = (exam: Exam) => {
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
          setCurrentView(view);
        }}
        exams={exams}
        onOpenUpload={() => handleOpenUpload()}
      />

      {/* Conteúdo Principal */}
      <main className="main-content-layout">
        {selectedExamToReport ? (
          <ReportEditor
            exam={selectedExamToReport}
            onBackToQueue={() => setSelectedExamToReport(null)}
            onSaveReportAndSign={handleSaveReportAndSign}
          />
        ) : (
          <>
            {currentView === 'admin' && (
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

            {currentView === 'laudista' && (
              <DemandQueue
                exams={exams}
                onSelectExamToReport={handleSelectExamToReport}
                onViewFinishedReport={handleViewReport}
              />
            )}

            {currentView === 'clinica' && (
              <ClinicDashboard
                exams={
                  // Se for clínica, filtra pelos exames da própria clínica
                  role === 'TECNICO_CLINICA' && currentUser?.clinicId
                    ? exams.filter(e => e.clinicId === currentUser.clinicId)
                    : exams
                }
                onOpenUpload={handleOpenUpload}
                onViewReport={handleViewReport}
                onDownloadPdf={handleDownloadPdf}
              />
            )}

            {currentView === 'validador' && (
              <PublicValidator
                exams={exams}
                onViewReport={handleViewReport}
                onDownloadPdf={handleDownloadPdf}
                onBackToLogin={!isAuthenticated ? () => setCurrentView('laudista') : undefined}
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
