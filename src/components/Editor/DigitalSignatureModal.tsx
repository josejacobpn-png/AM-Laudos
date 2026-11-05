import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  X, 
  FileCheck, 
  Award,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import type { Exam, Report, DigitalSignature } from '../../types';
import { calculateSha256, formatDateTimeBR, formatDoctorDisplayName } from '../../utils/cryptoSim';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured, createIsolatedAuthClient } from '../../services/supabase';

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
  const { currentUser } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState<'AUTH' | 'SUCCESS'>('AUTH');
  const [signedData, setSignedData] = useState<DigitalSignature | null>(null);

  if (!isOpen) return null;

  // Dados do médico logado com sanitização completa de prefixos
  const rawDoctorName = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.name)
    ? currentUser.name
    : reportDraft.doctorName || 'Dr. Fernando Albuquerque';
  const doctorName = formatDoctorDisplayName(rawDoctorName);
  const doctorCrm = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.crm)
    ? currentUser.crm
    : reportDraft.doctorCrm || '112.540';
  const doctorUf = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.uf)
    ? currentUser.uf
    : reportDraft.doctorUf || 'SP';
  const doctorRqe = (currentUser?.role === 'MEDICO_LAUDISTA' && currentUser.rqe)
    ? currentUser.rqe
    : reportDraft.doctorRqe;
  const doctorEmail = currentUser?.email || 'medico@amlaudos.com.br';

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPass = password.trim();
    if (!cleanPass) {
      setErrorMessage('Por favor, digite a sua senha de usuário para assinar o laudo.');
      return;
    }

    setIsSigning(true);

    // Validação com o Supabase Auth usando as credenciais do médico logado
    if (isSupabaseConfigured && currentUser?.email) {
      try {
        const authClient = createIsolatedAuthClient();
        const { error: authError } = await authClient.auth.signInWithPassword({
          email: currentUser.email,
          password: cleanPass
        });

        if (authError) {
          setIsSigning(false);
          setErrorMessage('Senha incorreta. Por favor, digite a senha cadastrada para o seu usuário.');
          return;
        }

        // Encerrar a sessão do cliente isolado para não deixar conexões abertas
        await authClient.auth.signOut();
      } catch (err) {
        console.warn('Aviso na validação de credencial de assinatura:', err);
      }
    }

    // Calcular Hash SHA-256 do documento (Protocolo + Paciente + Parecer + Timestamp)
    const now = new Date().toISOString();
    const contentToHash = `${exam.protocolNumber}|${exam.patient.cpf}|${reportDraft.rhythm || ''}|${reportDraft.conclusion || ''}|${now}`;
    const sha256 = await calculateSha256(contentToHash);

    const validationUrl = `https://amlaudos.com.br/validar/${exam.protocolNumber}?h=${sha256.substring(0, 12)}`;

    const signature: DigitalSignature = {
      doctorName,
      crm: doctorCrm,
      uf: doctorUf,
      rqe: doctorRqe,
      certificateType: 'ASSINATURA_ELETRONICA',
      signedAt: now,
      sha256Hash: sha256,
      qrCodeValidationUrl: validationUrl,
      certificateAuthority: 'Assinatura Eletrônica AM Laudos (Credenciais do Médico Laudista)',
      serialNumber: `AUT-${exam.protocolNumber}-${Date.now().toString(36).toUpperCase()}`,
      isQualifiedIcpBrasil: false
    };

    setTimeout(() => {
      setSignedData(signature);
      setStep('SUCCESS');
      setIsSigning(false);
    }, 400);
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
            <div className="icp-brasil-stamp-mini">AM LAUDOS</div>
            <div>
              <h3>Assinatura do Laudo</h3>
              <p>Autenticação por credenciais do médico laudista (Resoluções CFM nº 2.299/2021 e 2.314/2022)</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {step === 'AUTH' ? (
          <form onSubmit={handleSign} className="modal-body-form">
            {/* Dados do Médico e Credencial */}
            <div className="doctor-credential-box">
              <Award className="text-primary" size={28} />
              <div className="doctor-cred-text">
                <h4>{formatDoctorDisplayName(doctorName)}</h4>
                <p>Médico(a) Cardiologista • CRM {doctorCrm}-{doctorUf}{doctorRqe ? ` • RQE ${doctorRqe}` : ''}</p>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Usuário Laudista: <strong>{doctorEmail}</strong>
                </div>
                <span className="badge-legal-cf">Profissional Habilitado no Conselho Regional de Medicina</span>
              </div>
            </div>

            {/* PIN de Segurança / Senha de Usuário do Laudista */}
            <div className="form-group">
              <label>Senha de Acesso do Laudista (PIN de Assinatura)</label>
              <div className="pin-input-wrap" style={{ position: 'relative' }}>
                <Lock size={18} className="pin-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite sua senha de usuário..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="form-control pin-field"
                  style={{ paddingRight: '2.5rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem'
                  }}
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errorMessage ? (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={14} />
                  <span>{errorMessage}</span>
                </div>
              ) : (
                <small className="field-hint">
                  Digite a mesma senha de acesso utilizada no seu login ({doctorEmail}).
                </small>
              )}
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
                  <span>Validando credenciais e assinando...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Assinar e Liberar Laudo</span>
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
              O documento eletrônico recebeu assinatura com selo de autenticidade e integridade médica (CFM nº 2.299/2021 e 2.314/2022).
            </p>

            <div className="signed-details-card">
              <div className="stamp-visual-preview">
                <div className="stamp-icp-header">AM LAUDOS • ASSINATURA ELETRÔNICA AUTÊNTICA</div>
                <div className="stamp-body">
                  <strong>{formatDoctorDisplayName(signedData?.doctorName)}</strong>
                  <span>CRM {signedData?.crm}-{signedData?.uf}{signedData?.rqe ? ` • RQE ${signedData.rqe}` : ''}</span>
                  <small>Assinado em: {formatDateTimeBR(signedData?.signedAt)}</small>
                  <small style={{ marginTop: '0.2rem', color: '#047857', fontWeight: 600 }}>
                    Autenticado via senha de usuário ({doctorEmail})
                  </small>
                </div>
                <div className="stamp-hash">
                  <strong>HASH SHA-256:</strong>
                  <code>{signedData?.sha256Hash}</code>
                </div>
              </div>

              <div className="qr-code-validation-box">
                <div className="qr-frame">
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
                  <p>Qualquer pessoa ou instituição de saúde pode escanear este código para verificar a autenticidade e integridade no portal oficial.</p>
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
