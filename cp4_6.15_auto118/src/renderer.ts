export interface Note {
  id: string;
  time: number;
  track: 'melody' | 'drum' | 'harmony';
  y: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface RenderState {
  width: number;
  height: number;
  currentTime: number;
  notes: Note[];
  particles: Particle[];
  isPlaying: boolean;
  bpm: number;
  performanceMode: 'normal' | 'low';
  judgementLineX: number;
  noteFlyTime: number;
}

const TRACK_COLORS: Record<string, string> = {
  melody: '#ff3366',
  drum: '#3399ff',
  harmony: '#ffcc00',
};

const NOTE_SIZE = 30;
const NOTE_STROKE = 2;
const JUDGEMENT_LINE_BREATH_PERIOD = 2;
const NOTE_GLOW_PERIOD = 1;
const MIN_GLOW_INTENSITY = 0.5;

export function noteToScreenX(
  noteTime: number,
  currentTime: number,
  canvasWidth: number,
  noteFlyTime: number,
  judgementLineX: number
): number {
  const timeDiff = noteTime - currentTime;
  const progress = timeDiff / noteFlyTime;
  const judgementX = canvasWidth * (judgementLineX / 100);
  const startX = canvasWidth + NOTE_SIZE;
  return judgementX + (startX - judgementX) * progress;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, width, height);

  const gradient1 = ctx.createRadialGradient(
    width * 0.2,
    height * 0.3,
    0,
    width * 0.2,
    height * 0.3,
    width * 0.6
  );
  gradient1.addColorStop(0, 'rgba(0, 255, 255, 0.08)');
  gradient1.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, width, height);

  const gradient2 = ctx.createRadialGradient(
    width * 0.8,
    height * 0.7,
    0,
    width * 0.8,
    height * 0.7,
    width * 0.5
  );
  gradient2.addColorStop(0, 'rgba(255, 0, 255, 0.06)');
  gradient2.addColorStop(1, 'rgba(255, 0, 255, 0)');
  ctx.fillStyle = gradient2;
  ctx.fillRect(0, 0, width, height);
}

function drawGridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
  ctx.lineWidth = 1;

  const tracks = 4;
  for (let i = 1; i < tracks; i++) {
    const y = (height / tracks) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

export function drawJudgementLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  height: number,
  time: number,
  glowIntensity: number
): void {
  const breath = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / JUDGEMENT_LINE_BREATH_PERIOD);
  const intensity = MIN_GLOW_INTENSITY + (1 - MIN_GLOW_INTENSITY) * breath * glowIntensity;

  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 1)';
  ctx.shadowBlur = 20 * intensity;

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * intensity})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * intensity})`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.restore();
}

export function drawOctagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  glow: number
): void {
  const sides = 8;
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;

  ctx.save();

  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + 10 * glow;
  }

  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + angleStep * i;
    const px = x + (size / 2) * Math.cos(angle);
    const py = y + (size / 2) * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();

  ctx.fillStyle = hexToRgba(color, 0.25);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = NOTE_STROKE;
  ctx.stroke();

  ctx.restore();
}

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  performanceMode: 'normal' | 'low'
): void {
  const alpha = particle.life / particle.maxLife;

  ctx.save();

  if (performanceMode === 'normal') {
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.size * 2;
  }

  ctx.fillStyle = hexToRgba(particle.color, alpha);
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlashEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  height: number,
  intensity: number
): void {
  if (intensity <= 0) return;

  ctx.save();

  const gradient = ctx.createLinearGradient(x - 30, 0, x + 30, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.6 * intensity})`);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - 30, 0, 60, height);

  ctx.shadowColor = 'rgba(255, 255, 255, 1)';
  ctx.shadowBlur = 30 * intensity;
  ctx.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getFlashIntensity(notes: Note[], currentTime: number, judgementWindow: number = 0.05): number {
  let maxIntensity = 0;
  for (const note of notes) {
    const diff = Math.abs(note.time - currentTime);
    if (diff < judgementWindow) {
      const intensity = 1 - diff / judgementWindow;
      maxIntensity = Math.max(maxIntensity, intensity);
    }
  }
  return maxIntensity;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: RenderState
): void {
  const { width, height, currentTime, notes, particles, performanceMode, judgementLineX, noteFlyTime } = state;

  drawBackground(ctx, width, height);
  drawGridLines(ctx, width, height);

  const judgementX = width * (judgementLineX / 100);

  const flashIntensity = getFlashIntensity(notes, currentTime);
  drawFlashEffect(ctx, judgementX, height, flashIntensity);

  drawJudgementLine(ctx, judgementX, height, currentTime, 1);

  const noteGlowPhase = (currentTime % NOTE_GLOW_PERIOD) / NOTE_GLOW_PERIOD;
  const noteGlow = 0.5 + 0.5 * Math.sin(noteGlowPhase * Math.PI * 2);

  for (const note of notes) {
    const screenX = noteToScreenX(note.time, currentTime, width, noteFlyTime, judgementLineX);
    const screenY = height * (note.y / 100);
    const color = TRACK_COLORS[note.track];

    if (screenX < -NOTE_SIZE || screenX > width + NOTE_SIZE) {
      continue;
    }

    const glowValue = performanceMode === 'normal' ? noteGlow : 0;
    drawOctagon(ctx, screenX, screenY, NOTE_SIZE, color, glowValue);
  }

  for (const particle of particles) {
    drawParticle(ctx, particle, performanceMode);
  }
}
