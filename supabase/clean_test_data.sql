-- ==============================================================================
-- AM LAUDOS - SCRIPT DE LIMPEZA DE DADOS DE TESTE (PRODUÇÃO)
-- Finalidade: Zerar exames, laudos e pacientes de teste para início de operação real.
--
-- PRESERVA INTACTOS:
--   ✔ Clínicas cadastradas (tabela 'clinicas')
--   ✔ Médicos laudistas e perfis de usuários (tabela 'perfis')
--   ✔ Credenciais de acesso e senhas (tabela 'auth.users')
--   ✔ Máscaras e templates padrão de laudos (tabela 'mascaras_laudos')
--
-- REMOVE DEFINITIVAMENTE:
--   ✖ Assinaturas digitais de teste (tabela 'assinaturas_digitais')
--   ✖ Laudos médicos emitidos durante testes (tabela 'laudos')
--   ✖ Exames e traçados da fila (tabela 'exames')
--   ✖ Pacientes fictícios de teste (tabela 'pacientes')
--   ✖ Logs de auditoria vinculados a esses testes
--
-- NOTA SOBRE STORAGE:
--   O Supabase bloqueia a exclusão direta via SQL na tabela 'storage.objects'
--   por segurança interna (trigger storage.protect_delete). 
--   Caso haja arquivos na aba Storage do painel, eles podem ser excluídos
--   diretamente pela interface do Supabase Storage.
-- ==============================================================================

BEGIN;

-- 1. Excluir assinaturas digitais emitidas nos testes
DELETE FROM public.assinaturas_digitais;

-- 2. Excluir pareceres e laudos de teste
DELETE FROM public.laudos;

-- 3. Excluir exames de ECG e registros de triagem de teste
DELETE FROM public.exames;

-- 4. Excluir pacientes criados durante os testes
DELETE FROM public.pacientes;

-- 5. Limpar logs de auditoria referentes às tabelas de teste
DELETE FROM public.logs_auditoria 
WHERE tabela_alvo IN ('exames', 'laudos', 'assinaturas_digitais', 'pacientes');

COMMIT;

-- ------------------------------------------------------------------------------
-- VERIFICAÇÃO PÓS-LIMPEZA: Conforme esperado, todas as contagens devem ser 0
-- ------------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM public.exames) AS total_exames,
    (SELECT COUNT(*) FROM public.laudos) AS total_laudos,
    (SELECT COUNT(*) FROM public.assinaturas_digitais) AS total_assinaturas,
    (SELECT COUNT(*) FROM public.pacientes) AS total_pacientes,
    (SELECT COUNT(*) FROM public.clinicas) AS clinicas_preservadas,
    (SELECT COUNT(*) FROM public.perfis) AS perfis_preservados;
