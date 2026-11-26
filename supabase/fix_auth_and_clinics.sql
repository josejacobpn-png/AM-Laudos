-- ==============================================================================
-- AM LAUDOS - CORREÇÃO DEFINITIVA DO GOTRUE E FUNÇÃO ADMIN_SALVAR_USUARIO
-- Elimina para sempre o erro 'Database error querying schema' em novas clínicas
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ------------------------------------------------------------------------------
-- 1. CORRIGIR TODOS OS USUÁRIOS ATUAIS NO SUPABASE AUTH (auth.users)
-- Preenche as colunas de token que o GoTrue exige como String não-nula
-- ------------------------------------------------------------------------------
UPDATE auth.users
SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    phone = COALESCE(phone, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    is_sso_user = COALESCE(is_sso_user, false),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE confirmation_token IS NULL 
   OR recovery_token IS NULL 
   OR email_change IS NULL 
   OR phone IS NULL;

-- ------------------------------------------------------------------------------
-- 2. GARANTIR A IDENTIDADE (auth.identities) PARA TODOS OS USUÁRIOS EXISTENTES
-- O GoTrue exige uma linha em auth.identities vinculada ao user_id
-- ------------------------------------------------------------------------------
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    id, -- UUID
    id, -- UUID
    jsonb_build_object('sub', id::text, 'email', LOWER(email)),
    'email',
    id::text,
    NOW(),
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. REDEFINIR A FUNÇÃO admin_salvar_usuario DE FORMA 100% COMPATÍVEL COM O GOTRUE
-- Qualquer nova clínica ou médico criado no futuro já nasce com identity e tokens corretos
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_salvar_usuario(
  p_email TEXT,
  p_senha TEXT,
  p_nome TEXT,
  p_tipo TEXT DEFAULT 'TECNICO_CLINICA',
  p_clinica_id UUID DEFAULT NULL,
  p_crm TEXT DEFAULT NULL,
  p_uf TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_clean_email TEXT;
  v_encrypted_password TEXT;
BEGIN
  v_clean_email := LOWER(TRIM(p_email));

  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'E-mail não pode ser vazio.');
  END IF;

  IF p_senha IS NOT NULL AND length(p_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A senha deve conter no mínimo 6 caracteres.');
  END IF;

  -- Verificar se usuário já existe no auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = v_clean_email;

  IF v_user_id IS NOT NULL THEN
    -- 1. Atualizar usuário existente
    IF p_senha IS NOT NULL AND TRIM(p_senha) <> '' THEN
      UPDATE auth.users
      SET 
        encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        phone = COALESCE(phone, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        is_sso_user = COALESCE(is_sso_user, false),
        raw_user_meta_data = jsonb_build_object(
          'nome_completo', p_nome,
          'tipo', p_tipo,
          'clinica_id', p_clinica_id,
          'crm', p_crm,
          'uf_crm', p_uf
        ),
        updated_at = NOW()
      WHERE id = v_user_id;
    ELSE
      UPDATE auth.users
      SET 
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        phone = COALESCE(phone, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        is_sso_user = COALESCE(is_sso_user, false),
        raw_user_meta_data = jsonb_build_object(
          'nome_completo', p_nome,
          'tipo', p_tipo,
          'clinica_id', p_clinica_id,
          'crm', p_crm,
          'uf_crm', p_uf
        ),
        updated_at = NOW()
      WHERE id = v_user_id;
    END IF;
  ELSE
    -- 2. Criar novo usuário diretamente com confirmação de e-mail imediata
    IF p_senha IS NULL OR TRIM(p_senha) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Informe uma senha para o novo usuário.');
    END IF;

    v_user_id := gen_random_uuid();
    v_encrypted_password := extensions.crypt(p_senha, extensions.gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      reauthentication_token,
      phone,
      phone_change,
      phone_change_token,
      is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_clean_email,
      v_encrypted_password,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'nome_completo', p_nome,
        'tipo', p_tipo,
        'clinica_id', p_clinica_id,
        'crm', p_crm,
        'uf_crm', p_uf
      ),
      NOW(),
      NOW(),
      '', -- confirmation_token
      '', -- recovery_token
      '', -- email_change
      '', -- email_change_token_new
      '', -- email_change_token_current
      '', -- reauthentication_token
      '', -- phone
      '', -- phone_change
      '', -- phone_change_token
      false -- is_sso_user
    );
  END IF;

  -- 3. Inserir ou atualizar na tabela auth.identities (obrigatório para o GoTrue)
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
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  -- 4. Atualizar ou inserir na tabela public.perfis
  INSERT INTO public.perfis (
    id,
    nome_completo,
    tipo,
    clinica_id,
    crm,
    uf_crm,
    ativo,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_nome,
    p_tipo::tipo_usuario,
    p_clinica_id,
    p_crm,
    p_uf,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    tipo = EXCLUDED.tipo,
    clinica_id = COALESCE(EXCLUDED.clinica_id, public.perfis.clinica_id),
    crm = COALESCE(EXCLUDED.crm, public.perfis.crm),
    uf_crm = COALESCE(EXCLUDED.uf_crm, public.perfis.uf_crm),
    ativo = true,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_salvar_usuario(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated, anon;
