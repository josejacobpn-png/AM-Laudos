-- ==============================================================================
-- AM LAUDOS - REGULARIZAÇÃO DO USUÁRIO NO GOTRUE DO SUPABASE
-- ==============================================================================

-- 1. PREENCHER AS COLUNAS QUE O GOTRUE EXIGE COMO STRING (Elimina o Database error querying schema)
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

-- 2. REGISTRAR IDENTIDADE NO auth.identities (id é do tipo UUID)
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
