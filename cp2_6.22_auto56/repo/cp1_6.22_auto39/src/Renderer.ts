import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TileType,
  KeyColor,
  Particle
} from './types';
import { GameMap } from './Map';
import { Player } from './Player';
import { Monster } from './Monster';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private screenShake: number = 0;
  private transitionProgress: number = 0;
  private transitionDirection: 'in' | 'out' | 'none' = 'none';
  private flashEffect: number = 0;
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
  }

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  triggerScreenShake(duration: number): void {
    this.screenShake = duration;
  }

  triggerTransition(direction: 'in' | 'out'): void {
    this.transitionDirection = direction;
    this.transitionProgress = direction === 'in' ? 0 : 1;
  }

  triggerFlash(): void {
    this.flashEffect = 100;
  }

  isTransitioning(): boolean {
    return this.transitionDirection !== 'none';
  }

  getTransitionProgress(): number {
    return this.transitionProgress;
  }

  update(deltaTime: number): void {
    if (this.screenShake > 0) {
      this.screenShake -= deltaTime;
    }

    if (this.flashEffect > 0) {
      this.flashEffect -= deltaTime;
    }

    if (this.transitionDirection === 'in') {
      this.transitionProgress += deltaTime / 400;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.transitionDirection = 'none';
      }
    } else if (this.transitionDirection === 'out') {
      this.transitionProgress -= deltaTime / 400;
      if (this.transitionProgress <= 0) {
        this.transitionProgress = 0;
        this.transitionDirection = 'none';
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime / 16;
      p.y += p.vy * deltaTime / 16;
      p.vy += 0.1;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(map: GameMap, player: Player, monsters: Monster[], currentTime: number, floor: number): void {
    this.ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * 8;
      const shakeY = (Math.random() - 0.5) * 8;
      this.ctx.translate(shakeX, shakeY);
    }

    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.renderMap(map, currentTime);
    this.renderDoorways(map);
    this.renderChests(map);
    this.renderKeys(map);
    this.renderExit(map);
    this.renderMonsters(monsters);
    this.renderPlayer(player);
    this.renderParticles();

    this.ctx.restore();

    this.renderUI(player, floor);

    if (this.flashEffect > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashEffect / 200})`;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    this.renderTransition();
  }

  private renderMap(map: GameMap, _currentTime: number): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (!map.isRevealed(x, y)) continue;

        const tile = map.getTileAt(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === TileType.WALL) {
          this.drawWall(px, py, x, y);
        } else {
          this.drawFloor(px, py, x, y, map);
        }
      }
    }
  }

  private drawWall(x: number, y: number, gridX: number, gridY: number): void {
    this.ctx.fillStyle = '#3a4a5c';
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    this.ctx.fillStyle = '#4a5c6e';
    this.ctx.fillRect(x, y, TILE_SIZE, 4);
    this.ctx.fillRect(x, y, 4, TILE_SIZE);

    this.ctx.fillStyle = '#2a3a4c';
    this.ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
    this.ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);

    const seed = (gridX * 7 + gridY * 13) % 5;
    if (seed === 0) {
      this.ctx.fillStyle = '#2e3f4f';
      this.ctx.fillRect(x + 8, y + 12, 8, 8);
      this.ctx.fillRect(x + 24, y + 28, 10, 6);
    }
  }

  private drawFloor(x: number, y: number, gridX: number, gridY: number, _map: GameMap): void {
    const baseColor = this.gradientColor('#1a3a2a', '#0f2a1f', gridY / MAP_HEIGHT);
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    const patternSeed = (gridX * 17 + gridY * 23) % 8;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    
    if (patternSeed === 0) {
      this.ctx.fillRect(x + 4, y + 4, 4, 4);
    } else if (patternSeed === 1) {
      this.ctx.fillRect(x + TILE_SIZE - 8, y + 8, 4, 4);
    } else if (patternSeed === 2) {
      this.ctx.fillRect(x + 12, y + TILE_SIZE - 12, 6, 4);
    }

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  private gradientColor(start: string, end: string, t: number): string {
    const r1 = parseInt(start.slice(1, 3), 16);
    const g1 = parseInt(start.slice(3, 5), 16);
    const b1 = parseInt(start.slice(5, 7), 16);
    const r2 = parseInt(end.slice(1, 3), 16);
    const g2 = parseInt(end.slice(3, 5), 16);
    const b2 = parseInt(end.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private renderDoorways(map: GameMap): void {
    for (const doorway of map.getDoorways()) {
      if (!map.isRevealed(doorway.x, doorway.y)) continue;
      
      const x = doorway.x * TILE_SIZE + TILE_SIZE / 2;
      const y = doorway.y * TILE_SIZE + TILE_SIZE / 2;
      const pulse = Math.sin(doorway.pulsePhase) * 0.5 + 0.5;
      const radius = TILE_SIZE * 0.3 + pulse * 8;
      
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(100, 200, 255, ${0.3 + pulse * 0.3})`);
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderChests(map: GameMap): void {
    for (const chest of map.getChests()) {
      if (!map.isRevealed(chest.x, chest.y)) continue;
      
      const x = chest.x * TILE_SIZE;
      const y = chest.y * TILE_SIZE;
      
      let scale = 1;
      if (chest.opening) {
        const p = chest.openProgress;
        scale = 1 + Math.sin(p * Math.PI) * 0.4;
      }
      
      if (chest.opened) {
        this.drawChest(x, y, true, chest.keyRequired, 1);
      } else {
        this.drawChest(x, y, false, chest.keyRequired, scale);
      }
    }
  }

  private drawChest(x: number, y: number, opened: boolean, keyColor: KeyColor, scale: number): void {
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-centerX, -centerY);

    const chestColor = '#8b4513';
    const highlight = '#a0522d';
    const shadow = '#5c3317';

    if (opened) {
      this.ctx.fillStyle = shadow;
      this.ctx.fillRect(x + 8, y + 20, 32, 20);
      
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(x + 10, y + 22, 28, 16);
      
      this.ctx.fillStyle = chestColor;
      this.ctx.fillRect(x + 6, y + 8, 36, 14);
      this.ctx.fillStyle = highlight;
      this.ctx.fillRect(x + 6, y + 8, 36, 4);
    } else {
      this.ctx.fillStyle = chestColor;
      this.ctx.fillRect(x + 8, y + 16, 32, 24);
      
      this.ctx.fillStyle = highlight;
      this.ctx.fillRect(x + 8, y + 16, 32, 6);
      this.ctx.fillRect(x + 8, y + 16, 4, 24);
      
      this.ctx.fillStyle = shadow;
      this.ctx.fillRect(x + 8, y + 36, 32, 4);
      this.ctx.fillRect(x + 36, y + 16, 4, 24);
      
      this.ctx.fillStyle = highlight;
      this.ctx.fillRect(x + 6, y + 10, 36, 10);
      this.ctx.fillStyle = chestColor;
      this.ctx.fillRect(x + 8, y + 12, 32, 6);

      const lockColor = keyColor === KeyColor.RED ? '#e74c3c' :
                        keyColor === KeyColor.BLUE ? '#3498db' : '#f1c40f';
      this.ctx.fillStyle = lockColor;
      this.ctx.fillRect(x + 20, y + 24, 8, 10);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(x + 23, y + 28, 2, 4);
    }

    this.ctx.restore();
  }

  private renderKeys(map: GameMap): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (!map.isRevealed(x, y)) continue;
        
        const tile = map.getTileAt(x, y);
        if (tile === TileType.KEY_RED || tile === TileType.KEY_BLUE || tile === TileType.KEY_GOLD) {
          const color = tile === TileType.KEY_RED ? KeyColor.RED :
                        tile === TileType.KEY_BLUE ? KeyColor.BLUE : KeyColor.GOLD;
          this.drawKey(x * TILE_SIZE, y * TILE_SIZE, color, performance.now());
        }
      }
    }
  }

  private drawKey(x: number, y: number, color: KeyColor, time: number): void {
    const floatY = Math.sin(time / 300) * 3;
    const keyColor = color === KeyColor.RED ? '#e74c3c' :
                     color === KeyColor.BLUE ? '#3498db' : '#f1c40f';
    const shadowColor = color === KeyColor.RED ? '#922b21' :
                        color === KeyColor.BLUE ? '#1a5276' : '#b7950b';
    
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2 + floatY;

    this.ctx.fillStyle = shadowColor;
    this.ctx.beginPath();
    this.ctx.arc(cx + 1, cy - 4, 9, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = keyColor;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - 5, 9, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - 5, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = shadowColor;
    this.ctx.fillRect(cx + 1, cy - 3, 5, 14);

    this.ctx.fillStyle = keyColor;
    this.ctx.fillRect(cx, cy - 4, 5, 14);

    this.ctx.fillStyle = shadowColor;
    this.ctx.fillRect(cx + 1, cy + 6, 8, 3);
    this.ctx.fillRect(cx + 1, cy + 3, 5, 3);

    this.ctx.fillStyle = keyColor;
    this.ctx.fillRect(cx, cy + 5, 8, 3);
    this.ctx.fillRect(cx, cy + 2, 5, 3);
  }

  private renderExit(map: GameMap): void {
    const exit = map.getExitPos();
    if (!map.isRevealed(exit.x, exit.y)) return;

    const x = exit.x * TILE_SIZE;
    const y = exit.y * TILE_SIZE;
    const time = performance.now();

    const gradient = this.ctx.createRadialGradient(
      x + TILE_SIZE / 2, y + TILE_SIZE / 2, 0,
      x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.6
    );
    gradient.addColorStop(0, `rgba(46, 204, 113, ${0.3 + Math.sin(time / 200) * 0.1})`);
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(x + 8, y + 8, 32, 32);
    
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(x + 12, y + 12, 24, 24);
    
    this.ctx.fillStyle = '#27ae60';
    this.ctx.beginPath();
    this.ctx.moveTo(x + TILE_SIZE / 2, y + 16);
    this.ctx.lineTo(x + TILE_SIZE / 2 + 8, y + 28);
    this.ctx.lineTo(x + TILE_SIZE / 2 - 8, y + 28);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.fillRect(x + TILE_SIZE / 2 - 3, y + 26, 6, 10);
  }

  private renderPlayer(player: Player): void {
    const pos = player.getRenderPosition();
    const scale = player.getScale();
    const frame = player.getWalkFrame();
    const direction = player.getDirection();
    const hurt = player.isHurtFlashing();
    const attacking = player.isAttacking();
    const attackProgress = player.getAttackProgress();

    const centerX = pos.x + TILE_SIZE / 2;
    const centerY = pos.y + TILE_SIZE / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-centerX, -centerY);

    if (hurt) {
      this.ctx.globalAlpha = 0.7;
      this.drawPlayerSprite(pos.x, pos.y, frame, direction, '#e74c3c');
      this.ctx.globalAlpha = 1;
    } else {
      this.drawPlayerSprite(pos.x, pos.y, frame, direction, '#ecf0f1');
    }

    if (attacking) {
      const attackX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const attackY = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      const attackDist = TILE_SIZE * 0.6 * Math.sin(attackProgress * Math.PI);
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - attackProgress * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(
        centerX + attackX * attackDist,
        centerY + attackY * attackDist,
        12 * (1 - attackProgress * 0.5),
        0, Math.PI * 2
      );
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawPlayerSprite(x: number, y: number, frame: number, direction: string, color: string): void {
    const px = x + 12;
    const py = y + 8;

    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(px + 4, py + 12, 16, 16);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(px + 6, py + 2, 12, 12);

    this.ctx.fillStyle = '#2c3e50';
    if (direction === 'left') {
      this.ctx.fillRect(px + 7, py + 6, 3, 3);
    } else if (direction === 'right') {
      this.ctx.fillRect(px + 14, py + 6, 3, 3);
    } else if (direction === 'up') {
      this.ctx.fillRect(px + 8, py + 5, 2, 2);
      this.ctx.fillRect(px + 14, py + 5, 2, 2);
    } else {
      this.ctx.fillRect(px + 9, py + 7, 3, 3);
      this.ctx.fillRect(px + 14, py + 7, 3, 3);
    }

    this.ctx.fillStyle = '#2c3e50';
    if (frame === 0) {
      this.ctx.fillRect(px + 5, py + 28, 6, 8);
      this.ctx.fillRect(px + 13, py + 28, 6, 8);
    } else {
      this.ctx.fillRect(px + 3, py + 28, 6, 8);
      this.ctx.fillRect(px + 15, py + 28, 6, 8);
    }

    this.ctx.fillStyle = '#c0392b';
    this.ctx.fillRect(px + 6, py + 2, 12, 4);
  }

  private renderMonsters(monsters: Monster[]): void {
    for (const monster of monsters) {
      if (monster.isDead()) continue;
      
      const pos = monster.getRenderPosition();
      const rotation = monster.getRotation();
      const opacity = monster.getOpacity();
      const flashing = monster.isFlashing();
      const stunned = monster.isStunned();

      const centerX = pos.x + TILE_SIZE / 2;
      const centerY = pos.y + TILE_SIZE / 2;

      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(rotation);
      this.ctx.translate(-centerX, -centerY);

      if (flashing) {
        this.drawMonsterSprite(pos.x, pos.y, '#ffffff');
      } else {
        this.drawMonsterSprite(pos.x, pos.y, '#8e44ad');
      }

      if (stunned) {
        this.ctx.fillStyle = '#f1c40f';
        const starTime = performance.now() / 100;
        for (let i = 0; i < 3; i++) {
          const angle = starTime + (i * Math.PI * 2) / 3;
          const sx = centerX + Math.cos(angle) * 20;
          const sy = pos.y + Math.sin(angle * 2) * 5 - 5;
          this.drawStar(sx, sy, 4);
        }
      }

      this.ctx.restore();

      if (!monster.isDying() && !monster.isStunned()) {
        this.renderMonsterHealthBar(monster);
      }
    }
  }

  private drawMonsterSprite(x: number, y: number, color: string): void {
    const px = x + 8;
    const py = y + 10;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(px + 16, py + 16, 16, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(px + 8, py + 10, 6, 6);
    this.ctx.fillRect(px + 18, py + 10, 6, 6);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(px + 10, py + 12, 3, 3);
    this.ctx.fillRect(px + 20, py + 12, 3, 3);

    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(px + 12, py + 22, 8, 2);
    this.ctx.fillRect(px + 10, py + 24, 12, 2);

    this.ctx.fillStyle = '#6c3483';
    for (let i = 0; i < 3; i++) {
      const sx = px + 4 + i * 12;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, py);
      this.ctx.lineTo(sx + 6, py - 8);
      this.ctx.lineTo(sx + 12, py);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private drawStar(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderMonsterHealthBar(monster: Monster): void {
    const pos = monster.getRenderPosition();
    const x = pos.x + 8;
    const y = pos.y + 4;
    const width = TILE_SIZE - 16;
    const height = 4;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, width, height);

    const healthPercent = monster.getHealth() / monster.getMaxHealth();
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(x + 1, y + 1, (width - 2) * healthPercent, height - 2);
  }

  private renderParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      
      if (p.value > 0) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`+${p.value}`, p.x, p.y - 10);
      }
    }
    this.ctx.globalAlpha = 1;
  }

  private renderUI(player: Player, floor: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, 50);

    this.renderHealthBar(player);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`分数: ${player.getScore()}`, CANVAS_WIDTH - 120, 32);

    this.ctx.textAlign = 'left';
    this.ctx.fillText(`第 ${floor} 层`, 130, 32);

    this.renderKeyIcons(player);
  }

  private renderHealthBar(player: Player): void {
    const x = 10;
    const y = 15;
    const width = 100;
    const height = 20;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y, width, height);

    const healthPercent = player.getHealth() / player.getMaxHealth();
    const barColor = healthPercent > 0.5 ? '#e74c3c' : healthPercent > 0.25 ? '#f39c12' : '#c0392b';
    
    this.ctx.fillStyle = barColor;
    this.ctx.fillRect(x + 2, y + 2, (width - 4) * healthPercent, height - 4);

    const heartCount = 5;
    for (let i = 0; i < heartCount; i++) {
      const hx = x + 8 + i * 18;
      const hy = y + 5;
      const filled = (i + 1) / heartCount <= healthPercent;
      this.drawHeart(hx, hy, filled ? '#e74c3c' : '#555');
    }

    if (player.isHealthFlashing()) {
      this.ctx.fillStyle = `rgba(231, 76, 60, ${Math.sin(performance.now() / 50) * 0.3 + 0.3})`;
      this.ctx.fillRect(x, y, width, height);
    }
  }

  private drawHeart(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x + 3, y + 2, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 9, y + 2, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 4);
    this.ctx.lineTo(x + 6, y + 12);
    this.ctx.lineTo(x + 12, y + 4);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderKeyIcons(player: Player): void {
    const keys = player.getKeys();
    const startX = CANVAS_WIDTH - 110;
    const y = 15;

    for (let i = 0; i < 3; i++) {
      const color = i === 0 ? KeyColor.RED : i === 1 ? KeyColor.BLUE : KeyColor.GOLD;
      const hasKey = keys.includes(color);
      const x = startX + i * 35;
      
      if (hasKey) {
        this.drawKeyIcon(x, y, color);
      } else {
        this.ctx.globalAlpha = 0.3;
        this.drawKeyIcon(x, y, color);
        this.ctx.globalAlpha = 1;
      }
    }
  }

  private drawKeyIcon(x: number, y: number, color: KeyColor): void {
    const keyColor = color === KeyColor.RED ? '#e74c3c' :
                     color === KeyColor.BLUE ? '#3498db' : '#f1c40f';
    
    this.ctx.fillStyle = keyColor;
    this.ctx.beginPath();
    this.ctx.arc(x + 6, y + 6, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = keyColor;
    this.ctx.fillRect(x + 5, y + 8, 3, 8);
    this.ctx.fillRect(x + 5, y + 13, 6, 2);
  }

  private renderTransition(): void {
    if (this.transitionProgress <= 0) return;

    const tileSize = TILE_SIZE / 2;
    const cols = Math.ceil(CANVAS_WIDTH / tileSize);
    const rows = Math.ceil(CANVAS_HEIGHT / tileSize);

    this.ctx.fillStyle = '#0a0a0a';
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const checker = (x + y) % 2 === 0;
        const delay = checker ? 0 : 0.2;
        const progress = Math.max(0, Math.min(1, (this.transitionProgress - delay) / 0.8));
        
        if (progress > 0) {
          const px = x * tileSize;
          const py = y * tileSize;
          const w = tileSize * progress;
          const h = tileSize * progress;
          
          this.ctx.fillRect(px + (tileSize - w) / 2, py + (tileSize - h) / 2, w, h);
        }
      }
    }
  }
}
