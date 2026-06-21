import { Note, Danmaku } from './Note';

export interface ScoreAnimation {
  scale: number;
  targetScale: number;
  animating: boolean;
  timer: number;
  duration: number;
}

export interface ComboAnimation {
  scale: number;
  targetScale: number;
  animating: boolean;
  timer: number;
  duration: number;
  flashTimer: number;
  flashing: boolean;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public judgeLineY: number = 400;
  public isClimaxMode: boolean = false;
  public climaxTransition: number = 0;
  public climaxTransitionDuration: number = 3000;
  public comboFontSize: number = 24;
  public targetComboFontSize: number = 24;

  private danmakus: Danmaku[] = [];
  private danmakuDuration: number = 500;

  private judgeLinePulse: number = 0;

  private victoryParticles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = [];
  private isVictoryAnimation: boolean = false;
  private victoryTimer: number = 0;
  private victoryDuration: number = 2000;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  public drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);

    if (this.isClimaxMode) {
      const t = Math.min(1, this.climaxTransition / this.climaxTransitionDuration);
      const r1 = Math.floor(10 + (60 - 10) * t);
      const g1 = Math.floor(15 + (10 - 15) * t);
      const b1 = Math.floor(40 + (20 - 40) * t);
      const r2 = Math.floor(5 + (30 - 5) * t);
      const g2 = Math.floor(10 + (5 - 10) * t);
      const b2 = Math.floor(25 + (10 - 25) * t);
      gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
      gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
    } else {
      gradient.addColorStop(0, '#0a0f28');
      gradient.addColorStop(1, '#050a19');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public drawTracks(): void {
    const trackXPositions = [80, 210, 340, 470];

    this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
    this.ctx.lineWidth = 1;

    for (const x of trackXPositions) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
  }

  public drawJudgeLine(): void {
    this.judgeLinePulse += 0.05;
    const pulse = Math.sin(this.judgeLinePulse) * 0.3 + 0.7;

    let lineColor: string;
    let glowColor: string;

    if (this.isClimaxMode) {
      const t = Math.min(1, this.climaxTransition / this.climaxTransitionDuration);
      const r = Math.floor(0 + (255 - 0) * t);
      const g = Math.floor(255 + (215 - 255) * t);
      const b = Math.floor(255 + (0 - 255) * t);
      lineColor = `rgb(${r}, ${g}, ${b})`;
      glowColor = `rgba(${r}, ${g}, ${b}, ${0.5 * pulse})`;
    } else {
      lineColor = '#00ffff';
      glowColor = `rgba(0, 255, 255, ${0.5 * pulse})`;
    }

    this.ctx.shadowBlur = 20 * pulse;
    this.ctx.shadowColor = glowColor;
    this.ctx.strokeStyle = lineColor;
    this.ctx.lineWidth = 3;

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.judgeLineY);
    this.ctx.lineTo(this.width, this.judgeLineY);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }

  public drawNote(note: Note): void {
    if (note.isDead && note.particles.length === 0) return;

    if (note.flashAlpha > 0 && !note.isDead) {
      this.ctx.save();
      this.ctx.globalAlpha = note.flashAlpha * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(note.x, note.y, note.radius + 15, 0, Math.PI * 2);
      this.ctx.fillStyle = note.flashColor;
      this.ctx.fill();
      this.ctx.restore();
    }

    if (!note.isDead) {
      const gradient = this.ctx.createRadialGradient(
        note.x - 5, note.y - 5, 0,
        note.x, note.y, note.radius
      );
      gradient.addColorStop(0, '#8866ff');
      gradient.addColorStop(0.7, '#4466dd');
      gradient.addColorStop(1, '#2233aa');

      this.ctx.beginPath();
      this.ctx.arc(note.x, note.y, note.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(100, 100, 255, 0.5)';
      this.ctx.strokeStyle = 'rgba(150, 150, 255, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    for (const particle of note.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  public drawUI(
    score: number,
    combo: number,
    bpm: number,
    scoreAnim: ScoreAnimation,
    comboAnim: ComboAnimation,
    gameState: 'idle' | 'playing' | 'victory' | 'gameover'
  ): void {
    this.ctx.fillStyle = '#ffffff';

    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`BPM: ${bpm}`, 20, 40);

    this.ctx.save();
    const scoreScale = scoreAnim.scale;
    this.ctx.translate(20, 80);
    this.ctx.scale(scoreScale, scoreScale);
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${score}`, 0, 0);
    this.ctx.restore();

    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('SCORE', 20, 100);

    if (combo > 0) {
      this.ctx.save();
      const comboScale = comboAnim.scale;
      const fontSize = this.comboFontSize;

      this.ctx.translate(this.width - 20, 60);
      this.ctx.scale(comboScale, comboScale);

      let comboColor = '#ffffff';
      if (combo >= 10) {
        if (comboAnim.flashing) {
          comboColor = Math.floor(comboAnim.flashTimer / 100) % 2 === 0 ? '#ffaa00' : '#ffdd44';
        } else {
          comboColor = '#ffaa00';
        }
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 170, 0, 0.5)';
      }

      this.ctx.font = `bold ${fontSize}px Arial`;
      this.ctx.fillStyle = comboColor;
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`${combo}`, 0, 0);
      this.ctx.shadowBlur = 0;
      this.ctx.restore();

      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('COMBO', this.width - 20, 90);
    }

    if (gameState === 'idle') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('点击任意位置开始游戏', this.width / 2, this.height / 2);
      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillText('使用 D / F / J / K 键对应四条轨道', this.width / 2, this.height / 2 + 40);
    }

    if (gameState === 'gameover') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 30);
      this.ctx.font = '18px Arial';
      this.ctx.fillText(`最终得分: ${score}`, this.width / 2, this.height / 2 + 10);
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText('按空格键重新开始', this.width / 2, this.height / 2 + 50);
    }
  }

  public addDanmaku(x: number, y: number, text: string, color: string): void {
    this.danmakus.push({
      x,
      y,
      text,
      alpha: 1,
      life: 0,
      color
    });
  }

  public updateDanmakus(deltaTime: number): void {
    for (let i = this.danmakus.length - 1; i >= 0; i--) {
      const d = this.danmakus[i];
      d.life += deltaTime;
      d.y -= deltaTime * 0.03;

      if (d.life > this.danmakuDuration * 0.5) {
        d.alpha = Math.max(0, 1 - (d.life - this.danmakuDuration * 0.5) / (this.danmakuDuration * 0.5));
      }

      if (d.life >= this.danmakuDuration) {
        this.danmakus.splice(i, 1);
      }
    }
  }

  public drawDanmakus(): void {
    for (const d of this.danmakus) {
      this.ctx.save();
      this.ctx.globalAlpha = d.alpha;
      this.ctx.fillStyle = d.color;
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = d.color;
      this.ctx.fillText(d.text, d.x, d.y);
      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }
  }

  public updateClimaxTransition(deltaTime: number): void {
    if (this.isClimaxMode && this.climaxTransition < this.climaxTransitionDuration) {
      this.climaxTransition = Math.min(this.climaxTransitionDuration, this.climaxTransition + deltaTime);
    } else if (!this.isClimaxMode && this.climaxTransition > 0) {
      this.climaxTransition = Math.max(0, this.climaxTransition - deltaTime);
    }
  }

  public updateComboFontSize(deltaTime: number): void {
    if (Math.abs(this.comboFontSize - this.targetComboFontSize) > 0.1) {
      const speed = (32 - 24) / 500;
      if (this.comboFontSize < this.targetComboFontSize) {
        this.comboFontSize = Math.min(this.targetComboFontSize, this.comboFontSize + speed * deltaTime);
      } else {
        this.comboFontSize = Math.max(this.targetComboFontSize, this.comboFontSize - speed * deltaTime);
      }
    }
  }

  public startVictoryAnimation(): void {
    this.isVictoryAnimation = true;
    this.victoryTimer = 0;
    this.victoryParticles = [];

    for (let i = 0; i < 100; i++) {
      this.victoryParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        alpha: 1,
        size: 2 + Math.random() * 4
      });
    }
  }

  public updateVictoryAnimation(deltaTime: number): boolean {
    if (!this.isVictoryAnimation) return false;

    this.victoryTimer += deltaTime;

    const progress = this.victoryTimer / this.victoryDuration;

    for (const p of this.victoryParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, 1 - progress);
    }

    if (this.victoryTimer >= this.victoryDuration) {
      this.isVictoryAnimation = false;
      this.victoryParticles = [];
      return true;
    }

    return false;
  }

  public drawVictoryAnimation(): void {
    if (!this.isVictoryAnimation) return;

    const progress = this.victoryTimer / this.victoryDuration;

    this.ctx.save();
    this.ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * (1 - progress)})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    for (const p of this.victoryParticles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }
  }

  public get isVictoryPlaying(): boolean {
    return this.isVictoryAnimation;
  }
}
