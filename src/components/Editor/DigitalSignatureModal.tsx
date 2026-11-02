import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  X, 
  FileCheck, 
  Award
} from 'lucide-react';
import type { Exam, Report, DigitalSignature } from '../../types';
import { calculateSha256, formatDateTimeBR } from '../../utils/cryptoSim';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  reportDraft: Partial<Report>;
  onSignComplete: (signature: DigitalSignature) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  exam,
  reportDraft,
  onSignComplete
}) => {
  const [certType, setCertType] = useState<'A1_ARQUIVO' | 'A3_NUVEM_BIRD_ID' | 'A3_TOKEN_NEOID'>('A1_ARQUIVO');
  const [pin, setPin] = useState('1234');
  const [isSigning, setIsSigning] = useState(false);
  const [step, setStep] = useState<'AUTH' | 'SUCCESS'>('AUTH');
  const [signedData, setSignedData] = useState<DigitalSignature | null>(null);

  if (!isOpen) return null;

  const doctorName = reportDraft.doctorName || 'Dr. Fernando Albuquerque';
  const doctorCrm = reportDraft.doctorCrm || '112.540';
  const doctorUf = reportDraft.doctorUf || 'SP';
  const doctorRqe = reportDraft.doctorRqe || '24910';

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      alert('Por favor, informe seu PIN de assinatura digital.');
      return;
    }

    setIsSigning(true);

    // Calcular Hash SHA-256 do documento (Protocolo + Paciente + Parecer + Timestamp)
    const contentToHash = `${exam.protocolNumber}|${exam.patient.cpf}|${reportDraft.rhythm}|${reportDraft.conclusion}|${new Date().toISOString()}`;
    const sha256 = await calculateSha256(contentToHash);

    const now = new Date().toISOString();
    const validationUrl = `https://amlaudos.com.br/validar/${exam.protocolNumber}?h=${sha256.substring(0, 12)}`;

    const signature: DigitalSignature = {
      doctorName,
      crm: doctorCrm,
      uf: doctorUf,
      rqe: doctorRqe,
      certificateType: certType,
      signedAt: now,
      sha256Hash: sha256,
      qrCodeValidationUrl: validationUrl,
      certificateAuthority: certType === 'A1_ARQUIVO' 
        ? 'AC Soluti Multipla v5 (ICP-Brasil)' 
        : certType === 'A3_NUVEM_BIRD_ID' 
        ? 'AC BirdID Certisign em Nuvem (ICP-Brasil)' 
        : 'AC NeoID SERPRO (ICP-Brasil)',
      serialNumber: '7482-9901-2834-0192',
      isQualifiedIcpBrasil: true
    };

    setTimeout(() => {
      setSignedData(signature);
      setStep('SUCCESS');
      setIsSigning(false);
    }, 700);
  };

  const handleFinalize = () => {
    if (signedData) {
      onSignComplete(signedData);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="modal-dialog signature-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="icp-brasil-stamp-mini">ICP-Brasil</div>
            <div>
              <h3>Assinatura Digital Qualificada</h3>
              <p>Validade Jurídica conforme MP 2.200-2/2001 e Resoluções CFM nº 2.299/2021 e 2.314/2022</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {step === 'AUTH' ? (
          <form onSubmit={handleSign} className="modal-body-form">
            {/* Dados do Médico e Certificado */}
            <div className="doctor-credential-box">
              <Award className="text-primary" size={28} />
              <div className="doctor-cred-text">
                <h4>DR(A). {doctorName.toUpperCase()}</h4>
                <p>Médico(a) Cardiologista • CRM {doctorCrm}-{doctorUf} • RQE {doctorRqe}</p>
                <span className="badge-legal-cf">Profissional Habilitado no Conselho Regional de Medicina</span>
              </div>
            </div>

            {/* Seleção do Tipo de Certificado Digital */}
            <div className="form-group">
              <label>Selecione seu Certificado Digital ICP-Brasil</label>
              <div className="cert-type-options">
                <label className={`cert-radio-option ${certType === 'A1_ARQUIVO' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="certType"
                    checked={certType === 'A1_ARQUIVO'}
                    onChange={() => setCertType('A1_ARQUIVO')}
                  />
                  <div>
                    <strong>Certificado A1 (Arquivo PFX / Nuvem)</strong>
                    <small>AC Soluti Multipla v5 • Validade até 2028</small>
                  </div>
                </label>

                <label className={`cert-radio-option ${certType === 'A3_NUVEM_BIRD_ID' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="certType"
                    checked={certType === 'A3_NUVEM_BIRD_ID'}
                    onChange={() => setCertType('A3_NUVEM_BIRD_ID')}
                  />
                  <div>
                    <strong>Certificado A3 Nuvem (BirdID Certisign)</strong>
                    <small>Autorização por aplicativo no smartphone (OTP / Push)</small>
                  </div>
                </label>

                <label className={`cert-radio-option ${certType === 'A3_TOKEN_NEOID' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="certType"
                    checked={certType === 'A3_TOKEN_NEOID'}
                    onChange={() => setCertType('A3_TOKEN_NEOID')}
                  />
                  <div>
                    <strong>Token Criptográfico USB / Smartcard (NeoID)</strong>
                    <small>Dispositivo físico conectado à máquina local</small>
                  </div>
                </label>
              </div>
            </div>

            {/* PIN de Segurança */}
            <div className="form-group">
              <label>PIN de Assinatura do Certificado (Senha Numérica)</label>
              <div className="pin-input-wrap">
                <Lock size={18} className="pin-icon" />
                <input
                  type="password"
                  required
                  placeholder="Digite o PIN do certificado..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="form-control pin-field"
                />
              </div>
              <small className="field-hint">
                Simulação de ambiente seguro: o PIN padrão para teste é <strong>1234</strong>.
              </small>
            </div>

            {/* Resumo do Documento a ser Selado */}
            <div className="document-seal-summary">
              <div className="seal-summary-row">
                <span>Protocolo Oficial:</span>
                <strong>{exam.protocolNumber}</strong>
              </div>
              <div className="seal-summary-row">
                <span>Paciente:</span>
                <strong>{exam.patient.name}</strong>
              </div>
              <div className="seal-summary-row">
                <span>Diagnóstico Conclusivo:</span>
                <span className="conclusion-preview-text">
                  {reportDraft.conclusion ? reportDraft.conclusion.substring(0, 90) + '...' : 'Laudo preenchido'}
                </span>
              </div>
              <div className="seal-summary-row">
                <span>Carimbo do Tempo:</span>
                <span>Horário Oficial de Brasília (UTC-3)</span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Revisar Laudo
              </button>
              <button
                type="submit"
                disabled={isSigning}
                className="btn-primary-action btn-sign"
              >
                {isSigning ? (
                  <span>Assinando digitalmente...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Assinar Digitalmente (PAdES / ICP-Brasil)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmação e Selo Criptográfico Gerado */
          <div className="signature-success-pane animate-fade-in">
            <div className="success-icon-badge">
              <CheckCircle size={44} className="text-success" />
            </div>

            <h3>Laudo Assinado com Sucesso!</h3>
            <p className="success-desc">
              O documento eletrônico recebeu assinatura digital qualificada padrão ICP-Brasil e foi selado com validade jurídica nacional.
            </p>

            <div className="signed-details-card">
              <div className="stamp-visual-preview">
                <div className="stamp-icp-header">ICP-Brasil • DOCUMENTO AUTÊNTICO</div>
                <div className="stamp-body">
                  <strong>{signedData?.doctorName}</strong>
                  <span>CRM {signedData?.crm}-{signedData?.uf} • RQE {signedData?.rqe}</span>
                  <small>Assinado em: {formatDateTimeBR(signedData?.signedAt)}</small>
                </div>
                <div className="stamp-hash">
                  <strong>HASH SHA-256:</strong>
                  <code>{signedData?.sha256Hash}</code>
                </div>
              </div>

              <div className="qr-code-validation-box">
                <div className="qr-frame">
                  {/* SVG QR Code simulado de alta fidelidade */}
                  <svg viewBox="0 0 100 100" width="80" height="80">
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

                    {/* Pontos de dados */}
                    <rect x="42" y="14" width="8" height="8" fill="#0f172a" />
                    <rect x="52" y="24" width="8" height="8" fill="#0f172a" />
                    <rect x="42" y="42" width="16" height="16" fill="#0284c7" />
                    <rect x="66" y="44" width="8" height="14" fill="#0f172a" />
                    <rect x="44" y="68" width="10" height="10" fill="#0f172a" />
                    <rect x="70" y="72" width="16" height="12" fill="#0f172a" />
                  </svg>
                </div>
                <div className="qr-info">
                  <strong>QR Code de Validação Pública</strong>
                  <p>Qualquer pessoa ou instituição pode ler este código para validar a autenticidade e integridade no portal oficial.</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleFinalize}
              >
                <FileCheck size={18} />
                <span>Finalizar e Liberar Laudo para a Clínica</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
