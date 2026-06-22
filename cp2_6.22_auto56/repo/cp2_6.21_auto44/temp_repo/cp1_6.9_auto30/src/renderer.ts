import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PATH_POINTS,
  COLORS,
  TowerType,
  TOWER_CONFIGS,
  Position
} from './types';
import { Tower } from './tower';
import { Enemy } from './enemy';
import { Bullet } from './bullet';
import { Particle } from './particle';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  setScale(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.DARK_BROWN;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  begin(): void {
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);
  }

  end(): void {
    this.ctx.restore();
  }

  drawGrid(): void {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const isLight = (x + y) % 2 === 0;
        this.ctx.fillStyle = isLight ? COLORS.LIGHT_GREEN : COLORS.DARK_GREEN;
        this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  drawPath(): void {
    this.ctx.strokeStyle = COLORS.PATH_BORDER;
    this.ctx.lineWidth = CELL_SIZE + 4;
    this.ctx.lineCap = 'square';
    this.ctx.lineJoin = 'miter';
    
    this.ctx.beginPath();
    this.ctx.moveTo(PATH_POINTS[0].x * CELL_SIZE + CELL_SIZE / 2, PATH_POINTS[0].y * CELL_SIZE + CELL_SIZE / 2);
    for (let i = 1; i < PATH_POINTS.length; i++) {
      this.ctx.lineTo(PATH_POINTS[i].x * CELL_SIZE + CELL_SIZE / 2, PATH_POINTS[i].y * CELL_SIZE + CELL_SIZE / 2);
    }
    this.ctx.stroke();

    this.ctx.strokeStyle = COLORS.PATH_BROWN;
    this.ctx.lineWidth = CELL_SIZE - 4;
    
    this.ctx.beginPath();
    this.ctx.moveTo(PATH_POINTS[0].x * CELL_SIZE + CELL_SIZE / 2, PATH_POINTS[0].y * CELL_SIZE + CELL_SIZE / 2);
    for (let i = 1; i < PATH_POINTS.length; i++) {
      this.ctx.lineTo(PATH_POINTS[i].x * CELL_SIZE + CELL_SIZE / 2, PATH_POINTS[i].y * CELL_SIZE + CELL_SIZE / 2);
    }
    this.ctx.stroke();
  }

  drawTower(tower: Tower, isSelected: boolean): void {
    const { x, y } = tower;
    const buildHeight = tower.getBuildHeight();
    const baseY = y + CELL_SIZE * 0.4;
    const topY = baseY - buildHeight;

    if (isSelected) {
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, tower.range, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.fillRect(x - 13, baseY - 3, 26, 6);

    const baseHeight = Math.min(buildHeight * 0.4, CELL_SIZE * 0.32);
    this.ctx.fillStyle = tower.config.color;
    this.ctx.fillRect(x - 12, baseY - baseHeight, 24, baseHeight);
    this.ctx.strokeStyle = COLORS.BLACK;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 12, baseY - baseHeight, 24, baseHeight);

    if (buildHeight > CELL_SIZE * 0.32) {
      const bodyHeight = buildHeight - CELL_SIZE * 0.32;
      const bodyY = baseY - baseHeight - bodyHeight;
      
      this.ctx.fillStyle = this.lightenColor(tower.config.color, 20);
      this.ctx.fillRect(x - 10, bodyY, 20, bodyHeight);
      this.ctx.strokeStyle = COLORS.BLACK;
      this.ctx.strokeRect(x - 10, bodyY, 20, bodyHeight);

      if (tower.level > 1) {
        this.ctx.save();
        this.ctx.translate(x, bodyY + bodyHeight / 2);
        this.ctx.rotate(tower.rotationAngle);
        
        const ringSize = 12 + tower.level * 2;
        this.ctx.strokeStyle = tower.config.accentColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
        this.ctx.stroke();
        
        for (let i = 0; i < tower.level; i++) {
          const angle = (i / tower.level) * Math.PI * 2;
          this.ctx.fillStyle = tower.config.accentColor;
          this.ctx.fillRect(
            Math.cos(angle) * ringSize - 2,
            Math.sin(angle) * ringSize - 2,
            4, 4
          );
        }
        
        this.ctx.restore();
      }

      this.ctx.save();
      this.ctx.translate(x, topY);
      this.ctx.rotate(tower.targetAngle);
      
      this.ctx.fillStyle = tower.config.accentColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = COLORS.BLACK;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.fillStyle = tower.config.color;
      this.ctx.fillRect(0, -3, 16, 6);
      this.ctx.strokeRect(0, -3, 16, 6);
      
      this.ctx.restore();
    }

    if (tower.level > 1) {
      this.ctx.fillStyle = COLORS.GOLD;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      for (let i = 0; i < tower.level; i++) {
        this.ctx.fillText('★', x - 8 + i * 8, baseY + 12);
      }
    }
  }

  drawEnemy(enemy: Enemy): void {
    const { x, y } = enemy;
    const size = enemy.getSize();
    
    const color = enemy.isHit ? COLORS.RED : enemy.config.color;
    const halfSize = size / 2;

    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.fillRect(x - halfSize - 1, y - halfSize - 1, size + 2, size + 2);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - halfSize, y - halfSize, size, size);

    const eyeOffset = enemy.walkFrame === 0 ? 0 : 1;
    const eyeY = y - halfSize + 3;
    
    this.ctx.fillStyle = COLORS.WHITE;
    this.ctx.fillRect(x - halfSize + 3, eyeY, 3, 3);
    this.ctx.fillRect(x + halfSize - 6, eyeY, 3, 3);
    
    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.fillRect(x - halfSize + 3 + eyeOffset, eyeY + 1, 1, 1);
    this.ctx.fillRect(x + halfSize - 6 + eyeOffset, eyeY + 1, 1, 1);

    if (enemy.type === 'heavy') {
      this.ctx.fillStyle = '#888888';
      this.ctx.fillRect(x - halfSize - 2, y - 2, size + 4, 3);
      this.ctx.strokeStyle = COLORS.BLACK;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x - halfSize - 2, y - 2, size + 4, 3);
    }

    if (enemy.type === 'fast') {
      this.ctx.fillStyle = '#88CCFF';
      const wingOffset = enemy.walkFrame === 0 ? 0 : 2;
      this.ctx.fillRect(x - halfSize - 4, y - 1 + wingOffset, 3, 2);
      this.ctx.fillRect(x + halfSize + 1, y - 1 - wingOffset, 3, 2);
    }

    const healthBarWidth = size + 4;
    const healthPercent = enemy.health / enemy.maxHealth;
    
    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.fillRect(x - healthBarWidth / 2, y - halfSize - 8, healthBarWidth, 4);
    
    const healthColor = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(x - healthBarWidth / 2 + 1, y - halfSize - 7, (healthBarWidth - 2) * healthPercent, 2);
  }

  drawBullet(bullet: Bullet): void {
    const { x, y } = bullet;
    
    if (bullet.towerType === 'laser') {
      const angle = bullet.getAngle();
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(angle);
      
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      this.ctx.fillRect(-12, -2, 24, 4);
      
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.fillRect(-10, -1, 20, 2);
      
      this.ctx.restore();
    } else if (bullet.towerType === 'cannon') {
      this.ctx.fillStyle = COLORS.BLACK;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#333333';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FF6600';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = COLORS.BLACK;
      this.ctx.fillRect(x - 3, y - 3, 6, 6);
      
      this.ctx.fillStyle = COLORS.GOLD;
      this.ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  drawParticle(particle: Particle): void {
    const alpha = particle.getAlpha();
    this.ctx.globalAlpha = alpha;
    
    this.ctx.fillStyle = particle.color;
    this.ctx.fillRect(
      particle.x - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size
    );
    
    this.ctx.globalAlpha = 1;
  }

  drawUI(
    gold: number,
    lives: number,
    currentWave: number,
    totalWaves: number,
    waveState: string,
    countdown: number,
    selectedTowerType: TowerType | null,
    selectedTower: Tower | null,
    score: number,
    goldAnimation: number,
    mouseGridPos: Position | null
  ): void {
    this.drawResourcePanel(gold, lives, goldAnimation);
    this.drawWaveInfo(currentWave, totalWaves, waveState, countdown);
    this.drawTowerSelection(selectedTowerType);
    this.drawScore(score);
    
    if (selectedTower) {
      this.drawTowerInfoPanel(selectedTower, gold);
    }
    
    if (selectedTowerType && mouseGridPos) {
      this.drawPlacementPreview(selectedTowerType, mouseGridPos);
    }
  }

  private drawResourcePanel(gold: number, lives: number, goldAnimation: number): void {
    const panelX = 10;
    const panelY = 10;
    const panelWidth = 180;
    const panelHeight = 60;

    this.ctx.fillStyle = 'rgba(42, 26, 10, 0.9)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    const goldScale = 1 + goldAnimation * 0.3;
    this.ctx.save();
    this.ctx.translate(panelX + 25, panelY + 22);
    this.ctx.scale(goldScale, goldScale);
    
    this.ctx.fillStyle = COLORS.GOLD;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = COLORS.BLACK;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#B8860B';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('$', 0, 0);
    
    this.ctx.restore();

    this.ctx.fillStyle = COLORS.GOLD;
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${gold}`, panelX + 45, panelY + 27);

    this.ctx.fillStyle = COLORS.HEART_RED;
    this.ctx.beginPath();
    this.ctx.moveTo(panelX + 25, panelY + 50);
    this.ctx.bezierCurveTo(panelX + 25, panelY + 42, panelX + 15, panelY + 42, panelX + 15, panelY + 46);
    this.ctx.bezierCurveTo(panelX + 15, panelY + 52, panelX + 25, panelY + 58, panelX + 25, panelY + 58);
    this.ctx.bezierCurveTo(panelX + 25, panelY + 58, panelX + 35, panelY + 52, panelX + 35, panelY + 46);
    this.ctx.bezierCurveTo(panelX + 35, panelY + 42, panelX + 25, panelY + 42, panelX + 25, panelY + 50);
    this.ctx.fill();
    this.ctx.strokeStyle = COLORS.BLACK;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = lives <= 5 ? COLORS.RED : COLORS.WHITE;
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`${lives}`, panelX + 45, panelY + 52);
  }

  private drawWaveInfo(
    currentWave: number,
    totalWaves: number,
    waveState: string,
    countdown: number
  ): void {
    const panelX = CANVAS_WIDTH - 140;
    const panelY = CANVAS_HEIGHT - 40;
    const panelWidth = 130;
    const panelHeight = 30;

    this.ctx.fillStyle = 'rgba(42, 26, 10, 0.9)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    this.ctx.fillStyle = COLORS.WHITE;
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Wave ${currentWave}/${totalWaves}`, panelX + panelWidth / 2, panelY + 20);

    if (waveState === 'countdown') {
      const count = Math.ceil(countdown / 1000);
      const pulse = Math.sin(Date.now() / 100) * 0.2 + 1;
      
      this.ctx.save();
      this.ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      this.ctx.scale(pulse, pulse);
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(-60, -50, 120, 100);
      this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-60, -50, 120, 100);
      
      this.ctx.fillStyle = COLORS.GOLD;
      this.ctx.font = 'bold 48px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(count.toString(), 0, 0);
      
      this.ctx.restore();
    }
  }

  private drawTowerSelection(selectedType: TowerType | null): void {
    const types: TowerType[] = ['machine', 'laser', 'cannon'];
    const panelY = CANVAS_HEIGHT - 90;
    const panelWidth = 420;
    const panelX = (CANVAS_WIDTH - panelWidth) / 2;
    const panelHeight = 80;

    this.ctx.fillStyle = 'rgba(42, 26, 10, 0.95)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    types.forEach((type, index) => {
      const config = TOWER_CONFIGS[type];
      const buttonX = panelX + 10 + index * 140;
      const buttonY = panelY + 10;
      const buttonWidth = 120;
      const buttonHeight = 60;
      const isSelected = selectedType === type;

      this.ctx.fillStyle = isSelected ? config.accentColor : '#3a2a1a';
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.strokeStyle = isSelected ? COLORS.GOLD : COLORS.EARTH_YELLOW;
      this.ctx.lineWidth = isSelected ? 3 : 1;
      this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

      const iconX = buttonX + 20;
      const iconY = buttonY + buttonHeight / 2;
      
      this.ctx.fillStyle = config.color;
      this.ctx.fillRect(iconX - 10, iconY - 15, 20, 30);
      this.ctx.strokeStyle = COLORS.BLACK;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(iconX - 10, iconY - 15, 20, 30);
      
      this.ctx.fillStyle = config.accentColor;
      this.ctx.beginPath();
      this.ctx.arc(iconX, iconY - 15, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = COLORS.WHITE;
      this.ctx.font = '11px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(config.name, buttonX + 40, buttonY + 22);
      
      this.ctx.fillStyle = COLORS.GOLD;
      this.ctx.font = '10px monospace';
      this.ctx.fillText(`$${config.cost}`, buttonX + 40, buttonY + 38);

      if (isSelected) {
        const descX = buttonX;
        const descY = buttonY - 50;
        const descWidth = buttonWidth + 20;
        
        this.ctx.fillStyle = 'rgba(42, 26, 10, 0.95)';
        this.ctx.fillRect(descX - 10, descY, descWidth, 40);
        this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(descX - 10, descY, descWidth, 40);
        
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.font = '9px monospace';
        this.ctx.fillText(config.description, descX - 5, descY + 15);
        this.ctx.fillText(`伤害:${config.damage} 射程:${config.range}`, descX - 5, descY + 30);
      }
    });
  }

  private drawScore(score: number): void {
    const panelX = CANVAS_WIDTH - 140;
    const panelY = 10;
    const panelWidth = 130;
    const panelHeight = 30;

    this.ctx.fillStyle = 'rgba(42, 26, 10, 0.9)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    this.ctx.fillStyle = COLORS.GOLD;
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`分数: ${score}`, panelX + panelWidth / 2, panelY + 20);
  }

  private drawTowerInfoPanel(tower: Tower, gold: number): void {
    const panelX = CANVAS_WIDTH - 200;
    const panelY = 50;
    const panelWidth = 190;
    const panelHeight = 180;

    this.ctx.fillStyle = 'rgba(42, 26, 10, 0.95)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = COLORS.EARTH_YELLOW;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    this.ctx.fillStyle = tower.config.accentColor;
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(tower.config.name, panelX + 10, panelY + 25);

    this.ctx.fillStyle = COLORS.WHITE;
    this.ctx.font = '11px monospace';
    this.ctx.fillText(`等级: ${tower.level}/${3}`, panelX + 10, panelY + 45);
    this.ctx.fillText(`伤害: ${tower.damage}`, panelX + 10, panelY + 60);
    this.ctx.fillText(`射程: ${tower.range}`, panelX + 10, panelY + 75);
    this.ctx.fillText(`攻速: ${(1000 / tower.fireRate).toFixed(1)}/秒`, panelX + 10, panelY + 90);

    if (tower.canUpgrade()) {
      const upgradeCost = tower.getUpgradeCost();
      const canAfford = gold >= upgradeCost;
      
      const buttonX = panelX + 10;
      const buttonY = panelY + 110;
      const buttonWidth = panelWidth - 20;
      const buttonHeight = 35;

      this.ctx.fillStyle = canAfford ? '#4CAF50' : '#666666';
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.strokeStyle = canAfford ? COLORS.GOLD : '#888888';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

      this.ctx.fillStyle = COLORS.WHITE;
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`升级 $${upgradeCost}`, buttonX + buttonWidth / 2, buttonY + 22);
      
      if (!canAfford) {
        this.ctx.fillStyle = '#FF6666';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('金币不足', buttonX + buttonWidth / 2, buttonY + 55);
      }
    } else {
      this.ctx.fillStyle = COLORS.GOLD;
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('★ 已达最高等级 ★', panelX + panelWidth / 2, panelY + 130);
    }

    this.ctx.fillStyle = '#888888';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('点击其他位置取消选择', panelX + panelWidth / 2, panelY + 165);
  }

  private drawPlacementPreview(type: TowerType, gridPos: Position): void {
    const config = TOWER_CONFIGS[type];
    const x = gridPos.x * CELL_SIZE + CELL_SIZE / 2;
    const y = gridPos.y * CELL_SIZE + CELL_SIZE / 2;

    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(x, y, config.range, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.globalAlpha = 0.6;
    this.ctx.fillStyle = config.color;
    this.ctx.fillRect(x - 12, y - 20, 24, 24);
    this.ctx.strokeStyle = COLORS.BLACK;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 12, y - 20, 24, 24);
    
    this.ctx.fillStyle = config.accentColor;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 20, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  drawGameOver(score: number, wave: number, isVictory: boolean): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (CANVAS_WIDTH - panelWidth) / 2;
    const panelY = (CANVAS_HEIGHT - panelHeight) / 2;

    this.ctx.fillStyle = COLORS.DARK_BROWN;
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = isVictory ? COLORS.GOLD : COLORS.RED;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    this.ctx.fillStyle = isVictory ? COLORS.GOLD : COLORS.RED;
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(isVictory ? '胜利!' : '游戏结束', CANVAS_WIDTH / 2, panelY + 60);

    this.ctx.fillStyle = COLORS.WHITE;
    this.ctx.font = '20px monospace';
    this.ctx.fillText(`最终分数: ${score}`, CANVAS_WIDTH / 2, panelY + 110);
    this.ctx.fillText(`通过波次: ${wave - 1}/${5}`, CANVAS_WIDTH / 2, panelY + 145);

    const buttonX = CANVAS_WIDTH / 2 - 80;
    const buttonY = panelY + 190;
    const buttonWidth = 160;
    const buttonHeight = 50;

    this.ctx.fillStyle = COLORS.EARTH_YELLOW;
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.strokeStyle = COLORS.GOLD;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    this.ctx.fillStyle = COLORS.DARK_BROWN;
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillText('重新开始', CANVAS_WIDTH / 2, buttonY + 32);

    this.ctx.fillStyle = '#888888';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('点击按钮或按空格键重玩', CANVAS_WIDTH / 2, panelY + 270);
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  screenToWorld(screenX: number, screenY: number): Position {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }

  worldToGrid(worldX: number, worldY: number): Position {
    return {
      x: Math.floor(worldX / CELL_SIZE),
      y: Math.floor(worldY / CELL_SIZE)
    };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
  }
}
