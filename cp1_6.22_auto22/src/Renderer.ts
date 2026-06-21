import {
  GameState,
  GamePhase,
  PowerUpType,
  type Brick,
  type Particle,
  type BrickFragment,
  type PowerUp,
  type Ball,
  type Paddle,
  GAME_WIDTH,
  GAME_HEIGHT,
} from './GameState';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioCtx: AudioContext | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  private ensureAudioCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  playSound(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.12): void {
    try {
      const ctx = this.ensureAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_e) {
      // audio not available
    }
  }

  playBrickHitSound(): void {
    this.playSound(880, 0.08, 'square', 0.1);
  }

  playBrickDestroySound(): void {
    this.playSound(1200, 0.12, 'square', 0.12);
    setTimeout(() => this.playSound(1600, 0.06, 'sine', 0.08), 30);
  }

  playPaddleBounceSound(): void {
    this.playSound(440, 0.06, 'triangle', 0.08);
  }

  playPowerUpSound(): void {
    this.playSound(600, 0.08, 'sine', 0.1);
    setTimeout(() => this.playSound(900, 0.08, 'sine', 0.1), 60);
    setTimeout(() => this.playSound(1200, 0.1, 'sine', 0.12), 120);
  }

  playLoseLifeSound(): void {
    this.playSound(300, 0.2, 'sawtooth', 0.1);
    setTimeout(() => this.playSound(200, 0.3, 'sawtooth', 0.08), 150);
  }

  playWinSound(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playSound(n, 0.3, 'sine', 0.12), i * 120);
    });
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(state: GameState): void {
    const ctx = this.ctx;
    ctx.save();

    if (state.shakeTimer > 0) {
      const intensity = state.shakeIntensity * (state.shakeTimer / 0.3);
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }

    this.drawBackground(state);

    if (state.phase === GamePhase.MENU) {
      this.drawTitle(state);
      this.drawMenuText();
    } else {
      this.drawPowerUpLightPillars(state.powerUps);
      this.drawBricks(state.bricks);
      this.drawPowerUps(state.powerUps);
      this.drawFragments(state.fragments);
      this.drawParticles(state.particles);
      this.drawBallTrails(state.balls);
      this.drawBalls(state.balls);
      this.drawPaddle(state.paddle);
      this.drawHUD(state);

      if (state.phase === GamePhase.GAME_OVER) {
        this.drawGameOver(state);
      } else if (state.phase === GamePhase.WIN) {
        this.drawWinAnimation(state);
      }
    }

    if (state.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(state.flashAlpha, 0.4)})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    ctx.restore();
  }

  private drawBackground(state: GameState): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, 0,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.7
    );
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }
  }

  private drawTitle(state: GameState): void {
    const ctx = this.ctx;
    const floatY = Math.sin(state.titleFloatTimer * 2) * 5;
    const hue = (state.titleColorTimer * 60) % 360;

    ctx.save();
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.fillText('BREAKOUT', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40 + floatY);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawMenuText(): void {
    const ctx = this.ctx;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    const blink = Math.sin(Date.now() * 0.004) > 0;
    if (blink) {
      ctx.fillText('PRESS START', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
  }

  private drawBricks(bricks: Brick[]): void {
    const ctx = this.ctx;
    for (const brick of bricks) {
      if (!brick.alive) continue;

      let color = brick.color;
      if (brick.hp < brick.maxHp) {
        const ratio = brick.hp / brick.maxHp;
        if (ratio <= 0.33) color = brick.lightColor;
        else if (ratio <= 0.66) color = brick.lightColor;
      }

      if (brick.flickering && Math.sin(Date.now() * 0.03) > 0) {
        color = '#ffffff';
      }

      ctx.save();
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 8;

      ctx.fillStyle = color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height * 0.4);

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

      if (brick.hp > 1) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(
          brick.hp.toString(),
          brick.x + brick.width / 2,
          brick.y + brick.height / 2
        );
      }

      ctx.restore();
    }
  }

  private drawPaddle(paddle: Paddle): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;

    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#ccccdd');
    ctx.fillStyle = grad;

    const r = paddle.height / 2;
    ctx.beginPath();
    ctx.moveTo(paddle.x + r, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - r, paddle.y);
    ctx.arc(paddle.x + paddle.width - r, paddle.y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(paddle.x + r, paddle.y + paddle.height);
    ctx.arc(paddle.x + r, paddle.y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (paddle.widenedTimer > 0) {
      ctx.strokeStyle = `rgba(0, 255, 100, ${0.3 + 0.3 * Math.sin(Date.now() * 0.01)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawBalls(balls: Ball[]): void {
    const ctx = this.ctx;
    for (const ball of balls) {
      ctx.save();

      const glowColor = ball.isPiercing ? 'rgba(255, 50, 50, 0.6)' : 'rgba(255, 255, 50, 0.5)';
      ctx.shadowColor = ball.isPiercing ? '#ff3333' : '#ffff33';
      ctx.shadowBlur = 15;

      const grad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
        ball.x, ball.y, ball.radius
      );
      if (ball.isPiercing) {
        grad.addColorStop(0, '#ffaaaa');
        grad.addColorStop(1, '#ff3333');
      } else {
        grad.addColorStop(0, '#ffffcc');
        grad.addColorStop(1, '#ffdd00');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private drawBallTrails(balls: Ball[]): void {
    const ctx = this.ctx;
    for (const ball of balls) {
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = (t.life / 0.25) * 0.4;
        const size = ball.radius * (t.life / 0.25);
        ctx.fillStyle = ball.isPiercing
          ? `rgba(255, 50, 50, ${alpha})`
          : `rgba(255, 255, 50, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      if (p.lod > 0) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawFragments(fragments: BrickFragment[]): void {
    const ctx = this.ctx;
    for (const f of fragments) {
      const alpha = f.life / f.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 3;
      ctx.fillRect(-f.width / 2, -f.height / 2, f.width, f.height);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawPowerUps(powerUps: PowerUp[]): void {
    const ctx = this.ctx;
    for (const pu of powerUps) {
      ctx.save();

      let iconColor: string;
      let icon: string;
      switch (pu.type) {
        case PowerUpType.WIDER_PADDLE:
          iconColor = '#00ff88';
          icon = 'W';
          break;
        case PowerUpType.SPLIT_BALL:
          iconColor = '#ff8800';
          icon = 'S';
          break;
        case PowerUpType.PIERCING:
          iconColor = '#ff0088';
          icon = 'P';
          break;
      }

      const cx = pu.x + pu.width / 2;
      const cy = pu.y + pu.height / 2;
      const pulse = 1 + 0.1 * Math.sin(Date.now() * 0.008);

      ctx.shadowColor = iconColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = iconColor;
      ctx.beginPath();
      ctx.arc(cx, cy, (pu.width / 2) * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(icon, cx, cy + 1);

      ctx.restore();
    }
  }

  private drawPowerUpLightPillars(powerUps: PowerUp[]): void {
    const ctx = this.ctx;
    for (const pu of powerUps) {
      const cx = pu.x + pu.width / 2;
      const grad = ctx.createLinearGradient(cx, pu.y, cx, GAME_HEIGHT);
      let pillarColor: string;
      switch (pu.type) {
        case PowerUpType.WIDER_PADDLE:
          pillarColor = '0, 255, 136';
          break;
        case PowerUpType.SPLIT_BALL:
          pillarColor = '255, 136, 0';
          break;
        case PowerUpType.PIERCING:
          pillarColor = '255, 0, 136';
          break;
      }
      grad.addColorStop(0, `rgba(${pillarColor}, ${pu.lightPillarAlpha})`);
      grad.addColorStop(1, `rgba(${pillarColor}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 3, pu.y + pu.height, 6, GAME_HEIGHT - pu.y - pu.height);
    }
  }

  private drawHUD(state: GameState): void {
    const ctx = this.ctx;

    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`SCORE: ${state.score}`, 16, 30);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`LEVEL ${state.level}`, GAME_WIDTH / 2, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4466';
    const hearts = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives));
    ctx.fillText(hearts, GAME_WIDTH - 16, 30);
  }

  private drawGameOver(state: GameState): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.font = '32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2255';
    ctx.shadowColor = '#ff2255';
    ctx.shadowBlur = 15;
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

    ctx.shadowBlur = 0;
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`FINAL SCORE: ${state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + 0.5 * Math.sin(Date.now() * 0.004)})`;
    ctx.fillText('PRESS RESTART', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  }

  private drawWinAnimation(state: GameState): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (const letter of state.winLetters) {
      if (letter.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = letter.alpha;
      const flicker = 0.7 + 0.3 * Math.sin(letter.flickerTimer * 6);
      const hue = (letter.flickerTimer * 80 + letter.targetX) % 360;

      ctx.font = '36px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 20 * flicker;
      ctx.fillStyle = `hsl(${hue}, 100%, ${60 + 20 * flicker}%)`;
      ctx.fillText(letter.char, letter.x, letter.y);

      ctx.restore();
    }
  }
}
