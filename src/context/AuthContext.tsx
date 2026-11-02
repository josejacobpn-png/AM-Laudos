import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockUsers';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (user: UserProfile) => void;
  logout: () => Promise<void>;
  isSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'am_laudos_auth_user_v2';
const LEGACY_STORAGE_KEY = 'am_laudos_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sempre inicia deslogado: ao recarregar (F5) ou abrir a página, a tela de login sempre é exibida
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Limpar qualquer resquício de storage anterior
  useEffect(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignorar caso localStorage não esteja acessível
    }
  }, []);

  // Se Supabase estiver configurado, escutar mudanças de sessão
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Buscar dados do perfil na tabela public.perfis
        const { data: profile } = await client
          .from('perfis')
          .select('*, clinicas(nome)')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile.nome_completo || session.user.email || 'Usuário',
            role: profile.tipo as UserRole,
            clinicId: profile.clinica_id,
            clinicName: profile.clinicas?.nome,
            crm: profile.crm,
            uf: profile.uf_crm,
            rqe: profile.rqe,
            specialty: profile.especialidade
          };
          setCurrentUser(userProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Tentar autenticação no Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*, clinicas(nome)')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setCurrentUser({
              id: data.user.id,
              email: data.user.email || cleanEmail,
              name: profile.nome_completo,
              role: profile.tipo as UserRole,
              clinicId: profile.clinica_id,
              clinicName: profile.clinicas?.nome,
              crm: profile.crm,
              uf: profile.uf_crm,
              rqe: profile.rqe,
              specialty: profile.especialidade
            });
            return { success: true };
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
        console.warn('Falha no Supabase, tentando autenticação local:', message);
      }
    }

    // 2. Fallback / Modo Local: Verificar médicos cadastrados e usuários demo
    let localDoctors: UserProfile[] = [];
    try {
      const savedDocs = localStorage.getItem('am_laudos_doctors_v1');
      if (savedDocs) {
        localDoctors = JSON.parse(savedDocs);
      }
    } catch {
      // Ignorar erro
    }

    const allUsers = [...localDoctors, ...DEMO_USERS];
    const matchedUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      return { success: true };
    }

    // Se informou um email novo qualquer, cria uma conta temporária com base no domínio
    let role: UserRole = 'TECNICO_CLINICA';
    let clinicName = 'Clínica Parceira';
    if (cleanEmail.includes('admin')) {
      role = 'ADMIN';
    } else if (cleanEmail.includes('medico') || cleanEmail.includes('cardio') || cleanEmail.includes('dr')) {
      role = 'MEDICO_LAUDISTA';
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0].toUpperCase(),
      role,
      crm: role === 'MEDICO_LAUDISTA' ? '145.220' : undefined,
      uf: role === 'MEDICO_LAUDISTA' ? 'SP' : undefined,
      rqe: role === 'MEDICO_LAUDISTA' ? '19402' : undefined,
      clinicName: role === 'TECNICO_CLINICA' ? clinicName : undefined
    };

    setCurrentUser(newUser);
    return { success: true };
  };

  const quickLogin = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Erro ao deslogar do Supabase:', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        role: currentUser?.role || null,
        login,
        quickLogin,
        logout,
        isSupabase: isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
