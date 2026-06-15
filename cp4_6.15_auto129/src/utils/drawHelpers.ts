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

export interface ControlHandleStyle {
  radius: number;
  fillColor: string;
  strokeColor: string;
  hoverRadius: number;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string = 'rgba(74, 222, 128, 0.08)'
): void {
  ctx.save();
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
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number
): void {
  if (!data || data.length === 0) return;
  const sliceWidth = w / data.length;

  ctx.save();
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
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

  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
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
  ctx.restore();
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

  ctx.save();
  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * data.length);
    const value = data[dataIndex] / 255;
    const breathPhase = time * 2 + i * 0.3;
    const breath = 1 + 0.05 * Math.sin(breathPhase);
    const barHeight = value * h * 0.85 * breath;
    const x = i * (barWidth + gap);
    const y = h - barHeight;

    const t = i / barCount;
    const r = Math.round(60 + t * 195);
    const g = Math.round(60 + (1 - t) * 40);
    const b = Math.round(220 - t * 140);

    const gradient = ctx.createLinearGradient(x, y, x, h);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.7)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.25)`);
    ctx.fillStyle = gradient;

    const radius = Math.min(barWidth / 2, 3);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, h);
    ctx.lineTo(x, h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 1, y + 1, Math.max(1, barWidth * 0.25), Math.max(2, barHeight * 0.5));
  }
  ctx.restore();
}

export function catmullRomToBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number
): [number, number, number] {
  const cp1 = p1 + (p2 - p0) / 6;
  const cp2 = p2 - (p3 - p1) / 6;
  return [cp1, cp2, p2];
}

export function evaluateBezierAtT(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

export function drawPitchCurve(
  ctx: CanvasRenderingContext2D,
  points: PitchPoint[],
  w: number,
  h: number,
  showBezierControl: boolean = false
): { segments: Array<{ p0: any; p1: any; p2: any; p3: any }> } {
  const segments: Array<{ p0: any; p1: any; p2: any; p3: any }> = [];
  if (points.length === 0) return { segments };

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const mapped = sorted.map((p) => ({
    x: p.x * w,
    y: p.y * h,
    id: p.id,
  }));

  ctx.save();

  ctx.strokeStyle = 'rgba(255, 107, 107, 0.18)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  if (mapped.length === 1) {
    ctx.moveTo(0, mapped[0].y);
    ctx.lineTo(w, mapped[0].y);
  } else if (mapped.length === 2) {
    const p0 = { x: 0, y: mapped[0].y };
    const p3 = { x: w, y: mapped[1].y };
    const dx = p3.x - p0.x;
    const p1 = { x: p0.x + dx * 0.33, y: mapped[0].y };
    const p2 = { x: p0.x + dx * 0.67, y: mapped[1].y };
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    segments.push({ p0, p1, p2, p3 });
  } else {
    const extended = [
      { x: Math.max(-w * 0.1, mapped[0].x - w * 0.1), y: mapped[0].y },
      ...mapped,
      { x: Math.min(w * 1.1, mapped[mapped.length - 1].x + w * 0.1), y: mapped[mapped.length - 1].y },
    ];

    ctx.moveTo(mapped[0].x, mapped[0].y);
    for (let i = 1; i < extended.length - 2; i++) {
      const p0 = extended[i - 1];
      const p1 = extended[i];
      const p2 = extended[i + 1];
      const p3 = extended[i + 2];
      const [cp1x, cp2x, endx] = catmullRomToBezier(p0.x, p1.x, p2.x, p3.x);
      const [cp1y, cp2y, endy] = catmullRomToBezier(p0.y, p1.y, p2.y, p3.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
      segments.push({
        p0: { x: p1.x, y: p1.y },
        p1: { x: cp1x, y: cp1y },
        p2: { x: cp2x, y: cp2y },
        p3: { x: endx, y: endy },
      });
    }
  }
  ctx.stroke();

  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  if (mapped.length === 1) {
    ctx.moveTo(0, mapped[0].y);
    ctx.lineTo(w, mapped[0].y);
  } else if (mapped.length === 2) {
    const p0 = { x: 0, y: mapped[0].y };
    const p3 = { x: w, y: mapped[1].y };
    const dx = p3.x - p0.x;
    const p1 = { x: p0.x + dx * 0.33, y: mapped[0].y };
    const p2 = { x: p0.x + dx * 0.67, y: mapped[1].y };
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  } else {
    const extended = [
      { x: Math.max(-w * 0.1, mapped[0].x - w * 0.1), y: mapped[0].y },
      ...mapped,
      { x: Math.min(w * 1.1, mapped[mapped.length - 1].x + w * 0.1), y: mapped[mapped.length - 1].y },
    ];

    ctx.moveTo(mapped[0].x, mapped[0].y);
    for (let i = 1; i < extended.length - 2; i++) {
      const p0 = extended[i - 1];
      const p1 = extended[i];
      const p2 = extended[i + 1];
      const p3 = extended[i + 2];
      const [cp1x, cp2x, endx] = catmullRomToBezier(p0.x, p1.x, p2.x, p3.x);
      const [cp1y, cp2y, endy] = catmullRomToBezier(p0.y, p1.y, p2.y, p3.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (showBezierControl && segments.length > 0) {
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.fillStyle = 'rgba(255, 107, 107, 0.5)';
    ctx.lineWidth = 1;
    for (const seg of segments) {
      ctx.beginPath();
      ctx.moveTo(seg.p0.x, seg.p0.y);
      ctx.lineTo(seg.p1.x, seg.p1.y);
      ctx.moveTo(seg.p2.x, seg.p2.y);
      ctx.lineTo(seg.p3.x, seg.p3.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(seg.p1.x, seg.p1.y, 3, 0, Math.PI * 2);
      ctx.arc(seg.p2.x, seg.p2.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  return { segments };
}

export function drawControlHandles(
  ctx: CanvasRenderingContext2D,
  points: PitchPoint[],
  w: number,
  h: number,
  draggingId: string | null,
  hoverId: string | null
): void {
  ctx.save();
  for (const p of points) {
    const px = p.x * w;
    const py = p.y * h;
    const isDragging = p.id === draggingId;
    const isHovering = p.id === hoverId;
    const radius = isDragging ? 9 : isHovering ? 7.5 : 6;

    ctx.beginPath();
    ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = isDragging ? 'rgba(255, 68, 68, 0.25)' : 'rgba(255, 107, 107, 0.18)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(px - 2, py - 2, 0, px, py, radius);
    if (isDragging) {
      gradient.addColorStop(0, '#ff8888');
      gradient.addColorStop(1, '#cc2222');
    } else {
      gradient.addColorStop(0, '#ff9999');
      gradient.addColorStop(1, '#ff4444');
    }

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isDragging ? 2 : 1.5;
    ctx.stroke();

    if (isHovering || isDragging) {
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = isDragging ? 12 : 8;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

export function drawMarkerDiamonds(
  ctx: CanvasRenderingContext2D,
  markers: Marker[],
  w: number,
  duration: number,
  flashId: string | null,
  currentTime: number
): void {
  ctx.save();
  for (const m of markers) {
    if (duration <= 0) continue;
    const x = (m.time / duration) * w;
    const baseSize = 6;
    const size = flashId === m.id ? baseSize * 1.4 : baseSize;
    const isFlash = flashId === m.id;

    ctx.translate(x, size + 4);

    if (isFlash) {
      ctx.shadowColor = '#9b59b6';
      ctx.shadowBlur = 20;
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.fillRect(-size * 1.8, -size * 1.8, size * 3.6, size * 3.6);
      ctx.rotate(-Math.PI / 4);
    }

    ctx.shadowColor = isFlash ? '#9b59b6' : 'transparent';
    ctx.shadowBlur = isFlash ? 15 : 0;

    ctx.rotate(Math.PI / 4);
    const gradient = ctx.createLinearGradient(-size, -size, size, size);
    if (isFlash) {
      gradient.addColorStop(0, '#e9d5ff');
      gradient.addColorStop(1, '#9333ea');
    } else {
      gradient.addColorStop(0, '#c084fc');
      gradient.addColorStop(1, '#7c3aed');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(-size, -size, size * 2, size * 2);

    ctx.strokeStyle = isFlash ? '#ffffff' : '#e0e0e0';
    ctx.lineWidth = isFlash ? 2 : 1;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.rotate(-Math.PI / 4);

    ctx.shadowBlur = 0;

    ctx.globalAlpha = isFlash ? 0.6 : 0.3;
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(-0.5, size * 2 + 4, 1, ctx.canvas.height - size * 2 - 4);
    ctx.globalAlpha = 1;

    ctx.translate(-x, -(size + 4));
  }
  ctx.restore();
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

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, h);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#00d2ff';
  ctx.shadowColor = '#00d2ff';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(x, h * 0.02, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
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
      const smoothT = localT * localT * (3 - 2 * localT);
      const y = sorted[i].y + (sorted[i + 1].y - sorted[i].y) * smoothT;
      return (0.5 - y) * 24;
    }
  }
  return 0;
}

export function interpolatePitchSmooth(
  points: PitchPoint[],
  w: number,
  h: number,
  normalizedTime: number
): number {
  if (points.length === 0) return 0;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const t = Math.max(0, Math.min(1, normalizedTime));

  if (sorted.length === 1) {
    return (0.5 - sorted[0].y) * 24;
  }

  if (sorted.length === 2) {
    const localT = (t - sorted[0].x) / (sorted[1].x - sorted[0].x);
    const clampedT = Math.max(0, Math.min(1, localT));
    const smoothT = clampedT * clampedT * (3 - 2 * clampedT);
    const y = sorted[0].y + (sorted[1].y - sorted[0].y) * smoothT;
    return (0.5 - y) * 24;
  }

  const extended = [
    { x: Math.max(-0.1, sorted[0].x - 0.1), y: sorted[0].y },
    ...sorted,
    { x: Math.min(1.1, sorted[sorted.length - 1].x + 0.1), y: sorted[sorted.length - 1].y },
  ];

  for (let i = 1; i < extended.length - 2; i++) {
    const segStart = extended[i].x;
    const segEnd = extended[i + 1].x;
    if (t >= segStart && t <= segEnd) {
      const range = segEnd - segStart;
      const localT = range > 0 ? (t - segStart) / range : 0;
      const p0 = extended[i - 1];
      const p1 = extended[i];
      const p2 = extended[i + 1];
      const p3 = extended[i + 2];
      const [cp1x, cp2x] = catmullRomToBezier(p0.x, p1.x, p2.x, p3.x);
      const [cp1y, cp2y] = catmullRomToBezier(p0.y, p1.y, p2.y, p3.y);
      const p0p = { x: p1.x, y: p1.y };
      const p1p = { x: cp1x, y: cp1y };
      const p2p = { x: cp2x, y: cp2y };
      const p3p = { x: p2.x, y: p2.y };
      const point = evaluateBezierAtT(p0p, p1p, p2p, p3p, localT);
      return (0.5 - point.y / h) * 24;
    }
  }

  if (t < sorted[0].x) return (0.5 - sorted[0].y) * 24;
  return (0.5 - sorted[sorted.length - 1].y) * 24;
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

export function applyPitchShiftToBuffer(
  sourceBuffer: AudioBuffer,
  pitchCurve: PitchPoint[],
  offlineCtx: OfflineAudioContext
): AudioBufferSourceNode {
  const source = offlineCtx.createBufferSource();
  source.buffer = sourceBuffer;

  if (pitchCurve.length === 0) {
    return source;
  }

  const sampleRate = sourceBuffer.sampleRate;
  const duration = sourceBuffer.duration;
  const numChannels = sourceBuffer.numberOfChannels;
  const totalSamples = sourceBuffer.length;
  const curvePoints = [...pitchCurve].sort((a, b) => a.x - b.x);

  const outputBuffer = offlineCtx.createBuffer(
    numChannels,
    totalSamples,
    sampleRate
  );

  for (let ch = 0; ch < numChannels; ch++) {
    const inData = sourceBuffer.getChannelData(ch);
    const outData = outputBuffer.getChannelData(ch);

    for (let i = 0; i < totalSamples; i++) {
      const normalizedTime = i / totalSamples;
      const semitones = interpolatePitchSmooth(
        curvePoints,
        sourceBuffer.length,
        sourceBuffer.length,
        normalizedTime
      );
      const rate = Math.pow(2, semitones / 12);
      const sourcePos = i / rate;

      if (sourcePos < 0 || sourcePos >= totalSamples - 1) {
        outData[i] = 0;
      } else {
        const pos0 = Math.floor(sourcePos);
        const pos1 = pos0 + 1;
        const frac = sourcePos - pos0;
        const s0 = inData[pos0];
        const s1 = inData[Math.min(pos1, totalSamples - 1)];
        outData[i] = s0 + (s1 - s0) * frac;
      }
    }
  }

  const pitchedSource = offlineCtx.createBufferSource();
  pitchedSource.buffer = outputBuffer;
  return pitchedSource;
}
