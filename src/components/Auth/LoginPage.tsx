import React, { useState } from 'react';
import { 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import logoImg from '../../assets/logo-amlaudos.png';

interface LoginPageProps {
  onOpenPublicValidator: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenPublicValidator }) => {
  const { login, isSupabase } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('MEDICO_LAUDISTA');
  const [email, setEmail] = useState('medico@amlaudos.com.br');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar o email ao alternar entre as abas
  const handleRoleTabChange = (role: UserRole) => {
    setActiveRoleTab(role);
    setErrorMessage('');
    if (role === 'MEDICO_LAUDISTA') {
      setEmail('medico@amlaudos.com.br');
    } else if (role === 'TECNICO_CLINICA') {
      setEmail('clinica@saolucas.com.br');
    } else {
      setEmail('admin@amlaudos.com.br');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="login-page-wrap">
      {/* Background Decorativo Médico */}
      <div className="login-bg-glow top-left" />
      <div className="login-bg-glow bottom-right" />

      <div className="login-central-card animate-fade-in">
        {/* Topo do Card de Login */}
        <div className="login-header">
          <div className="login-logo-img-wrap">
            <img 
              src={logoImg} 
              alt="AM Laudos - Saúde ao Seu Alcance" 
              className="login-brand-logo-img" 
            />
          </div>
          <p className="login-tagline">Portal Seguro de Telemedicina Cardiológica & Telediagnóstico</p>

          <div className="connection-badge">
            <span className={`status-indicator ${isSupabase ? 'live' : 'demo'}`} />
            <span>{isSupabase ? 'Supabase Auth Ativo' : 'Ambiente Local / Demonstração'}</span>
          </div>
        </div>

        {/* Seletor de Perfil de Acesso */}
        <div className="role-selector-tabs">
          <button
            type="button"
            className={`role-tab ${activeRoleTab === 'MEDICO_LAUDISTA' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('MEDICO_LAUDISTA')}
          >
            <Stethoscope size={18} />
            <span>Médico Laudista</span>
          </button>

          <button
            type="button"
            className={`role-tab ${activeRoleTab === 'TECNICO_CLINICA' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('TECNICO_CLINICA')}
          >
            <Building2 size={18} />
            <span>Clínica / Posto</span>
          </button>

          <button
            type="button"
            className={`role-tab ${activeRoleTab === 'ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('ADMIN')}
          >
            <ShieldCheck size={18} />
            <span>Administrador</span>
          </button>
        </div>

        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div className="login-error-banner animate-fade-in">
            {errorMessage}
          </div>
        )}

        {/* Formulário de Login Tradicional */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label>E-mail de Acesso</label>
            <div className="input-with-icon">
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-input-group">
            <label>Senha de Segurança</label>
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-submit-login"
          >
            {isLoading ? (
              <span>Autenticando sessão...</span>
            ) : (
              <>
                <span>Acessar Plataforma AM Laudos</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>


        {/* Rodapé com Validador Público e Informações Legais */}
        <div className="login-footer">
          <button
            type="button"
            className="btn-public-validator-link"
            onClick={onOpenPublicValidator}
          >
            <FileCheck2 size={16} />
            <span>Consultar Validade de Laudo (Validador ICP-Brasil Público)</span>
          </button>

          <div className="legal-notice">
            <p>Conforme MP nº 2.200-2/2001 e Resoluções CFM 2.299/2021 e 2.314/2022 (Telemedicina). Acesso restrito e auditado por IP e CPF.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
