// Gerador de traçado e sinais de eletrocardiograma (ECG) para visualização clínica
import type { EcgWavePoint } from '../types';

export interface LeadConfig {
  name: string;
  pAmp: number;
  qAmp: number;
  rAmp: number;
  sAmp: number;
  stElev: number;
  tAmp: number;
  qrsDurationFactor: number;
}

export function getLeadConfigs(ecgType: string = 'NORMAL'): Record<string, LeadConfig> {
  const isLBBB = ecgType === 'LBBB';
  const isIschemia = ecgType === 'ISCHEMIA';
  const isAF = ecgType === 'ARRHYTHMIA';

  const baseConfigs: Record<string, LeadConfig> = {
    'DI':   { name: 'DI',   pAmp: isAF ? 0.03 : 0.15, qAmp: -0.05, rAmp: isLBBB ? 1.6 : 1.1, sAmp: -0.1,  stElev: 0.0, tAmp: isLBBB ? -0.3 : 0.25, qrsDurationFactor: isLBBB ? 1.8 : 1.0 },
    'DII':  { name: 'DII',  pAmp: isAF ? 0.02 : 0.25, qAmp: -0.1,  rAmp: 1.8, sAmp: -0.2,  stElev: isIschemia ? -0.15 : 0.0, tAmp: 0.35, qrsDurationFactor: isLBBB ? 1.7 : 1.0 },
    'DIII': { name: 'DIII', pAmp: isAF ? 0.04 : 0.12, qAmp: -0.15, rAmp: 0.9, sAmp: -0.3,  stElev: isIschemia ? -0.2 : 0.0,  tAmp: 0.15, qrsDurationFactor: 1.0 },
    'aVR':  { name: 'aVR',  pAmp: isAF ? -0.02 : -0.18, qAmp: 0.1, rAmp: -1.2, sAmp: 0.1,  stElev: 0.0, tAmp: -0.2, qrsDurationFactor: 1.0 },
    'aVL':  { name: 'aVL',  pAmp: isAF ? 0.02 : 0.12, qAmp: -0.05, rAmp: isLBBB ? 1.4 : 0.8, sAmp: -0.1,  stElev: 0.0, tAmp: isLBBB ? -0.2 : 0.2, qrsDurationFactor: isLBBB ? 1.7 : 1.0 },
    'aVF':  { name: 'aVF',  pAmp: isAF ? 0.03 : 0.2,  qAmp: -0.1,  rAmp: 1.3, sAmp: -0.25, stElev: isIschemia ? -0.15 : 0.0, tAmp: 0.25, qrsDurationFactor: 1.0 },
    'V1':   { name: 'V1',   pAmp: isAF ? 0.04 : 0.1,  qAmp: 0.0,   rAmp: 0.25, sAmp: isLBBB ? -2.2 : -1.2, stElev: isIschemia ? 0.35 : 0.0, tAmp: isLBBB ? 0.3 : -0.1, qrsDurationFactor: isLBBB ? 1.8 : 1.0 },
    'V2':   { name: 'V2',   pAmp: isAF ? 0.03 : 0.12, qAmp: -0.05, rAmp: 0.5, sAmp: isLBBB ? -2.4 : -1.6, stElev: isIschemia ? 0.55 : 0.0, tAmp: isIschemia ? 0.6 : (isLBBB ? 0.35 : 0.2), qrsDurationFactor: isLBBB ? 1.8 : 1.0 },
    'V3':   { name: 'V3',   pAmp: isAF ? 0.02 : 0.14, qAmp: -0.08, rAmp: 0.9, sAmp: isLBBB ? -2.0 : -1.2, stElev: isIschemia ? 0.45 : 0.0, tAmp: isIschemia ? 0.55 : 0.3, qrsDurationFactor: 1.0 },
    'V4':   { name: 'V4',   pAmp: isAF ? 0.03 : 0.16, qAmp: -0.1,  rAmp: 1.5, sAmp: -0.7,  stElev: isIschemia ? 0.3 : 0.0,  tAmp: 0.35, qrsDurationFactor: 1.0 },
    'V5':   { name: 'V5',   pAmp: isAF ? 0.02 : 0.18, qAmp: -0.1,  rAmp: isLBBB ? 2.1 : 1.8, sAmp: -0.3,  stElev: 0.0, tAmp: isLBBB ? -0.35 : 0.35, qrsDurationFactor: isLBBB ? 1.8 : 1.0 },
    'V6':   { name: 'V6',   pAmp: isAF ? 0.02 : 0.15, qAmp: -0.05, rAmp: isLBBB ? 1.9 : 1.4, sAmp: -0.1,  stElev: 0.0, tAmp: isLBBB ? -0.3 : 0.3, qrsDurationFactor: isLBBB ? 1.8 : 1.0 }
  };

  return baseConfigs;
}

// Gera pontos de amplitude (mV) ao longo do tempo (segundos) para uma derivação específica
export function generateLeadWaveform(
  leadConfig: LeadConfig,
  durationSeconds: number = 3.0,
  heartRate: number = 75,
  ecgType: string = 'NORMAL',
  sampleRate: number = 250 // amostras por segundo
): EcgWavePoint[] {
  const points: EcgWavePoint[] = [];
  const totalSamples = Math.floor(durationSeconds * sampleRate);
  const isAF = ecgType === 'ARRHYTHMIA';

  // Base RR interval in seconds
  const baseRR = 60 / heartRate;
  let currentBeatTime = 0.08;

  // Lista dos tempos de cada batimento (com variação se FA)
  const beatTimes: number[] = [];
  while (currentBeatTime < durationSeconds + 0.5) {
    beatTimes.push(currentBeatTime);
    if (isAF) {
      // Variação irregular de batimento a batimento
      const jitter = (Math.random() - 0.5) * 0.35;
      currentBeatTime += Math.max(0.38, baseRR + jitter);
    } else {
      currentBeatTime += baseRR;
    }
  }

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let mv = 0;

    // Se Fibrilação Atrial, adicionar ondulações rápidas 'f' na linha de base
    if (isAF) {
      mv += Math.sin(t * 30) * 0.04 + Math.sin(t * 52) * 0.03;
    }

    // Calcular influência do batimento mais próximo
    for (const bTime of beatTimes) {
      const dt = t - bTime; // tempo relativo ao pico R (segundos)

      // Se muito distante do batimento atual, ignora
      if (Math.abs(dt) > 0.45) continue;

      // 1. Onda P (ocorre cerca de -0.16s a -0.08s antes do R)
      if (!isAF) {
        const pCenter = -0.16;
        const pWidth = 0.045;
        const pDist = dt - pCenter;
        mv += leadConfig.pAmp * Math.exp(-(pDist * pDist) / (2 * pWidth * pWidth));
      }

      // 2. Complexo QRS
      const qrsScale = leadConfig.qrsDurationFactor || 1.0;
      // Onda Q (cerca de -0.03s)
      const qCenter = -0.03 * qrsScale;
      const qWidth = 0.012 * qrsScale;
      mv += leadConfig.qAmp * Math.exp(-((dt - qCenter) ** 2) / (2 * qWidth ** 2));

      // Onda R (pico em dt = 0.0s)
      const rWidth = 0.018 * qrsScale;
      mv += leadConfig.rAmp * Math.exp(-(dt ** 2) / (2 * rWidth ** 2));

      // Onda S (cerca de +0.035s)
      const sCenter = 0.035 * qrsScale;
      const sWidth = 0.016 * qrsScale;
      mv += leadConfig.sAmp * Math.exp(-((dt - sCenter) ** 2) / (2 * sWidth ** 2));

      // 3. Segmento ST e Onda T
      // ST Elevation / Desnivelamento
      const stCenter = 0.10 * qrsScale;
      const stWidth = 0.045 * qrsScale;
      mv += leadConfig.stElev * Math.exp(-((dt - stCenter) ** 2) / (2 * stWidth ** 2));

      // Onda T (cerca de +0.22s)
      const tCenter = 0.22 * qrsScale;
      const tWidth = 0.065 * qrsScale;
      const tDist = dt - tCenter;
      mv += leadConfig.tAmp * Math.exp(-(tDist * tDist) / (2 * tWidth * tWidth));
    }

    // Leve ruído de linha de base biológica
    const biologicalNoise = (Math.sin(t * 1.5) * 0.01) + ((Math.random() - 0.5) * 0.008);
    mv += biologicalNoise;

    points.push({ time: t, amplitude: mv });
  }

  return points;
}

// Renderiza uma derivação no elemento Canvas com a grade milimetrada clássica
export function drawEcgOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  leadName: string,
  points: EcgWavePoint[],
  options: {
    theme?: 'classic' | 'dark';
    mmPerSecond?: number; // padrão 25 mm/s
    mmPerMv?: number;     // padrão 10 mm/mV
    showGrid?: boolean;
    scale?: number;
  } = {}
) {
  const {
    theme = 'classic',
    showGrid = true,
    scale = 1.0
  } = options;

  // Cores do tema
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0b1320' : '#fff5f5';
  const majorGridColor = isDark ? 'rgba(56, 189, 248, 0.25)' : '#fca5a5';
  const minorGridColor = isDark ? 'rgba(56, 189, 248, 0.10)' : '#fee2e2';
  const waveColor = isDark ? '#38bdf8' : '#0f172a';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // Limpar fundo
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Escala milimétrica aproximada em pixels na tela:
  // 1 mm ≈ 4 pixels em escala padrão (25 mm = 100px por segundo)
  const pxPerMm = 3.78 * scale;
  const majorStep = 5 * pxPerMm; // quadrado grande de 5mm (0.20s ou 0.5mV)
  const minorStep = 1 * pxPerMm; // quadrado pequeno de 1mm (0.04s ou 0.1mV)

  // 1. Grade milimetrada
  if (showGrid) {
    // Linhas menores (1mm)
    ctx.beginPath();
    ctx.strokeStyle = minorGridColor;
    ctx.lineWidth = 0.5;

    for (let x = 0; x < width; x += minorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += minorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Linhas maiores (5mm)
    ctx.beginPath();
    ctx.strokeStyle = majorGridColor;
    ctx.lineWidth = 1.0;

    for (let x = 0; x < width; x += majorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += majorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  // Linha de calibração / base central
  const centerY = height * 0.55;

  // 2. Traçado do sinal
  if (points.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = isDark ? 2.0 : 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Conversão de mV e Segundos para pixels:
    // Tempo: 25 mm/s -> 25 * pxPerMm pixels por segundo
    const pxPerSecond = 25 * pxPerMm;
    // Voltagem: 10 mm/mV -> 10 * pxPerMm pixels por mV (invertido no eixo Y)
    const pxPerMv = 10 * pxPerMm;

    let started = false;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = 30 + pt.time * pxPerSecond;
      const y = centerY - (pt.amplitude * pxPerMv);

      if (x > width + 10) break;

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // 3. Rótulo da derivação no canto superior esquerdo
  ctx.fillStyle = textColor;
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText(leadName, 8, 18);
}
