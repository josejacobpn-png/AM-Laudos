import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockUsers';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { formatDoctorDisplayName } from '../utils/cryptoSim';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string, selectedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
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
        const userEmail = session.user.email?.trim().toLowerCase() || '';
        const userMeta = session.user.user_metadata || {};
        const isMasterAdmin = userEmail === 'g2autodev@gmail.com' || userEmail.includes('admin') || userMeta.tipo === 'ADMIN';

        // 1. Buscar perfil no banco (apenas campos necessários para autenticação e sessão)
        let { data: profile } = await client
          .from('perfis')
          .select('id, nome_completo, tipo, clinica_id, crm, uf_crm, rqe, especialidade, telefone, clinicas(nome)')
          .eq('id', session.user.id)
          .maybeSingle();

        // 2. Verificar correspondência com médicos salvos no storage
        const savedDoctors: UserProfile[] = (() => {
          try {
            return [
              ...JSON.parse(localStorage.getItem('am_laudos_doctors_v2') || '[]'),
              ...JSON.parse(localStorage.getItem('am_laudos_doctors_v1') || '[]')
            ];
          } catch {
            return [];
          }
        })();
        const localDocMatch = savedDoctors.find(d => 
          (d.email && d.email.toLowerCase() === userEmail) || 
          d.id === session.user.id
        );

        const savedClinics: any[] = (() => {
          try {
            return JSON.parse(localStorage.getItem('am_laudos_clinics_v2') || '[]');
          } catch {
            return [];
          }
        })();
        const localClinicMatch = savedClinics.find(c => 
          (c.email && c.email.toLowerCase() === userEmail) || 
          c.id === (profile?.clinica_id || userMeta.clinica_id)
        );

        // 3. Determinar perfil real do usuário
        const isDoctorAccount = Boolean(
          userMeta.tipo === 'MEDICO_LAUDISTA' || 
          profile?.tipo === 'MEDICO_LAUDISTA' || 
          localDocMatch ||
          userMeta.crm ||
          profile?.crm ||
          userEmail.includes('medico') || 
          userEmail.includes('cardio') || 
          userEmail.includes('dr.') ||
          userEmail.startsWith('dr')
        );

        const isClinicAccount = Boolean(
          userMeta.tipo === 'TECNICO_CLINICA' ||
          profile?.tipo === 'TECNICO_CLINICA' ||
          localClinicMatch ||
          userMeta.clinica_id ||
          profile?.clinica_id
        );

        let finalRole: UserRole = 'TECNICO_CLINICA';
        if (isMasterAdmin) {
          finalRole = 'ADMIN';
        } else if (isDoctorAccount && !isClinicAccount) {
          finalRole = 'MEDICO_LAUDISTA';
        } else if (isClinicAccount) {
          finalRole = 'TECNICO_CLINICA';
        } else if (profile?.tipo) {
          finalRole = profile.tipo as UserRole;
        }

        const rawName = userMeta.nome_completo || profile?.nome_completo || localDocMatch?.name || (isMasterAdmin ? 'Administrador Geral' : userEmail.split('@')[0].toUpperCase());
        const finalName = finalRole === 'MEDICO_LAUDISTA' ? formatDoctorDisplayName(rawName) : rawName;
        const finalCrm = userMeta.crm || profile?.crm || localDocMatch?.crm;
        const finalUf = userMeta.uf_crm || profile?.uf_crm || localDocMatch?.uf || (finalRole === 'MEDICO_LAUDISTA' ? 'SP' : undefined);
        const finalSpecialty = userMeta.especialidade || profile?.especialidade || localDocMatch?.specialty || (finalRole === 'MEDICO_LAUDISTA' ? 'Cardiologia Clínica' : undefined);
        const finalPhone = userMeta.telefone || profile?.telefone || localDocMatch?.phone;

        const finalClinicId = profile?.clinica_id || userMeta.clinica_id || localClinicMatch?.id || localDocMatch?.clinicId;
        const clinicObj = Array.isArray(profile?.clinicas) ? profile.clinicas[0] : (profile?.clinicas as { nome?: string } | undefined);
        const finalClinicName = clinicObj?.nome || localClinicMatch?.name || (finalRole === 'TECNICO_CLINICA' ? finalName : localDocMatch?.clinicName);

        // Auto-sincronizar / reparar perfil no Supabase se for médico e a tabela perfis estiver incompleta
        if (finalRole === 'MEDICO_LAUDISTA' && (!profile || profile.tipo !== 'MEDICO_LAUDISTA' || !profile.crm)) {
          try {
            await client.from('perfis').upsert({
              id: session.user.id,
              nome_completo: finalName,
              tipo: 'MEDICO_LAUDISTA',
              crm: finalCrm,
              uf_crm: finalUf,
              especialidade: finalSpecialty,
              telefone: finalPhone
            });
          } catch (e) {
            console.warn('Aviso ao sincronizar perfil do médico:', e);
          }
        }

        const userProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || userEmail,
          name: finalName,
          role: finalRole,
          clinicId: finalClinicId,
          clinicName: finalClinicName,
          crm: finalCrm,
          uf: finalUf,
          rqe: profile?.rqe || localDocMatch?.rqe,
          specialty: finalSpecialty,
          phone: finalPhone
        };
        setCurrentUser(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, selectedRole?: UserRole): Promise<{ success: boolean; error?: string }> => {
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
          const userMeta = data.user.user_metadata || {};
          const isMasterAdmin = cleanEmail === 'g2autodev@gmail.com' || cleanEmail.includes('admin') || userMeta.tipo === 'ADMIN';

          let { data: profile } = await supabase
            .from('perfis')
            .select('id, nome_completo, tipo, clinica_id, crm, uf_crm, rqe, especialidade, telefone, clinicas(nome)')
            .eq('id', data.user.id)
            .maybeSingle();

          const savedDoctors: UserProfile[] = (() => {
            try {
              return [
                ...JSON.parse(localStorage.getItem('am_laudos_doctors_v2') || '[]'),
                ...JSON.parse(localStorage.getItem('am_laudos_doctors_v1') || '[]')
              ];
            } catch {
              return [];
            }
          })();
          const localDocMatch = savedDoctors.find(d => 
            (d.email && d.email.toLowerCase() === cleanEmail) || 
            d.id === data.user.id
          );

          const savedClinics: any[] = (() => {
            try {
              return JSON.parse(localStorage.getItem('am_laudos_clinics_v2') || '[]');
            } catch {
              return [];
            }
          })();
          const localClinicMatch = savedClinics.find(c => 
            (c.email && c.email.toLowerCase() === cleanEmail) || 
            c.id === (profile?.clinica_id || userMeta.clinica_id)
          );

          const isDoctorAccount = Boolean(
            userMeta.tipo === 'MEDICO_LAUDISTA' || 
            profile?.tipo === 'MEDICO_LAUDISTA' || 
            localDocMatch ||
            userMeta.crm ||
            profile?.crm ||
            cleanEmail.includes('medico') || 
            cleanEmail.includes('cardio') || 
            cleanEmail.includes('dr.') ||
            cleanEmail.startsWith('dr')
          );

          const isClinicAccount = Boolean(
            userMeta.tipo === 'TECNICO_CLINICA' ||
            profile?.tipo === 'TECNICO_CLINICA' ||
            localClinicMatch ||
            userMeta.clinica_id ||
            profile?.clinica_id
          );

          let finalRole: UserRole = 'TECNICO_CLINICA';
          if (isMasterAdmin) {
            finalRole = 'ADMIN';
          } else if (isDoctorAccount && !isClinicAccount) {
            finalRole = 'MEDICO_LAUDISTA';
          } else if (isClinicAccount) {
            finalRole = 'TECNICO_CLINICA';
          } else if (profile?.tipo) {
            finalRole = profile.tipo as UserRole;
          } else if (selectedRole) {
            finalRole = selectedRole;
          }

          // Blindagem estrita de aba de login selecionada vs papel real do usuário
          if (selectedRole && !isMasterAdmin) {
            if (selectedRole === 'MEDICO_LAUDISTA' && finalRole === 'TECNICO_CLINICA') {
              await supabase.auth.signOut();
              return {
                success: false,
                error: 'Acesso negado: Esta conta pertence a uma Clínica/Posto e não tem permissão para acessar a Central de Laudos. Selecione a aba "Clínica / Posto".'
              };
            }
            if (selectedRole === 'TECNICO_CLINICA' && finalRole === 'MEDICO_LAUDISTA') {
              await supabase.auth.signOut();
              return {
                success: false,
                error: 'Acesso negado: Esta conta pertence a um Médico Laudista e não tem permissão para acessar o Portal das Clínicas. Selecione a aba "Médico Laudista".'
              };
            }
            if (selectedRole === 'ADMIN' && finalRole !== 'ADMIN') {
              await supabase.auth.signOut();
              return {
                success: false,
                error: 'Acesso negado: Esta conta não possui privilégios de Administrador. Selecione a aba correspondente ao seu perfil de acesso.'
              };
            }
          }

          const rawName = userMeta.nome_completo || profile?.nome_completo || localDocMatch?.name || (isMasterAdmin ? 'Administrador Geral' : cleanEmail.split('@')[0].toUpperCase());
          const finalName = finalRole === 'MEDICO_LAUDISTA' ? formatDoctorDisplayName(rawName) : rawName;
          const finalCrm = userMeta.crm || profile?.crm || localDocMatch?.crm;
          const finalUf = userMeta.uf_crm || profile?.uf_crm || localDocMatch?.uf || (finalRole === 'MEDICO_LAUDISTA' ? 'SP' : undefined);
          const finalSpecialty = userMeta.especialidade || profile?.especialidade || localDocMatch?.specialty || (finalRole === 'MEDICO_LAUDISTA' ? 'Cardiologia Clínica' : undefined);
          const finalPhone = userMeta.telefone || profile?.telefone || localDocMatch?.phone;

          const finalClinicId = profile?.clinica_id || userMeta.clinica_id || localClinicMatch?.id || localDocMatch?.clinicId;
          const clinicObj = Array.isArray(profile?.clinicas) ? profile.clinicas[0] : (profile?.clinicas as { nome?: string } | undefined);
          const finalClinicName = clinicObj?.nome || localClinicMatch?.name || (finalRole === 'TECNICO_CLINICA' ? finalName : localDocMatch?.clinicName);

          if (finalRole === 'MEDICO_LAUDISTA' && (!profile || profile.tipo !== 'MEDICO_LAUDISTA' || !profile.crm)) {
            try {
              await supabase.from('perfis').upsert({
                id: data.user.id,
                nome_completo: finalName,
                tipo: 'MEDICO_LAUDISTA',
                crm: finalCrm,
                uf_crm: finalUf,
                especialidade: finalSpecialty,
                telefone: finalPhone
              });
            } catch (e) {
              console.warn('Aviso ao sincronizar perfil do médico no login:', e);
            }
          }

          setCurrentUser({
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: finalName,
            role: finalRole,
            clinicId: finalClinicId,
            clinicName: finalClinicName,
            crm: finalCrm,
            uf: finalUf,
            rqe: profile?.rqe || localDocMatch?.rqe,
            specialty: finalSpecialty,
            phone: finalPhone
          });
          return { success: true };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
        console.warn('Falha no Supabase, tentando autenticação local:', message);
      }
    }

    // 2. Fallback / Modo Local: Verificar médicos cadastrados e usuários demo
    let localDoctors: UserProfile[] = [];
    try {
      const savedDocs = [
        ...JSON.parse(localStorage.getItem('am_laudos_doctors_v2') || '[]'),
        ...JSON.parse(localStorage.getItem('am_laudos_doctors_v1') || '[]')
      ];
      localDoctors = savedDocs;
    } catch {
      // Ignorar erro
    }

    const allUsers = [...localDoctors, ...DEMO_USERS];
    const matchedUser = allUsers.find(u => u.email?.toLowerCase() === cleanEmail);
    if (matchedUser) {
      if (selectedRole && matchedUser.role !== 'ADMIN') {
        if (selectedRole === 'MEDICO_LAUDISTA' && matchedUser.role === 'TECNICO_CLINICA') {
          return {
            success: false,
            error: 'Acesso negado: Esta conta pertence a uma Clínica/Posto e não tem permissão para acessar a Central de Laudos. Selecione a aba "Clínica / Posto".'
          };
        }
        if (selectedRole === 'TECNICO_CLINICA' && matchedUser.role === 'MEDICO_LAUDISTA') {
          return {
            success: false,
            error: 'Acesso negado: Esta conta pertence a um Médico Laudista e não tem permissão para acessar o Portal das Clínicas. Selecione a aba "Médico Laudista".'
          };
        }
      }
      setCurrentUser(matchedUser);
      return { success: true };
    }

    // Se informou um email novo qualquer em modo local/demo
    let role: UserRole = selectedRole || 'TECNICO_CLINICA';
    let clinicName = 'Clínica Parceira';
    if (cleanEmail === 'g2autodev@gmail.com' || cleanEmail.includes('admin')) {
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
