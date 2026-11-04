import React, { useState } from 'react';
import { 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import logoImg from '../../assets/logo-amlaudos.jpg';

interface LoginPageProps {
  onOpenPublicValidator?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const { login, isSupabase } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleTabChange = (role: UserRole) => {
    setActiveRoleTab(role);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const result = await login(email, password, activeRoleTab);
    setIsLoading(false);

    if (!result.success) {
      let msg = result.error || 'Credenciais inválidas. Tente novamente.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Este e-mail ainda não foi confirmado no Supabase. Confirme o usuário no painel do Supabase ou execute o comando SQL de confirmação.';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      }
      setErrorMessage(msg);
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
              alt="AM Laudos - Telemedicina e Laudos Médicos Digitais" 
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
                placeholder="Digite seu e-mail de acesso"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                <span>Acessar Plataforma</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>


        {/* Rodapé com Informações Legais */}
        <div className="login-footer">
          <div className="legal-notice">
            <p>Conforme Resoluções CFM 2.299/2021 e 2.314/2022 (Telemedicina). Acesso restrito e auditado por IP e CPF.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
