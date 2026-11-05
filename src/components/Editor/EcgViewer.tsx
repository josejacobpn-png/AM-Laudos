import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  FileText,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  RotateCw,
  Contrast,
  UploadCloud
} from 'lucide-react';
import type { Exam } from '../../types';
import { getExamFile, dataUrlToBlobUrl, fileToDataUrl, saveExamFile } from '../../utils/fileStorage';

interface EcgViewerProps {
  exam: Exam;
}

export const EcgViewer: React.FC<EcgViewerProps> = ({ exam }) => {
  // Estado do arquivo anexado (Data URL / Blob URL)
  const [fileContent, setFileContent] = useState<string | null>(exam.fileDataUrl || exam.fileUrl || null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Controles de Imagem (quando o anexo for foto/scanner de ECG)
  const [imgZoom, setImgZoom] = useState<number>(1.0);
  const [imgRotation, setImgRotation] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  // Modo Tela Cheia do Visualizador para análise minuciosa
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Ref para seleção manual de arquivo direto no visualizador
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recuperar arquivo do IndexedDB caso não esteja em memória
  useEffect(() => {
    if (exam.fileDataUrl || exam.fileUrl) {
      setFileContent(exam.fileDataUrl || exam.fileUrl || null);
      return;
    }

    setIsLoadingFile(true);
    getExamFile(exam.id, exam.fileName)
      .then(stored => {
        if (stored?.dataUrl) {
          setFileContent(stored.dataUrl);
        }
      })
      .finally(() => {
        setIsLoadingFile(false);
      });
  }, [exam.id, exam.fileName, exam.fileDataUrl, exam.fileUrl]);

  // Converter dataUrl em blobUrl para compatibilidade nativa com o leitor de PDF do navegador
  useEffect(() => {
    if (!fileContent) {
      setBlobUrl(null);
      return;
    }

    if (fileContent.startsWith('blob:') || fileContent.startsWith('http')) {
      setBlobUrl(fileContent);
      return;
    }

    try {
      const converted = dataUrlToBlobUrl(fileContent);
      setBlobUrl(converted);
      return () => {
        if (converted.startsWith('blob:')) {
          URL.revokeObjectURL(converted);
        }
      };
    } catch (e) {
      console.warn('Erro ao gerar blobUrl do arquivo:', e);
      setBlobUrl(fileContent);
    }
  }, [fileContent]);

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

  // Handler de carregamento manual de arquivo pelo médico
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await fileToDataUrl(file);
        setFileContent(dataUrl);
        await saveExamFile(exam.id, file.name, file.type, dataUrl, `${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      } catch (err) {
        console.warn('Erro ao carregar arquivo de exame:', err);
      }
    }
  };

  // Detectar tipo de arquivo
  const isImageFile = 
    exam.fileType === 'IMAGE' || 
    exam.fileName.match(/\.(png|jpe?g|webp|bmp|gif)$/i) || 
    (fileContent && fileContent.startsWith('data:image/'));

  // Handler de abertura em nova aba (utilizando blobUrl seguro)
  const handleOpenInNewTab = () => {
    const targetUrl = blobUrl || fileContent;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <div className={`ecg-viewer-container theme-classic ${isFullscreen ? 'ecg-viewer-fullscreen' : ''}`}>
      {/* Input de arquivo invisível para anexar/trocar arquivo manualmente */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.xml,.dcm"
        onChange={handleManualUpload}
      />

      {/* Barra de Ferramentas Superior */}
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <div className="view-mode-tabs">
            <div className="mode-tab-btn active" style={{ cursor: 'default' }}>
              <FileText size={15} />
              <span>Arquivo do Exame ({exam.fileName})</span>
            </div>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Controles de Imagem (quando o anexo for imagem) */}
          {isImageFile && fileContent && (
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

          {/* Botão para anexar ou substituir arquivo */}
          <button
            className="tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Carregar ou substituir arquivo de exame (PDF / Imagem)"
          >
            <UploadCloud size={16} />
          </button>

          {blobUrl && (
            <>
              <button
                className="tool-btn"
                onClick={handleOpenInNewTab}
                title="Abrir arquivo em uma nova aba do navegador"
              >
                <ExternalLink size={16} />
              </button>

              <a
                href={blobUrl}
                download={exam.fileName}
                className="tool-btn"
                title="Baixar arquivo original"
              >
                <Download size={16} />
              </a>
            </>
          )}

          {/* Botão de Tela Cheia */}
          <button
            className={`tool-btn ${isFullscreen ? 'active' : ''}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Restaurar tela dividida (Esc)' : 'Expandir visualizador em Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Conteúdo: Exibição Integral do Arquivo Anexado */}
      <div className="pdf-full-viewer-pane">
        {isLoadingFile ? (
          <div className="file-loading-state">
            <div className="spinner" />
            <p>Carregando arquivo anexado ({exam.fileName})...</p>
          </div>
        ) : fileContent ? (
          isImageFile ? (
            /* Visualização de Imagem em Alta Resolução */
            <div className="image-viewer-container">
              <div className="pdf-doc-action-bar">
                <div className="pdf-doc-meta">
                  <FileText size={16} className="text-primary" />
                  <span><strong>{exam.fileName}</strong> ({exam.fileSize})</span>
                  <span className="pdf-verified-badge">Imagem Anexa</span>
                </div>
                <div className="pdf-doc-buttons">
                  <button
                    type="button"
                    className="btn-doc-action"
                    onClick={handleOpenInNewTab}
                    title="Abrir em Nova Aba"
                  >
                    <ExternalLink size={15} />
                    <span>Nova Aba</span>
                  </button>
                  {blobUrl && (
                    <a
                      href={blobUrl}
                      download={exam.fileName}
                      className="btn-doc-action"
                      title="Baixar Arquivo"
                    >
                      <Download size={15} />
                      <span>Baixar</span>
                    </a>
                  )}
                </div>
              </div>

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
                  src={blobUrl || fileContent}
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
              <div className="pdf-doc-action-bar">
                <div className="pdf-doc-meta">
                  <FileText size={16} className="text-primary" />
                  <span><strong>{exam.fileName}</strong> ({exam.fileSize})</span>
                  <span className="pdf-verified-badge">PDF Nativo</span>
                </div>
                <div className="pdf-doc-buttons">
                  <button
                    type="button"
                    className="btn-doc-action"
                    onClick={handleOpenInNewTab}
                    title="Abrir PDF em tela cheia numa nova aba do navegador"
                  >
                    <ExternalLink size={15} />
                    <span>Abrir em Nova Aba</span>
                  </button>
                  {blobUrl && (
                    <a
                      href={blobUrl}
                      download={exam.fileName}
                      className="btn-doc-action"
                      title="Baixar Arquivo PDF"
                    >
                      <Download size={15} />
                      <span>Baixar</span>
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn-doc-action"
                    onClick={() => fileInputRef.current?.click()}
                    title="Substituir ou enviar outro arquivo de exame"
                  >
                    <UploadCloud size={15} />
                    <span>Substituir</span>
                  </button>
                </div>
              </div>

              {blobUrl ? (
                <iframe
                  src={blobUrl}
                  title={`Documento do Exame - ${exam.fileName}`}
                  className="pdf-native-iframe"
                />
              ) : (
                <div className="file-loading-state">
                  <div className="spinner" />
                  <p>Processando documento PDF...</p>
                </div>
              )}
            </div>
          )
        ) : (
          /* Caso nenhum arquivo físico tenha sido salvo para este exame */
          <div className="pdf-empty-upload-box">
            <FileText size={48} style={{ color: '#94a3b8', marginBottom: '0.85rem' }} />
            <h4>Nenhum arquivo físico foi localizado para este exame</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '480px', margin: '0.35rem auto 1.25rem auto' }}>
              O exame <strong>{exam.fileName}</strong> foi registrado sem anexo direto. Você pode carregar o PDF ou imagem agora:
            </p>

            <button
              type="button"
              className="btn-primary-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: 'auto' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={18} />
              <span>Carregar Arquivo PDF / Imagem de Exame</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
