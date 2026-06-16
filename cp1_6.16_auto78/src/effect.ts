import { CONFIG, AURORA_COLORS, NEON_GOLD } from './config';

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  active: boolean;
  startTime: number;
}

export interface LightBeam {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  active: boolean;
  startTime: number;
}

export interface Flash {
  active: boolean;
  startTime: number;
  alpha: number;
}

export interface TextAnimation {
  text: string;
  x: number;
  y: number;
  startY: number;
  alpha: number;
  active: boolean;
  startTime: number;
}

export class EffectManager {
  private shockwaves: Shockwave[] = [];
  private lightBeam: LightBeam | null = null;
  private flash: Flash = { active: false, startTime: 0, alpha: 0 };
  private textAnimation: TextAnimation | null = null;
  private audioContext: AudioContext | null = null;

  constructor(audioContext: AudioContext | null) {
    this.audioContext = audioContext;
  }

  createShockwave(x: number, y: number, colorIndex: number, screenScale: number): void {
    const color = AURORA_COLORS[colorIndex % AURORA_COLORS.length];
    this.shockwaves.push({
      x,
      y,
      radius: CONFIG.SHOCKWAVE_START_RADIUS * screenScale,
      maxRadius: CONFIG.SHOCKWAVE_END_RADIUS * screenScale,
      alpha: 0.8,
      color: color.hex,
      active: true,
      startTime: performance.now(),
    });
  }

  createLightBeam(x: number, y: number, screenWidth: number, screenHeight: number): void {
    this.lightBeam = {
      x,
      y,
      width: screenWidth * CONFIG.LIGHT_BEAM_WIDTH_RATIO,
      height: screenHeight,
      alpha: 0,
      active: true,
      startTime: performance.now(),
    };

    this.playLightBeamSound();
  }

  createFlash(): void {
    this.flash = {
      active: true,
      startTime: performance.now(),
      alpha: 0.8,
    };
  }

  createTextAnimation(text: string, x: number, y: number): void {
    this.textAnimation = {
      text,
      x,
      y,
      startY: y,
      alpha: 0,
      active: true,
      startTime: performance.now(),
    };
  }

  update(_deltaTime: number): void {
    const now = performance.now();

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      const elapsed = now - sw.startTime;
      const progress = Math.min(elapsed / CONFIG.SHOCKWAVE_DURATION, 1);

      sw.radius = CONFIG.SHOCKWAVE_START_RADIUS + (CONFIG.SHOCKWAVE_END_RADIUS - CONFIG.SHOCKWAVE_START_RADIUS) * progress;
      sw.alpha = 0.8 * (1 - progress);

      if (progress >= 1) {
        sw.active = false;
        this.shockwaves.splice(i, 1);
      }
    }

    if (this.lightBeam && this.lightBeam.active) {
      const elapsed = now - this.lightBeam.startTime;
      const progress = Math.min(elapsed / CONFIG.LIGHT_BEAM_DURATION, 1);
      
      if (progress < 0.3) {
        this.lightBeam.alpha = progress / 0.3;
      } else if (progress > 0.7) {
        this.lightBeam.alpha = (1 - progress) / 0.3;
      } else {
        this.lightBeam.alpha = 1;
      }

      if (progress >= 1) {
        this.lightBeam.active = false;
        this.lightBeam = null;
      }
    }

    if (this.flash.active) {
      const elapsed = now - this.flash.startTime;
      const progress = Math.min(elapsed / CONFIG.FLASH_DURATION, 1);
      this.flash.alpha = 0.8 * (1 - progress);

      if (progress >= 1) {
        this.flash.active = false;
      }
    }

    if (this.textAnimation && this.textAnimation.active) {
      const elapsed = now - this.textAnimation.startTime;
      const progress = Math.min(elapsed / CONFIG.TEXT_ANIMATION_DURATION, 1);
      
      if (progress < 0.3) {
        this.textAnimation.alpha = progress / 0.3;
      } else if (progress > 0.8) {
        this.textAnimation.alpha = (1 - progress) / 0.2;
      } else {
        this.textAnimation.alpha = 1;
      }

      this.textAnimation.y = this.textAnimation.startY - CONFIG.TEXT_ANIMATION_OFFSET * progress;

      if (progress >= 1) {
        this.textAnimation.active = false;
        this.textAnimation = null;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenScale: number): void {
    for (const sw of this.shockwaves) {
      if (!sw.active) continue;

      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * screenScale;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 20 * screenScale;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * screenScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.lightBeam && this.lightBeam.active) {
      const lb = this.lightBeam;
      ctx.save();
      ctx.globalAlpha = lb.alpha;

      const gradient = ctx.createLinearGradient(lb.x, lb.y, lb.x, 0);
      const startColor = AURORA_COLORS[Math.floor(performance.now() / 200) % AURORA_COLORS.length];
      gradient.addColorStop(0, startColor.hex);
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.shadowColor = startColor.hex;
      ctx.shadowBlur = 40 * screenScale;
      
      ctx.beginPath();
      ctx.moveTo(lb.x - lb.width / 2, lb.y);
      ctx.lineTo(lb.x + lb.width / 2, lb.y);
      ctx.lineTo(lb.x + lb.width / 4, 0);
      ctx.lineTo(lb.x - lb.width / 4, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    if (this.flash.active) {
      ctx.save();
      ctx.globalAlpha = this.flash.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    if (this.textAnimation && this.textAnimation.active) {
      const ta = this.textAnimation;
      ctx.save();
      ctx.globalAlpha = ta.alpha;
      ctx.fillStyle = NEON_GOLD;
      ctx.shadowColor = NEON_GOLD;
      ctx.shadowBlur = 20 * screenScale;
      ctx.font = `bold ${36 * screenScale}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ta.text, ta.x, ta.y);
      ctx.restore();
    }
  }

  private playLightBeamSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 1);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 2);
  }

  reset(): void {
    this.shockwaves = [];
    this.lightBeam = null;
    this.flash = { active: false, startTime: 0, alpha: 0 };
    this.textAnimation = null;
  }
}
