import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Stethoscope, 
  FileCheck, 
  Flame, 
  Eye, 
  Edit3, 
  Heart,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import type { Exam, Priority } from '../../types';
import { formatDateTimeBR } from '../../utils/cryptoSim';

interface DemandQueueProps {
  exams: Exam[];
  onSelectExamToReport: (exam: Exam) => void;
  onViewFinishedReport: (exam: Exam) => void;
}

export const DemandQueue: React.FC<DemandQueueProps> = ({
  exams,
  onSelectExamToReport,
  onViewFinishedReport
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING_OR_ANALYSIS' | 'ALL' | 'LAUDADO'>('PENDING_OR_ANALYSIS');
  const [searchTerm, setSearchTerm] = useState('');

  // Ordenação inteligente: Emergência primeiro, depois Urgência, depois Eletivo; e mais antigos primeiro dentro do mesmo grupo
  const priorityWeight = {
    EMERGENCIA: 1,
    URGENCIA: 2,
    ELETIVO: 3
  };

  const sortedAndFilteredExams = [...exams]
    .filter(e => {
      // Filtro de status
      if (statusFilter === 'PENDING_OR_ANALYSIS') {
        if (e.status === 'LAUDADO') return false;
      } else if (statusFilter === 'LAUDADO') {
        if (e.status !== 'LAUDADO') return false;
      }

      // Filtro de prioridade
      if (priorityFilter !== 'ALL' && e.priority !== priorityFilter) return false;

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = e.patient.name.toLowerCase().includes(q) ||
                        e.protocolNumber.toLowerCase().includes(q) ||
                        e.patient.symptoms.toLowerCase().includes(q) ||
                        e.clinicName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Se um é laudado e outro não
      if (a.status === 'LAUDADO' && b.status !== 'LAUDADO') return 1;
      if (b.status === 'LAUDADO' && a.status !== 'LAUDADO') return -1;

      // Ordenar por prioridade (1, 2, 3)
      const pDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (pDiff !== 0) return pDiff;

      // Por data de recebimento (mais antigos primeiro - FIFO)
      return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
    });

  // Métricas para os cards de estatísticas
  const pendingCount = exams.filter(e => e.status === 'PENDENTE').length;
  const criticalCount = exams.filter(e => e.status === 'PENDENTE' && e.priority === 'EMERGENCIA').length;
  const inProgressCount = exams.filter(e => e.status === 'EM_ANALISE').length;
  const finishedCount = exams.filter(e => e.status === 'LAUDADO').length;

  return (
    <div className="laudista-queue-wrap">
      {/* Cards de Métricas em Tempo Real */}
      <div className="metrics-grid">
        <div className={`metric-card ${criticalCount > 0 ? 'critical-glow' : ''}`}>
          <div className="metric-icon red">
            <Flame size={24} />
          </div>
          <div>
            <span className="metric-value red-text">{criticalCount}</span>
            <span className="metric-label">Emergências Críticas (&lt;15m)</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon blue">
            <Clock size={24} />
          </div>
          <div>
            <span className="metric-value">{pendingCount}</span>
            <span className="metric-label">Fila Geral Aguardando</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon yellow">
            <Edit3 size={24} />
          </div>
          <div>
            <span className="metric-value">{inProgressCount}</span>
            <span className="metric-label">Em Análise / Aberto</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <FileCheck size={24} />
          </div>
          <div>
            <span className="metric-value">{finishedCount}</span>
            <span className="metric-label">Laudados Hoje</span>
          </div>
        </div>
      </div>

      {/* Barra de Ferramentas e Filtros Inteligentes */}
      <div className="queue-controls-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por paciente, sintoma (ex: dor precordial, palpitação), protocolo ou clínica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="queue-filters">
          <div className="filter-group">
            <span className="filter-title">Visualizar:</span>
            <button
              className={`filter-btn ${statusFilter === 'PENDING_OR_ANALYSIS' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDING_OR_ANALYSIS')}
            >
              Fila Ativa ({pendingCount + inProgressCount})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({exams.length})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'LAUDADO' ? 'active' : ''}`}
              onClick={() => setStatusFilter('LAUDADO')}
            >
              Concluídos ({finishedCount})
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-title">Prioridade:</span>
            <button
              className={`filter-btn ${priorityFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('ALL')}
            >
              Todas
            </button>
            <button
              className={`filter-btn red ${priorityFilter === 'EMERGENCIA' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('EMERGENCIA')}
            >
              Emergência
            </button>
            <button
              className={`filter-btn yellow ${priorityFilter === 'URGENCIA' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('URGENCIA')}
            >
              Urgência
            </button>
            <button
              className={`filter-btn green ${priorityFilter === 'ELETIVO' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('ELETIVO')}
            >
              Eletivo
            </button>
          </div>
        </div>
      </div>

      {/* Lista Inteligente de Demandas */}
      <div className="queue-items-list">
        {sortedAndFilteredExams.length === 0 ? (
          <div className="empty-queue-box">
            <Heart size={44} className="text-muted" />
            <h3>Nenhum exame na fila para os filtros selecionados</h3>
            <p>A fila de trabalho está em dia ou não há itens correspondentes aos critérios de busca.</p>
          </div>
        ) : (
          sortedAndFilteredExams.map((exam) => {
            const isEmergency = exam.priority === 'EMERGENCIA';
            const isDone = exam.status === 'LAUDADO';

            return (
              <div
                key={exam.id}
                className={`queue-card ${isEmergency && !isDone ? 'card-emergency' : ''} ${isDone ? 'card-finished' : ''}`}
              >
                {/* Faixa Lateral de Prioridade */}
                <div className={`priority-stripe ${exam.priority.toLowerCase()}`} />

                <div className="queue-card-main">
                  {/* Topo do Card: Protocolo, Clínica e SLA */}
                  <div className="card-top-meta">
                    <div className="meta-left">
                      <span className="protocol-chip">{exam.protocolNumber}</span>
                      <span className="clinic-chip">
                        <Building size={13} /> {exam.clinicName}
                      </span>
                      <span className="time-chip">
                        <Clock size={13} /> Recebido: {formatDateTimeBR(exam.receivedAt)}
                      </span>
                    </div>

                    <div className="meta-right">
                      <span className={`priority-badge ${exam.priority.toLowerCase()}`}>
                        {isEmergency && <Flame size={14} />}
                        {exam.priority} (SLA &le; {exam.slaMinutesTotal} min)
                      </span>
                    </div>
                  </div>

                  {/* Dados Centrais do Paciente e Sintomas */}
                  <div className="card-patient-body">
                    <div className="patient-main-info">
                      <h3 className="patient-name">{exam.patient.name}</h3>
                      <div className="patient-details-row">
                        <span><strong>Idade:</strong> {exam.patient.age} anos</span>
                        <span>•</span>
                        <span><strong>Sexo:</strong> {exam.patient.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                        <span>•</span>
                        <span><strong>PA:</strong> {exam.patient.bloodPressure || 'Não aferida'}</span>
                        <span>•</span>
                        <span><strong>Arquivo:</strong> {exam.fileName} ({exam.fileSize})</span>
                      </div>
                    </div>

                    {/* Sintomas / Motivo do Exame */}
                    <div className={`symptoms-box ${isEmergency ? 'emergency-symptom' : ''}`}>
                      <span className="symptom-tag-title">INDICAÇÃO / SINTOMA:</span>
                      <p>{exam.patient.symptoms}</p>
                    </div>

                    {exam.patient.medications && (
                      <div className="meds-row">
                        <span className="text-muted">Medicamentos:</span> {exam.patient.medications}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloco de Ações do Card */}
                <div className="queue-card-actions">
                  {isDone ? (
                    <div className="card-finished-actions">
                      <div className="finished-badge">
                        <ShieldCheck size={16} /> Laudado & Assinado
                      </div>
                      <button
                        className="btn-view-report"
                        onClick={() => onViewFinishedReport(exam)}
                      >
                        <Eye size={17} />
                        <span>Ver Laudo / PDF</span>
                      </button>
                    </div>
                  ) : (
                    <div className="card-pending-actions">
                      {exam.lockedByDoctor && (
                        <div className="lock-notice">
                          <span>{exam.lockedByDoctor}</span>
                        </div>
                      )}
                      <button
                        className={`btn-start-report ${isEmergency ? 'btn-report-emergency' : ''}`}
                        onClick={() => onSelectExamToReport(exam)}
                      >
                        <Stethoscope size={18} />
                        <span>{exam.status === 'EM_ANALISE' ? 'Continuar Laudo' : 'Abrir para Laudar'}</span>
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
