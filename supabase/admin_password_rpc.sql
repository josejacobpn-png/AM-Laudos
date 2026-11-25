-- ==============================================================================
-- AM LAUDOS - FUNÇÃO RPC DE ALTERAÇÃO DE SENHA PELO ADMINISTRADOR
-- Permite ao Administrador redefinir a senha de qualquer usuário (Clínica ou Médico)
-- diretamente no Supabase Auth via pgcrypto.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.admin_alterar_senha_usuario(email_usuario TEXT, nova_senha TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Validar tamanho mínimo de senha
  IF length(nova_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A nova senha deve ter no mínimo 6 caracteres.');
  END IF;

  -- 2. Localizar o usuário no auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(email_usuario));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário com este e-mail não foi encontrado na base de autenticação.');
  END IF;

  -- 3. Atualizar a senha com pgcrypto (bcrypt)
  UPDATE auth.users
  SET 
    encrypted_password = crypt(nova_senha, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Senha atualizada com sucesso.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_alterar_senha_usuario(TEXT, TEXT) TO authenticated, anon;
