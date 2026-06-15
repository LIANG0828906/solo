export interface PitchPoint {
  id: string;
  x: number;
  y: number;
}

export interface Marker {
  id: string;
  time: number;
  note: string;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string = 'rgba(74, 222, 128, 0.08)'
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const stepX = w / 20;
  const stepY = h / 8;
  for (let x = stepX; x < w; x += stepX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = stepY; y < h; y += stepY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number
): void {
  if (!data || data.length === 0) return;
  const sliceWidth = w / data.length;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#4ade80';
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * h) / 2;
    if (i === 0) {
      ctx.moveTo(0, y);
    } else {
      ctx.lineTo(i * sliceWidth, y);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * h) / 2;
    if (i === 0) {
      ctx.moveTo(0, y);
    } else {
      ctx.lineTo(i * sliceWidth, y);
    }
  }
  ctx.stroke();
}

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  time: number
): void {
  if (!data || data.length === 0) return;
  const barCount = Math.min(data.length, 80);
  const gap = 2;
  const barWidth = (w - gap * barCount) / barCount;

  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * data.length);
    const value = data[dataIndex] / 255;
    const breath = 1 + 0.03 * Math.sin(time * 2 + i * 0.3);
    const barHeight = value * h * 0.85 * breath;
    const x = i * (barWidth + gap);
    const y = h - barHeight;

    const t = i / barCount;
    const r = Math.round(70 + t * 185);
    const g = Math.round(50 + (1 - t) * 30);
    const b = Math.round(200 - t * 120);

    const gradient = ctx.createLinearGradient(x, y, x, h);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.3)`);
    ctx.fillStyle = gradient;

    ctx.beginPath();
    const radius = Math.min(barWidth / 2, 3);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, h);
    ctx.lineTo(x, h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();
  }
}

function catmullRomToBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number
): [number, number, number] {
  const cp1 = p1 + (p2 - p0) / 6;
  const cp2 = p2 - (p3 - p1) / 6;
  return [cp1, cp2, p2];
}

export function drawPitchCurve(
  ctx: CanvasRenderingContext2D,
  points: PitchPoint[],
  w: number,
  h: number
): void {
  if (points.length === 0) return;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const mapped = sorted.map((p) => ({
    x: p.x * w,
    y: p.y * h,
  }));

  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 6;
  ctx.beginPath();

  if (mapped.length === 1) {
    ctx.moveTo(0, mapped[0].y);
    ctx.lineTo(w, mapped[0].y);
  } else if (mapped.length === 2) {
    ctx.moveTo(mapped[0].x, mapped[0].y);
    ctx.lineTo(mapped[1].x, mapped[1].y);
  } else {
    ctx.moveTo(mapped[0].x, mapped[0].y);
    for (let i = 0; i < mapped.length - 1; i++) {
      const p0 = mapped[Math.max(0, i - 1)];
      const p1 = mapped[i];
      const p2 = mapped[i + 1];
      const p3 = mapped[Math.min(mapped.length - 1, i + 2)];
      const [cp1x, cp2x, endx] = catmullRomToBezier(p0.x, p1.x, p2.x, p3.x);
      const [cp1y, cp2y, endy] = catmullRomToBezier(p0.y, p1.y, p2.y, p3.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255, 107, 107, 0.2)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (mapped.length === 1) {
    ctx.moveTo(0, mapped[0].y);
    ctx.lineTo(w, mapped[0].y);
  } else if (mapped.length === 2) {
    ctx.moveTo(mapped[0].x, mapped[0].y);
    ctx.lineTo(mapped[1].x, mapped[1].y);
  } else {
    ctx.moveTo(mapped[0].x, mapped[0].y);
    for (let i = 0; i < mapped.length - 1; i++) {
      const p0 = mapped[Math.max(0, i - 1)];
      const p1 = mapped[i];
      const p2 = mapped[i + 1];
      const p3 = mapped[Math.min(mapped.length - 1, i + 2)];
      const [cp1x, cp2x, endx] = catmullRomToBezier(p0.x, p1.x, p2.x, p3.x);
      const [cp1y, cp2y, endy] = catmullRomToBezier(p0.y, p1.y, p2.y, p3.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
    }
  }
  ctx.stroke();
}

export function drawControlHandles(
  ctx: CanvasRenderingContext2D,
  points: PitchPoint[],
  w: number,
  h: number,
  draggingId: string | null
): void {
  for (const p of points) {
    const px = p.x * w;
    const py = p.y * h;
    const isDragging = p.id === draggingId;
    const radius = isDragging ? 8 : 6;

    ctx.beginPath();
    ctx.arc(px, py, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = isDragging ? '#ff4444' : '#ff6b6b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function drawMarkerDiamonds(
  ctx: CanvasRenderingContext2D,
  markers: Marker[],
  w: number,
  duration: number,
  flashId: string | null,
  currentTime: number
): void {
  for (const m of markers) {
    if (duration <= 0) continue;
    const x = (m.time / duration) * w;
    const size = 6;
    const isFlash = m.id === flashId;

    ctx.save();
    ctx.translate(x, size + 4);
    ctx.rotate(Math.PI / 4);

    if (isFlash) {
      ctx.shadowColor = '#9b59b6';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-size * 1.5, -size * 1.5, size * 3, size * 3);
    }

    ctx.shadowColor = isFlash ? '#9b59b6' : 'transparent';
    ctx.shadowBlur = isFlash ? 12 : 0;
    ctx.fillStyle = isFlash ? '#c084fc' : '#9b59b6';
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size, -size, size * 2, size * 2);

    ctx.restore();

    ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.fillRect(x - 0.5, size * 2 + 6, 1, ctx.canvas.height - size * 2 - 6);
  }
}

export function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  duration: number,
  w: number,
  h: number
): void {
  if (duration <= 0) return;
  const x = (currentTime / duration) * w;
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, h);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function interpolatePitch(
  points: PitchPoint[],
  normalizedTime: number
): number {
  if (points.length === 0) return 0;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const t = Math.max(0, Math.min(1, normalizedTime));

  if (t <= sorted[0].x) {
    return (0.5 - sorted[0].y) * 24;
  }
  if (t >= sorted[sorted.length - 1].x) {
    return (0.5 - sorted[sorted.length - 1].y) * 24;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].x && t <= sorted[i + 1].x) {
      const range = sorted[i + 1].x - sorted[i].x;
      const localT = range > 0 ? (t - sorted[i].x) / range : 0;
      const y = sorted[i].y + (sorted[i + 1].y - sorted[i].y) * localT;
      return (0.5 - y) * 24;
    }
  }
  return 0;
}

export function startAnimationLoop(
  callback: (timestamp: number) => void,
  targetFPS: number = 30
): () => void {
  const interval = 1000 / targetFPS;
  let lastTime = 0;
  let rafId = 0;
  let running = true;

  const loop = (timestamp: number) => {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    const delta = timestamp - lastTime;
    if (delta >= interval) {
      lastTime = timestamp - (delta % interval);
      callback(timestamp);
    }
  };

  rafId = requestAnimationFrame(loop);
  return () => {
    running = false;
    cancelAnimationFrame(rafId);
  };
}

export function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const dataLength = length * numChannels * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}
