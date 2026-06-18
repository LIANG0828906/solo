export interface WaveformOptions {
  color?: string;
  bgColor?: string;
  gradient?: [string, string];
}

export function renderWaveform(
  canvas: HTMLCanvasElement,
  channelData: Float32Array,
  options: WaveformOptions = {}
): void {
  const { color = '#64FFDA', bgColor = '#2A2A3E', gradient } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const midY = height / 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  if (channelData.length === 0) return;

  let fillStyle: string | CanvasGradient = color;
  if (gradient) {
    const g = ctx.createLinearGradient(0, 0, width, 0);
    g.addColorStop(0, gradient[0]);
    g.addColorStop(1, gradient[1]);
    fillStyle = g;
  }
  ctx.fillStyle = fillStyle;

  const samplesPerPixel = Math.max(1, Math.floor(channelData.length / width));
  for (let x = 0; x < width; x++) {
    const start = x * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, channelData.length);
    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i < end; i++) {
      const v = channelData[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!isFinite(min)) { min = 0; max = 0; }
    const yTop = midY - Math.abs(max) * midY;
    const yBot = midY + Math.abs(min) * midY;
    const barH = Math.max(1, yBot - yTop);
    ctx.fillRect(x, yTop, 1, barH);
  }
}

export function renderWaveformThumbnail(
  canvas: HTMLCanvasElement,
  channelData: Float32Array,
  width: number,
  height: number,
  gradientColors: [string, string]
): void {
  canvas.width = width;
  canvas.height = height;
  renderWaveform(canvas, channelData, { gradient: gradientColors });
}

export function getBandColor(band: 'low' | 'mid' | 'high' | null): string {
  switch (band) {
    case 'low': return '#FF6B6B';
    case 'mid': return '#64FFDA';
    case 'high': return '#B388FF';
    default: return '#555577';
  }
}

export function getBandLabel(band: 'low' | 'mid' | 'high' | null): string {
  switch (band) {
    case 'low': return '低频';
    case 'mid': return '中频';
    case 'high': return '高频';
    default: return '—';
  }
}
