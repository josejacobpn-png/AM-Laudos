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
import { formatDateTimeBR } from '../utils/cryptoSim';
import { generateLaudoPdf } from '../utils/pdfGenerator';

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
      `Prezado(a) ${exam.patient.name}, seu laudo eletrocardiográfico (Protocolo ${exam.protocolNumber}) já está disponível com assinatura digital ICP-Brasil. Acesse o portal para download ou verificação.`
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
              <div className="brand-header-text">
                <h2>AM LAUDOS | TELEMEDICINA & TELEDIASTÓSTICO</h2>
                <p>Serviço Especializado de Eletrocardiografia Digital e Telediagnóstico</p>
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
                  <span className="val">{exam.patient.age} anos / {exam.patient.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
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

            {/* 7. Registro do Ritmo (Miniatura) */}
            <div className="sheet-ecg-strip-box">
              <div className="strip-header">
                REGISTRO DO RITMO (DERIVAÇÃO DII - VELOCIDADE 25 mm/s, SENSIBILIDADE 10 mm/mV)
              </div>
              <div className="strip-grid-bg">
                {/* SVG estilizado do traçado */}
                <svg viewBox="0 0 800 60" width="100%" height="45">
                  <path
                    d="M0,30 L30,30 L35,24 L40,30 L50,30 L53,34 L58,4 L62,42 L66,30 L74,30 L80,22 L86,30 L115,30 
                       L145,30 L150,24 L155,30 L165,30 L168,34 L173,4 L177,42 L181,30 L189,30 L195,22 L201,30 L230,30
                       L260,30 L265,24 L270,30 L280,30 L283,34 L288,4 L292,42 L296,30 L304,30 L310,22 L316,30 L345,30
                       L375,30 L380,24 L385,30 L395,30 L398,34 L403,4 L407,42 L411,30 L419,30 L425,22 L431,30 L460,30
                       L490,30 L495,24 L500,30 L510,30 L513,34 L518,4 L522,42 L526,30 L534,30 L540,22 L546,30 L575,30
                       L605,30 L610,24 L615,30 L625,30 L628,34 L633,4 L637,42 L641,30 L649,30 L655,22 L661,30 L690,30
                       L720,30 L725,24 L730,30 L740,30 L743,34 L748,4 L752,42 L756,30 L764,30 L770,22 L776,30 L800,30"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="1.6"
                  />
                </svg>
              </div>
            </div>

            {/* 8. Bloco de Assinatura Digital ICP-Brasil */}
            <div className="sheet-signature-box">
              <div className="icp-brasil-seal-card">
                <div className="seal-top">ICP-Brasil</div>
                <div className="seal-type">ASSINATURA QUALIFICADA</div>
                <div className="seal-law">MP 2.200-2/01</div>
                <div className="seal-law">CFM 2.299/21</div>
              </div>

              <div className="sig-meta-content">
                <h4>DR(A). {report.doctorName.toUpperCase()}</h4>
                <p>Médico(a) Cardiologista • CRM: <strong>{report.doctorCrm}-{report.doctorUf}</strong> • RQE: <strong>{report.doctorRqe || '18492'}</strong></p>
                <p>Certificado Digital: <strong>{sig?.certificateAuthority || 'AC Soluti Multipla v5 (ICP-Brasil)'}</strong></p>
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
