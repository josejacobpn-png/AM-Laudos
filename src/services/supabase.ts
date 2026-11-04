import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://giexcrlytwgnfyaaunjl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZXhjcmx5dHdnbmZ5YWF1bmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NTExMzcsImV4cCI6MjEwODIyNzEzN30.dDkYlj1yjXVZ5g5K3RLdKu-UR7c6FqM7aLF_LuuWeNw';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://seu-projeto.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Cria um cliente isolado para operações de autenticação administrativas
 * (ex: cadastro de novos usuários/médicos/clínicas pelo Admin),
 * garantindo que a sessão ativa do usuário atual no navegador não seja sobrescrita.
 */
export const createIsolatedAuthClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
};
