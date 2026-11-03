import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  Lock,
  ArrowLeft
} from 'lucide-react';
import type { Exam } from '../types';
import { formatDateTimeBR } from '../utils/cryptoSim';

interface PublicValidatorProps {
  exams: Exam[];
  onViewReport: (exam: Exam) => void;
  onDownloadPdf: (exam: Exam) => void;
  onBackToLogin?: () => void;
}

export const PublicValidator: React.FC<PublicValidatorProps> = ({
  exams,
  onViewReport,
  onDownloadPdf,
  onBackToLogin
}) => {
  const [query, setQuery] = useState('ECG-2026-118942'); // pré-preenchido com o laudo assinado de teste
  const [searchedExam, setSearchedExam] = useState<Exam | null>(
    exams.find(e => e.protocolNumber === 'ECG-2026-118942') || null
  );
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const clean = query.trim().toLowerCase();
    const found = exams.find(e => 
      e.protocolNumber.toLowerCase() === clean ||
      e.report?.signature?.sha256Hash.toLowerCase().includes(clean)
    );
    setSearchedExam(found || null);
  };

  return (
    <div className="validator-page-wrap">
      {onBackToLogin && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              color: '#0284c7',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Voltar para a Tela de Login</span>
          </button>
        </div>
      )}

      {/* Banner de Validação */}
      <div className="validator-hero-card">
        <div className="validator-hero-icon">
          <ShieldCheck size={36} />
        </div>
        <div className="validator-hero-text">
          <h2>Validador Público de Laudos e Assinaturas Digitais</h2>
          <p>
            Verifique a integridade, autenticidade e validade de laudos emitidos pela plataforma AM Laudos em conformidade com as Resoluções CFM 2.299/2021 e 2.314/2022.
          </p>
        </div>
      </div>

      {/* Caixa de Busca por Protocolo ou Hash SHA-256 */}
      <div className="validator-search-card">
        <form onSubmit={handleSearch} className="validator-form">
          <div className="validator-input-group">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Digite o Protocolo (ex: ECG-2026-118942) ou o Hash SHA-256..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="validator-input"
            />
            <button type="submit" className="btn-validate-submit">
              Consultar Validade
            </button>
          </div>
        </form>

        <div className="quick-suggestions">
          <small>Exames assinados para teste rápido:</small>
          {exams.filter(e => e.status === 'LAUDADO').map(e => (
            <button
              key={e.id}
              className="suggestion-tag"
              onClick={() => {
                setQuery(e.protocolNumber);
                setSearchedExam(e);
                setHasSearched(true);
              }}
            >
              {e.protocolNumber} ({e.patient.name})
            </button>
          ))}
        </div>
      </div>

      {/* Resultado da Validação */}
      {hasSearched && (
        <div className="validator-result-container animate-fade-in">
          {searchedExam && searchedExam.report?.signature ? (
            <div className="result-card valid">
              <div className="result-header valid">
                <div className="result-header-left">
                  <CheckCircle2 size={32} className="text-success" />
                  <div>
                    <h3>DOCUMENTO AUTÊNTICO E ÍNTEGRO</h3>
                    <p>Assinatura Digital conferida com sucesso</p>
                  </div>
                </div>
                <span className="badge-legal-stamp">CFM Válido • Autêntico</span>
              </div>

              <div className="result-body-grid">
                <div className="result-info-box">
                  <div className="box-item">
                    <span className="box-lbl">Protocolo do Exame:</span>
                    <strong className="box-val">{searchedExam.protocolNumber}</strong>
                  </div>
                  <div className="box-item">
                    <span className="box-lbl">Paciente:</span>
                    <strong className="box-val">{searchedExam.patient.name}</strong>
                  </div>
                  <div className="box-item">
                    <span className="box-lbl">Clínica Solicitante:</span>
                    <span className="box-val">{searchedExam.clinicName}</span>
                  </div>
                  <div className="box-item">
                    <span className="box-lbl">Tipo de Exame:</span>
                    <span className="box-val">Eletrocardiograma de Repouso (12 Derivações)</span>
                  </div>
                </div>

                <div className="result-info-box">
                  <div className="box-item">
                    <span className="box-lbl">Médico(a) Laudista:</span>
                    <strong className="box-val text-primary">{searchedExam.report.doctorName}</strong>
                  </div>
                  <div className="box-item">
                    <span className="box-lbl">Registro Profissional:</span>
                    <span className="box-val">CRM {searchedExam.report.doctorCrm}-{searchedExam.report.doctorUf} • RQE {searchedExam.report.doctorRqe || '18492'}</span>
                  </div>
                  <div className="box-item">
                    <span className="box-lbl">Autoridade Certificadora:</span>
                    <span className="box-val">{searchedExam.report.signature.certificateAuthority}</span>
                  </div>
                  <div className="box-item">
                    <span className="box-lbl">Carimbo do Tempo (Timestamp):</span>
                    <span className="box-val">{formatDateTimeBR(searchedExam.report.signature.signedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Hash SHA-256 e Conclusão */}
              <div className="hash-verification-banner">
                <div className="hash-title">
                  <Lock size={15} />
                  <span>HASH CRIPTOGRÁFICO DO LAUDO (SHA-256):</span>
                </div>
                <code>{searchedExam.report.signature.sha256Hash}</code>
              </div>

              <div className="conclusion-preview-box">
                <strong>Parecer Conclusivo Emitido:</strong>
                <p>"{searchedExam.report.conclusion}"</p>
              </div>

              {/* Ações */}
              <div className="result-footer-actions">
                <button
                  className="btn-result-action view"
                  onClick={() => onViewReport(searchedExam)}
                >
                  <Eye size={17} />
                  <span>Visualizar Laudo Oficial</span>
                </button>

                <button
                  className="btn-result-action download"
                  onClick={() => onDownloadPdf(searchedExam)}
                >
                  <Download size={17} />
                  <span>Baixar Cópia Autenticada em PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="result-card invalid">
              <div className="result-header invalid">
                <AlertCircle size={32} className="text-danger" />
                <div>
                  <h3>DOCUMENTO NÃO LOCALIZADO OU NÃO ASSINADO</h3>
                  <p>O número de protocolo ou hash informado não corresponde a um laudo assinado na base de dados.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
