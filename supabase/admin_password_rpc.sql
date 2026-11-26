-- ==============================================================================
-- AM LAUDOS - FUNÇÃO RPC DE ALTERAÇÃO DE SENHA PELO ADMINISTRADOR
-- Permite ao Administrador redefinir a senha de qualquer usuário (Clínica ou Médico)
-- diretamente no Supabase Auth via pgcrypto (schema extensions), reparando tokens e identities.
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
  v_clean_email TEXT;
BEGIN
  v_clean_email := LOWER(TRIM(email_usuario));

  IF length(nova_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A nova senha deve ter no mínimo 6 caracteres.');
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = v_clean_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado no Supabase Auth com este e-mail.');
  END IF;

  -- 1. Atualizar senha e regularizar tokens do GoTrue (phone deve ser NULL devido a constraint UNIQUE)
  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(nova_senha, extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    phone = NULL,
    phone_change = NULL,
    phone_change_token = NULL,
    is_sso_user = COALESCE(is_sso_user, false),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- 2. Garantir registro correspondente em auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'message', 'Senha atualizada com sucesso.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_alterar_senha_usuario(TEXT, TEXT) TO authenticated, anon;
