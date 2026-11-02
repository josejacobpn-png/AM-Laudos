import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Save, 
  CheckCircle, 
  Activity, 
  Stethoscope
} from 'lucide-react';
import type { Exam, Report, DigitalSignature } from '../../types';
import { MEDICAL_TEMPLATES } from '../../data/templates';
import { EcgViewer } from './EcgViewer';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { useAuth } from '../../context/AuthContext';

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
  // Inicializar estado do editor com base no exame ou rascunho anterior
  const initialTpl = MEDICAL_TEMPLATES.find(t => {
    if (exam.simulatedEcgType === 'ISCHEMIA') return t.id === 'tpl-ischemia';
    if (exam.simulatedEcgType === 'ARRHYTHMIA') return t.id === 'tpl-af';
    if (exam.simulatedEcgType === 'LBBB') return t.id === 'tpl-lbbb';
    return t.id === 'tpl-normal';
  }) || MEDICAL_TEMPLATES[0];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTpl.id);

  const [rhythm, setRhythm] = useState(exam.report?.rhythm || initialTpl.rhythm);
  const [heartRate, setHeartRate] = useState<number>(exam.report?.heartRate || initialTpl.heartRate);
  const [prInterval, setPrInterval] = useState(exam.report?.prInterval || initialTpl.prInterval);
  const [qrsDuration, setQrsDuration] = useState(exam.report?.qrsDuration || initialTpl.qrsDuration);
  const [qtcInterval, setQtcInterval] = useState(exam.report?.qtcInterval || initialTpl.qtcInterval);
  const [qrsAxis, setQrsAxis] = useState(exam.report?.qrsAxis || initialTpl.qrsAxis);
  const [findings, setFindings] = useState(exam.report?.findings || initialTpl.findings);
  const [conclusion, setConclusion] = useState(exam.report?.conclusion || initialTpl.conclusion);

  const { currentUser } = useAuth();

  // Médico logado
  const doctorName = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.name) ? currentUser.name : 'Dr. Fernando Albuquerque';
  const doctorCrm = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.crm) ? currentUser.crm : '112.540';
  const doctorUf = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.uf) ? currentUser.uf : 'SP';
  const doctorRqe = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.rqe) ? currentUser.rqe : '24910';

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Carregar máscara ao selecionar
  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = MEDICAL_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;

    setRhythm(tpl.rhythm);
    setHeartRate(tpl.heartRate);
    setPrInterval(tpl.prInterval);
    setQrsDuration(tpl.qrsDuration);
    setQtcInterval(tpl.qtcInterval);
    setQrsAxis(tpl.qrsAxis);
    setFindings(tpl.findings);
    setConclusion(tpl.conclusion);
  };

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
    heartRate,
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

          <button className="btn-save-draft" onClick={handleSaveDraft}>
            <Save size={16} />
            <span>Salvar Rascunho</span>
          </button>

          <button className="btn-sign-proceed" onClick={handleOpenSignature}>
            <ShieldCheck size={18} />
            <span>Assinar Digitalmente (ICP-Brasil)</span>
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
          <span>{exam.patient.age} anos • Sexo: {exam.patient.gender === 'M' ? 'Masc' : 'Fem'} • CPF: {exam.patient.cpf}</span>
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
      <div className="editor-split-container">
        {/* Painel Esquerdo: Visualizador de ECG */}
        <div className="split-left-panel">
          <EcgViewer exam={exam} />
        </div>

        {/* Painel Direito: Formulário Estruturado de Laudo com Máscaras */}
        <div className="split-right-panel">
          <div className="report-form-card">
            {/* Seletor de Máscaras Predefinidas */}
            <div className="template-selector-box">
              <div className="template-label">
                <Sparkles size={16} className="text-primary" />
                <strong>Modelos Predefinidos (Máscaras de Laudo)</strong>
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="template-select"
              >
                {MEDICAL_TEMPLATES.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    [{tpl.category}] {tpl.name}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Descrição Detalhada dos Achados */}
            <div className="form-group">
              <label>Descrição dos Achados Eletrocardiográficos</label>
              <textarea
                rows={4}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="form-control editor-textarea"
                placeholder="Descreva morfologia de onda P, complexo QRS, repolarização ventricular, segmento ST e onda T..."
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
                <span>Assinar Digitalmente e Emitir Laudo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Assinatura Digital ICP-Brasil */}
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
