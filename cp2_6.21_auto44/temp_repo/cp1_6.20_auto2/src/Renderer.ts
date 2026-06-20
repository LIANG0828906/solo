import { CONFIG, COLORS } from './types';
import type {
  GameState,
  Position,
  Particle,
  DamageNumber,
  Enemy,
  Chest,
  PlayerState,
} from './types';
import { TileType, GamePhase } from './types';
import { CombatManager } from './CombatManager';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize: number = CONFIG.TILE_SIZE;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private combatManager: CombatManager;

  constructor(canvas: HTMLCanvasElement, combatManager: CombatManager) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.combatManager = combatManager;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const padding = CONFIG.CANVAS_PADDING * 2;
    const maxWidth = container.clientWidth - padding;
    const maxHeight = container.clientHeight - padding;

    let canvasWidth = maxWidth;
    let canvasHeight = canvasWidth / CONFIG.ASPECT_RATIO;

    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * CONFIG.ASPECT_RATIO;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(canvasWidth * dpr);
    this.canvas.height = Math.floor(canvasHeight * dpr);
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: GameState, currentTime: number): void {
    const { dungeon, player, enemies, chests, particles, damageNumbers } = state;

    this.calculateTileSize(dungeon.width, dungeon.height);

    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderMap(dungeon, state.exitPosition);

    for (const chest of chests) {
      this.renderChest(chest);
    }

    for (const enemy of enemies) {
      if (enemy.isAlive) {
        this.renderEnemy(enemy, currentTime);
      }
    }

    this.renderPlayer(player, currentTime);

    for (const particle of particles) {
      this.renderParticle(particle);
    }

    for (const dn of damageNumbers) {
      this.renderDamageNumber(dn);
    }

    this.renderCombatFlash(state.combatFlash);

    this.renderHUD(state);

    if (state.pickupMessage) {
      this.renderPickupMessage(state.pickupMessage, state.pickupMessageTime, currentTime);
    }

    if (state.phase === GamePhase.VICTORY) {
      this.renderVictoryScreen(state);
    } else if (state.phase === GamePhase.DEFEAT) {
      this.renderDefeatScreen(state);
    }
  }

  private calculateTileSize(mapWidth: number, mapHeight: number): void {
    const containerWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const containerHeight = this.canvas.height / (window.devicePixelRatio || 1);

    const maxTileWidth = (containerWidth - 40) / mapWidth;
    const maxTileHeight = (containerHeight - 80) / mapHeight;

    this.tileSize = Math.floor(Math.min(maxTileWidth, maxTileHeight));
    this.tileSize = Math.max(8, Math.min(this.tileSize, 64));

    const mapPixelWidth = mapWidth * this.tileSize;
    const mapPixelHeight = mapHeight * this.tileSize;

    this.offsetX = (containerWidth - mapPixelWidth) / 2;
    this.offsetY = (containerHeight - mapPixelHeight) / 2 + 20;
  }

  private renderMap(dungeon: GameState['dungeon'], exitPosition: Position): void {
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y][x];
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

        if (tile === TileType.WALL) {
          this.ctx.fillStyle = COLORS.WALL;
        } else if (tile === TileType.EXIT || (x === exitPosition.x && y === exitPosition.y)) {
          this.ctx.fillStyle = COLORS.EXIT;
        } else {
          this.ctx.fillStyle = COLORS.FLOOR;
        }

        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);

        if (tile === TileType.FLOOR || tile === TileType.EXIT) {
          this.ctx.fillStyle = COLORS.WALL;
          this.ctx.fillRect(px, py, this.tileSize, 1);
          this.ctx.fillRect(px, py, 1, this.tileSize);
        }
      }
    }
  }

  private renderPlayer(player: PlayerState, currentTime: number): void {
    const pos = this.getInterpolatedPlayerPosition(player, currentTime);
    const px = this.offsetX + pos.x * this.tileSize;
    const py = this.offsetY + pos.y * this.tileSize;
    const size = this.tileSize * 0.8;
    const padding = (this.tileSize - size) / 2;

    this.ctx.fillStyle = COLORS.PLAYER;
    this.ctx.fillRect(px + padding, py + padding, size, size);

    this.ctx.fillStyle = '#000';
    const eyeSize = size * 0.15;
    const eyeY = py + padding + size * 0.25;
    this.ctx.fillRect(px + padding + size * 0.2, eyeY, eyeSize, eyeSize);
    this.ctx.fillRect(px + padding + size * 0.65, eyeY, eyeSize, eyeSize);
  }

  private renderEnemy(enemy: Enemy, currentTime: number): void {
    const pos = this.combatManager.getInterpolatedEnemyPosition(enemy, currentTime);
    const px = this.offsetX + pos.x * this.tileSize;
    const py = this.offsetY + pos.y * this.tileSize;
    const size = this.tileSize * 0.8;
    const padding = (this.tileSize - size) / 2;

    const isFlashing = this.combatManager.isEnemyFlashing(enemy, currentTime);
    this.ctx.fillStyle = isFlashing ? '#FFFFFF' : COLORS.ENEMY;
    this.ctx.fillRect(px + padding, py + padding, size, size);

    this.ctx.fillStyle = '#000';
    const eyeSize = size * 0.15;
    const eyeY = py + padding + size * 0.25;
    this.ctx.fillRect(px + padding + size * 0.2, eyeY, eyeSize, eyeSize);
    this.ctx.fillRect(px + padding + size * 0.65, eyeY, eyeSize, eyeSize);

    const healthBarWidth = size;
    const healthBarHeight = 3;
    const healthPercent = enemy.health / enemy.maxHealth;

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(px + padding, py + padding - 6, healthBarWidth, healthBarHeight);

    this.ctx.fillStyle = COLORS.ENEMY;
    this.ctx.fillRect(px + padding, py + padding - 6, healthBarWidth * healthPercent, healthBarHeight);
  }

  private renderChest(chest: Chest): void {
    const px = this.offsetX + chest.position.x * this.tileSize;
    const py = this.offsetY + chest.position.y * this.tileSize;
    const size = this.tileSize * 0.8;
    const padding = (this.tileSize - size) / 2;

    if (chest.isOpened) {
      this.ctx.fillStyle = '#666';
      this.ctx.fillRect(px + padding, py + padding + size * 0.3, size, size * 0.7);

      this.ctx.fillStyle = '#444';
      this.ctx.fillRect(px + padding, py + padding, size, size * 0.3);
    } else {
      this.ctx.fillStyle = COLORS.CHEST;
      this.ctx.fillRect(px + padding, py + padding + size * 0.3, size, size * 0.7);

      this.ctx.fillStyle = '#B9770E';
      this.ctx.fillRect(px + padding, py + padding, size, size * 0.4);

      this.ctx.fillStyle = '#FFD700';
      const lockSize = size * 0.15;
      this.ctx.fillRect(
        px + padding + size / 2 - lockSize / 2,
        py + padding + size * 0.35,
        lockSize,
        lockSize
      );
    }
  }

  private renderParticle(particle: Particle): void {
    const alpha = particle.life / particle.maxLife;
    const px = this.offsetX + particle.x * this.tileSize;
    const py = this.offsetY + particle.y * this.tileSize;

    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = particle.color;
    this.ctx.fillRect(px - particle.size / 2, py - particle.size / 2, particle.size, particle.size);
    this.ctx.globalAlpha = 1;
  }

  private renderDamageNumber(dn: DamageNumber): void {
    const alpha = dn.life / dn.maxLife;
    const progress = 1 - alpha;
    const px = this.offsetX + dn.x * this.tileSize + this.tileSize / 2;
    const py = this.offsetY + dn.y * this.tileSize - progress * 30;

    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = dn.color;
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`-${dn.value}`, px, py);
    this.ctx.globalAlpha = 1;
  }

  private renderCombatFlash(intensity: number): void {
    if (intensity <= 0) return;

    const containerWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const containerHeight = this.canvas.height / (window.devicePixelRatio || 1);

    const gradient = this.ctx.createRadialGradient(
      containerWidth / 2,
      containerHeight / 2,
      Math.min(containerWidth, containerHeight) * 0.3,
      containerWidth / 2,
      containerHeight / 2,
      Math.max(containerWidth, containerHeight) * 0.7
    );
    gradient.addColorStop(0, 'rgba(192, 57, 43, 0)');
    gradient.addColorStop(1, `rgba(192, 57, 43, ${0.3 * intensity})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, containerWidth, containerHeight);
  }

  private renderHUD(state: GameState): void {
    const containerWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const { player, stats } = state;
    const elapsedTime = Math.floor((performance.now() - stats.startTime) / 1000);

    const hudText = `HP: ${player.health}/${player.maxHealth}  ATK: ${player.attack}  金币: ${player.coins}  经验: ${player.experience}  击杀: ${player.kills}  时间: ${elapsedTime}s`;

    this.ctx.font = '14px sans-serif';
    const textWidth = this.ctx.measureText(hudText).width;
    const hudWidth = textWidth + 32;
    const hudHeight = 36;
    const hudX = (containerWidth - hudWidth) / 2;
    const hudY = 10;

    this.ctx.fillStyle = COLORS.HUD_BG;
    this.roundRect(hudX, hudY, hudWidth, hudHeight, 8);

    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(hudText, containerWidth / 2, hudY + hudHeight / 2);
  }

  private renderPickupMessage(message: string, startTime: number, currentTime: number): void {
    const containerWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const containerHeight = this.canvas.height / (window.devicePixelRatio || 1);

    const elapsed = currentTime - startTime;
    const duration = 2000;
    const alpha = Math.max(0, 1 - elapsed / duration);

    if (alpha <= 0) return;

    this.ctx.globalAlpha = alpha;
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(message, containerWidth / 2, containerHeight - 80);
    this.ctx.globalAlpha = 1;
  }

  private renderVictoryScreen(state: GameState): void {
    const containerWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const containerHeight = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, containerWidth, containerHeight);

    const elapsedTime = Math.floor((performance.now() - state.stats.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.ctx.fillStyle = COLORS.EXIT;
    this.ctx.font = 'bold 48px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('胜利!', containerWidth / 2, containerHeight / 2 - 80);

    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.font = '20px sans-serif';
    this.ctx.fillText(`总击杀数: ${state.player.kills}`, containerWidth / 2, containerHeight / 2 - 20);
    this.ctx.fillText(`收集金币: ${state.player.coins}`, containerWidth / 2, containerHeight / 2 + 10);
    this.ctx.fillText(`耗时: ${timeStr}`, containerWidth / 2, containerHeight / 2 + 40);

    this.ctx.fillStyle = COLORS.PLAYER;
    this.ctx.font = '18px sans-serif';
    this.ctx.fillText('按 空格键 重新开始', containerWidth / 2, containerHeight / 2 + 100);
  }

  private renderDefeatScreen(state: GameState): void {
    const containerWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const containerHeight = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, containerWidth, containerHeight);

    const elapsedTime = Math.floor((performance.now() - state.stats.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.ctx.fillStyle = COLORS.ENEMY;
    this.ctx.font = 'bold 48px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('失败...', containerWidth / 2, containerHeight / 2 - 80);

    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.font = '20px sans-serif';
    this.ctx.fillText(`总击杀数: ${state.player.kills}`, containerWidth / 2, containerHeight / 2 - 20);
    this.ctx.fillText(`收集金币: ${state.player.coins}`, containerWidth / 2, containerHeight / 2 + 10);
    this.ctx.fillText(`存活时间: ${timeStr}`, containerWidth / 2, containerHeight / 2 + 40);

    this.ctx.fillStyle = COLORS.PLAYER;
    this.ctx.font = '18px sans-serif';
    this.ctx.fillText('按 空格键 重新开始', containerWidth / 2, containerHeight / 2 + 100);
  }

  private getInterpolatedPlayerPosition(player: PlayerState, currentTime: number): Position {
    if (!player.isMoving) {
      return { ...player.position };
    }

    const elapsed = currentTime - player.moveStartTime;
    const progress = Math.min(elapsed / CONFIG.MOVE_ANIMATION_DURATION, 1);
    const easedProgress = this.easeOutQuad(progress);

    return {
      x: player.position.x + (player.targetPosition.x - player.position.x) * easedProgress,
      y: player.position.y + (player.targetPosition.y - player.position.y) * easedProgress,
    };
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  createGoldParticles(position: Position): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT + Math.random() * 0.5;
      const speed = 0.05 + Math.random() * 0.1;
      particles.push({
        x: position.x + 0.5,
        y: position.y + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS.PARTICLE_GOLD,
        size: 3 + Math.random() * 3,
        life: CONFIG.PARTICLE_DURATION,
        maxLife: CONFIG.PARTICLE_DURATION,
      });
    }
    return particles;
  }

  updateParticles(particles: Particle[], deltaTime: number): Particle[] {
    return particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * (deltaTime / 16),
        y: p.y + p.vy * (deltaTime / 16),
        life: p.life - deltaTime,
      }))
      .filter((p) => p.life > 0);
  }

  updateDamageNumbers(damageNumbers: DamageNumber[], deltaTime: number): DamageNumber[] {
    return damageNumbers
      .map((dn) => ({
        ...dn,
        life: dn.life - deltaTime,
      }))
      .filter((dn) => dn.life > 0);
  }
}
