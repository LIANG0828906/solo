import { scaleLinear } from 'd3-scale';

export interface AudioAnalyzer {
  analyser: AnalyserNode;
  context: AudioContext;
  source: AudioBufferSourceNode | MediaElementAudioSourceNode;
  gainNode: GainNode;
}

export function createAudioAnalyzer(audioElement: HTMLAudioElement): AudioAnalyzer | null {
  try {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaElementSource(audioElement);
    const gainNode = ctx.createGain();
    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(ctx.destination);
    return { analyser, context: ctx, source, gainNode };
  } catch {
    return null;
  }
}

export function getFrequencyData(analyzer: AudioAnalyzer): Uint8Array {
  const data = new Uint8Array(analyzer.analyser.frequencyBinCount);
  analyzer.analyser.getByteFrequencyData(data);
  return data;
}

const freqToColor = scaleLinear<string>()
  .domain([0, 85, 170])
  .range(['#3B82F6', '#22C55E', '#EF4444'])
  .clamp(true);

export function getWaveformColors(frequencyData: Uint8Array): string[] {
  const step = Math.max(1, Math.floor(frequencyData.length / 64));
  const colors: string[] = [];
  for (let i = 0; i < frequencyData.length; i += step) {
    const freq = frequencyData[i];
    const ratio = freq / 255;
    colors.push(freqToColor(i / frequencyData.length * 170));
  }
  return colors;
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  frequencyData: Uint8Array,
  colors: string[]
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const barCount = Math.min(frequencyData.length, 64);
  const barWidth = w / barCount;
  const step = Math.max(1, Math.floor(frequencyData.length / barCount));

  for (let i = 0; i < barCount; i++) {
    const value = frequencyData[i * step] / 255;
    const barHeight = value * h;
    ctx.fillStyle = colors[i] || '#3B82F6';
    ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
  }
}

export function parseCSV(text: string): { name: string; message: string }[] {
  const lines = text.trim().split('\n');
  const results: { name: string; message: string }[] = [];
  const startIdx = lines[0].includes('name') || lines[0].includes('姓名') ? 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2 && parts[0]) {
      results.push({ name: parts[0], message: parts.slice(1).join(',') });
    }
  }
  return results;
}
