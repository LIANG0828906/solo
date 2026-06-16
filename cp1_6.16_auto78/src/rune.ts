import { CONFIG, AURORA_COLORS, RUNE_SYMBOLS, NEON_CYAN } from './config';

export interface RuneState {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: typeof AURORA_COLORS[0];
  symbol: string;
  alpha: number;
  phase: number;
  driftPhase: number;
  isActive: boolean;
  isClicked: boolean;
  isWrong: boolean;
  wrongTimer: number;
  scale: number;
  targetScale: number;
  returning: boolean;
  returnStartX: number;
  returnStartY: number;
  returnTargetX: number;
  returnTargetY: number;
  returnProgress: number;
  audioContext: AudioContext | null;
}

export class Rune {
  state: RuneState;

  constructor(
    id: number,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    screenScale: number,
    audioContext: AudioContext | null
  ) {
    const colorIndex = id % AURORA_COLORS.length;
    this.state = {
      id,
      x: startX,
      y: startY,
      baseX: targetX,
      baseY: targetY,
      size: CONFIG.RUNE_BASE_SIZE * screenScale,
      color: AURORA_COLORS[colorIndex],
      symbol: RUNE_SYMBOLS[id % RUNE_SYMBOLS.length],
      alpha: CONFIG.RUNE_PULSE_MIN_ALPHA,
      phase: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2,
      isActive: false,
      isClicked: false,
      isWrong: false,
      wrongTimer: 0,
      scale: 1,
      targetScale: 1,
      returning: false,
      returnStartX: 0,
      returnStartY: 0,
      returnTargetX: 0,
      returnTargetY: 0,
      returnProgress: 0,
      audioContext,
    };
  }

  update(deltaTime: number, screenScale: number): void {
    const dt = deltaTime / 1000;

    if (this.state.returning) {
      this.state.returnProgress += dt * 1.5;
      const t = Math.min(this.state.returnProgress, 1);
      const easeT = 1 - Math.pow(1 - t, 3);
      this.state.x = this.state.returnStartX + (this.state.returnTargetX - this.state.returnStartX) * easeT;
      this.state.y = this.state.returnStartY + (this.state.returnTargetY - this.state.returnStartY) * easeT;
      this.state.alpha = 0.9 - t * 0.3;
      return;
    }

    if (this.state.isWrong) {
      this.state.wrongTimer -= deltaTime;
      if (this.state.wrongTimer <= 0) {
        this.state.isWrong = false;
      }
    }

    this.state.phase += dt * (Math.PI * 2 / (CONFIG.RUNE_PULSE_PERIOD / 1000));
    const pulseRange = CONFIG.RUNE_PULSE_MAX_ALPHA - CONFIG.RUNE_PULSE_MIN_ALPHA;
    this.state.alpha = CONFIG.RUNE_PULSE_MIN_ALPHA + (Math.sin(this.state.phase) + 1) / 2 * pulseRange;

    if (this.state.isActive) {
      this.state.driftPhase += dt * 0.5;
      const driftX = Math.sin(this.state.driftPhase) * 30 * screenScale;
      const driftY = Math.cos(this.state.driftPhase * 0.7) * 20 * screenScale;
      const speed = CONFIG.RUNE_DRIFT_SPEED * screenScale;
      
      this.state.baseX += (Math.random() - 0.5) * speed * dt * 60;
      this.state.baseY += (Math.random() - 0.5) * speed * dt * 60;

      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
      if (canvas) {
        const margin = this.state.size;
        const topLimit = canvas.height * 0.15;
        const bottomLimit = canvas.height * 0.55;
        this.state.baseX = Math.max(margin, Math.min(canvas.width - margin, this.state.baseX));
        this.state.baseY = Math.max(topLimit, Math.min(bottomLimit, this.state.baseY));
      }

      this.state.x = this.state.baseX + driftX;
      this.state.y = this.state.baseY + driftY;
    }

    this.state.scale += (this.state.targetScale - this.state.scale) * dt * 10;
    this.state.size = CONFIG.RUNE_BASE_SIZE * screenScale * this.state.scale;
  }

  draw(ctx: CanvasRenderingContext2D, screenScale: number): void {
    const s = this.state;
    ctx.save();

    let offsetX = 0;
    let offsetY = 0;
    if (s.isWrong) {
      const shakeFreq = CONFIG.WRONG_SHAKE_FREQUENCY * 2 * Math.PI;
      const elapsed = (CONFIG.WRONG_SHAKE_DURATION - s.wrongTimer) / 1000;
      offsetX = Math.sin(elapsed * shakeFreq) * CONFIG.WRONG_SHAKE_AMPLITUDE * screenScale;
      offsetY = Math.cos(elapsed * shakeFreq * 1.3) * CONFIG.WRONG_SHAKE_AMPLITUDE * screenScale;
    }

    const drawX = s.x + offsetX;
    const drawY = s.y + offsetY;

    const glowSize = s.size * 1.5;
    const gradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowSize);
    gradient.addColorStop(0, s.color.glow);
    gradient.addColorStop(0.5, s.color.glow.replace('0.6', '0.2'));
    gradient.addColorStop(1, 'transparent');
    
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = s.color.hex;
    ctx.shadowBlur = 20 * screenScale;

    ctx.fillStyle = s.isWrong ? '#FF0000' : s.color.hex;
    ctx.beginPath();
    ctx.arc(drawX, drawY, s.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 2 * screenScale;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${s.size * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.symbol, drawX, drawY);

    ctx.restore();
  }

  containsPoint(px: number, py: number): boolean {
    const dx = px - this.state.x;
    const dy = py - this.state.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.state.size / 2;
  }

  onCorrectClick(): void {
    this.state.isClicked = true;
    this.state.isActive = false;
    this.state.targetScale = CONFIG.RUNE_HOVER_SIZE / CONFIG.RUNE_BASE_SIZE;
    setTimeout(() => {
      this.state.targetScale = 1;
    }, 200);
    this.playTone(600 + this.state.id * 30, 0.2);
  }

  onWrongClick(): void {
    this.state.isWrong = true;
    this.state.wrongTimer = CONFIG.WRONG_SHAKE_DURATION;
    this.playTone(150, 0.3, 'sawtooth');
  }

  startReturn(targetX: number, targetY: number): void {
    this.state.returning = true;
    this.state.returnStartX = this.state.x;
    this.state.returnStartY = this.state.y;
    this.state.returnTargetX = targetX;
    this.state.returnTargetY = targetY;
    this.state.returnProgress = 0;
    this.state.isActive = false;
  }

  activate(): void {
    this.state.isActive = true;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.state.audioContext) return;
    
    const oscillator = this.state.audioContext.createOscillator();
    const gainNode = this.state.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.state.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, this.state.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.state.audioContext.currentTime + duration);
    
    oscillator.start(this.state.audioContext.currentTime);
    oscillator.stop(this.state.audioContext.currentTime + duration);
  }

  reset(startX: number, startY: number, targetX: number, targetY: number): void {
    this.state.x = startX;
    this.state.y = startY;
    this.state.baseX = targetX;
    this.state.baseY = targetY;
    this.state.isActive = false;
    this.state.isClicked = false;
    this.state.isWrong = false;
    this.state.returning = false;
    this.state.returnProgress = 0;
    this.state.scale = 1;
    this.state.targetScale = 1;
    this.state.phase = Math.random() * Math.PI * 2;
    this.state.driftPhase = Math.random() * Math.PI * 2;
  }
}
