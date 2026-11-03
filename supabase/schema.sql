-- ==============================================================================
-- AM LAUDOS - SCHEMA DE BANCO DE DADOS SUPABASE (POSTGRESQL)
-- Versão: 1.1.0 (Idempotente e Seguro para Re-execução)
-- Em conformidade com: Resolução CFM nº 2.299/2021, 2.314/2022 e LGPD
-- ==============================================================================

-- 1. HABILITAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE tipo_usuario AS ENUM ('ADMIN', 'MEDICO_LAUDISTA', 'TECNICO_CLINICA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prioridade_exame AS ENUM ('EMERGENCIA', 'URGENCIA', 'ELETIVO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_exame AS ENUM ('PENDENTE', 'EM_ANALISE', 'LAUDADO', 'CANCELADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_certificado AS ENUM ('A1_ARQUIVO', 'A3_NUVEM_BIRD_ID', 'A3_TOKEN_NEOID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABELA: CLINICAS (Postos de coleta e unidades solicitantes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnes VARCHAR(50) NOT NULL UNIQUE,
    cnpj VARCHAR(30),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(10) NOT NULL,
    telefone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 4. TABELA: PERFIS (Usuários vinculados à autenticação do Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    tipo tipo_usuario NOT NULL DEFAULT 'TECNICO_CLINICA',
    clinica_id UUID REFERENCES public.clinicas(id) ON DELETE SET NULL,
    crm VARCHAR(50),
    uf_crm VARCHAR(10),
    rqe VARCHAR(50),
    especialidade VARCHAR(100) DEFAULT 'Cardiologia',
    cpf VARCHAR(20) UNIQUE,
    telefone VARCHAR(50),
    avatar_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 5. TABELA: PACIENTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20),
    data_nascimento DATE,
    idade INT,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'O')),
    telefone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 6. TABELA: EXAMES (Fila inteligente de demandas de ECG)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocolo VARCHAR(100) NOT NULL UNIQUE,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE RESTRICT,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE RESTRICT,
    solicitante_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    
    -- Dados clínicos informados no upload
    pressao_arterial VARCHAR(50),
    sintomas TEXT NOT NULL,
    medicamentos TEXT,
    
    -- Triagem e SLA
    prioridade prioridade_exame NOT NULL DEFAULT 'URGENCIA',
    status status_exame NOT NULL DEFAULT 'PENDENTE',
    sla_minutos_total INT NOT NULL DEFAULT 120,
    recebido_em TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    
    -- Arquivo original de ECG
    arquivo_url TEXT NOT NULL,
    arquivo_nome VARCHAR(255) NOT NULL,
    arquivo_tamanho VARCHAR(100),
    arquivo_tipo VARCHAR(100) DEFAULT 'PDF',
    arquivo_checksum_sha256 VARCHAR(100),
    simulacao_tipo_ecg VARCHAR(100) DEFAULT 'NORMAL',
    
    -- Bloqueio de concorrência entre laudistas
    bloqueado_por_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    bloqueado_em TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 7. TABELA: LAUDOS (Parecer médico estruturado)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laudos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exame_id UUID NOT NULL UNIQUE REFERENCES public.exames(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
    
    -- Parâmetros eletrocardiográficos estruturados (VARCHAR(255) para acomodar descrições completas)
    ritmo VARCHAR(255) NOT NULL,
    frequencia_cardiaca INT NOT NULL,
    eixo_qrs VARCHAR(255) NOT NULL,
    intervalo_pr VARCHAR(255) NOT NULL,
    duracao_qrs VARCHAR(255) NOT NULL,
    intervalo_qtc VARCHAR(255) NOT NULL,
    
    -- Textos do parecer
    descricao_achados TEXT NOT NULL,
    conclusao TEXT NOT NULL,
    
    -- PDF final gerado
    pdf_laudo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 8. TABELA: ASSINATURAS_DIGITAIS (Validade jurídica ICP-Brasil e CFM)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assinaturas_digitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laudo_id UUID NOT NULL UNIQUE REFERENCES public.laudos(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
    
    medico_nome VARCHAR(255) NOT NULL,
    crm VARCHAR(50) NOT NULL,
    uf_crm VARCHAR(10) NOT NULL,
    rqe VARCHAR(50),
    
    tipo_certificado tipo_certificado NOT NULL DEFAULT 'A1_ARQUIVO',
    autoridade_certificadora VARCHAR(255) NOT NULL,
    numero_serie VARCHAR(150) NOT NULL,
    
    -- Criptografia e Validação
    hash_sha256 VARCHAR(128) NOT NULL,
    qr_code_url TEXT NOT NULL,
    assinado_em TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    is_qualificada_icp_brasil BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 9. TABELA: MASCARAS_LAUDOS (Templates predefinidos de laudos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mascaras_laudos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL UNIQUE,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    ritmo VARCHAR(255) NOT NULL,
    frequencia_cardiaca INT NOT NULL,
    eixo_qrs VARCHAR(255) NOT NULL,
    intervalo_pr VARCHAR(255) NOT NULL,
    duracao_qrs VARCHAR(255) NOT NULL,
    intervalo_qtc VARCHAR(255) NOT NULL,
    
    descricao_achados TEXT NOT NULL,
    conclusao TEXT NOT NULL,
    
    is_padrao BOOLEAN DEFAULT true,
    criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 10. TABELA: LOGS_AUDITORIA (Trilhas imutáveis para LGPD e CFM)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    tabela_alvo VARCHAR(100),
    registro_id UUID,
    detalhes JSONB,
    ip_origem VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- ------------------------------------------------------------------------------
-- 11. AJUSTES DE TAMANHO CASO AS TABELAS JÁ TENHAM SIDO CRIADAS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE public.laudos ALTER COLUMN eixo_qrs TYPE VARCHAR(255);
    ALTER TABLE public.laudos ALTER COLUMN intervalo_pr TYPE VARCHAR(255);
    ALTER TABLE public.laudos ALTER COLUMN duracao_qrs TYPE VARCHAR(255);
    ALTER TABLE public.laudos ALTER COLUMN intervalo_qtc TYPE VARCHAR(255);
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.mascaras_laudos ALTER COLUMN eixo_qrs TYPE VARCHAR(255);
    ALTER TABLE public.mascaras_laudos ALTER COLUMN intervalo_pr TYPE VARCHAR(255);
    ALTER TABLE public.mascaras_laudos ALTER COLUMN duracao_qrs TYPE VARCHAR(255);
    ALTER TABLE public.mascaras_laudos ALTER COLUMN intervalo_qtc TYPE VARCHAR(255);
EXCEPTION WHEN others THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 12. ÍNDICES DE ALTA PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_exames_status_prioridade ON public.exames (status, prioridade, recebido_em);
CREATE INDEX IF NOT EXISTS idx_exames_protocolo ON public.exames (protocolo);
CREATE INDEX IF NOT EXISTS idx_exames_clinica ON public.exames (clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON public.pacientes (cpf);
CREATE INDEX IF NOT EXISTS idx_laudos_exame ON public.laudos (exame_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_hash ON public.assinaturas_digitais (hash_sha256);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON public.logs_auditoria (usuario_id, created_at);

-- ------------------------------------------------------------------------------
-- 13. TRIGGERS AUTOMÁTICOS: ATUALIZAÇÃO DE updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('America/Sao_Paulo', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinicas_updated_at ON public.clinicas;
CREATE TRIGGER trigger_clinicas_updated_at BEFORE UPDATE ON public.clinicas
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_perfis_updated_at ON public.perfis;
CREATE TRIGGER trigger_perfis_updated_at BEFORE UPDATE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_pacientes_updated_at ON public.pacientes;
CREATE TRIGGER trigger_pacientes_updated_at BEFORE UPDATE ON public.pacientes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_exames_updated_at ON public.exames;
CREATE TRIGGER trigger_exames_updated_at BEFORE UPDATE ON public.exames
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_laudos_updated_at ON public.laudos;
CREATE TRIGGER trigger_laudos_updated_at BEFORE UPDATE ON public.laudos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 14. TRIGGER: ATUALIZA STATUS DO EXAME PARA 'LAUDADO'
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_laudo_concluido()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.exames
    SET status = 'LAUDADO',
        updated_at = TIMEZONE('America/Sao_Paulo', NOW())
    WHERE id = NEW.exame_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_laudo_concluido ON public.laudos;
CREATE TRIGGER trigger_laudo_concluido AFTER INSERT ON public.laudos
FOR EACH ROW EXECUTE FUNCTION public.handle_laudo_concluido();

-- ------------------------------------------------------------------------------
-- 15. POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_digitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascaras_laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Limpar e recriar políticas para garantir re-execução sem erro
DROP POLICY IF EXISTS "Permitir leitura de clinicas ativas para autenticados" ON public.clinicas;
CREATE POLICY "Permitir leitura de clinicas ativas para autenticados"
ON public.clinicas FOR SELECT TO authenticated USING (ativo = true);

DROP POLICY IF EXISTS "Admins podem gerenciar clinicas" ON public.clinicas;
CREATE POLICY "Admins podem gerenciar clinicas"
ON public.clinicas FOR ALL TO authenticated
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'ADMIN'
  OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'g2autodev@gmail.com'
)
WITH CHECK (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'ADMIN'
  OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'g2autodev@gmail.com'
);

DROP POLICY IF EXISTS "Permitir leitura de mascaras de laudos" ON public.mascaras_laudos;
CREATE POLICY "Permitir leitura de mascaras de laudos"
ON public.mascaras_laudos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios podem visualizar seus proprios perfis" ON public.perfis;
CREATE POLICY "Usuarios podem visualizar seus proprios perfis"
ON public.perfis FOR SELECT TO authenticated
USING (auth.uid() = id OR (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'ADMIN');

DROP POLICY IF EXISTS "Usuarios podem atualizar seus proprios perfis" ON public.perfis;
CREATE POLICY "Usuarios podem atualizar seus proprios perfis"
ON public.perfis FOR UPDATE TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Laudistas podem visualizar todos os exames" ON public.exames;
CREATE POLICY "Laudistas podem visualizar todos os exames"
ON public.exames FOR SELECT TO authenticated
USING (
    (SELECT tipo FROM public.perfis WHERE id = auth.uid()) IN ('MEDICO_LAUDISTA', 'ADMIN')
    OR clinica_id = (SELECT clinica_id FROM public.perfis WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Clinicas podem inserir novos exames" ON public.exames;
CREATE POLICY "Clinicas podem inserir novos exames"
ON public.exames FOR INSERT TO authenticated
WITH CHECK (
    clinica_id = (SELECT clinica_id FROM public.perfis WHERE id = auth.uid())
    OR (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'ADMIN'
);

DROP POLICY IF EXISTS "Laudistas e solicitantes podem visualizar laudos" ON public.laudos;
CREATE POLICY "Laudistas e solicitantes podem visualizar laudos"
ON public.laudos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Apenas laudistas podem inserir laudos" ON public.laudos;
CREATE POLICY "Apenas laudistas podem inserir laudos"
ON public.laudos FOR INSERT TO authenticated
WITH CHECK (
    (SELECT tipo FROM public.perfis WHERE id = auth.uid()) IN ('MEDICO_LAUDISTA', 'ADMIN')
);

DROP POLICY IF EXISTS "Apenas laudistas podem assinar digitalmente" ON public.assinaturas_digitais;
CREATE POLICY "Apenas laudistas podem assinar digitalmente"
ON public.assinaturas_digitais FOR INSERT TO authenticated
WITH CHECK (
    (SELECT tipo FROM public.perfis WHERE id = auth.uid()) IN ('MEDICO_LAUDISTA', 'ADMIN')
);

-- Políticas de Consulta Pública (Validador de Laudos / QR Code)
DROP POLICY IF EXISTS "Permitir validacao publica por protocolo ou hash" ON public.assinaturas_digitais;
CREATE POLICY "Permitir validacao publica por protocolo ou hash"
ON public.assinaturas_digitais FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Permitir leitura de laudo no validador publico" ON public.laudos;
CREATE POLICY "Permitir leitura de laudo no validador publico"
ON public.laudos FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Permitir leitura basica de exame no validador publico" ON public.exames;
CREATE POLICY "Permitir leitura basica de exame no validador publico"
ON public.exames FOR SELECT TO anon USING (true);

-- ------------------------------------------------------------------------------
-- 16. BUCKETS DE STORAGE DO SUPABASE
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('exames', 'exames', false),
    ('laudos', 'laudos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload de exames por usuarios autenticados" ON storage.objects;
CREATE POLICY "Upload de exames por usuarios autenticados"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exames');

DROP POLICY IF EXISTS "Download de exames por usuarios autenticados" ON storage.objects;
CREATE POLICY "Download de exames por usuarios autenticados"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exames');

DROP POLICY IF EXISTS "Leitura publica de PDFs de laudos emitidos" ON storage.objects;
CREATE POLICY "Leitura publica de PDFs de laudos emitidos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'laudos');

DROP POLICY IF EXISTS "Laudistas podem salvar PDFs de laudos finalizados" ON storage.objects;
CREATE POLICY "Laudistas podem salvar PDFs de laudos finalizados"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'laudos');

-- ------------------------------------------------------------------------------
-- 17. DADOS INICIAIS (SEEDS): CLÍNICAS E MÁSCARAS DE LAUDO
-- ------------------------------------------------------------------------------
INSERT INTO public.clinicas (id, nome, cnes, cidade, estado, telefone)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Centro Médico São Lucas', '2849102', 'Campinas', 'SP', '(19) 3456-7890'),
    ('c2222222-2222-2222-2222-222222222222', 'Hospital e Pronto Atendimento Vida', '7492810', 'Belo Horizonte', 'MG', '(31) 3222-1100'),
    ('c3333333-3333-3333-3333-333333333333', 'Clínica CardioMed Diagnósticos', '1092834', 'Curitiba', 'PR', '(41) 3340-9988')
ON CONFLICT (cnes) DO NOTHING;

INSERT INTO public.mascaras_laudos (nome, categoria, descricao, ritmo, frequencia_cardiaca, eixo_qrs, intervalo_pr, duracao_qrs, intervalo_qtc, descricao_achados, conclusao)
VALUES
    (
        'Eletrocardiograma Normal',
        'Normal',
        'Traçado sem alterações patológicas, ritmo sinusal preservado.',
        'Ritmo sinusal regular',
        72,
        '+45° (Normal)',
        '160 ms (Normal)',
        '88 ms (Normal)',
        '412 ms (Normal - Bazzet)',
        'Ondas P de morfologia e orientação normais em todas as derivações. Intervalo PR normal. Complexos QRS com amplitude, duração e morfologia preservadas. Segmento ST nivelado na linha de base. Ondas T assimétricas, concordantes com o QRS nas derivações periféricas e precordiais.',
        'Eletrocardiograma dentro dos limites da normalidade para a faixa etária.'
    ),
    (
        'Fibrilação Atrial (FA)',
        'Arritmias',
        'Ausência de onda P, ritmo irregular com ondas f de fibrilação.',
        'Fibrilação Atrial com resposta ventricular moderada',
        98,
        '+30°',
        'Não mensurável (ausência de ondas P organizadas)',
        '92 ms',
        '425 ms',
        'Ausência de ondas P sinusais identificáveis, substituídas por ondulações irregulares da linha de base (ondas f). Intervalos R-R absolutamente irregulares. Complexos QRS estreitos, com repolarização ventricular sem evidência de supradesnivelamento agudo de ST.',
        'Fibrilação atrial de resposta ventricular moderada. Sugere-se correlação clínica e avaliação de escores de risco tromboembólico (CHA2DS2-VASc).'
    ),
    (
        'Bloqueio de Ramo Esquerdo (BRE)',
        'Bloqueios',
        'QRS alargado >= 120ms com padrão rS em V1 e R alargado/entalhado em V6.',
        'Ritmo sinusal regular',
        68,
        '-15° (Desvio para a esquerda)',
        '180 ms',
        '144 ms (Alargado)',
        '468 ms (Prolongado secundário ao distúrbio de condução)',
        'QRS alargado com duração de 144 ms. Ausência de onda Q septal em D1, aVL e V6. Presença de onda R alargada e entalhada em D1, aVL, V5 e V6. Padrão rS com S profunda em V1 e V2. Alteração secundária da repolarização ventricular com desnivelamento do segmento ST oposto ao vetor principal do QRS.',
        'Bloqueio completo do ramo esquerdo (BRE de 3º grau). Recomenda-se correlação ecocardiográfica para avaliação da função ventricular esquerda.'
    ),
    (
        'Sobrecarga Ventricular Esquerda (SVE)',
        'Sobrecargas',
        'Critérios de Sokolow-Lyon e Cornell positivos com padrão de strain.',
        'Ritmo sinusal regular',
        78,
        '+10°',
        '170 ms',
        '104 ms',
        '438 ms',
        'Aumento da voltagem dos complexos QRS nas derivações precordiais. Índice de Sokolow-Lyon positivo (S em V1 + R em V5/V6 = 42 mm, valor de referência > 35 mm). Alterações de repolarização ventricular tipo "strain" com infradesnivelamento assimétrico do segmento ST e inversão de onda T em V5, V6, D1 e aVL.',
        'Sobrecarga ventricular esquerda acentuada com padrão de sobrecarga sistólica (strain). Compatível com cardiopatia hipertensiva crônica.'
    ),
    (
        'Isquemia Subepicárdica Anterior / IAM',
        'Isquemia',
        'Inversão simétrica de onda T ou supradesnivelamento de ST.',
        'Ritmo sinusal regular',
        88,
        '+60°',
        '165 ms',
        '96 ms',
        '455 ms',
        'Supradesnivelamento convexo do segmento ST de 3.5 mm nas derivações precordiais anteriores (V1 a V4), com imagem recíproca (infradesnivelamento em D2, D3 e aVF). Ondas T hiperagudas e simétricas.',
        'SÍNDROME CORONARIANA AGUDA COM SUPRADESNIVELAMENTO DO SEGMENTO ST (IAMCSST) DE PAREDE ANTERIOR EXTENSA. ACHADO CRÍTICO DE EMERGÊNCIA MÉDICA: ENCAMINHAMENTO IMEDIATO PARA SERVIÇO DE HEMODINÂMICA / PROTOCOLO DE DOR TORÁCICA.'
    ),
    (
        'Bradicardia Sinusal',
        'Arritmias',
        'Ritmo sinusal com frequência cardíaca inferior a 50 bpm.',
        'Bradicardia sinusal',
        46,
        '+50°',
        '175 ms',
        '86 ms',
        '405 ms',
        'Ritmo sinusal de baixa frequência (46 bpm). Condução atrioventricular e intraventricular normais. Sem alterações agudas do segmento ST ou da onda T.',
        'Bradicardia sinusal. Sugere-se correlacionar com nível de condicionamento físico (atleta) ou uso de cronotrópicos negativos (beta-bloqueadores, bloqueadores de canal de cálcio).'
    )
ON CONFLICT (nome) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 12. AUTOMAÇÃO DE CRIAÇÃO DE PERFIL VIA TRIGGER (auth.users -> public.perfis)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Usuarios podem criar seu proprio perfil" ON public.perfis;
CREATE POLICY "Usuarios podem criar seu proprio perfil"
ON public.perfis FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, tipo, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email = 'g2autodev@gmail.com' OR new.email ILIKE '%admin%' THEN 'ADMIN'::tipo_usuario
      WHEN new.email ILIKE '%medico%' OR new.email ILIKE '%cardio%' THEN 'MEDICO_LAUDISTA'::tipo_usuario
      ELSE 'TECNICO_CLINICA'::tipo_usuario
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
