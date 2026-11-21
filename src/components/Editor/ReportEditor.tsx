import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Save, 
  CheckCircle, 
  Activity, 
  Stethoscope,
  Columns,
  ListFilter
} from 'lucide-react';
import type { Exam, Report, DigitalSignature } from '../../types';
import { EcgViewer } from './EcgViewer';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { useAuth } from '../../context/AuthContext';
import { formatDoctorDisplayName } from '../../utils/cryptoSim';
import { ECG_TEMPLATES } from '../../data/ecgTemplates';

interface ReportEditorProps {
  exam: Exam;
  onBackToQueue: () => void;
  onSaveReportAndSign: (examId: string, report: Report) => void;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  exam,
  onBackToQueue,
  onSaveReportAndSign
}) => {
  // Inicializar campos do laudo com base no exame ou em branco para preenchimento pelo médico
  const [rhythm, setRhythm] = useState(exam.report?.rhythm || '');
  const [heartRate, setHeartRate] = useState<number | string>(exam.report?.heartRate || '');
  const [prInterval, setPrInterval] = useState(exam.report?.prInterval || '');
  const [qrsDuration, setQrsDuration] = useState(exam.report?.qrsDuration || '');
  const [qtcInterval, setQtcInterval] = useState(exam.report?.qtcInterval || '');
  const [qrsAxis, setQrsAxis] = useState(exam.report?.qrsAxis || '');
  const [findings, setFindings] = useState(exam.report?.findings || '');
  const [conclusion, setConclusion] = useState(exam.report?.conclusion || '');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState<string>('');

  const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedTemplateCode(code);
    if (!code) return;
    const tmpl = ECG_TEMPLATES.find(t => t.code === code);
    if (tmpl) {
      setFindings(tmpl.description);
      setConclusion(tmpl.conclusion);
    }
  };

  const filteredTemplates = templateSearchTerm.trim()
    ? ECG_TEMPLATES.filter(t => 
        t.code.includes(templateSearchTerm.trim()) ||
        t.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
        t.conclusion.toLowerCase().includes(templateSearchTerm.toLowerCase())
      )
    : ECG_TEMPLATES;

  const { currentUser } = useAuth();

  // Médico logado com higienização de prefixos duplicados
  const rawDocName = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.name) ? currentUser.name : 'Dr. Fernando Albuquerque';
  const doctorName = formatDoctorDisplayName(rawDocName);
  const doctorCrm = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.crm) ? currentUser.crm : '112.540';
  const doctorUf = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.uf) ? currentUser.uf : 'SP';
  const doctorRqe = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.rqe) ? currentUser.rqe : '24910';

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [isExamExpanded, setIsExamExpanded] = useState<boolean>(false);

  const handleSaveDraft = () => {
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handleOpenSignature = () => {
    if (!conclusion.trim()) {
      alert('Por favor, redija o parecer conclusivo antes de assinar o laudo.');
      return;
    }
    setIsSignModalOpen(true);
  };

  const handleSignatureComplete = (signature: DigitalSignature) => {
    const finalReport: Report = {
      id: `rep-${Date.now()}`,
      examId: exam.id,
      doctorName,
      doctorCrm,
      doctorUf,
      doctorRqe,
      rhythm,
      heartRate: Number(heartRate),
      prInterval,
      qrsDuration,
      qtcInterval,
      qrsAxis,
      findings,
      conclusion,
      signature,
      createdAt: new Date().toISOString()
    };

    setIsSignModalOpen(false);
    onSaveReportAndSign(exam.id, finalReport);
  };

  const currentReportDraft: Partial<Report> = {
    doctorName,
    doctorCrm,
    doctorUf,
    doctorRqe,
    rhythm,
    heartRate: heartRate === '' ? undefined : Number(heartRate),
    prInterval,
    qrsDuration,
    qtcInterval,
    qrsAxis,
    findings,
    conclusion
  };

  return (
    <div className="report-editor-view">
      {/* Barra Superior de Contexto do Paciente e Exame */}
      <div className="editor-top-bar">
        <div className="top-bar-left">
          <button className="btn-back" onClick={onBackToQueue}>
            <ArrowLeft size={18} />
            <span>Fila de Laudos</span>
          </button>

          <div className="divider-vert" />

          <div className="exam-meta-headline">
            <span className="exam-proto">{exam.protocolNumber}</span>
            <span className={`priority-tag ${exam.priority.toLowerCase()}`}>
              {exam.priority}
            </span>
            <span className="exam-clinic-name">{exam.clinicName}</span>
          </div>
        </div>

        <div className="top-bar-right">
          <div className="doctor-active-pill">
            <Stethoscope size={16} />
            <span>{doctorName} (CRM {doctorCrm}-{doctorUf})</span>
          </div>

          <button 
            className={`btn-save-draft ${isExamExpanded ? 'active' : ''}`}
            onClick={() => setIsExamExpanded(!isExamExpanded)}
            title={isExamExpanded ? 'Voltar para divisão padrão (50/50)' : 'Expandir arquivo do exame para visualização ampla'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Columns size={16} />
            <span>{isExamExpanded ? 'Divisão Normal' : 'Expandir Exame'}</span>
          </button>

          <button className="btn-save-draft" onClick={handleSaveDraft}>
            <Save size={16} />
            <span>Salvar Rascunho</span>
          </button>

          <button className="btn-sign-proceed" onClick={handleOpenSignature}>
            <ShieldCheck size={18} />
            <span>Assinar Digitalmente</span>
          </button>
        </div>
      </div>

      {draftSavedToast && (
        <div className="toast-notification animate-fade-in">
          <CheckCircle size={16} /> Rascunho do laudo salvo localmente com sucesso!
        </div>
      )}

      {/* Faixa com Dados Clínicos e Sintomas */}
      <div className="patient-context-banner">
        <div className="patient-id-block">
          <strong>{exam.patient.name}</strong>
          <span>{exam.patient.age ? `${exam.patient.age} anos` : 'Idade não informada'} • Sexo: {exam.patient.gender === 'M' ? 'Masc' : 'Fem'} • CPF: {exam.patient.cpf}</span>
          <span>PA: {exam.patient.bloodPressure || 'N/A'}</span>
        </div>

        <div className="patient-symptom-block">
          <span className="block-title">INDICAÇÃO CLÍNICA / SINTOMAS:</span>
          <p>{exam.patient.symptoms}</p>
        </div>

        {exam.patient.medications && (
          <div className="patient-meds-block">
            <span className="block-title">MEDICAMENTOS:</span>
            <p>{exam.patient.medications}</p>
          </div>
        )}
      </div>

      {/* Layout Split-Screen: Esquerda (ECG Viewer) | Direita (Editor de Laudo) */}
      <div className={`editor-split-container ${isExamExpanded ? 'layout-expanded' : ''}`}>
        {/* Painel Esquerdo: Visualizador de ECG */}
        <div className="split-left-panel">
          <EcgViewer exam={exam} />
        </div>

        {/* Painel Direito: Formulário Estruturado de Laudo */}
        <div className="split-right-panel">
          <div className="report-form-card">
            {/* Parâmetros Eletrocardiográficos */}
            <div className="form-sub-header">
              <Activity size={16} />
              <span>PARÂMETROS ELETROCARDIOGRÁFICOS</span>
            </div>

            <div className="grid-params-row">
              <div className="form-group">
                <label>Ritmo Cardíaco</label>
                <input
                  type="text"
                  value={rhythm}
                  onChange={(e) => setRhythm(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Frequência Cardíaca</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="form-control"
                  />
                  <span className="input-suffix">bpm</span>
                </div>
              </div>

              <div className="form-group">
                <label>Eixo QRS</label>
                <input
                  type="text"
                  value={qrsAxis}
                  onChange={(e) => setQrsAxis(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="grid-params-row">
              <div className="form-group">
                <label>Intervalo PR</label>
                <input
                  type="text"
                  value={prInterval}
                  onChange={(e) => setPrInterval(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Duração QRS</label>
                <input
                  type="text"
                  value={qrsDuration}
                  onChange={(e) => setQrsDuration(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Intervalo QTc</label>
                <input
                  type="text"
                  value={qtcInterval}
                  onChange={(e) => setQtcInterval(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            {/* Descrição Detalhada dos Achados com Lista de Modelos Prontos */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>
                  Descrição dos Achados Eletrocardiográficos
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ListFilter size={14} />
                    <span>Descrições Prontas:</span>
                  </span>

                  <input
                    type="text"
                    placeholder="Filtrar por nº ou nome..."
                    value={templateSearchTerm}
                    onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    style={{
                      padding: '0.35rem 0.55rem',
                      fontSize: '0.78rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-hover, #cbd5e1)',
                      width: '145px',
                      backgroundColor: 'var(--bg-app, #f8fafc)'
                    }}
                    title="Digite um número ou palavra-chave para filtrar a lista"
                  />

                  <select
                    value={selectedTemplateCode}
                    onChange={handleSelectTemplate}
                    className="form-control"
                    style={{
                      width: 'auto',
                      maxWidth: '320px',
                      padding: '0.35rem 0.55rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1.5px solid #0284c7',
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1'
                    }}
                    title="Escolha um modelo de laudo predefinido para preencher automaticamente"
                  >
                    <option value="">-- Selecione uma Descrição Pronta ({filteredTemplates.length}) --</option>
                    {filteredTemplates.map(t => (
                      <option key={t.code} value={t.code}>
                        {t.code}. {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                rows={4}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="form-control editor-textarea"
                placeholder="Selecione uma descrição pronta acima ou redija livremente os achados eletrocardiográficos..."
              />
            </div>

            {/* Conclusão Diagnóstica */}
            <div className="form-group">
              <label className="conclusion-label">
                <span>Conclusão / Parecer Diagnóstico *</span>
                <span className="badge-official">Emitido em Laudo Oficial</span>
              </label>
              <textarea
                rows={3}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className="form-control conclusion-textarea"
                placeholder="Insira o diagnóstico final (ex: Traçado dentro dos limites da normalidade, Fibrilação Atrial, etc.)..."
              />
            </div>

            {/* Rodapé de Ações do Formulário */}
            <div className="editor-action-footer">
              <button
                type="button"
                className="btn-footer-sign"
                onClick={handleOpenSignature}
              >
                <ShieldCheck size={19} />
                <span>Assinar com Senha e Emitir Laudo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Assinatura Digital */}
      <DigitalSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        exam={exam}
        reportDraft={currentReportDraft}
        onSignComplete={handleSignatureComplete}
      />
    </div>
  );
};
