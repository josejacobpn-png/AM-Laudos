/**
 * Utilitário de persistência de arquivos em IndexedDB para exames médicos.
 * Permite armazenar PDFs, imagens de alta resolução e arquivos DICOM/XML
 * sem esbarrar no limite de 5MB do localStorage.
 */

const DB_NAME = 'am_laudos_files_db';
const DB_VERSION = 1;
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
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
 * Recupera o arquivo de um exame pelo examId.
 */
export async function getExamFile(examId: string): Promise<StoredExamFile | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(examId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
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
