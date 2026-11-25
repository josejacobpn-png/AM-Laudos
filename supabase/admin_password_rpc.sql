-- ==============================================================================
-- AM LAUDOS - FUNÇÃO RPC DE ALTERAÇÃO DE SENHA PELO ADMINISTRADOR
-- Permite ao Administrador redefinir a senha de qualquer usuário (Clínica ou Médico)
-- diretamente no Supabase Auth via pgcrypto (schema extensions).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_alterar_senha_usuario(email_usuario TEXT, nova_senha TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF length(nova_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A nova senha deve ter no mínimo 6 caracteres.');
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(email_usuario));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado no Supabase Auth com este e-mail.');
  END IF;

  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(nova_senha, extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Senha atualizada com sucesso.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_alterar_senha_usuario(TEXT, TEXT) TO authenticated, anon;
