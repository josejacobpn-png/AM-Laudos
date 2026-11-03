import React, { useState, useRef } from 'react';
import { 
  Building2, 
  UploadCloud, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download, 
  Eye, 
  Share2, 
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import type { Exam } from '../../types';
import { formatDateTimeBR } from '../../utils/cryptoSim';

interface ClinicDashboardProps {
  exams: Exam[];
  onOpenUpload: (preselectedFiles?: File[]) => void;
  onViewReport: (exam: Exam) => void;
  onDownloadPdf: (exam: Exam) => void;
}

export const ClinicDashboard: React.FC<ClinicDashboardProps> = ({
  exams,
  onOpenUpload,
  onViewReport,
  onDownloadPdf
}) => {
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'LAUDADO'>('ALL');

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.patient.cpf.includes(searchTerm);
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  const totalExams = exams.length;
  const readyExams = exams.filter(e => e.status === 'LAUDADO').length;
  const pendingExams = exams.filter(e => e.status === 'PENDENTE' || e.status === 'EM_ANALISE').length;

  const handleShareWhatsApp = (exam: Exam) => {
    const text = encodeURIComponent(
      `Olá ${exam.patient.name}, seu laudo eletrocardiográfico (Protocolo ${exam.protocolNumber}) já foi emitido pelo cardiologista com assinatura digital e está disponível para download.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleQuickUploadClick = () => {
    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = '';
      quickFileInputRef.current.click();
    } else {
      onOpenUpload();
    }
  };

  const handleQuickFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="clinic-portal-wrap">
      {/* Input de arquivo invisível para agilizar abertura imediata da pasta C:\Laudos */}
      <input
        type="file"
        ref={quickFileInputRef}
        multiple
        accept=".pdf,.xml,.dicom,.dcm,.scp,.edf,.jpg,.png"
        style={{ display: 'none' }}
        onChange={handleQuickFileSelect}
      />

      {/* Banner de Boas-Vindas da Unidade de Coleta */}
      <div className="clinic-hero-card">
        <div className="clinic-hero-content">
          <div className="clinic-badge-icon">
            <Building2 size={28} />
          </div>
          <div>
            <h2>Portal do Posto de Coleta & Clínica</h2>
            <p>Upload centralizado de exames e recepção imediata de laudos assinados digitalmente</p>
          </div>
        </div>

        <div className="clinic-hero-actions-container">
          <button className="btn-hero-upload" onClick={handleQuickUploadClick} title="Abre a janela de arquivos direto para escolher em C:\Laudos">
            <UploadCloud size={20} />
            <span>Carregar Novo Exame</span>
          </button>
          <div className="clinic-hero-sublinks">
            <span className="clinic-path-badge" title="Pasta padrão para onde os equipamentos exportam os exames">
              <FolderOpen size={13} />
              Pasta: <strong>C:\Laudos</strong>
            </span>
            <button
              type="button"
              className="btn-link-manual"
              onClick={() => onOpenUpload()}
              title="Abrir tela de cadastro sem selecionar arquivo agora"
            >
              Ou preencher manual
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <FileText size={22} />
          </div>
          <div>
            <span className="metric-value">{totalExams}</span>
            <span className="metric-label">Exames Enviados</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon yellow">
            <Clock size={22} />
          </div>
          <div>
            <span className="metric-value">{pendingExams}</span>
            <span className="metric-label">Na Fila de Laudo</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="metric-value">{readyExams}</span>
            <span className="metric-label">Laudos Liberados</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon teal">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="metric-value">100%</span>
            <span className="metric-label">Laudos Assinados</span>
          </div>
        </div>
      </div>

      {/* Filtros e Tabela de Exames */}
      <div className="table-card">
        <div className="table-header-toolbar">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por paciente, CPF ou número de protocolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
            />
          </div>

          <div className="filter-pill-group">
            <button
              className={`pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({totalExams})
            </button>
            <button
              className={`pill-btn ${statusFilter === 'PENDENTE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDENTE')}
            >
              Aguardando ({pendingExams})
            </button>
            <button
              className={`pill-btn ${statusFilter === 'LAUDADO' ? 'active' : ''}`}
              onClick={() => setStatusFilter('LAUDADO')}
            >
              Prontos ({readyExams})
            </button>
          </div>
        </div>

        {/* Lista de Exames */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Protocolo / Envio</th>
                <th>Paciente</th>
                <th>Prioridade</th>
                <th>Clínica de Origem</th>
                <th>Status do Laudo</th>
                <th>Médico Responsável</th>
                <th style={{ textAlign: 'right' }}>Ações / Entrega</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-state">
                    Nenhum exame encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredExams.map(exam => {
                  const isReady = exam.status === 'LAUDADO';
                  return (
                    <tr key={exam.id} className={isReady ? 'row-ready' : ''}>
                      <td>
                        <div className="protocol-cell">
                          <strong>{exam.protocolNumber}</strong>
                          <small>{formatDateTimeBR(exam.receivedAt)}</small>
                        </div>
                      </td>

                      <td>
                        <div className="patient-cell">
                          <strong>{exam.patient.name}</strong>
                          <small>{exam.patient.age} anos • CPF: {exam.patient.cpf}</small>
                        </div>
                      </td>

                      <td>
                        <span className={`badge-priority ${exam.priority.toLowerCase()}`}>
                          {exam.priority}
                        </span>
                      </td>

                      <td>
                        <div className="clinic-cell">
                          <span>{exam.clinicName}</span>
                          <small>{exam.fileName}</small>
                        </div>
                      </td>

                      <td>
                        {isReady ? (
                          <span className="badge-status-ready">
                            <CheckCircle2 size={14} /> Laudo Disponível
                          </span>
                        ) : (
                          <span className="badge-status-waiting">
                            <Clock size={14} /> Na Fila de Triagem
                          </span>
                        )}
                      </td>

                      <td>
                        {exam.report ? (
                          <div className="doctor-cell">
                            <strong>{exam.report.doctorName}</strong>
                            <small>CRM {exam.report.doctorCrm}-{exam.report.doctorUf}</small>
                          </div>
                        ) : (
                          <span className="text-muted">Aguardando atribuição</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="action-button-group">
                          {isReady ? (
                            <>
                              <button
                                className="btn-action view"
                                title="Visualizar laudo completo na tela"
                                onClick={() => onViewReport(exam)}
                              >
                                <Eye size={16} />
                                <span>Ver Laudo</span>
                              </button>

                              <button
                                className="btn-action download"
                                title="Baixar PDF de alta resolução com assinatura digital"
                                onClick={() => onDownloadPdf(exam)}
                              >
                                <Download size={16} />
                                <span>PDF</span>
                              </button>

                              <button
                                className="btn-action share"
                                title="Compartilhar via WhatsApp com o paciente"
                                onClick={() => handleShareWhatsApp(exam)}
                              >
                                <Share2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="waiting-tag">
                              Processando SLA ({exam.slaMinutesTotal}m)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
