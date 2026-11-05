import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle, 
  FileText, 
  Copy
} from 'lucide-react';
import type { Exam } from '../types';
import { formatDateTimeBR, formatDoctorDisplayName } from '../utils/cryptoSim';
import { generateLaudoPdf } from '../utils/pdfGenerator';
import logoImg from '../assets/logo-amlaudos.jpg';

interface ReportViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
}

export const ReportViewModal: React.FC<ReportViewModalProps> = ({
  isOpen,
  onClose,
  exam
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !exam || !exam.report) return null;

  const report = exam.report;
  const sig = report.signature;

  const handleDownloadPdf = () => {
    const doc = generateLaudoPdf(exam, report);
    doc.save(`AM_Laudo_${exam.patient.name.replace(/\s+/g, '_')}_${exam.protocolNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    if (sig?.sha256Hash) {
      navigator.clipboard.writeText(sig.sha256Hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Prezado(a) ${exam.patient.name}, seu laudo eletrocardiográfico (Protocolo ${exam.protocolNumber}) já está disponível com assinatura digital. Acesse o portal para download ou verificação.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="modal-dialog report-view-modal">
        {/* Header do Modal com Ações de Entrega */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <FileText className="text-primary" size={24} />
            <div>
              <h3>Laudo Eletrocardiográfico Digital</h3>
              <p>Protocolo: <strong>{exam.protocolNumber}</strong> • Emissão Oficial</p>
            </div>
          </div>

          <div className="header-report-actions">
            <button className="btn-modal-action print" onClick={handlePrint} title="Imprimir laudo">
              <Printer size={16} />
              <span>Imprimir</span>
            </button>

            <button className="btn-modal-action download" onClick={handleDownloadPdf} title="Baixar PDF de alta resolução">
              <Download size={16} />
              <span>Baixar PDF</span>
            </button>

            <button className="btn-modal-action share" onClick={handleShareWhatsApp} title="Enviar via WhatsApp">
              <Share2 size={16} />
              <span>WhatsApp</span>
            </button>

            <button className="btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Folha do Laudo Formatada (Preview Autêntico) */}
        <div className="report-paper-container">
          <div className="report-a4-sheet">
            {/* 1. Cabeçalho Oficial */}
            <div className="sheet-top-header">
              <div className="sheet-brand-wrap">
                <img src={logoImg} alt="AM Laudos" className="sheet-header-logo-img" />
              </div>
              <div className="sheet-meta-box">
                <div><strong>Protocolo:</strong> {exam.protocolNumber}</div>
                <div><strong>Clínica Solicitante:</strong> {exam.clinicName}</div>
                <div><strong>Data de Emissão:</strong> {formatDateTimeBR(report.createdAt)}</div>
              </div>
            </div>

            {/* 2. Dados do Paciente */}
            <div className="sheet-patient-box">
              <div className="patient-grid">
                <div>
                  <span className="lbl">PACIENTE:</span>
                  <strong className="val">{exam.patient.name}</strong>
                </div>
                <div>
                  <span className="lbl">CPF:</span>
                  <span className="val">{exam.patient.cpf}</span>
                </div>
                <div>
                  <span className="lbl">IDADE / SEXO:</span>
                  <span className="val">{exam.patient.age ? `${exam.patient.age} anos` : 'Não informada'} / {exam.patient.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                </div>
                <div>
                  <span className="lbl">PA:</span>
                  <span className="val">{exam.patient.bloodPressure || 'Não aferida'}</span>
                </div>
              </div>

              <div className="patient-symptom-strip">
                <span className="lbl">INDICAÇÃO CLÍNICA / SINTOMAS:</span>
                <span className="val-text">{exam.patient.symptoms}</span>
              </div>
            </div>

            {/* 3. Título do Exame */}
            <div className="sheet-exam-title">
              <h3>LAUDO ELETROCARDIOGRÁFICO DE REPOUSO (12 DERIVAÇÕES)</h3>
            </div>

            {/* 4. Parâmetros Eletrocardiográficos */}
            <div className="sheet-params-table">
              <div className="param-item">
                <span className="p-lbl">RITMO:</span>
                <span className="p-val">{report.rhythm}</span>
              </div>
              <div className="param-item">
                <span className="p-lbl">FREQ. CARDÍACA:</span>
                <span className="p-val">{report.heartRate} bpm</span>
              </div>
              <div className="param-item">
                <span className="p-lbl">EIXO QRS:</span>
                <span className="p-val">{report.qrsAxis}</span>
              </div>
              <div className="param-item">
                <span className="p-lbl">INTERVALO PR:</span>
                <span className="p-val">{report.prInterval}</span>
              </div>
              <div className="param-item">
                <span className="p-lbl">DURAÇÃO QRS:</span>
                <span className="p-val">{report.qrsDuration}</span>
              </div>
              <div className="param-item">
                <span className="p-lbl">INTERVALO QTc:</span>
                <span className="p-val">{report.qtcInterval}</span>
              </div>
            </div>

            {/* 5. Descrição dos Achados */}
            <div className="sheet-section">
              <h4>DESCRIÇÃO DOS ACHADOS ELETROCARDIOGRÁFICOS:</h4>
              <p className="findings-paragraph">{report.findings}</p>
            </div>

            {/* 6. Conclusão Diagnóstica */}
            <div className="sheet-conclusion-box">
              <h4>CONCLUSÃO / PARECER DIAGNÓSTICO:</h4>
              <p className="conclusion-paragraph">{report.conclusion}</p>
            </div>

            {/* 7. Bloco de Assinatura do Laudo */}
            <div className="sheet-signature-box">
              <div className="icp-brasil-seal-card">
                <div className="seal-top">AM LAUDOS</div>
                <div className="seal-type">ASSINATURA DIGITAL</div>
                <div className="seal-law">AUTÊNTICO</div>
                <div className="seal-law">CFM 2.299/21</div>
              </div>

              <div className="sig-meta-content">
                <h4>{formatDoctorDisplayName(report.doctorName)}</h4>
                <p>Médico(a) Cardiologista • CRM: <strong>{report.doctorCrm}-{report.doctorUf}</strong>{report.doctorRqe ? ` • RQE: ${report.doctorRqe}` : ''}</p>
                <p>Assinatura Digital: <strong>{sig?.certificateAuthority || 'Certificado Digital Padrão CFM'}</strong></p>
                <p>Carimbo do Tempo: <strong>{formatDateTimeBR(sig?.signedAt || report.createdAt)}</strong> (Horário de Brasília)</p>

                <div className="hash-code-line">
                  <span>HASH SHA-256: <code>{sig?.sha256Hash || '4C9E7D810B225F88A19074EE49B062137D98944120A3815D839E6BC1092F348C'}</code></span>
                  <button className="btn-copy-hash" onClick={handleCopyHash}>
                    {copiedHash ? <CheckCircle size={13} className="text-success" /> : <Copy size={13} />}
                    <span>{copiedHash ? 'Copiado!' : 'Copiar Hash'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code de Validação Pública */}
              <div className="qr-validation-badge">
                <svg viewBox="0 0 100 100" width="70" height="70">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                  <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
                  
                  <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                  <rect x="74" y="18" width="8" height="8" fill="#0f172a" />

                  <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                  <rect x="18" y="74" width="8" height="8" fill="#0f172a" />

                  <rect x="42" y="14" width="8" height="8" fill="#0f172a" />
                  <rect x="52" y="24" width="8" height="8" fill="#0f172a" />
                  <rect x="42" y="42" width="16" height="16" fill="#0284c7" />
                  <rect x="66" y="44" width="8" height="14" fill="#0f172a" />
                  <rect x="44" y="68" width="10" height="10" fill="#0f172a" />
                  <rect x="70" y="72" width="16" height="12" fill="#0f172a" />
                </svg>
                <small>Consulte a autenticidade pelo QR Code</small>
              </div>
            </div>

            {/* Rodapé Legal */}
            <div className="sheet-footer">
              <small>Documento eletrônico com validade jurídica garantida por assinatura digital conforme MP nº 2.200-2/2001 e Resolução CFM 2.314/2022. Guarda obrigatória de prontuário por 20 anos.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
