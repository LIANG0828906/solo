import { GameMap, Entity, Drop, Chest, DamageNumber, PlayerState, AttackEffect, Particle, TILE_SIZE, COLORS, RARITY_COLORS, Direction, GameStats, Equipment, Rarity } from '../../types/gameTypes';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private camera: { x: number; y: number } = { x: 0, y: 0 };
  private particles: Particle[] = [];
  private attackEffects: AttackEffect[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public clear(): void {
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public updateCamera(playerX: number, playerY: number): void {
    const targetX = playerX + TILE_SIZE / 2 - this.canvas.width / 2;
    const targetY = playerY + TILE_SIZE / 2 - this.canvas.height / 2;
    
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
  }

  public drawMap(gameMap: GameMap, time: number): void {
    const startX = Math.max(0, Math.floor(this.camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(this.camera.y / TILE_SIZE) - 1);
    const endX = Math.min(gameMap.width, Math.ceil((this.camera.x + this.canvas.width) / TILE_SIZE) + 1);
    const endY = Math.min(gameMap.height, Math.ceil((this.camera.y + this.canvas.height) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = gameMap.tiles[y]?.[x];
        if (!tile) continue;

        const screenX = x * TILE_SIZE - this.camera.x;
        const screenY = y * TILE_SIZE - this.camera.y;

        switch (tile.type) {
          case 'WALL':
            this.ctx.fillStyle = COLORS.WALL;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
            this.ctx.fillRect(screenX, screenY, 4, TILE_SIZE);
            break;

          case 'FLOOR':
            this.ctx.fillStyle = COLORS.FLOOR;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            if ((x + y) % 2 === 0) {
              this.ctx.fillStyle = 'rgba(255,255,255,0.02)';
              this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
            break;

          case 'DOOR':
            this.ctx.fillStyle = COLORS.FLOOR;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            const glowIntensity = 0.5 + 0.5 * Math.sin(time / 500 + (tile.glowPhase || 0));
            const gradient = this.ctx.createRadialGradient(
              screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 0,
              screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE
            );
            gradient.addColorStop(0, `rgba(255, 215, 0, ${0.4 * glowIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(screenX - TILE_SIZE, screenY - TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 3);
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * glowIntensity})`;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            break;

          case 'PORTAL':
            this.ctx.fillStyle = COLORS.FLOOR;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            this.drawPortal(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, time);
            break;
        }
      }
    }
  }

  private drawPortal(cx: number, cy: number, time: number): void {
    const rings = 4;
    for (let i = 0; i < rings; i++) {
      const progress = ((time / 1000 + i * 0.25) % 1);
      const radius = 5 + progress * 25;
      const alpha = 1 - progress;
      
      this.ctx.beginPath();
      for (let j = 0; j < 12; j++) {
        const angle = (j / 12) * Math.PI * 2 + time / 500 + i;
        const r = radius + Math.sin(angle * 3 + time / 200) * 3;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (j === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      this.ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.3})`;
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(192, 132, 252, ${alpha * 0.8})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    const centerGradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
    centerGradient.addColorStop(0, 'rgba(216, 180, 254, 0.8)');
    centerGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.5)');
    centerGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    this.ctx.fillStyle = centerGradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public drawChests(chests: Chest[], time: number): void {
    for (const chest of chests) {
      const screenX = chest.x - this.camera.x;
      const screenY = chest.y - this.camera.y;

      if (chest.opened) {
        this.ctx.fillStyle = '#4A3C2A';
        this.ctx.fillRect(screenX + 4, screenY + 16, TILE_SIZE - 8, TILE_SIZE - 20);
        this.ctx.fillStyle = '#3A2C1A';
        this.ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, 14);
      } else {
        for (let i = 0; i < 3; i++) {
          const sparkle = (time / 100 + i * 50) % 200;
          if (sparkle < 50) {
            const px = screenX + 5 + Math.random() * (TILE_SIZE - 10);
            const py = screenY + 5 + Math.random() * (TILE_SIZE - 10);
            const size = 2 * (1 - sparkle / 50);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - sparkle / 50})`;
            this.ctx.fillRect(px, py, size, size);
          }
        }

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, TILE_SIZE - 12);
        
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, 8);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(screenX + TILE_SIZE / 2 - 3, screenY + 14, 6, 8);
        this.ctx.fillStyle = '#DAA520';
        this.ctx.fillRect(screenX + TILE_SIZE / 2 - 2, screenY + 16, 4, 4);
      }
    }
  }

  public drawPlayer(player: PlayerState, time: number): void {
    const e = player.entity;
    const screenX = e.x - this.camera.x + 2;
    const screenY = e.y - this.camera.y + 2;
    const size = TILE_SIZE - 4;

    const bounce = e.isAttacking ? 0 : Math.sin(e.animPhase * 0.5) * 2;

    this.ctx.save();
    this.ctx.translate(screenX + size / 2, screenY + size / 2 + bounce);

    this.drawCape(e.direction, time);
    this.drawPixelWarrior(e.direction, size);

    this.ctx.restore();

    this.drawHealthBar(screenX + 2, screenY - 8, size - 4, e.hp, e.maxHp);
  }

  private drawCape(direction: Direction, time: number): void {
    const capeWave = Math.sin(time / 100) * 3;
    
    this.ctx.fillStyle = COLORS.PLAYER_CAPE;
    this.ctx.beginPath();
    
    switch (direction) {
      case 'DOWN':
        this.ctx.moveTo(-8, -4);
        this.ctx.lineTo(-10 + capeWave, 10);
        this.ctx.lineTo(-6 + capeWave * 0.5, 12);
        this.ctx.lineTo(-4, -2);
        break;
      case 'UP':
        this.ctx.moveTo(-8, 4);
        this.ctx.lineTo(-10 + capeWave, -10);
        this.ctx.lineTo(-6 + capeWave * 0.5, -12);
        this.ctx.lineTo(-4, 2);
        break;
      case 'LEFT':
        this.ctx.moveTo(4, -6);
        this.ctx.lineTo(10 + capeWave, -8);
        this.ctx.lineTo(12 + capeWave * 0.5, -4);
        this.ctx.lineTo(6, 2);
        break;
      case 'RIGHT':
        this.ctx.moveTo(-4, -6);
        this.ctx.lineTo(-10 - capeWave, -8);
        this.ctx.lineTo(-12 - capeWave * 0.5, -4);
        this.ctx.lineTo(-6, 2);
        break;
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawPixelWarrior(direction: Direction, size: number): void {
    const px = size / 16;

    this.ctx.fillStyle = '#FFE0BD';
    this.ctx.fillRect(-3 * px, -7 * px, 6 * px, 6 * px);

    this.ctx.fillStyle = '#4A3728';
    this.ctx.fillRect(-3 * px, -7 * px, 6 * px, 2 * px);

    this.ctx.fillStyle = '#000';
    if (direction === 'LEFT') {
      this.ctx.fillRect(-2 * px, -5 * px, 1 * px, 1 * px);
    } else if (direction === 'RIGHT') {
      this.ctx.fillRect(1 * px, -5 * px, 1 * px, 1 * px);
    } else {
      this.ctx.fillRect(-2 * px, -5 * px, 1 * px, 1 * px);
      this.ctx.fillRect(1 * px, -5 * px, 1 * px, 1 * px);
    }

    this.ctx.fillStyle = '#3B82F6';
    this.ctx.fillRect(-4 * px, -1 * px, 8 * px, 6 * px);

    this.ctx.fillStyle = '#2563EB';
    this.ctx.fillRect(-4 * px, 2 * px, 8 * px, 3 * px);

    this.ctx.fillStyle = '#1E40AF';
    this.ctx.fillRect(-4 * px, 5 * px, 3 * px, 2 * px);
    this.ctx.fillRect(1 * px, 5 * px, 3 * px, 2 * px);

    this.ctx.fillStyle = '#C0C0C0';
    if (direction === 'RIGHT') {
      this.ctx.fillRect(4 * px, -3 * px, 6 * px, 2 * px);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(3 * px, -4 * px, 2 * px, 4 * px);
    } else if (direction === 'LEFT') {
      this.ctx.fillRect(-10 * px, -3 * px, 6 * px, 2 * px);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(-5 * px, -4 * px, 2 * px, 4 * px);
    } else if (direction === 'UP') {
      this.ctx.save();
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.fillRect(4 * px, -3 * px, 6 * px, 2 * px);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(3 * px, -4 * px, 2 * px, 4 * px);
      this.ctx.restore();
    } else {
      this.ctx.save();
      this.ctx.rotate(Math.PI / 2);
      this.ctx.fillRect(4 * px, -3 * px, 6 * px, 2 * px);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(3 * px, -4 * px, 2 * px, 4 * px);
      this.ctx.restore();
    }
  }

  public drawMonsters(monsters: Entity[], time: number): void {
    for (const monster of monsters) {
      const screenX = monster.x - this.camera.x + 3;
      const screenY = monster.y - this.camera.y + 3;

      switch (monster.type) {
        case 'SLIME':
          this.drawSlime(screenX, screenY, monster, time);
          break;
        case 'SKELETON':
          this.drawSkeleton(screenX, screenY, monster, time);
          break;
        case 'BAT':
          this.drawBat(screenX, screenY, monster, time);
          break;
      }

      this.drawHealthBar(screenX + 2, screenY - 6, TILE_SIZE - 10, monster.hp, monster.maxHp, true);
    }
  }

  private drawSlime(x: number, y: number, monster: Entity, time: number): void {
    const size = TILE_SIZE - 6;
    const wobble = Math.sin(monster.animPhase + time / 200) * 2;
    const scale = monster.splitPhase !== undefined ? 0.5 + monster.splitPhase * 0.5 : 1;
    const actualSize = size * scale;
    const offset = (size - actualSize) / 2;

    this.ctx.fillStyle = COLORS.SLIME;
    this.ctx.beginPath();
    this.ctx.ellipse(
      x + offset + actualSize / 2,
      y + offset + actualSize / 2 + wobble * 0.5,
      actualSize / 2,
      actualSize / 2 - wobble * 0.3,
      0, 0, Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(
      x + offset + actualSize * 0.3,
      y + offset + actualSize * 0.3,
      actualSize * 0.15,
      actualSize * 0.1,
      -0.3, 0, Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + offset + actualSize * 0.3, y + offset + actualSize * 0.45, 3 * scale, 3 * scale);
    this.ctx.fillRect(x + offset + actualSize * 0.6, y + offset + actualSize * 0.45, 3 * scale, 3 * scale);
  }

  private drawSkeleton(x: number, y: number, monster: Entity, time: number): void {
    const size = TILE_SIZE - 6;
    const px = size / 16;
    const bounce = Math.sin(monster.animPhase * 0.5) * 2;

    this.ctx.save();
    this.ctx.translate(x + size / 2, y + size / 2 + bounce);

    this.ctx.fillStyle = COLORS.SKELETON;
    this.ctx.fillRect(-3 * px, -7 * px, 6 * px, 6 * px);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(-2 * px, -5 * px, 2 * px, 2 * px);
    this.ctx.fillRect(0 * px, -5 * px, 2 * px, 2 * px);

    this.ctx.fillRect(-1 * px, -3 * px, 2 * px, 1 * px);
    this.ctx.fillRect(-2 * px, -2 * px, 1 * px, 1 * px);
    this.ctx.fillRect(0 * px, -2 * px, 1 * px, 1 * px);
    this.ctx.fillRect(1 * px, -2 * px, 1 * px, 1 * px);

    this.ctx.fillStyle = COLORS.SKELETON;
    this.ctx.fillRect(-2 * px, -1 * px, 4 * px, 1 * px);
    this.ctx.fillRect(-3 * px, 0 * px, 6 * px, 1 * px);
    this.ctx.fillRect(-2 * px, 1 * px, 4 * px, 1 * px);
    this.ctx.fillRect(-3 * px, 2 * px, 6 * px, 1 * px);
    this.ctx.fillRect(-2 * px, 3 * px, 4 * px, 1 * px);

    this.ctx.fillStyle = '#6B7280';
    this.ctx.fillRect(-8 * px, -3 * px, 4 * px, 8 * px);
    this.ctx.fillStyle = '#4B5563';
    this.ctx.fillRect(-7 * px, -2 * px, 2 * px, 6 * px);

    this.ctx.fillStyle = COLORS.SKELETON;
    this.ctx.fillRect(-2 * px, 4 * px, 2 * px, 4 * px);
    this.ctx.fillRect(0 * px, 4 * px, 2 * px, 4 * px);

    this.ctx.restore();
  }

  private drawBat(x: number, y: number, monster: Entity, time: number): void {
    const size = TILE_SIZE - 6;
    const wingFlap = Math.sin(time / 80 + monster.animPhase) * 0.6;
    const hover = Math.sin(time / 200 + monster.animPhase) * 3;

    this.ctx.save();
    this.ctx.translate(x + size / 2, y + size / 2 + hover);

    this.ctx.fillStyle = COLORS.BAT;
    
    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.4, 0);
    this.ctx.quadraticCurveTo(-size * 0.8, -size * 0.4 * Math.sin(wingFlap + Math.PI / 2), -size * 0.6, -size * 0.1);
    this.ctx.quadraticCurveTo(-size * 0.4, -size * 0.2, -size * 0.2, 0);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.4, 0);
    this.ctx.quadraticCurveTo(size * 0.8, -size * 0.4 * Math.sin(wingFlap + Math.PI / 2), size * 0.6, -size * 0.1);
    this.ctx.quadraticCurveTo(size * 0.4, -size * 0.2, size * 0.2, 0);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(-size * 0.15, -size * 0.2);
    this.ctx.lineTo(-size * 0.1, -size * 0.35);
    this.ctx.lineTo(-size * 0.05, -size * 0.2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.05, -size * 0.2);
    this.ctx.lineTo(size * 0.1, -size * 0.35);
    this.ctx.lineTo(size * 0.15, -size * 0.2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(-size * 0.1, -size * 0.05, 2, 2);
    this.ctx.fillRect(size * 0.05, -size * 0.05, 2, 2);

    this.ctx.restore();
  }

  public drawDrops(drops: Drop[], time: number): void {
    for (const drop of drops) {
      const screenX = drop.x - this.camera.x;
      const screenY = drop.y - this.camera.y;
      const float = Math.sin(drop.animPhase) * 3;

      if (drop.type === 'COIN') {
        this.drawCoin(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + float, drop.animPhase);
      } else if (drop.type === 'EQUIPMENT' && drop.equipment) {
        this.drawEquipmentDrop(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + float, drop.equipment, drop.animPhase);
      }
    }
  }

  private drawCoin(cx: number, cy: number, phase: number): void {
    const rotation = phase;
    const scaleX = Math.abs(Math.cos(rotation));
    
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scaleX, 1);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFA500';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 8, -Math.PI / 4, Math.PI / 4);
    this.ctx.lineTo(0, 0);
    this.ctx.fill();

    this.ctx.fillStyle = '#DAA520';
    this.ctx.font = 'bold 10px serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('$', 0, 0);

    this.ctx.restore();
  }

  private drawEquipmentDrop(cx: number, cy: number, equipment: Equipment, phase: number): void {
    const float = Math.sin(phase * 2) * 2;
    
    this.ctx.save();
    this.ctx.translate(cx, cy + float);

    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    gradient.addColorStop(0, RARITY_COLORS[equipment.rarity] + '80');
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-20, -20, 40, 40);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(-8, -10, 16, 20);
    
    this.ctx.fillStyle = '#F0F0F0';
    this.ctx.fillRect(-6, -8, 12, 2);
    this.ctx.fillRect(-6, -4, 12, 2);
    this.ctx.fillRect(-6, 0, 12, 2);
    this.ctx.fillRect(-6, 4, 8, 2);

    this.ctx.strokeStyle = RARITY_COLORS[equipment.rarity];
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-8, -10, 16, 20);

    this.ctx.restore();
  }

  public drawDamageNumbers(numbers: DamageNumber[], now: number): void {
    for (const dmg of numbers) {
      const elapsed = now - dmg.startTime;
      const progress = elapsed / 1000;
      
      if (progress > 1) continue;

      const screenX = dmg.x - this.camera.x;
      const screenY = dmg.y - this.camera.y - progress * 30;
      const alpha = 1 - progress;
      const scale = 1 + progress * 0.5;

      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.scale(scale, scale);

      this.ctx.font = 'bold 16px system-ui';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(`-${dmg.value}`, 0, 0);
      
      this.ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
      this.ctx.fillText(`-${dmg.value}`, 0, 0);

      this.ctx.restore();
    }
  }

  public addAttackEffect(x: number, y: number, direction: Direction, now: number): void {
    this.attackEffects.push({
      x, y, direction,
      startTime: now,
      duration: 200
    });
  }

  public drawAttackEffects(now: number): void {
    this.attackEffects = this.attackEffects.filter(effect => now - effect.startTime < effect.duration);

    for (const effect of this.attackEffects) {
      const progress = (now - effect.startTime) / effect.duration;
      const screenX = effect.x - this.camera.x;
      const screenY = effect.y - this.camera.y;
      const alpha = 1 - progress;
      const size = TILE_SIZE * (0.5 + progress * 0.5);

      this.ctx.save();
      this.ctx.translate(screenX, screenY);

      let rotation = 0;
      switch (effect.direction) {
        case 'UP': rotation = -Math.PI / 2; break;
        case 'DOWN': rotation = Math.PI / 2; break;
        case 'LEFT': rotation = Math.PI; break;
        case 'RIGHT': rotation = 0; break;
      }
      this.ctx.rotate(rotation);

      const gradient = this.ctx.createRadialGradient(size * 0.5, 0, 0, size * 0.5, 0, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * alpha})`);
      gradient.addColorStop(0.5, `rgba(200, 200, 255, ${0.4 * alpha})`);
      gradient.addColorStop(1, `rgba(100, 100, 255, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, -Math.PI / 3, Math.PI / 3);
      this.ctx.lineTo(0, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, -Math.PI / 3, Math.PI / 3);
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  public addParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x - this.camera.x,
        y: y - this.camera.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  public updateAndDrawParticles(): void {
    this.particles = this.particles.filter(p => p.life > 0);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.02;

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      this.ctx.globalAlpha = 1;
    }
  }

  public drawTransition(progress: number): void {
    const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.camera.x,
      y: worldY - this.camera.y
    };
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.camera.x,
      y: screenY + this.camera.y
    };
  }

  private drawHealthBar(x: number, y: number, width: number, hp: number, maxHp: number, small: boolean = false): void {
    const height = small ? 4 : 6;
    const percent = hp / maxHp;

    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

    let color = COLORS.HEALTH_GREEN;
    if (percent < 0.3) color = COLORS.HEALTH_RED;
    else if (percent < 0.6) color = COLORS.HEALTH_YELLOW;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y, width, height);

    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.darkenColor(color, 0.3));
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width * percent, height);
  }

  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
