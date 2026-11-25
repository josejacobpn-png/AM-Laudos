-- ==============================================================================
-- AM LAUDOS - SCRIPT DE LIMPEZA DE DADOS DE TESTE (PRODUÇÃO)
-- Finalidade: Zerar exames, laudos, pacientes e arquivos de teste para início de operação real.
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
--   ✖ Arquivos/PDFs de teste nos buckets de storage ('exames' e 'laudos')
--   ✖ Logs de auditoria vinculados a esses testes (opcional)
--
-- COMO EXECUTAR NO SUPABASE:
--   1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/giexcrlytwgnfyaaunjl
--   2. No menu lateral esquerdo, clique em "SQL Editor".
--   3. Cole este script e clique no botão verde "Run" (ou pressione Ctrl+Enter).
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

-- 5. Excluir arquivos de teste anexados aos buckets do Supabase Storage
DELETE FROM storage.objects 
WHERE bucket_id IN ('exames', 'laudos');

-- 6. Limpar logs de auditoria referentes às tabelas de teste
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
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id IN ('exames', 'laudos')) AS total_arquivos_storage,
    (SELECT COUNT(*) FROM public.clinicas) AS clinicas_preservadas,
    (SELECT COUNT(*) FROM public.perfis) AS perfis_preservados;
