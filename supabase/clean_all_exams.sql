-- ==============================================================================
-- AM LAUDOS - SCRIPT DE LIMPEZA DEFINITIVA DA FILA E AUDITORIA (PRODUÇÃO)
-- Finalidade: Zerar todos os laudos, exames de ECG, pacientes de teste
-- e registros de auditoria vinculados para iniciar os testes do zero.
--
-- PRESERVA INTACTOS:
--   ✔ Clínicas cadastradas (tabela 'clinicas')
--   ✔ Médicos laudistas e perfis (tabela 'perfis')
--   ✔ Logins e senhas (tabela 'auth.users')
--   ✔ Modelos e máscaras de laudo (tabela 'mascaras_laudos')
-- ==============================================================================

BEGIN;

-- 1. Excluir assinaturas digitais de teste
DELETE FROM public.assinaturas_digitais;

-- 2. Excluir laudos médicos emitidos durante os testes
DELETE FROM public.laudos;

-- 3. Excluir exames da fila de triagem
DELETE FROM public.exames;

-- 4. Excluir pacientes cadastrados nos testes
DELETE FROM public.pacientes;

-- 5. Limpar logs da trilha de auditoria
DELETE FROM public.logs_auditoria 
WHERE tabela_alvo IN ('exames', 'laudos', 'assinaturas_digitais', 'pacientes');

COMMIT;

-- ------------------------------------------------------------------------------
-- HABILITAR POLÍTICAS DE EXCLUSÃO (DELETE) PARA O FUTURO
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Exclusao de assinaturas para autenticados" ON public.assinaturas_digitais;
CREATE POLICY "Exclusao de assinaturas para autenticados"
ON public.assinaturas_digitais FOR DELETE TO authenticated
USING (true);

DROP POLICY IF EXISTS "Exclusao de laudos para autenticados" ON public.laudos;
CREATE POLICY "Exclusao de laudos para autenticados"
ON public.laudos FOR DELETE TO authenticated
USING (true);

DROP POLICY IF EXISTS "Exclusao de exames para autenticados" ON public.exames;
CREATE POLICY "Exclusao de exames para autenticados"
ON public.exames FOR DELETE TO authenticated
USING (true);

DROP POLICY IF EXISTS "Exclusao de pacientes para autenticados" ON public.pacientes;
CREATE POLICY "Exclusao de pacientes para autenticados"
ON public.pacientes FOR DELETE TO authenticated
USING (true);

-- ------------------------------------------------------------------------------
-- VERIFICAÇÃO PÓS-LIMPEZA: Todas as contagens devem ser 0
-- ------------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM public.exames) AS total_exames,
    (SELECT COUNT(*) FROM public.laudos) AS total_laudos,
    (SELECT COUNT(*) FROM public.pacientes) AS total_pacientes,
    (SELECT COUNT(*) FROM public.assinaturas_digitais) AS total_assinaturas;
