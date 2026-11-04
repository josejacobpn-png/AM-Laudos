import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon, 
  Grid, 
  Compass, 
  FileText,
  RotateCcw
} from 'lucide-react';
import type { Exam } from '../../types';
import { getLeadConfigs, generateLeadWaveform, drawEcgOnCanvas } from '../../utils/ecgGenerator';
import { formatDateTimeBR } from '../../utils/cryptoSim';

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
  const [activeTab, setActiveTab] = useState<'tracado' | 'pdf_original'>('tracado');

  const leadOrder = ['DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  const leadConfigs = getLeadConfigs(exam.simulatedEcgType || 'NORMAL');

  // Canvas refs para cada derivação
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    if (activeTab !== 'tracado') return;

    // Renderizar cada derivação
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

  return (
    <div className={`ecg-viewer-container ${theme === 'dark' ? 'theme-dark' : 'theme-classic'}`}>
      {/* Barra de Controles do Eletrocardiógrafo */}
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <div className="view-mode-tabs">
            <button
              className={`mode-tab-btn ${activeTab === 'tracado' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracado')}
            >
              <Grid size={15} />
              <span>Traçado 12D Calibrado</span>
            </button>
            <button
              className={`mode-tab-btn ${activeTab === 'pdf_original' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf_original')}
            >
              <FileText size={15} />
              <span>Arquivo Original ({exam.fileName})</span>
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
          {/* Zoom */}
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
              onClick={() => setScale(s => Math.min(1.6, s + 0.15))}
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
        </div>
      </div>

      {/* Faixa de Informação da Régua Digital se ativa */}
      {showRuler && (
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

      {/* Conteúdo do Traçado ou PDF Original */}
      {activeTab === 'tracado' ? (
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
      ) : (
        /* Visualização do PDF Nativo enviado pela Clínica */
        <div className="pdf-preview-pane">
          <div className="pdf-doc-sheet">
            <div className="pdf-sheet-header">
              <div>
                <h4>{exam.clinicName}</h4>
                <p>Equipamento Eletrocardiógrafo Digital 12 Canais • Calibração NBR IEC 60601-2-25</p>
              </div>
              <span className="pdf-status-tag">DOCUMENTO ORIGINAL NATIVO</span>
            </div>

            <div className="pdf-patient-strip">
              <span><strong>Paciente:</strong> {exam.patient.name}</span>
              <span><strong>Idade:</strong> {exam.patient.age ? `${exam.patient.age} anos` : 'Não informada'}</span>
              <span><strong>Sexo:</strong> {exam.patient.gender}</span>
              <span><strong>Data/Hora:</strong> {formatDateTimeBR(exam.receivedAt)}</span>
            </div>

            <div className="pdf-simulated-content">
              <div className="pdf-ecg-paper">
                <div className="pdf-grid-watermark">
                  <p>TRAÇADO DIGITALIZADO RECEBIDO VIA UPLOAD CENTRALIZADO</p>
                  <p>Arquivo: {exam.fileName} ({exam.fileSize})</p>
                  <p>Checksum SHA-256 Validado no Portal de Telemedicina</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
