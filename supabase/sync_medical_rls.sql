-- ==============================================================================
-- AM LAUDOS - POLÍTICAS DE RLS PARA SINCRONIZAÇÃO EM NUVEM MULTI-COMPUTADOR
-- Permite que exames enviados por uma clínica sejam recebidos imediatamente
-- por qualquer médico laudista e pelo painel administrativo em outros computadores.
-- ==============================================================================

-- Habilitar RLS nas tabelas médicas
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_digitais ENABLE ROW LEVEL SECURITY;

-- 1. PACIENTES
DROP POLICY IF EXISTS "Acesso completo a pacientes para autenticados" ON public.pacientes;
CREATE POLICY "Acesso completo a pacientes para autenticados"
ON public.pacientes FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 2. EXAMES
DROP POLICY IF EXISTS "Leitura de exames para autenticados" ON public.exames;
DROP POLICY IF EXISTS "Laudistas podem visualizar todos os exames" ON public.exames;
CREATE POLICY "Leitura de exames para autenticados"
ON public.exames FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Insercao de exames para autenticados" ON public.exames;
DROP POLICY IF EXISTS "Clinicas podem inserir novos exames" ON public.exames;
CREATE POLICY "Insercao de exames para autenticados"
ON public.exames FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizacao de exames para autenticados" ON public.exames;
CREATE POLICY "Atualizacao de exames para autenticados"
ON public.exames FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- 3. LAUDOS
DROP POLICY IF EXISTS "Gerenciamento de laudos para autenticados" ON public.laudos;
DROP POLICY IF EXISTS "Laudistas e solicitantes podem visualizar laudos" ON public.laudos;
DROP POLICY IF EXISTS "Apenas laudistas podem inserir laudos" ON public.laudos;
CREATE POLICY "Gerenciamento de laudos para autenticados"
ON public.laudos FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 4. ASSINATURAS DIGITAIS
DROP POLICY IF EXISTS "Gerenciamento de assinaturas para autenticados" ON public.assinaturas_digitais;
DROP POLICY IF EXISTS "Apenas laudistas podem assinar digitalmente" ON public.assinaturas_digitais;
CREATE POLICY "Gerenciamento de assinaturas para autenticados"
ON public.assinaturas_digitais FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
