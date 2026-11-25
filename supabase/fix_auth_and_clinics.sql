-- ==============================================================================
-- AM LAUDOS - CORREÇÃO DE AUTENTICAÇÃO E CADASTRO DE CLÍNICAS/MÉDICOS
-- ==============================================================================
-- Este script:
-- 1. Garante que pgcrypto esteja no schema 'extensions'.
-- 2. Corrige o trigger 'handle_new_user' para evitar erro 500 no Supabase Auth.
-- 3. Cria a função RPC 'admin_salvar_usuario' que cadastra/atualiza usuários
--    já com o e-mail confirmado imediatamente (sem bloqueio de confirmação de e-mail).
-- 4. Cadastra/ativa o acesso da clínica 'CSF JURANDIR CARVALHO' (jurandir@amlaudos.com).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 1. CORREÇÃO DO TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tipo tipo_usuario;
  v_crm VARCHAR;
  v_uf VARCHAR;
  v_especialidade VARCHAR;
  v_clinica_id UUID;
BEGIN
  IF (new.raw_user_meta_data->>'tipo') IS NOT NULL THEN
    BEGIN
      v_tipo := (new.raw_user_meta_data->>'tipo')::tipo_usuario;
    EXCEPTION WHEN OTHERS THEN
      v_tipo := 'TECNICO_CLINICA'::tipo_usuario;
    END;
  ELSIF new.email = 'g2autodev@gmail.com' OR new.email ILIKE '%admin%' THEN
    v_tipo := 'ADMIN'::tipo_usuario;
  ELSIF (new.raw_user_meta_data->>'crm') IS NOT NULL OR new.email ILIKE '%medico%' OR new.email ILIKE '%cardio%' OR new.email ILIKE '%dr%' THEN
    v_tipo := 'MEDICO_LAUDISTA'::tipo_usuario;
  ELSE
    v_tipo := 'TECNICO_CLINICA'::tipo_usuario;
  END IF;

  v_crm := new.raw_user_meta_data->>'crm';
  v_uf := new.raw_user_meta_data->>'uf_crm';
  v_especialidade := COALESCE(new.raw_user_meta_data->>'especialidade', 'Cardiologia Clínica');
  
  BEGIN
    v_clinica_id := NULLIF(new.raw_user_meta_data->>'clinica_id', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_clinica_id := NULL;
  END;

  INSERT INTO public.perfis (id, nome_completo, tipo, crm, uf_crm, especialidade, clinica_id, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', split_part(new.email, '@', 1)),
    v_tipo,
    v_crm,
    v_uf,
    v_especialidade,
    v_clinica_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    nome_completo = COALESCE(EXCLUDED.nome_completo, public.perfis.nome_completo),
    crm = COALESCE(EXCLUDED.crm, public.perfis.crm),
    uf_crm = COALESCE(EXCLUDED.uf_crm, public.perfis.uf_crm),
    especialidade = COALESCE(EXCLUDED.especialidade, public.perfis.especialidade),
    clinica_id = COALESCE(EXCLUDED.clinica_id, public.perfis.clinica_id),
    updated_at = NOW();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. FUNÇÃO ADMINISTRATIVA DE CRIAÇÃO E ATUALIZAÇÃO IMEDIATA DE USUÁRIOS
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

  IF p_senha IS NOT NULL AND length(p_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A senha deve conter no mínimo 6 caracteres.');
  END IF;

  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_user_id IS NOT NULL THEN
    -- Atualizar usuário existente (senha e dados)
    IF p_senha IS NOT NULL AND TRIM(p_senha) <> '' THEN
      UPDATE auth.users
      SET 
        encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
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
    -- Criar novo usuário com e-mail já confirmado
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
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      LOWER(TRIM(p_email)),
      v_encrypted_password,
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'nome_completo', p_nome,
        'tipo', p_tipo,
        'clinica_id', p_clinica_id,
        'crm', p_crm,
        'uf_crm', p_uf
      ),
      NOW(),
      NOW(),
      '',
      ''
    );
  END IF;

  -- 3. Atualizar ou inserir na tabela public.perfis
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

-- 4. ATIVAÇÃO IMEDIATA DO ACESSO DA CLÍNICA 'CSF JURANDIR CARVALHO'
SELECT public.admin_salvar_usuario(
  'jurandir@amlaudos.com',
  '123456',
  'CSF JURANDIR CARVALHO',
  'TECNICO_CLINICA',
  '771769a3-ab20-48eb-a07c-ec30a688900f'
);
