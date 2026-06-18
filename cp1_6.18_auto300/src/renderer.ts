import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SCROLL_WIDTH,
  PLAYER_SIZE,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  DART_SIZE,
  COLORS,
  type ScrollStyle
} from './config';
import type { GameState } from './game';

interface InkBlot {
  x: number;
  y: number;
  size: number;
  ovalX: number;
  ovalY: number;
  alpha: number;
}

interface Mountain {
  x: number;
  height: number;
  width: number;
}

interface Bird {
  x: number;
  y: number;
  wingAngle: number;
}

interface Stroke {
  x: number;
  y: number;
  points: { x: number; y: number }[];
  width: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private inkBlots: InkBlot[] = [];
  private mountains: Mountain[] = [];
  private birds: Bird[] = [];
  private strokes: Stroke[] = [];
  private gameOverTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.generateBackgroundElements();
  }

  private generateBackgroundElements(): void {
    this.inkBlots = [];
    for (let i = 0; i < 200; i++) {
      this.inkBlots.push({
        x: Math.random() * SCROLL_WIDTH * 2,
        y: Math.random() * CANVAS_HEIGHT,
        size: 10 + Math.random() * 20,
        ovalX: 0.5 + Math.random() * 0.5,
        ovalY: 0.5 + Math.random() * 0.5,
        alpha: 0.15 + Math.random() * 0.35
      });
    }

    this.mountains = [];
    for (let i = 0; i < 15; i++) {
      this.mountains.push({
        x: i * 200 + Math.random() * 100,
        height: 60 + Math.random() * 120,
        width: 120 + Math.random() * 100
      });
    }

    this.birds = [];
    for (let i = 0; i < 12; i++) {
      this.birds.push({
        x: Math.random() * SCROLL_WIDTH * 2,
        y: 60 + Math.random() * 150,
        wingAngle: Math.random() * Math.PI
      });
    }

    this.strokes = [];
    for (let i = 0; i < 8; i++) {
      const sx = i * 300 + Math.random() * 150;
      const sy = 100 + Math.random() * 300;
      const points: { x: number; y: number }[] = [];
      let x = 0;
      let y = 0;
      for (let j = 0; j < 8; j++) {
        x += 10 + Math.random() * 20;
        y += (Math.random() - 0.5) * 30;
        points.push({ x, y });
      }
      this.strokes.push({ x: sx, y: sy, points, width: 3 + Math.random() * 4 });
    }
  }

  private drawBackground(scrollX: number, style: ScrollStyle): void {
    const ctx = this.ctx;

    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    for (const blot of this.inkBlots) {
      let x = blot.x - scrollX;
      while (x < -50) x += SCROLL_WIDTH * 2;
      while (x > CANVAS_WIDTH + 50) x -= SCROLL_WIDTH * 2;

      ctx.globalAlpha = blot.alpha;
      ctx.fillStyle = COLORS.TEXTURE;
      ctx.beginPath();
      ctx.ellipse(x, blot.y, blot.size * blot.ovalX, blot.size * blot.ovalY, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (style === 'mountain') {
      this.drawMountains(scrollX);
    } else if (style === 'bird') {
      this.drawBirds(scrollX);
    } else if (style === 'calligraphy') {
      this.drawCalligraphy(scrollX);
    }
  }

  private drawMountains(scrollX: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = COLORS.MOUNTAIN;
    ctx.globalAlpha = 0.4;

    for (const m of this.mountains) {
      let x = m.x - scrollX * 0.5;
      while (x < -200) x += SCROLL_WIDTH;
      while (x > CANVAS_WIDTH + 200) x -= SCROLL_WIDTH;

      ctx.beginPath();
      ctx.moveTo(x - m.width / 2, CANVAS_HEIGHT - 50);
      ctx.lineTo(x, CANVAS_HEIGHT - 50 - m.height);
      ctx.lineTo(x + m.width / 2, CANVAS_HEIGHT - 50);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBirds(scrollX: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = COLORS.BIRD;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const bird of this.birds) {
      let x = bird.x - scrollX * 0.8;
      while (x < -30) x += SCROLL_WIDTH * 2;
      while (x > CANVAS_WIDTH + 30) x -= SCROLL_WIDTH * 2;

      const wing = Math.sin(Date.now() * 0.005 + bird.wingAngle) * 8;
      ctx.beginPath();
      ctx.moveTo(x - 12, bird.y + wing);
      ctx.quadraticCurveTo(x, bird.y - 5, x + 12, bird.y + wing);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCalligraphy(scrollX: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = COLORS.CALLIGRAPHY;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.25;

    for (const s of this.strokes) {
      let x = s.x - scrollX * 0.6;
      while (x < -200) x += SCROLL_WIDTH;
      while (x > CANVAS_WIDTH + 200) x -= SCROLL_WIDTH;

      ctx.lineWidth = s.width;
      ctx.beginPath();
      let first = true;
      for (const p of s.points) {
        if (first) {
          ctx.moveTo(x + p.x, s.y + p.y);
          first = false;
        } else {
          ctx.lineTo(x + p.x, s.y + p.y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPlayer(x: number, y: number, alpha: number = 1): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.shadowColor = COLORS.PLAYER_GLOW;
    ctx.shadowBlur = 2;

    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(x, y, PLAYER_SIZE, PLAYER_SIZE);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.PLAYER_GLOW;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, PLAYER_SIZE - 1, PLAYER_SIZE - 1);

    ctx.fillStyle = COLORS.ENEMY_BODY;
    ctx.fillRect(x + 5, y + 6, 3, 3);
    ctx.fillRect(x + 12, y + 6, 3, 3);

    ctx.restore();
  }

  private drawEnemy(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = COLORS.ENEMY_BODY;
    ctx.strokeStyle = COLORS.CALLIGRAPHY;
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, ENEMY_WIDTH, ENEMY_HEIGHT);
    ctx.strokeRect(x + 0.5, y + 0.5, ENEMY_WIDTH - 1, ENEMY_HEIGHT - 1);

    ctx.fillStyle = COLORS.ENEMY_EYE;
    ctx.fillRect(x + 2, y + 5, 2, 2);
    ctx.fillRect(x + 6, y + 5, 2, 2);

    ctx.restore();
  }

  private drawDart(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.DART;
    ctx.fillRect(x, y, DART_SIZE, DART_SIZE);
  }

  private drawParticles(state: GameState): void {
    const ctx = this.ctx;
    ctx.save();
    for (const p of state.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.PARTICLE;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }

  private drawHUD(state: GameState): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.font = '20px SimHei, Microsoft YaHei, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.strokeStyle = COLORS.TEXT_STROKE;
    ctx.lineWidth = 3;
    ctx.strokeText(`分数: ${state.score}`, 15, 15);
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText(`分数: ${state.score}`, 15, 15);

    ctx.strokeText(`生命: ${state.player.lives}`, 15, 45);
    ctx.fillText(`生命: ${state.player.lives}`, 15, 45);

    ctx.restore();
  }

  private drawAfterimages(state: GameState): void {
    for (const img of state.afterimages) {
      this.drawPlayer(img.x, img.y, img.alpha);
    }
  }

  private drawFlash(state: GameState): void {
    if (!state.flash.active) return;
    const ctx = this.ctx;
    const progress = state.flash.duration / state.flash.maxDuration;
    const alpha = 0.3 * (progress > 0.5 ? 1 : progress * 2);
    ctx.save();
    ctx.fillStyle = COLORS.FLASH;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  private drawRipple(state: GameState): void {
    if (!state.ripple.active) return;
    const ctx = this.ctx;
    const progress = 1 - state.ripple.duration / state.ripple.maxDuration;
    const maxRadius = Math.sqrt(CANVAS_WIDTH * CANVAS_WIDTH + CANVAS_HEIGHT * CANVAS_HEIGHT) / 2;
    const radius = maxRadius * progress;

    ctx.save();
    ctx.strokeStyle = COLORS.RIPPLE;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - progress;

    for (let i = 0; i < 3; i++) {
      const r = radius - i * 50;
      if (r > 0) {
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawFade(state: GameState, nextStyle: ScrollStyle): void {
    if (!state.fade.active) return;
    const ctx = this.ctx;
    let alpha: number;

    if (state.fade.fadingOut) {
      alpha = 1 - state.fade.duration / state.fade.maxDuration;
    } else {
      alpha = state.fade.duration / state.fade.maxDuration;
      this.drawBackground(state.scrollX, nextStyle);
    }

    ctx.save();
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  private drawGameOver(state: GameState): void {
    if (!state.gameOver) return;

    this.gameOverTimer += 1 / 60;
    const alpha = Math.min(1, this.gameOverTimer / 0.5);

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 48px SimHei, Microsoft YaHei, sans-serif';
    ctx.strokeStyle = COLORS.TEXT_STROKE;
    ctx.lineWidth = 4;
    ctx.strokeText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    ctx.font = '24px SimHei, Microsoft YaHei, sans-serif';
    ctx.strokeText(`最终分数: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`最终分数: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.font = '20px SimHei, Microsoft YaHei, sans-serif';
    ctx.strokeText('按 R 键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    ctx.fillText('按 R 键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);

    ctx.restore();
  }

  public render(state: GameState): void {
    if (!state.gameOver) {
      this.gameOverTimer = 0;
    }

    const nextStyle = state.fade.active && state.fade.fadingOut ? state.fade.newStyle : state.scrollStyle;

    this.drawBackground(state.scrollX, state.scrollStyle);

    this.drawAfterimages(state);

    if (!state.invincible || Math.floor(Date.now() / 80) % 2 === 0) {
      this.drawPlayer(state.player.x, state.player.y);
    }

    for (const enemy of state.enemies) {
      this.drawEnemy(enemy.x, enemy.y);
    }

    for (const dart of state.darts) {
      this.drawDart(dart.x, dart.y);
    }

    this.drawParticles(state);

    this.drawFade(state, nextStyle);

    this.drawHUD(state);

    this.drawFlash(state);

    this.drawRipple(state);

    this.drawGameOver(state);
  }
}
