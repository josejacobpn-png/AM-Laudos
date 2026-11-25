-- ==============================================================================
-- AM LAUDOS - CORREÇÃO COMPLETA DE AUTENTICAÇÃO DO SUPABASE (GOTRUE)
-- Resolve o erro "Database error querying schema" preenchendo as colunas de token
-- exigidas pelo GoTrue e criando o registro correspondente em auth.identities.
-- ==============================================================================

-- 1. CORREÇÃO DAS COLUNAS DE TEXTO DO GOTRUE (Elimina o erro "Database error querying schema")
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
WHERE email = 'jurandir@amlaudos.com';

-- 2. REGISTRAR IDENTIDADE NO auth.identities (Obrigatório para o GoTrue)
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
    id::text,
    id,
    jsonb_build_object('sub', id::text, 'email', LOWER(email)),
    'email',
    id::text,
    NOW(),
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'jurandir@amlaudos.com'
ON CONFLICT (provider, provider_id) DO NOTHING;

-- 3. GARANTIR A SENHA '123456' E O PERFIL DA CLÍNICA
UPDATE auth.users
SET 
    encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'jurandir@amlaudos.com';

INSERT INTO public.perfis (
    id,
    nome_completo,
    tipo,
    clinica_id,
    ativo,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'CSF JURANDIR CARVALHO',
    'TECNICO_CLINICA'::tipo_usuario,
    '771769a3-ab20-48eb-a07c-ec30a688900f'::uuid,
    true,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'jurandir@amlaudos.com'
ON CONFLICT (id) DO UPDATE SET
    tipo = 'TECNICO_CLINICA'::tipo_usuario,
    clinica_id = '771769a3-ab20-48eb-a07c-ec30a688900f'::uuid,
    ativo = true,
    updated_at = NOW();

-- 4. ATUALIZAR FUNÇÃO ADMIN_SALVAR_USUARIO COM SUPORTE TOTAL AO GOTRUE
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
  v_encrypted_password TEXT;
BEGIN
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'E-mail não pode ser vazio.');
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_user_id IS NOT NULL THEN
    -- Atualizar senha e garantir colunas limpas para o GoTrue
    IF p_senha IS NOT NULL AND length(p_senha) >= 6 THEN
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

    -- Garantir identidade no auth.identities
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
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', LOWER(TRIM(p_email))),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT (provider, provider_id) DO NOTHING;

  ELSE
    -- Criar novo usuário com todas as colunas de texto preenchidas para o GoTrue
    IF p_senha IS NULL OR length(p_senha) < 6 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Informe uma senha com no mínimo 6 caracteres para o novo usuário.');
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
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      reauthentication_token,
      phone,
      phone_change,
      phone_change_token,
      is_sso_user,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      LOWER(TRIM(p_email)),
      v_encrypted_password,
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      false,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'nome_completo', p_nome,
        'tipo', p_tipo,
        'clinica_id', p_clinica_id,
        'crm', p_crm,
        'uf_crm', p_uf
      ),
      NOW(),
      NOW()
    );

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
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', LOWER(TRIM(p_email))),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  -- Inserir / Atualizar perfil
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
