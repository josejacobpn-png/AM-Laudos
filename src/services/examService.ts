import { supabase, isSupabaseConfigured } from './supabase';
import type { Exam, Report, DigitalSignature } from '../types';
import { saveExamFile } from '../utils/fileStorage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Gera um UUID v4 válido compatível com o PostgreSQL
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Converte linhas do Supabase para a interface Exam
 */
export function mapRemoteExamToLocal(row: any): Exam {
  const patientData = row.pacientes || {};
  const clinicData = row.clinicas || {};
  const laudoData = Array.isArray(row.laudos) ? row.laudos[0] : row.laudos;
  const assinaturaData = laudoData && Array.isArray(laudoData.assinaturas_digitais)
    ? laudoData.assinaturas_digitais[0]
    : laudoData?.assinaturas_digitais;

  let report: Report | undefined = undefined;
  if (laudoData) {
    let signature: DigitalSignature | undefined = undefined;
    if (assinaturaData) {
      signature = {
        doctorName: assinaturaData.medico_nome || 'Dr(a). Laudista',
        crm: assinaturaData.crm || '',
        uf: assinaturaData.uf_crm || 'SP',
        rqe: assinaturaData.rqe,
        certificateType: assinaturaData.tipo_certificado || 'A1_ARQUIVO',
        signedAt: assinaturaData.assinado_em || laudoData.created_at,
        sha256Hash: assinaturaData.hash_sha256 || '',
        qrCodeValidationUrl: assinaturaData.qr_code_url || '',
        certificateAuthority: assinaturaData.autoridade_certificadora || 'AC VALID Brasil ICP-Brasil',
        serialNumber: assinaturaData.numero_serie || '7894-B6C2',
        isQualifiedIcpBrasil: assinaturaData.is_qualificada_icp_brasil !== false
      };
    }

    report = {
      id: laudoData.id,
      examId: row.id,
      doctorName: signature?.doctorName || 'Dr(a). Médico Laudista',
      doctorCrm: signature?.crm || '',
      doctorUf: signature?.uf || 'SP',
      doctorRqe: signature?.rqe,
      rhythm: laudoData.ritmo || 'Sinusal',
      heartRate: laudoData.frequencia_cardiaca || 75,
      prInterval: laudoData.intervalo_pr || '160 ms',
      qrsDuration: laudoData.duracao_qrs || '88 ms',
      qtcInterval: laudoData.intervalo_qtc || '410 ms',
      qrsAxis: laudoData.eixo_qrs || '+45 graus',
      findings: laudoData.descricao_achados || '',
      conclusion: laudoData.conclusao || '',
      signature,
      createdAt: laudoData.created_at || row.recebido_em
    };
  }

  // Cálculo de minutos restantes baseado na data de recebimento e SLA
  let remainingMinutes = row.sla_minutos_total || 120;
  if (row.recebido_em) {
    const elapsedMinutes = Math.floor((Date.now() - new Date(row.recebido_em).getTime()) / 60000);
    remainingMinutes = Math.max(0, (row.sla_minutos_total || 120) - elapsedMinutes);
  }

  const rawUrl = row.arquivo_url && !row.arquivo_url.includes('laudos.amlaudos.com.br') ? row.arquivo_url : undefined;
  const isData = rawUrl?.startsWith('data:') || false;

  return {
    id: row.id,
    protocolNumber: row.protocolo,
    clinicId: row.clinica_id,
    clinicName: clinicData.nome || 'Clínica Conveniada',
    priority: row.prioridade,
    status: row.status,
    receivedAt: row.recebido_em,
    slaMinutesTotal: row.sla_minutos_total || 120,
    remainingMinutes: row.status === 'LAUDADO' ? 0 : remainingMinutes,
    fileName: row.arquivo_nome || 'exame_ecg.pdf',
    fileSize: row.arquivo_tamanho || '1.0 MB',
    fileType: row.arquivo_tipo || 'PDF',
    simulatedEcgType: row.simulacao_tipo_ecg || 'NORMAL',
    fileUrl: rawUrl,
    fileDataUrl: isData ? rawUrl : undefined,
    lockedByDoctor: row.bloqueado_por_id ? 'Em análise por outro médico' : undefined,
    report,
    patient: {
      id: patientData.id || generateUUID(),
      name: patientData.nome || 'Paciente ' + (row.protocolo || row.id?.slice(0, 6)),
      cpf: patientData.cpf || '000.***.***-00',
      age: patientData.idade || 52,
      gender: patientData.sexo || 'M',
      bloodPressure: row.pressao_arterial,
      symptoms: row.sintomas || 'Exame de rotina',
      medications: row.medicamentos || 'Nenhum'
    }
  };
}

/**
 * Busca todos os exames em tempo real direto do Supabase
 */
export async function fetchExamsFromSupabase(): Promise<Exam[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('exames')
      .select(`
        id,
        protocolo,
        clinica_id,
        pressao_arterial,
        sintomas,
        medicamentos,
        prioridade,
        status,
        sla_minutos_total,
        recebido_em,
        arquivo_url,
        arquivo_nome,
        arquivo_tamanho,
        arquivo_tipo,
        simulacao_tipo_ecg,
        bloqueado_por_id,
        clinicas (
          nome
        ),
        pacientes (
          id,
          nome,
          cpf,
          idade,
          sexo,
          telefone
        ),
        laudos (
          id,
          ritmo,
          frequencia_cardiaca,
          eixo_qrs,
          intervalo_pr,
          duracao_qrs,
          intervalo_qtc,
          descricao_achados,
          conclusao,
          pdf_laudo_url,
          created_at,
          assinaturas_digitais (
            medico_nome,
            crm,
            uf_crm,
            rqe,
            hash_sha256,
            qr_code_url,
            assinado_em,
            autoridade_certificadora,
            numero_serie,
            is_qualificada_icp_brasil,
            tipo_certificado
          )
        )
      `)
      .order('recebido_em', { ascending: false });

    if (error) {
      console.warn('Aviso ao carregar exames do Supabase:', error.message);
      return null;
    }

    if (data) {
      return data.map(mapRemoteExamToLocal);
    }
    return [];
  } catch (err) {
    console.warn('Erro de rede ao carregar exames remotos:', err);
    return null;
  }
}

/**
 * Salva novo exame e paciente no Supabase para sincronização em nuvem
 */
export async function saveExamToSupabase(exam: Exam): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const patientId = exam.patient.id && UUID_REGEX.test(exam.patient.id) ? exam.patient.id : generateUUID();
    const examId = exam.id && UUID_REGEX.test(exam.id) ? exam.id : generateUUID();

    // 1. Validar e resolver clinic_id com UUID real existente
    let validClinicId = exam.clinicId;
    if (!validClinicId || !UUID_REGEX.test(validClinicId)) {
      try {
        const { data: firstClinic } = await supabase.from('clinicas').select('id').limit(1).single();
        if (firstClinic?.id) {
          validClinicId = firstClinic.id;
        }
      } catch (e) {
        console.warn('Fallback de clínica:', e);
      }
    }

    // 2. Salvar arquivo pesado no IndexedDB local para carregamento instantâneo
    let remoteArquivoUrl = exam.fileDataUrl || exam.fileUrl || '';
    if (remoteArquivoUrl.includes('laudos.amlaudos.com.br')) {
      remoteArquivoUrl = '';
    }

    if (exam.fileDataUrl) {
      try {
        await saveExamFile(examId, exam.fileName, exam.fileType, exam.fileDataUrl, exam.fileSize);
      } catch (e) {
        console.warn('Erro ao salvar em IndexedDB local:', e);
      }
      remoteArquivoUrl = exam.fileDataUrl;
    }

    // 3. Tentar via RPC seguro 'salvar_exame_completo' (atômico e com privilégios de banco)
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('salvar_exame_completo', {
        p_paciente: {
          id: patientId,
          nome: exam.patient.name,
          cpf: exam.patient.cpf || '000.***.***-00',
          idade: exam.patient.age || 50,
          sexo: exam.patient.gender || 'M'
        },
        p_exame: {
          id: examId,
          protocolo: exam.protocolNumber,
          clinica_id: validClinicId,
          pressao_arterial: exam.patient.bloodPressure || '120/80 mmHg',
          sintomas: exam.patient.symptoms || 'Exame de rotina',
          medicamentos: exam.patient.medications || 'Nenhum',
          prioridade: exam.priority,
          status: exam.status,
          sla_minutos_total: exam.slaMinutesTotal,
          recebido_em: exam.receivedAt,
          arquivo_url: remoteArquivoUrl,
          arquivo_nome: exam.fileName,
          arquivo_tamanho: exam.fileSize,
          arquivo_tipo: exam.fileType,
          simulacao_tipo_ecg: exam.simulatedEcgType || 'NORMAL'
        }
      });

      if (!rpcErr && rpcRes && (rpcRes as any)?.success) {
        return true;
      }
    } catch (rpcCatch) {
      console.warn('RPC salvar_exame_completo indisponível, usando fallback de tabela:', rpcCatch);
    }

    // 4. Fallback: Upsert direto nas tabelas
    await supabase.from('pacientes').upsert({
      id: patientId,
      nome: exam.patient.name,
      cpf: exam.patient.cpf || '000.***.***-00',
      idade: exam.patient.age || 50,
      sexo: exam.patient.gender || 'M',
      created_at: new Date().toISOString()
    });

    const { error: examErr } = await supabase.from('exames').upsert({
      id: examId,
      protocolo: exam.protocolNumber,
      clinica_id: validClinicId,
      paciente_id: patientId,
      pressao_arterial: exam.patient.bloodPressure || '120/80 mmHg',
      sintomas: exam.patient.symptoms || 'Exame de rotina',
      medicamentos: exam.patient.medications || 'Nenhum',
      prioridade: exam.priority,
      status: exam.status,
      sla_minutos_total: exam.slaMinutesTotal,
      recebido_em: exam.receivedAt,
      arquivo_url: remoteArquivoUrl,
      arquivo_nome: exam.fileName,
      arquivo_tamanho: exam.fileSize,
      arquivo_tipo: exam.fileType,
      simulacao_tipo_ecg: exam.simulatedEcgType || 'NORMAL'
    });

    if (examErr) {
      console.warn('Aviso ao sincronizar exame no Supabase:', examErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro ao salvar exame no Supabase:', err);
    return false;
  }
}

/**
 * Salva laudo e assinatura digital no Supabase e atualiza status do exame para LAUDADO
 */
export async function saveReportToSupabase(
  examId: string, 
  report: Report, 
  doctorId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const laudoId = report.id && UUID_REGEX.test(report.id) ? report.id : generateUUID();
    let effectiveDoctorId = doctorId;
    if (!effectiveDoctorId) {
      const { data } = await supabase.auth.getUser();
      effectiveDoctorId = data.user?.id;
    }

    // 1. Tentar via RPC seguro 'salvar_laudo_completo'
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('salvar_laudo_completo', {
        p_exame_id: examId,
        p_laudo: {
          id: laudoId,
          medico_id: effectiveDoctorId,
          ritmo: report.rhythm,
          frequencia_cardiaca: report.heartRate,
          eixo_qrs: report.qrsAxis,
          intervalo_pr: report.prInterval,
          duracao_qrs: report.qrsDuration,
          intervalo_qtc: report.qtcInterval,
          descricao_achados: report.findings,
          conclusao: report.conclusion
        },
        p_assinatura: report.signature ? {
          medico_nome: report.signature.doctorName,
          crm: report.signature.crm,
          uf_crm: report.signature.uf,
          rqe: report.signature.rqe,
          autoridade_certificadora: report.signature.certificateAuthority,
          numero_serie: report.signature.serialNumber,
          hash_sha256: report.signature.sha256Hash,
          qr_code_url: report.signature.qrCodeValidationUrl,
          is_qualificada_icp_brasil: report.signature.isQualifiedIcpBrasil
        } : null
      });

      if (!rpcErr && rpcRes && (rpcRes as any)?.success) {
        return true;
      }
    } catch (rpcCatch) {
      console.warn('RPC salvar_laudo_completo indisponível, usando fallback:', rpcCatch);
    }

    // 2. Fallback: Inserir ou atualizar na tabela laudos
    const { error: laudoErr } = await supabase.from('laudos').upsert({
      id: laudoId,
      exame_id: examId,
      medico_id: effectiveDoctorId,
      ritmo: report.rhythm,
      frequencia_cardiaca: report.heartRate,
      eixo_qrs: report.qrsAxis,
      intervalo_pr: report.prInterval,
      duracao_qrs: report.qrsDuration,
      intervalo_qtc: report.qtcInterval,
      descricao_achados: report.findings,
      conclusao: report.conclusion,
      created_at: report.createdAt || new Date().toISOString()
    });

    if (laudoErr) {
      console.warn('Aviso ao salvar laudo no Supabase:', laudoErr.message);
    }

    // 3. Se houver assinatura digital, insere na tabela assinaturas_digitais
    if (report.signature) {
      const sig = report.signature;
      await supabase.from('assinaturas_digitais').upsert({
        id: generateUUID(),
        laudo_id: laudoId,
        medico_id: effectiveDoctorId,
        medico_nome: sig.doctorName,
        crm: sig.crm,
        uf_crm: sig.uf,
        rqe: sig.rqe,
        tipo_certificado: 'A1_ARQUIVO',
        autoridade_certificadora: sig.certificateAuthority,
        numero_serie: sig.serialNumber,
        hash_sha256: sig.sha256Hash,
        qr_code_url: sig.qrCodeValidationUrl,
        is_qualificada_icp_brasil: sig.isQualifiedIcpBrasil,
        assinado_em: sig.signedAt
      });
    }

    // 4. Atualizar status do exame para LAUDADO
    await supabase.from('exames').update({
      status: 'LAUDADO'
    }).eq('id', examId);

    return true;
  } catch (err) {
    console.warn('Erro ao salvar laudo e assinatura no Supabase:', err);
    return false;
  }
}
