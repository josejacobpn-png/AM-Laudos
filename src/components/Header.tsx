import React, { useState } from 'react';
import { 
  Building2, 
  Stethoscope, 
  AlertTriangle, 
  UploadCloud, 
  LogOut, 
  LogIn,
  ChevronDown, 
  Layers
} from 'lucide-react';
import type { Exam } from '../types';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo-amlaudos.jpg';

interface HeaderProps {
  currentView: 'laudista' | 'clinica' | 'admin';
  onViewChange: (view: 'laudista' | 'clinica' | 'admin') => void;
  exams: Exam[];
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  exams,
  onOpenUpload
}) => {
  const { currentUser, role, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const pendingCount = exams.filter(e => e.status === 'PENDENTE').length;
  const emergencyCount = exams.filter(e => e.status === 'PENDENTE' && e.priority === 'EMERGENCIA').length;

  const isAdmin = role === 'ADMIN';
  const isDoctor = role === 'MEDICO_LAUDISTA';
  const isClinic = role === 'TECNICO_CLINICA';

  // Iniciais do Avatar
  const getAvatarInitials = () => {
    if (isAdmin) return 'AD';
    if (isDoctor) return 'DR';
    return 'CL';
  };

  return (
    <header className="main-header">
      <div className="header-container">
        {/* Logo & Marca Oficial */}
        <div 
          className="brand-group" 
          onClick={() => {
            if (isAdmin) onViewChange('admin');
            else if (isClinic) onViewChange('clinica');
            else onViewChange('laudista');
          }} 
          style={{ cursor: 'pointer' }}
          title="Ir para o painel inicial"
        >
          <img 
            src={logoImg} 
            alt="AM Laudos - Telemedicina e Laudos Médicos Digitais" 
            className="header-brand-logo" 
          />
        </div>

        {/* Alerta de Emergência Crítica no Cabeçalho (Visível APENAS para Médicos e Admins, NUNCA para Clínicas) */}
        {!isClinic && (isDoctor || isAdmin) && emergencyCount > 0 && (
          <div className="header-emergency-alert" onClick={() => onViewChange('laudista')}>
            <AlertTriangle size={18} className="emergency-icon-pulse" />
            <div>
              <strong>{emergencyCount} Exame(s) Crítico(s)</strong>
              <span>SLA Emergência &lt; 15 min</span>
            </div>
          </div>
        )}

        {/* Abas de Navegação baseadas na Permissão do Usuário */}
        <nav className="header-nav-tabs">
          {/* Aba do Administrador */}
          {isAdmin && (
            <button
              className={`nav-tab-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => onViewChange('admin')}
            >
              <Layers size={18} />
              <span>Painel Gestão & Admin</span>
            </button>
          )}

          {/* Aba do Médico Laudista (Exclusiva do Médico e Admin) */}
          {(isDoctor || isAdmin) && !isClinic && (
            <button
              className={`nav-tab-btn ${currentView === 'laudista' ? 'active' : ''}`}
              onClick={() => onViewChange('laudista')}
            >
              <Stethoscope size={18} />
              <span>Central de Laudos</span>
              {pendingCount > 0 && (
                <span className={`tab-counter ${emergencyCount > 0 ? 'alert' : ''}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* Aba da Clínica / Posto (Exclusiva da Clínica e Admin) */}
          {(isClinic || isAdmin) && !isDoctor && (
            <button
              className={`nav-tab-btn ${currentView === 'clinica' ? 'active' : ''}`}
              onClick={() => onViewChange('clinica')}
            >
              <Building2 size={18} />
              <span>Portal Clínicas</span>
            </button>
          )}
        </nav>

        {/* Ação Rápida e Perfil Ativo com Dropdown */}
        <div className="header-actions">
          {/* Botão de Enviar Exame visível APENAS para Clínicas e Admins, NUNCA para Médicos */}
          {!isDoctor && (isClinic || isAdmin) && (
            <button className="btn-quick-upload" onClick={onOpenUpload}>
              <UploadCloud size={17} />
              <span>Enviar Exame</span>
            </button>
          )}

          {/* Badge do Usuário com Menu Dropdown ou Botão de Login */}
          {currentUser ? (
            <div className="user-profile-section">
              <div className="user-profile-wrapper">
                <div 
                  className="user-profile-badge" 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`avatar-circle ${isAdmin ? 'admin' : isDoctor ? 'doctor' : 'clinic'}`}>
                    {getAvatarInitials()}
                  </div>
                  <div className="user-info-text">
                    <span className="user-name">
                      {currentUser.name}
                    </span>
                    <span className="user-role">
                      {isAdmin ? 'Administrador Geral' : isDoctor ? `CRM ${currentUser.crm}-${currentUser.uf}` : (currentUser.clinicName || 'Clínica Parceira')}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-muted" />
                </div>

                {/* Menu Popover do Perfil */}
                {isProfileMenuOpen && (
                  <div className="profile-dropdown-menu animate-fade-in">
                    <div className="dropdown-user-header">
                      <strong>{currentUser.name}</strong>
                      <span>{currentUser.email}</span>
                      <div className="user-role-pill">
                        {isAdmin ? '🛡️ Administrador do Sistema' : isDoctor ? '🩺 Médico Cardiologista Laudista' : '🏥 Posto de Coleta / Clínica'}
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    {/* Botão Sair / Logout */}
                    <button
                      type="button"
                      className="dropdown-logout-btn"
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await logout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Encerrar Sessão (Logout)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Sair Direto e Visível */}
              <button
                type="button"
                className="btn-header-logout"
                title="Sair e voltar para a tela de login"
                onClick={async () => {
                  setIsProfileMenuOpen(false);
                  await logout();
                }}
              >
                <LogOut size={15} />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-header-login"
              onClick={() => onViewChange('laudista')}
            >
              <LogIn size={16} />
              <span>Acessar Plataforma</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
