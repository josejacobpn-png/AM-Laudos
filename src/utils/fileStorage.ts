/**
 * Utilitário de persistência e conversão de arquivos para exames médicos.
 * Utiliza IndexedDB e Blob URLs para contornar limitações de CSP/CORS
 * de iframes com Data URLs no Chromium e a cota de 5MB do localStorage.
 */

const DB_NAME = 'am_laudos_files_db';
const DB_VERSION = 2;
const STORE_NAME = 'exam_files';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('fileName', 'fileName', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredExamFile {
  id: string; // examId
  fileName: string;
  fileType: string;
  dataUrl: string;
  fileSize?: string;
  updatedAt: number;
}

/**
 * Salva o arquivo de um exame no IndexedDB.
 */
export async function saveExamFile(
  examId: string, 
  fileName: string, 
  fileType: string, 
  dataUrl: string,
  fileSize?: string
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredExamFile = {
        id: examId,
        fileName,
        fileType,
        dataUrl,
        fileSize,
        updatedAt: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao salvar arquivo no IndexedDB:', err);
  }
}

/**
 * Recupera o arquivo de um exame pelo examId ou fileName.
 */
export async function getExamFile(examId: string, fileName?: string): Promise<StoredExamFile | null> {
  try {
    const db = await openDatabase();
    
    // 1. Tentar buscar diretamente por ID
    const directMatch = await new Promise<StoredExamFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(examId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (directMatch) return directMatch;

    // 2. Se não encontrou por ID e há fileName, buscar pelo nome do arquivo
    if (fileName) {
      return new Promise<StoredExamFile | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const all: StoredExamFile[] = req.result || [];
          const found = all.find(item => item.fileName.toLowerCase() === fileName.toLowerCase());
          resolve(found || null);
        };
        req.onerror = () => reject(req.error);
      });
    }

    return null;
  } catch (err) {
    console.warn('Erro ao buscar arquivo no IndexedDB:', err);
    return null;
  }
}

/**
 * Converte um objeto File ou Blob do navegador para DataURL (base64)
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Converte DataURL (base64) para Blob URL (blob:http...)
 * Essencial no Chromium (Chrome / Edge), pois iframes bloqueiam data:application/pdf
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl) return '';
  if (dataUrl.startsWith('blob:')) return dataUrl;
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return dataUrl;

    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Erro ao converter dataUrl para blobUrl:', err);
    return dataUrl;
  }
}
