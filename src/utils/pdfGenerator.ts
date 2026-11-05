import jsPDF from 'jspdf';
import type { Exam, Report } from '../types';
import { formatDateTimeBR, formatDoctorDisplayName } from './cryptoSim';

export function generateLaudoPdf(exam: Exam, report: Report): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // 1. Cabeçalho Principal (Bordas e Identidade Visual)
  doc.setFillColor(15, 23, 42); // Navy Blue #0F172A
  doc.rect(margin, y, pageWidth - (margin * 2), 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('AM LAUDOS | SERVIÇO DE TELEMEDICINA & TELEDIAGNÓSTICO', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Clínica Solicitante: ${exam.clinicName.toUpperCase()}  |  CNES: 7492810`, margin + 6, y + 14);
  doc.text(`Protocolo: ${exam.protocolNumber}  |  Emissão: ${formatDateTimeBR(report.createdAt)}`, margin + 6, y + 18.5);

  y += 26;

  // 2. Caixa de Dados do Paciente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 25, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO PACIENTE E INDICAÇÃO CLÍNICA', margin + 4, y + 5.5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paciente:`, margin + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${exam.patient.name}`, margin + 20, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.text(`CPF: ${exam.patient.cpf}`, margin + 105, y + 11);
  doc.text(`Idade / Sexo: ${exam.patient.age ? `${exam.patient.age} anos` : 'Não informada'} / ${exam.patient.gender === 'M' ? 'Masculino' : 'Feminino'}`, margin + 145, y + 11);

  doc.text(`Sintomas / Indicação:`, margin + 4, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(`${exam.patient.symptoms || 'Exame de rotina'}`, margin + 37, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.text(`PA: ${exam.patient.bloodPressure || 'Não aferida'}`, margin + 105, y + 17);
  doc.text(`Prioridade: ${exam.priority}`, margin + 145, y + 17);

  y += 29;

  // 3. Título do Exame
  doc.setFillColor(2, 132, 199); // Sky blue #0284C7
  doc.rect(margin, y, 3, 7, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAUDO ELETROCARDIOGRÁFICO DE REPOUSO (12 DERIVAÇÕES)', margin + 6, y + 5.5);

  y += 11;

  // 4. Parâmetros Eletrocardiográficos Estruturados
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 16, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');

  // Linha 1 de parâmetros
  doc.text('RITMO:', margin + 4, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(report.rhythm, margin + 19, y + 5.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('FREQ. CARDÍACA:', margin + 105, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.heartRate} bpm`, margin + 138, y + 5.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('EIXO QRS:', margin + 158, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(report.qrsAxis, margin + 176, y + 5.5);

  // Linha 2 de parâmetros
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVALO PR:', margin + 4, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(report.prInterval, margin + 28, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('DURAÇÃO QRS:', margin + 85, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(report.qrsDuration, margin + 110, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVALO QTc:', margin + 145, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(report.qtcInterval, margin + 170, y + 12);

  y += 21;

  // 5. Descrição Detalhada dos Achados
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESCRIÇÃO DOS ACHADOS ELETROCARDIOGRÁFICOS:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const splitFindings = doc.splitTextToSize(report.findings, pageWidth - (margin * 2));
  doc.text(splitFindings, margin, y);
  y += (splitFindings.length * 5) + 6;

  // 6. Conclusão Diagnóstica (Destaque visual)
  doc.setFillColor(240, 253, 250); // Mint/teal light
  doc.setDrawColor(13, 148, 136); // Teal border
  doc.setLineWidth(0.4);
  
  const conclusionLines = doc.splitTextToSize(report.conclusion, pageWidth - (margin * 2) - 8);
  const conclusionHeight = (conclusionLines.length * 5.2) + 12;

  doc.roundedRect(margin, y, pageWidth - (margin * 2), conclusionHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(13, 148, 136);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CONCLUSÃO / PARECER DIAGNÓSTICO:', margin + 4, y + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(conclusionLines, margin + 4, y + 11);

  y += conclusionHeight + 8;

  // 7. Seção de Assinatura do Laudo
  const sig = report.signature;
  const sigBoxY = Math.max(y + 8, pageHeight - 48);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, sigBoxY, pageWidth - (margin * 2), 34, 2, 2, 'FD');

  // Selo visual de autenticação do Laudo
  doc.setFillColor(15, 23, 42);
  doc.rect(margin + 4, sigBoxY + 4, 26, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('AM LAUDOS', margin + 6, sigBoxY + 11);
  doc.setFontSize(5.5);
  doc.text('ASSINATURA', margin + 7, sigBoxY + 16);
  doc.text('DIGITAL', margin + 9.5, sigBoxY + 20);
  doc.text('CFM 2.299/21', margin + 6.5, sigBoxY + 25);

  // Informações da Assinatura
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatDoctorDisplayName(report.doctorName), margin + 34, sigBoxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Médico(a) Cardiologista  |  CRM: ${report.doctorCrm}-${report.doctorUf}${report.doctorRqe ? `  |  RQE: ${report.doctorRqe}` : ''}`, margin + 34, sigBoxY + 13);
  doc.text(`Assinatura Digital: ${sig?.certificateAuthority || 'Certificado Digital Padrão CFM'} - PAdES`, margin + 34, sigBoxY + 17.5);
  doc.text(`Carimbo do Tempo: ${formatDateTimeBR(sig?.signedAt || report.createdAt)} (Horário Oficial de Brasília)`, margin + 34, sigBoxY + 22);

  // Hash SHA-256 e validação
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`HASH SHA-256: ${sig?.sha256Hash || 'A89F3C184E290D54B892718E4A0C79148F02C4819E77B841829D6459128A3BE9'}`, margin + 34, sigBoxY + 26.5);
  doc.text(`Validação Pública: ${sig?.qrCodeValidationUrl || `https://amlaudos.com.br/validar/${exam.protocolNumber}`}`, margin + 34, sigBoxY + 30.5);

  // Rodapé da Página
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento eletrônico assinado digitalmente conforme MP nº 2.200-2/2001 e Resolução CFM 2.314/2022. Guarda legal obrigatória por 20 anos.', margin, pageHeight - 6);
  doc.text(`Página 1 de 1  |  Protocolo de Autenticidade: ${exam.protocolNumber}`, pageWidth - margin - 60, pageHeight - 6);

  return doc;
}
