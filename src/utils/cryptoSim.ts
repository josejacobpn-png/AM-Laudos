// Utilitário para cálculo de Hash criptográfico SHA-256 e geração de dados de Assinatura Digital do Laudo

export async function calculateSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  // Fallback simulado
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return ('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855' + Math.abs(hash).toString(16)).slice(0, 64).toUpperCase();
}

export function formatDateTimeBR(isoString?: string): string {
  const d = isoString ? new Date(isoString) : new Date();
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function generateProtocolNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ECG-${year}-${rand}`;
}

/**
 * Remove redundâncias de prefixos médicos (ex: "DR(A). DR(A). DRA GIOVANA MARIA" -> "DRA. GIOVANA MARIA")
 * e formata para exibição padronizada e elegante em laudos e assinaturas.
 */
export function formatDoctorDisplayName(rawName?: string): string {
  if (!rawName) return 'MÉDICO(A) CARDIOLOGISTA';
  let cleaned = rawName.trim();

  let isDra = false;
  let isDr = false;

  // Regex para capturar e limpar qualquer prefixo no início repetidamente
  const prefixRegex = /^(dr\(a\)\.?|dr\.|dra\.|dr\b|dra\b|doutor\(a\)\.?|doutor\b|doutora\b)\s*/i;

  while (prefixRegex.test(cleaned)) {
    const match = cleaned.match(prefixRegex);
    if (match) {
      const p = match[1].toLowerCase();
      if (p.startsWith('dra') || p.startsWith('doutora')) {
        isDra = true;
      } else if ((p.startsWith('dr') || p.startsWith('doutor')) && !p.includes('(a)')) {
        isDr = true;
      }
      cleaned = cleaned.replace(prefixRegex, '').trim();
    }
  }

  // Remove caracteres residuais como pontos, traços ou espaços no início
  cleaned = cleaned.replace(/^[.\s-]+/, '').trim();

  if (!cleaned) {
    return isDra ? 'DRA.' : isDr ? 'DR.' : 'DR(A).';
  }

  const prefix = isDra ? 'DRA.' : isDr ? 'DR.' : 'DR(A).';
  return `${prefix} ${cleaned.toUpperCase()}`;
}
