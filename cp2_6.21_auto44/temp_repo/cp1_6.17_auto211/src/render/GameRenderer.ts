import { useGameStore } from '../state/StateManager';
import { PlayerController } from '../game/PlayerController';
import { hexToRgb } from '../utils/noise';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface CollectionEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private collectionEffects: CollectionEffect[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    useGameStore.getState().on('planktonCollected', this.handlePlanktonCollected);
  }

  destroy() {
    useGameStore.getState().off('planktonCollected', this.handlePlanktonCollected);
  }

  private handlePlanktonCollected = (data: unknown) => {
    const d = data as { position: { x: number; y: number } };
    if (d && d.position) {
      this.collectionEffects.push({
        x: d.position.x,
        y: d.position.y,
        radius: 0,
        maxRadius: 25,
        alpha: 1,
        life: 300,
        maxLife: 300,
      });
    }
  };

  render(deltaTime: number, currentTime: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const store = useGameStore.getState();

    this.drawBackground(ctx, currentTime);
    this.drawTerrain(ctx, currentTime);
    this.drawCaves(ctx, currentTime);
    this.drawCollectionEffects(ctx, deltaTime);
    this.drawParticles(ctx, deltaTime);
    this.drawPlanktons(ctx);
    this.drawDecoys(ctx);
    this.drawPredators(ctx);
    this.drawPlayer(ctx, currentTime);
    this.drawFloatingTexts(ctx, deltaTime);
    this.drawScreenEffects(ctx, currentTime);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, currentTime: number) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#001020');
    gradient.addColorStop(1, '#0A3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    for (let i = 0; i < 30; i++) {
      const x = ((i * 137 + currentTime * 0.01) % CANVAS_WIDTH);
      const y = ((i * 89 + currentTime * 0.005) % CANVAS_HEIGHT);
      const size = 1 + (i % 3) * 0.5;
      const alpha = 0.2 + Math.sin(currentTime * 0.001 + i) * 0.1;
      ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTerrain(ctx: CanvasRenderingContext2D, currentTime: number) {
    const store = useGameStore.getState();
    const terrain = store.terrain;
    if (!terrain) return;

    const { grid, gridSize, cellSize } = terrain;
    const offsetX = (CANVAS_WIDTH - gridSize * cellSize) / 2;
    const offsetY = (CANVAS_HEIGHT - gridSize * cellSize) / 2;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        const pulse = Math.sin(currentTime * 0.002 + x * 0.5 + y * 0.3) * 2;
        const height = cell.height + pulse;

        if (cell.isWall) {
          const gradient = ctx.createLinearGradient(
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            offsetX + x * cellSize,
            offsetY + y * cellSize + height
          );
          gradient.addColorStop(0, '#0A2040');
          gradient.addColorStop(1, '#184878');
          ctx.fillStyle = gradient;
          ctx.fillRect(
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            cellSize - 1,
            Math.min(cellSize, height)
          );

          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(
            offsetX + x * cellSize,
            offsetY + y * cellSize + Math.min(cellSize, height) - 2,
            cellSize - 1,
            2
          );
        }
      }
    }
  }

  private drawCaves(ctx: CanvasRenderingContext2D, currentTime: number) {
    const store = useGameStore.getState();
    const terrain = store.terrain;
    if (!terrain) return;

    for (const cave of terrain.caves) {
      const pulse = 0.7 + Math.sin(currentTime * 0.003) * 0.3;
      const gradient = ctx.createRadialGradient(
        cave.position.x,
        cave.position.y,
        0,
        cave.position.x,
        cave.position.y,
        cave.radius
      );
      gradient.addColorStop(0, `rgba(34, 68, 136, ${0.8 * pulse})`);
      gradient.addColorStop(0.7, `rgba(34, 68, 136, ${0.4 * pulse})`);
      gradient.addColorStop(1, 'rgba(34, 68, 136, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cave.position.x, cave.position.y, cave.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(100, 150, 255, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cave.position.x, cave.position.y, cave.radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawCollectionEffects(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.collectionEffects = this.collectionEffects.filter((effect) => {
      effect.life -= deltaTime * 1000;
      const t = 1 - effect.life / effect.maxLife;
      effect.radius = effect.maxRadius * t;
      effect.alpha = 1 - t;

      if (effect.life <= 0) return false;

      const gradient = ctx.createRadialGradient(
        effect.x,
        effect.y,
        0,
        effect.x,
        effect.y,
        effect.radius
      );
      const rgb = hexToRgb('#88FFAA');
      gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${effect.alpha})`);
      gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D, deltaTime: number) {
    const store = useGameStore.getState();
    const particles = store.particles;

    const toRemove: number[] = [];
    for (const p of particles) {
      p.life -= deltaTime * 1000;
      p.position.x += p.velocity.x * deltaTime;
      p.position.y += p.velocity.y * deltaTime;

      if (p.life <= 0) {
        toRemove.push(p.id);
        continue;
      }

      const alpha = (p.life / p.maxLife) * p.alpha;
      const rgb = hexToRgb(p.color);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (toRemove.length > 0) {
      useGameStore.setState((state) => ({
        particles: state.particles.filter((p) => !toRemove.includes(p.id)),
      }));
    }
  }

  private drawPlanktons(ctx: CanvasRenderingContext2D) {
    const store = useGameStore.getState();
    const planktons = store.planktons;

    for (const p of planktons) {
      const gradient = ctx.createRadialGradient(
        p.position.x,
        p.position.y,
        0,
        p.position.x,
        p.position.y,
        p.radius * 3
      );
      const rgb = hexToRgb(p.color);
      gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`);
      gradient.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
      gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(p.position.x - p.radius * 0.3, p.position.y - p.radius * 0.3, p.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawDecoys(ctx: CanvasRenderingContext2D) {
    const store = useGameStore.getState();
    const decoys = store.decoys;
    const now = Date.now();

    for (const d of decoys) {
      const pulse = 0.7 + Math.sin(now * 0.01) * 0.3;
      const remaining = d.expireTime - now;
      const alpha = remaining > 500 ? 1 : remaining / 500;

      const gradient = ctx.createRadialGradient(
        d.position.x,
        d.position.y,
        0,
        d.position.x,
        d.position.y,
        d.radius * 4
      );
      gradient.addColorStop(0, `rgba(255, 136, 0, ${0.8 * alpha * pulse})`);
      gradient.addColorStop(0.5, `rgba(255, 136, 0, ${0.3 * alpha * pulse})`);
      gradient.addColorStop(1, 'rgba(255, 136, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(d.position.x, d.position.y, d.radius * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 136, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(d.position.x, d.position.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPredators(ctx: CanvasRenderingContext2D) {
    const store = useGameStore.getState();
    const predators = store.predators;

    for (const pred of predators) {
      ctx.save();
      ctx.shadowColor = '#FF3355';
      ctx.shadowBlur = 20;

      const gradient = ctx.createRadialGradient(
        pred.position.x,
        pred.position.y,
        0,
        pred.position.x,
        pred.position.y,
        pred.radius
      );
      gradient.addColorStop(0, '#FF6677');
      gradient.addColorStop(0.5, '#FF3355');
      gradient.addColorStop(1, '#AA0022');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pred.position.x, pred.position.y, pred.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      const eyeOffsetX = pred.velocity.x !== 0 ? Math.sign(pred.velocity.x) * 8 : 0;
      const eyeOffsetY = pred.velocity.y !== 0 ? Math.sign(pred.velocity.y) * 8 : 0;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pred.position.x - 8 + eyeOffsetX, pred.position.y - 6 + eyeOffsetY, 6, 0, Math.PI * 2);
      ctx.arc(pred.position.x + 8 + eyeOffsetX, pred.position.y - 6 + eyeOffsetY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pred.position.x - 8 + eyeOffsetX * 1.5, pred.position.y - 6 + eyeOffsetY * 1.5, 3, 0, Math.PI * 2);
      ctx.arc(pred.position.x + 8 + eyeOffsetX * 1.5, pred.position.y - 6 + eyeOffsetY * 1.5, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#880011';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pred.position.x - 12, pred.position.y + 10);
      ctx.quadraticCurveTo(pred.position.x, pred.position.y + 18, pred.position.x + 12, pred.position.y + 10);
      ctx.stroke();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, currentTime: number) {
    const store = useGameStore.getState();
    const player = store.player;
    const radius = PlayerController.getPlayerRadius(player.size);

    let alpha = 1;
    if (player.isInvincible) {
      if (Date.now() < player.hitFlashEnd) {
        alpha = 0.3 + Math.sin(currentTime * 0.05) * 0.25 + 0.25;
      } else {
        alpha = 0.5 + Math.sin(currentTime * 0.01) * 0.3;
      }
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    if (player.isGlowing) {
      const glowRadius = radius * 4;
      const gradient = ctx.createRadialGradient(
        player.position.x,
        player.position.y,
        0,
        player.position.x,
        player.position.y,
        glowRadius
      );
      gradient.addColorStop(0, 'rgba(0, 255, 136, 0.5)');
      gradient.addColorStop(0.4, 'rgba(0, 255, 136, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(player.position.x, player.position.y);

    const angle = Math.atan2(player.velocity.y, player.velocity.x);
    if (player.velocity.x !== 0 || player.velocity.y !== 0) {
      ctx.rotate(angle);
    }

    const bodyGradient = ctx.createRadialGradient(-radius * 0.3, 0, 0, 0, 0, radius);
    bodyGradient.addColorStop(0, '#336699');
    bodyGradient.addColorStop(0.7, '#1A3355');
    bodyGradient.addColorStop(1, '#0A1A2A');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0D2240';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, -radius * 0.5);
    ctx.lineTo(-radius * 1.3, 0);
    ctx.lineTo(-radius * 0.5, radius * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0D2240';
    ctx.beginPath();
    ctx.moveTo(radius * 0.3, -radius * 0.7);
    ctx.lineTo(radius * 0.1, -radius * 1.1);
    ctx.lineTo(radius * 0.5, -radius * 0.6);
    ctx.closePath();
    ctx.fill();

    if (player.isGlowing) {
      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00FF88';
    } else {
      ctx.shadowColor = '#00AA55';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00AA55';
    }
    ctx.beginPath();
    ctx.arc(radius * 0.5, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(radius * 0.3, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(radius * 0.35, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D, deltaTime: number) {
    const store = useGameStore.getState();
    const texts = store.floatingTexts;

    const toRemove: number[] = [];
    for (const t of texts) {
      t.life -= deltaTime * 1000;
      t.position.y -= 60 * deltaTime;

      if (t.life <= 0) {
        toRemove.push(t.id);
        continue;
      }

      t.alpha = t.life / t.maxLife;

      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.position.x, t.position.y);
      ctx.restore();
    }

    if (toRemove.length > 0) {
      useGameStore.setState((state) => ({
        floatingTexts: state.floatingTexts.filter((t) => !toRemove.includes(t.id)),
      }));
    }
  }

  private drawScreenEffects(ctx: CanvasRenderingContext2D, currentTime: number) {
    const store = useGameStore.getState();
    const game = store.game;

    if (game.screenFlash.active && currentTime < game.screenFlash.endTime) {
      const remaining = game.screenFlash.endTime - currentTime;
      const alpha = Math.min(1, remaining / 500);
      ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * alpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (game.darkenScreen > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${game.darkenScreen})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }
}
