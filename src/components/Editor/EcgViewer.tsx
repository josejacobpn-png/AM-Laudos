import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon, 
  Grid, 
  Compass, 
  FileText,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  RotateCw,
  Contrast
} from 'lucide-react';
import type { Exam } from '../../types';
import { getLeadConfigs, generateLeadWaveform, drawEcgOnCanvas } from '../../utils/ecgGenerator';
import { formatDateTimeBR } from '../../utils/cryptoSim';
import { getExamFile } from '../../utils/fileStorage';

interface EcgViewerProps {
  exam: Exam;
}

export const EcgViewer: React.FC<EcgViewerProps> = ({ exam }) => {
  const [theme, setTheme] = useState<'classic' | 'dark'>('classic');
  const [scale, setScale] = useState<number>(1.0);
  const [selectedLead, setSelectedLead] = useState<string>('ALL'); // 'ALL' ou 'DII', 'V1', etc.
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ x: number; y: number } | null>(null);

  // Aba ativa: inicia exibindo o arquivo original anexado
  const [activeTab, setActiveTab] = useState<'pdf_original' | 'tracado'>('pdf_original');

  // Estado do arquivo anexado (Data URL / Blob URL)
  const [fileContent, setFileContent] = useState<string | null>(exam.fileDataUrl || exam.fileUrl || null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Controles de Imagem (quando o anexo for foto/scanner de ECG)
  const [imgZoom, setImgZoom] = useState<number>(1.0);
  const [imgRotation, setImgRotation] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  // Modo Tela Cheia do Visualizador para análise minuciosa
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const leadOrder = ['DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  const leadConfigs = getLeadConfigs(exam.simulatedEcgType || 'NORMAL');

  // Canvas refs para cada derivação
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  // Recuperar arquivo do IndexedDB caso não esteja em memória
  useEffect(() => {
    if (exam.fileDataUrl || exam.fileUrl) {
      setFileContent(exam.fileDataUrl || exam.fileUrl || null);
      return;
    }

    setIsLoadingFile(true);
    getExamFile(exam.id)
      .then(stored => {
        if (stored?.dataUrl) {
          setFileContent(stored.dataUrl);
        }
      })
      .finally(() => {
        setIsLoadingFile(false);
      });
  }, [exam.id, exam.fileDataUrl, exam.fileUrl]);

  // Tecla ESC para sair de tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Renderizar Traçado Interativo 12 Derivações
  useEffect(() => {
    if (activeTab !== 'tracado') return;

    const leadsToRender = selectedLead === 'ALL' ? [...leadOrder, 'DII_LONGO'] : [selectedLead];

    leadsToRender.forEach(leadKey => {
      const canvas = canvasRefs.current[leadKey];
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isLongStrip = leadKey === 'DII_LONGO';
      const actualLead = isLongStrip ? 'DII' : leadKey;
      const config = leadConfigs[actualLead] || leadConfigs['DII'];

      const duration = isLongStrip ? 9.0 : 2.5;
      const points = generateLeadWaveform(config, duration, 75, exam.simulatedEcgType || 'NORMAL');

      drawEcgOnCanvas(ctx, canvas.width, canvas.height, isLongStrip ? 'DII LONGO (RITMO)' : actualLead, points, {
        theme,
        scale,
        showGrid: true
      });
    });
  }, [theme, scale, selectedLead, activeTab, exam]);

  // Medição com régua digital (Caliper)
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showRuler) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRulerStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setRulerEnd(null);
  };

  const handleRulerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showRuler || !rulerStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRulerEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleRulerMouseUp = () => {
    // Manter a medição visível
  };

  // Cálculo de tempo e voltagem com base na régua (1mm = 0.04s, 1mm = 0.1mV)
  let measurementText = '';
  if (rulerStart && rulerEnd) {
    const dx = Math.abs(rulerEnd.x - rulerStart.x);
    const dy = Math.abs(rulerEnd.y - rulerStart.y);
    const pxPerMm = 3.78 * scale;
    const mmX = dx / pxPerMm;
    const mmY = dy / pxPerMm;
    const ms = Math.round(mmX * 40); // 1mm = 40ms a 25mm/s
    const mv = (mmY * 0.1).toFixed(2); // 1mm = 0.1mV a 10mm/mV
    measurementText = `Intervalo: ${ms} ms (${mmX.toFixed(1)} mm)  |  Voltagem: ${mv} mV (${mmY.toFixed(1)} mm)`;
  }

  // Detectar tipo de arquivo
  const isImageFile = 
    exam.fileType === 'IMAGE' || 
    exam.fileName.match(/\.(png|jpe?g|webp|bmp|gif)$/i) || 
    (fileContent && fileContent.startsWith('data:image/'));

  const isPdfFile = 
    exam.fileType === 'PDF' || 
    exam.fileName.match(/\.pdf$/i) || 
    (fileContent && fileContent.startsWith('data:application/pdf'));

  // Handler de abertura em nova aba
  const handleOpenInNewTab = () => {
    if (fileContent) {
      const win = window.open();
      if (win) {
        if (isPdfFile) {
          win.document.write(`<iframe src="${fileContent}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          win.document.write(`<img src="${fileContent}" style="max-width:100%; margin:auto; display:block;" />`);
        }
        win.document.title = `Exame - ${exam.fileName}`;
      }
    }
  };

  return (
    <div className={`ecg-viewer-container ${theme === 'dark' ? 'theme-dark' : 'theme-classic'} ${isFullscreen ? 'ecg-viewer-fullscreen' : ''}`}>
      {/* Barra de Controles do Eletrocardiógrafo */}
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <div className="view-mode-tabs">
            <button
              className={`mode-tab-btn ${activeTab === 'pdf_original' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf_original')}
            >
              <FileText size={15} />
              <span>Arquivo Original Anexado ({exam.fileName})</span>
            </button>

            <button
              className={`mode-tab-btn ${activeTab === 'tracado' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracado')}
            >
              <Grid size={15} />
              <span>Traçado 12D com Régua (Caliper)</span>
            </button>
          </div>

          <div className="calibration-indicator">
            <span>25 mm/s</span>
            <span>•</span>
            <span>10 mm/mV</span>
            <span>•</span>
            <span className="cal-badge">Padrão Internacional</span>
          </div>
        </div>

        <div className="toolbar-right">
          {activeTab === 'tracado' ? (
            <>
              {/* Zoom do Traçado */}
              <div className="tool-btn-group">
                <button
                  className="tool-btn"
                  onClick={() => setScale(s => Math.max(0.7, s - 0.15))}
                  title="Reduzir Zoom"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="scale-display">{Math.round(scale * 100)}%</span>
                <button
                  className="tool-btn"
                  onClick={() => setScale(s => Math.min(1.8, s + 0.15))}
                  title="Aumentar Zoom"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              {/* Derivações */}
              <select
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
                className="lead-select-dropdown"
              >
                <option value="ALL">Todas as 12 Derivações + DII Longo</option>
                {leadOrder.map(l => (
                  <option key={l} value={l}>Derivação {l} (Isolada)</option>
                ))}
              </select>

              {/* Régua Digital / Caliper */}
              <button
                className={`tool-btn-pill ${showRuler ? 'active' : ''}`}
                onClick={() => {
                  setShowRuler(!showRuler);
                  setRulerStart(null);
                  setRulerEnd(null);
                }}
                title="Ativar Régua Digital para Medição de PR/QRS/QT"
              >
                <Compass size={16} />
                <span>Régua Digital</span>
              </button>

              {/* Alternador de Tema */}
              <button
                className="tool-btn"
                onClick={() => setTheme(t => t === 'classic' ? 'dark' : 'classic')}
                title="Alternar entre Papel Milimetrado Rosa e Monitor Escuro"
              >
                {theme === 'classic' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </>
          ) : (
            /* Ferramentas do Arquivo Original */
            <>
              {isImageFile && (
                <>
                  <div className="tool-btn-group">
                    <button
                      className="tool-btn"
                      onClick={() => setImgZoom(z => Math.max(0.5, z - 0.2))}
                      title="Reduzir Imagem"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="scale-display">{Math.round(imgZoom * 100)}%</span>
                    <button
                      className="tool-btn"
                      onClick={() => setImgZoom(z => Math.min(3.0, z + 0.2))}
                      title="Ampliar Imagem"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>

                  <button
                    className="tool-btn"
                    onClick={() => setImgRotation(r => (r + 90) % 360)}
                    title="Girar 90° no sentido horário"
                  >
                    <RotateCw size={16} />
                  </button>

                  <button
                    className={`tool-btn-pill ${isHighContrast ? 'active' : ''}`}
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    title="Realçar traçado (Alto contraste)"
                  >
                    <Contrast size={15} />
                    <span>Realce</span>
                  </button>
                </>
              )}

              {fileContent && (
                <>
                  <button
                    className="tool-btn"
                    onClick={handleOpenInNewTab}
                    title="Abrir arquivo original em uma nova aba"
                  >
                    <ExternalLink size={16} />
                  </button>

                  <a
                    href={fileContent}
                    download={exam.fileName}
                    className="tool-btn"
                    title="Baixar arquivo original enviado pela clínica"
                  >
                    <Download size={16} />
                  </a>
                </>
              )}
            </>
          )}

          {/* Botão de Tela Cheia Global */}
          <button
            className={`tool-btn ${isFullscreen ? 'active' : ''}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Restaurar tela dividida (Esc)' : 'Expandir arquivo em Tela Cheia para análise minuciosa'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Faixa de Informação da Régua Digital se ativa */}
      {showRuler && activeTab === 'tracado' && (
        <div className="ruler-info-strip">
          <Compass size={15} />
          <span>
            {measurementText ? (
              <strong>{measurementText}</strong>
            ) : (
              'Clique e arraste sobre qualquer ponto do traçado para medir tempo (ms) e amplitude (mV)'
            )}
          </span>
          {rulerStart && (
            <button
              className="btn-clear-ruler"
              onClick={() => { setRulerStart(null); setRulerEnd(null); }}
            >
              <RotateCcw size={12} /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Conteúdo: Traçado Sintético Calibrado */}
      {activeTab === 'tracado' && (
        <div
          className="canvas-scroll-viewport"
          onMouseDown={handleRulerMouseDown}
          onMouseMove={handleRulerMouseMove}
          onMouseUp={handleRulerMouseUp}
          style={{ cursor: showRuler ? 'crosshair' : 'default', position: 'relative' }}
        >
          {selectedLead === 'ALL' ? (
            <div className="ecg-12-lead-grid">
              {/* Grid 4 colunas x 3 linhas */}
              <div className="leads-matrix">
                {leadOrder.map((leadKey) => (
                  <div key={leadKey} className="lead-canvas-box">
                    <canvas
                      ref={el => { canvasRefs.current[leadKey] = el; }}
                      width={380}
                      height={130}
                      className="ecg-single-canvas"
                    />
                  </div>
                ))}
              </div>

              {/* DII Longo na base para análise de arritmias */}
              <div className="rhythm-strip-box">
                <canvas
                  ref={el => { canvasRefs.current['DII_LONGO'] = el; }}
                  width={1540}
                  height={135}
                  className="ecg-rhythm-canvas"
                />
              </div>
            </div>
          ) : (
            /* Visualização de derivação única ampliada */
            <div className="single-lead-fullscreen">
              <canvas
                ref={el => { canvasRefs.current[selectedLead] = el; }}
                width={1200}
                height={480}
                className="ecg-expanded-canvas"
              />
            </div>
          )}

          {/* SVG Overlay da Régua de Medição */}
          {showRuler && rulerStart && rulerEnd && (
            <svg className="ruler-svg-overlay">
              <line
                x1={rulerStart.x}
                y1={rulerStart.y}
                x2={rulerEnd.x}
                y2={rulerEnd.y}
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <circle cx={rulerStart.x} cy={rulerStart.y} r="4" fill="#0284c7" />
              <circle cx={rulerEnd.x} cy={rulerEnd.y} r="4" fill="#0284c7" />
            </svg>
          )}
        </div>
      )}

      {/* Conteúdo: Arquivo Original Anexado */}
      {activeTab === 'pdf_original' && (
        <div className="pdf-full-viewer-pane">
          {isLoadingFile ? (
            <div className="file-loading-state">
              <div className="spinner" />
              <p>Carregando arquivo anexado ({exam.fileName})...</p>
            </div>
          ) : fileContent ? (
            /* CASO 1: Arquivo Real Anexado Encontrado */
            isImageFile ? (
              /* Visualização de Imagem em Alta Resolução */
              <div className="image-viewer-container">
                <div 
                  className="image-scroll-surface"
                  style={{
                    overflow: 'auto',
                    textAlign: 'center',
                    padding: '1.5rem',
                    backgroundColor: '#1e293b'
                  }}
                >
                  <img
                    src={fileContent}
                    alt={`Arquivo de Exame - ${exam.fileName}`}
                    style={{
                      transform: `scale(${imgZoom}) rotate(${imgRotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease',
                      filter: isHighContrast ? 'contrast(200%) brightness(85%) grayscale(100%)' : 'none',
                      maxWidth: '100%',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Visualização de PDF Nativo em Tela Inteira */
              <div className="pdf-iframe-wrapper">
                <iframe
                  src={`${fileContent}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                  title={`Documento do Exame - ${exam.fileName}`}
                  className="pdf-native-iframe"
                />
              </div>
            )
          ) : (
            /* CASO 2: Exame Sem Arquivo Binário Físico (Ex: Registro Simulado) */
            /* Renderiza a Folha Oficial A4 de Eletrocardiograma em Papel Milimetrado com Todas as 12 Derivações */
            <div className="ecg-official-sheet-wrapper">
              <div className="ecg-official-sheet">
                {/* Cabeçalho Oficial do Exame */}
                <div className="ecg-sheet-header">
                  <div className="sheet-clinic-info">
                    <h3>{exam.clinicName}</h3>
                    <p>Serviço de Cardiologia Diagnóstica • CNES {exam.clinicId?.slice(0, 7) || '2849102'}</p>
                    <p className="sheet-tech-info">
                      Equipamento Digital de 12 Canais • Calibração NBR IEC 60601-2-25 • Filtros 0.05 - 150 Hz
                    </p>
                  </div>

                  <div className="sheet-badge-right">
                    <span className="sheet-badge">ECG 12 DERIVAÇÕES DIGITAL</span>
                    <span className="sheet-protocol">PROTOCOLO: {exam.protocolNumber}</span>
                  </div>
                </div>

                {/* Faixa com Dados do Paciente */}
                <div className="ecg-sheet-patient-bar">
                  <div className="sheet-patient-col">
                    <span><strong>PACIENTE:</strong> {exam.patient.name}</span>
                    <span><strong>CPF:</strong> {exam.patient.cpf}</span>
                  </div>
                  <div className="sheet-patient-col">
                    <span><strong>IDADE:</strong> {exam.patient.age ? `${exam.patient.age} anos` : 'Não informada'}</span>
                    <span><strong>SEXO:</strong> {exam.patient.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                  </div>
                  <div className="sheet-patient-col">
                    <span><strong>PRESSÃO ARTERIAL:</strong> {exam.patient.bloodPressure || '120/80 mmHg'}</span>
                    <span><strong>DATA/HORA:</strong> {formatDateTimeBR(exam.receivedAt)}</span>
                  </div>
                </div>

                {/* Informações Clínicas / Sintomas */}
                <div className="ecg-sheet-clinical-box">
                  <span><strong>INDICAÇÃO CLÍNICA / SINTOMAS:</strong> {exam.patient.symptoms}</span>
                  {exam.patient.medications && (
                    <span style={{ marginLeft: '1.5rem' }}><strong>MEDICAMENTOS:</strong> {exam.patient.medications}</span>
                  )}
                </div>

                {/* Traçado Oficial Completo em Papel Milimetrado Rosa com 12 Derivações */}
                <div className="ecg-sheet-paper-grid">
                  <div className="sheet-leads-container">
                    {leadOrder.map((leadKey) => {
                      const config = leadConfigs[leadKey] || leadConfigs['DII'];
                      const points = generateLeadWaveform(config, 2.5, 75, exam.simulatedEcgType || 'NORMAL');
                      return (
                        <div key={`sheet-${leadKey}`} className="sheet-lead-item">
                          <canvas
                            ref={el => {
                              if (!el) return;
                              const ctx = el.getContext('2d');
                              if (!ctx) return;
                              drawEcgOnCanvas(ctx, el.width, el.height, leadKey, points, {
                                theme: 'classic',
                                scale: 1.0,
                                showGrid: true
                              });
                            }}
                            width={340}
                            height={110}
                            className="sheet-lead-canvas"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* DII Longo na base da folha */}
                  <div className="sheet-rhythm-strip">
                    <canvas
                      ref={el => {
                        if (!el) return;
                        const ctx = el.getContext('2d');
                        if (!ctx) return;
                        const config = leadConfigs['DII'];
                        const points = generateLeadWaveform(config, 9.0, 75, exam.simulatedEcgType || 'NORMAL');
                        drawEcgOnCanvas(ctx, el.width, el.height, 'DII LONGO (RITMO DE BASE)', points, {
                          theme: 'classic',
                          scale: 1.0,
                          showGrid: true
                        });
                      }}
                      width={1380}
                      height={120}
                      className="sheet-rhythm-canvas"
                    />
                  </div>
                </div>

                {/* Rodapé de Parâmetros e Calibração */}
                <div className="ecg-sheet-footer">
                  <div className="sheet-cal-params">
                    <span>Velocidade: <strong>25 mm/s</strong></span>
                    <span>Sensibilidade: <strong>10 mm/mV</strong></span>
                    <span>Frequência Cardíaca estimada: <strong>72 bpm</strong></span>
                    <span>Arquivo de Origem: <strong>{exam.fileName}</strong> ({exam.fileSize})</span>
                  </div>
                  <div className="sheet-audit-hash">
                    <span>Validação Digital SHA-256: <code>sha256:9f83b2...a841</code></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
