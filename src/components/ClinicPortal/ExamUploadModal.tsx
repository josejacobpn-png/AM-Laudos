import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  FolderOpen, 
  Trash2, 
  Plus, 
  Copy, 
  Check 
} from 'lucide-react';
import type { Clinic, Exam, Priority } from '../../types';
import { calculateSha256, generateProtocolNumber } from '../../utils/cryptoSim';
import { useAuth } from '../../context/AuthContext';

export interface SelectedFileItem {
  id: string;
  name: string;
  size: string;
  patientName: string;
  priority: Priority;
  checksum: string;
  file?: File;
}

interface ExamUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  initialFiles?: File[];
  onExamCreated: (newExam: Exam | Exam[]) => void;
}

export function cleanPatientNameFromFilename(filename: string): string {
  let name = filename.replace(/\.[^/.]+$/, '');
  name = name.replace(/[_\-+.]+/g, ' ');
  name = name.replace(/\b(ecg|laudo|exame|tracado|12der|12d|pdf|xml|scp|dcm|dicom|paciente|patient|record|cardio|holter|mapa)\b/gi, ' ');
  name = name.replace(/\b\d{4,}\b/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  
  if (!name || name.length < 2) {
    return 'Paciente ' + filename.replace(/\.[^/.]+$/, '').slice(0, 14);
  }

  const lowercaseWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  return name
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && lowercaseWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export const ExamUploadModal: React.FC<ExamUploadModalProps> = ({
  isOpen,
  onClose,
  clinics,
  initialFiles,
  onExamCreated
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedClinicId, setSelectedClinicId] = useState(
    currentUser?.clinicId || clinics[0]?.id || 'cli-01'
  );
  
  // Lista de arquivos selecionados (suporte a seleção múltipla / lote)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [copiedPath, setCopiedPath] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos para quando for 1 exame (ou valores padrão)
  const [patientName, setPatientName] = useState('');
  const [patientCpf, setPatientCpf] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'M' | 'F'>('M');
  const [bloodPressure, setBloodPressure] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [priority, setPriority] = useState<Priority>('URGENCIA');

  // Processar arquivos recebidos (sejam iniciais ou adicionados depois)
  const processFiles = async (files: File[] | FileList) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const items: SelectedFileItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      let hash = '';
      try {
        const fullHash = await calculateSha256(file.name + file.size);
        hash = fullHash.substring(0, 16) + '...';
      } catch {
        hash = 'sha256-ok';
      }

      items.push({
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        patientName: cleanPatientNameFromFilename(file.name),
        priority: priority || 'URGENCIA',
        checksum: hash,
        file
      });
    }

    setSelectedFiles(prev => {
      const updated = [...prev, ...items];
      if (prev.length === 0 && items.length === 1) {
        setPatientName(items[0].patientName);
      }
      return updated;
    });
  };

  // Carregar arquivos iniciais caso tenham sido escolhidos direto no Dashboard
  useEffect(() => {
    if (isOpen) {
      if (initialFiles && initialFiles.length > 0) {
        setSelectedFiles([]);
        processFiles(initialFiles);
      }
    } else {
      setSelectedFiles([]);
      setPatientName('');
      setPatientCpf('');
      setPatientAge('');
      setBloodPressure('');
      setSymptoms('');
      setMedications('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialFiles]);

  if (!isOpen) return null;

  const handleCopyFolder = () => {
    navigator.clipboard.writeText('C:\\Laudos');
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const updateFileItem = (id: string, updates: Partial<SelectedFileItem>) => {
    setSelectedFiles(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeFileItem = (id: string) => {
    setSelectedFiles(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (filtered.length === 1) {
        setPatientName(filtered[0].patientName);
      }
      return filtered;
    });
  };

  const setQuickSymptom = (text: string, quickPriority?: Priority) => {
    setSymptoms(text);
    if (quickPriority) setPriority(quickPriority);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clinic = clinics.find(c => c.id === selectedClinicId) || clinics[0];
    const slaMap = {
      EMERGENCIA: 15,
      URGENCIA: 120,
      ELETIVO: 1440
    };

    // Caso 1: Envio em LOTE (múltiplos arquivos selecionados)
    if (selectedFiles.length > 1) {
      // Validação rápida de nomes
      const emptyName = selectedFiles.some(f => !f.patientName.trim());
      if (emptyName) {
        alert('Por favor, preencha o nome de todos os pacientes da lista de exames.');
        return;
      }

      setIsSubmitting(true);

      const batchExams: Exam[] = selectedFiles.map((item, idx) => {
        let simulatedEcg: 'NORMAL' | 'ARRHYTHMIA' | 'ISCHEMIA' | 'LBBB' | 'BRADYCARDIA' = 'NORMAL';
        if (item.priority === 'EMERGENCIA') simulatedEcg = 'ISCHEMIA';
        else if (item.priority === 'URGENCIA') simulatedEcg = 'ARRHYTHMIA';

        return {
          id: `ex-${Date.now()}-${idx}`,
          protocolNumber: generateProtocolNumber(),
          clinicId: clinic.id,
          clinicName: clinic.name,
          priority: item.priority,
          status: 'PENDENTE',
          receivedAt: new Date().toISOString(),
          slaMinutesTotal: slaMap[item.priority],
          remainingMinutes: slaMap[item.priority],
          fileName: item.name,
          fileSize: item.size,
          fileType: item.name.toLowerCase().endsWith('.xml') ? 'XML_DICOM' : 'PDF',
          simulatedEcgType: simulatedEcg,
          patient: {
            id: `pat-${Date.now()}-${idx}`,
            name: item.patientName.trim(),
            cpf: '000.***.***-00',
            age: 52,
            gender: 'M',
            bloodPressure: '120/80 mmHg',
            symptoms: symptoms || 'Exame de rotina importado em lote via pasta C:\\Laudos',
            medications: medications || 'Nenhum informado'
          }
        };
      });

      setTimeout(() => {
        onExamCreated(batchExams);
        setIsSubmitting(false);
        onClose();
      }, 500);
      return;
    }

    // Caso 2: Envio individual (1 arquivo ou formulário preenchido)
    const finalPatientName = selectedFiles.length === 1 
      ? (patientName.trim() || selectedFiles[0].patientName)
      : patientName.trim();

    if (!finalPatientName) {
      alert('Por favor, informe o nome do paciente.');
      return;
    }

    setIsSubmitting(true);

    let simulatedEcg: 'NORMAL' | 'ARRHYTHMIA' | 'ISCHEMIA' | 'LBBB' | 'BRADYCARDIA' = 'NORMAL';
    if (priority === 'EMERGENCIA' || symptoms.toLowerCase().includes('dor') || symptoms.toLowerCase().includes('infarto')) {
      simulatedEcg = 'ISCHEMIA';
    } else if (symptoms.toLowerCase().includes('palpit') || symptoms.toLowerCase().includes('arritmia')) {
      simulatedEcg = 'ARRHYTHMIA';
    } else if (symptoms.toLowerCase().includes('bloqueio') || symptoms.toLowerCase().includes('dispneia')) {
      simulatedEcg = 'LBBB';
    }

    const singleFileName = selectedFiles.length === 1 ? selectedFiles[0].name : 'ecg_digital_padrao.pdf';
    const singleFileSize = selectedFiles.length === 1 ? selectedFiles[0].size : '1.1 MB';
    const singleFileType = singleFileName.toLowerCase().endsWith('.xml') ? 'XML_DICOM' : 'PDF';

    const newExam: Exam = {
      id: `ex-${Date.now()}`,
      protocolNumber: generateProtocolNumber(),
      clinicId: clinic.id,
      clinicName: clinic.name,
      priority,
      status: 'PENDENTE',
      receivedAt: new Date().toISOString(),
      slaMinutesTotal: slaMap[priority],
      remainingMinutes: slaMap[priority],
      fileName: singleFileName,
      fileSize: singleFileSize,
      fileType: singleFileType,
      simulatedEcgType: simulatedEcg,
      patient: {
        id: `pat-${Date.now()}`,
        name: finalPatientName,
        cpf: patientCpf || '000.***.***-00',
        age: patientAge !== '' ? Number(patientAge) : undefined,
        gender: patientGender,
        bloodPressure: bloodPressure.trim() || undefined,
        symptoms: symptoms || 'Exame de rotina',
        medications: medications || 'Nenhum informado'
      }
    };

    setTimeout(() => {
      onExamCreated(newExam);
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  const isMultiple = selectedFiles.length > 1;

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className={`modal-dialog upload-modal ${isMultiple ? 'upload-modal-large' : ''}`}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <UploadCloud className="text-primary" size={24} />
            <div>
              <h3>Módulo de Captura e Upload de Exames</h3>
              <p>Envio rápido de ECG da pasta padrão do equipamento para a fila central de laudos</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Banner Informativo da Pasta Padrão C:\Laudos */}
        <div className="folder-hint-banner">
          <div className="folder-hint-info">
            <FolderOpen size={18} className="text-primary" />
            <div>
              <span>Pasta padrão do equipamento: <strong>C:\Laudos</strong></span>
              <p>Selecione um ou vários exames diretamente da pasta para upload simultâneo</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-copy-path" 
            onClick={handleCopyFolder}
            title="Copiar o caminho C:\Laudos para a área de transferência"
          >
            {copiedPath ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copiedPath ? 'Copiado!' : 'Copiar C:\\Laudos'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          {/* 1. Seleção da Clínica de Origem */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Unidade / Clínica Solicitante</label>
              <select
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                className="form-control"
              >
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — CNES: {c.cnes} ({c.city}/{c.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade padrão (se não for em lote múltiplo) */}
            {!isMultiple && (
              <div className="form-group flex-1">
                <label>Classificação de Risco & Urgência (SLA)</label>
                <div className="priority-selector">
                  <button
                    type="button"
                    className={`btn-priority emerg ${priority === 'EMERGENCIA' ? 'active' : ''}`}
                    onClick={() => setPriority('EMERGENCIA')}
                  >
                    <span className="dot red"></span>
                    <strong>Emergência</strong>
                    <small>&lt; 15 min</small>
                  </button>
                  <button
                    type="button"
                    className={`btn-priority urg ${priority === 'URGENCIA' ? 'active' : ''}`}
                    onClick={() => setPriority('URGENCIA')}
                  >
                    <span className="dot yellow"></span>
                    <strong>Urgência</strong>
                    <small>&lt; 2 horas</small>
                  </button>
                  <button
                    type="button"
                    className={`btn-priority elet ${priority === 'ELETIVO' ? 'active' : ''}`}
                    onClick={() => setPriority('ELETIVO')}
                  >
                    <span className="dot green"></span>
                    <strong>Eletivo</strong>
                    <small>&lt; 24 horas</small>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input invisível para seleção de arquivos com suporte a múltiplos */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            accept=".pdf,.xml,.dicom,.dcm,.scp,.edf,.jpg,.png"
            onChange={handleFileInputChange}
          />

          {/* Dropzone de Arquivos */}
          {selectedFiles.length === 0 ? (
            <div
              className={`file-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <UploadCloud size={34} />
                </div>
                <div>
                  <strong>Clique aqui para escolher os arquivos em C:\Laudos ou arraste para cá</strong>
                  <p>Você pode selecionar múltiplos arquivos de uma vez (PDF, XML, SCP, DICOM)</p>
                </div>
              </div>
            </div>
          ) : isMultiple ? (
            /* VISÃO EM LOTE (MÚLTIPLOS ARQUIVOS SELECIONADOS) */
            <div className="batch-files-container">
              <div className="batch-files-header">
                <div className="batch-title">
                  <CheckCircle size={18} className="text-success" />
                  <span><strong>{selectedFiles.length} exames prontos</strong> para envio em lote</span>
                </div>
                <button
                  type="button"
                  className="btn-add-more-files"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={15} />
                  <span>Adicionar mais arquivos</span>
                </button>
              </div>

              <div className="batch-files-list">
                {selectedFiles.map((item, idx) => (
                  <div key={item.id} className="batch-file-row">
                    <div className="batch-file-icon">
                      <FileText size={20} />
                      <span className="file-num">{idx + 1}</span>
                    </div>

                    <div className="batch-file-details">
                      <span className="batch-filename" title={item.name}>{item.name}</span>
                      <span className="batch-filesize">{item.size}</span>
                    </div>

                    <div className="batch-patient-input">
                      <label>Paciente:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.patientName}
                        placeholder="Nome do paciente"
                        onChange={(e) => updateFileItem(item.id, { patientName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="batch-priority-select">
                      <label>Prioridade:</label>
                      <select
                        className={`form-control form-control-sm priority-badge-select ${item.priority}`}
                        value={item.priority}
                        onChange={(e) => updateFileItem(item.id, { priority: e.target.value as Priority })}
                      >
                        <option value="EMERGENCIA">🚨 Emergência (&lt;15m)</option>
                        <option value="URGENCIA">⚡ Urgência (&lt;2h)</option>
                        <option value="ELETIVO">📋 Eletivo (&lt;24h)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="btn-remove-batch-file"
                      title="Remover exame"
                      onClick={() => removeFileItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 1 ARQUIVO SELECIONADO */
            <div className="single-file-badge-wrap">
              <div className="selected-file-badge">
                <CheckCircle size={16} className="text-success" />
                <span>Arquivo: <strong>{selectedFiles[0].name}</strong> ({selectedFiles[0].size})</span>
                {selectedFiles[0].checksum && <span className="checksum-tag">SHA-256 verificado</span>}
              </div>
              <div className="single-file-actions">
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={14} /> Adicionar mais arquivos
                </button>
                <button
                  type="button"
                  className="btn-link-danger"
                  onClick={() => removeFileItem(selectedFiles[0].id)}
                >
                  <Trash2 size={14} /> Trocar arquivo
                </button>
              </div>
            </div>
          )}

          {/* Dados do Paciente e Clínicos (Exibido para exame individual) */}
          {!isMultiple && (
            <>
              <div className="section-divider">
                <span>DADOS DO PACIENTE</span>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Nome Completo do Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo da Silva"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={patientCpf}
                    onChange={(e) => setPatientCpf(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Idade (anos)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Ex: 45"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Sexo Biológico</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as 'M' | 'F')}
                    className="form-control"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Pressão Arterial</label>
                  <input
                    type="text"
                    placeholder="Ex: 120/80 mmHg"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
            </>
          )}

          {/* Dados Clínicos e Sintomas (Comum a individual e lote) */}
          <div className="form-group" style={{ marginTop: isMultiple ? '0.75rem' : '0' }}>
            <div className="label-with-actions">
              <label>{isMultiple ? 'Indicação Clínica / Observações Gerais do Lote' : 'Indicação Clínica / Sintomas Relatados'}</label>
              <div className="quick-tags">
                <button
                  type="button"
                  onClick={() => setQuickSymptom('Dor precordial típica em aperto com sudorese fria há 30 min', 'EMERGENCIA')}
                  className="tag-btn danger"
                >
                  <Sparkles size={12} /> Dor Precordial / IAM
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSymptom('Palpitações taquicárdicas súbitas e mal-estar', 'URGENCIA')}
                  className="tag-btn warning"
                >
                  Palpitações / FA
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSymptom('Avaliação pré-operatória de risco cirúrgico')}
                  className="tag-btn"
                >
                  Pré-Operatório
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSymptom('Check-up cardiológico de rotina assintomático', 'ELETIVO')}
                  className="tag-btn"
                >
                  Rotina
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              placeholder="Descreva a queixa principal, tempo de evolução ou achados clínicos relevantes..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="form-control"
            />
          </div>

          {!isMultiple && (
            <div className="form-group">
              <label>Medicamentos em uso contínuo (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Losartana 50mg, AAS 100mg, Metoprolol 25mg"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="form-control"
              />
            </div>
          )}

          {/* Footer com Botões */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-primary-action ${(!isMultiple && priority === 'EMERGENCIA') ? 'btn-danger-action' : ''}`}
            >
              {isSubmitting ? (
                <span>Transmitindo e indexando exames...</span>
              ) : isMultiple ? (
                <>
                  <UploadCloud size={18} />
                  <span>Transmitir Todos os {selectedFiles.length} Exames para Laudo</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>
                    {priority === 'EMERGENCIA' ? 'Enviar para Fila com PRIORIDADE MÁXIMA' : 'Enviar Exame para Laudo'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
