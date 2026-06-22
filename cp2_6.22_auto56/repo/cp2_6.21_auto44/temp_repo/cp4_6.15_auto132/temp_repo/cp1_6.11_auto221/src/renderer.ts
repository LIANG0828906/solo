import { Kitchen } from './kitchen';
import {
  INGREDIENTS_DATA,
  STOVE_RADIUS,
  BOWL_RADIUS,
  PLATE_RADIUS,
  RING_RADIUS,
  Stove,
  FireLevel,
  IngredientType,
  Particle
} from './types';

export class Renderer {
  kitchen: Kitchen;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

  constructor(kitchen: Kitchen) {
    this.kitchen = kitchen;
    this.canvas = kitchen.canvas;
    this.ctx = kitchen.ctx;
  }

  render(currentTime: number) {
    this.ctx.clearRect(0, 0, this.kitchen.width, this.kitchen.height);
    
    this.drawBackground();
    this.drawPrepTable();
    this.drawFinishedTable();
    this.drawCounter();
    this.drawStoves(currentTime);
    this.drawCompletedDishes(currentTime);
    this.drawFlyingDishes(currentTime);
    this.drawScorePopups(currentTime);
    this.drawParticles(currentTime);
    this.drawScore(currentTime);
    this.drawDataPanel(currentTime);
    this.drawFireButtons();
    this.drawDraggingIngredient();
    this.drawComboEffect(currentTime);
  }

  drawBackground() {
    const wallHeight = this.kitchen.counterY;
    
    this.ctx.fillStyle = '#F5F5DC';
    this.ctx.fillRect(0, 0, this.kitchen.width, wallHeight);

    this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    this.ctx.lineWidth = 1;
    const brickWidth = 80;
    const brickHeight = 30;
    for (let y = 0; y < wallHeight; y += brickHeight) {
      const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      for (let x = -brickWidth; x < this.kitchen.width + brickWidth; x += brickWidth) {
        this.ctx.strokeRect(x + offset, y, brickWidth, brickHeight);
      }
    }

    this.ctx.fillStyle = '#708090';
    this.ctx.fillRect(0, wallHeight + 20, this.kitchen.width, this.kitchen.height - wallHeight - 20);

    this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    this.ctx.lineWidth = 1;
    const tileSize = 60;
    for (let y = wallHeight + 20; y < this.kitchen.height; y += tileSize) {
      for (let x = 0; x < this.kitchen.width; x += tileSize) {
        this.ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  drawCounter() {
    const counterY = this.kitchen.counterY;
    const gradient = this.ctx.createLinearGradient(0, counterY - 30, 0, counterY + 40);
    gradient.addColorStop(0, '#808080');
    gradient.addColorStop(0.5, '#696969');
    gradient.addColorStop(1, '#555555');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, counterY - 30, this.kitchen.width, 70);

    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth = 2;
    for (let x = 0; x < this.kitchen.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, counterY - 28);
      this.ctx.lineTo(x + 20, counterY + 38);
      this.ctx.stroke();
    }
  }

  drawPrepTable() {
    const { prepTableX, prepTableY, prepTableW, prepTableH } = this.kitchen;

    const gradient = this.ctx.createLinearGradient(prepTableX, prepTableY, prepTableX + prepTableW, prepTableY + prepTableH);
    gradient.addColorStop(0, '#D2B48C');
    gradient.addColorStop(0.5, '#DEB887');
    gradient.addColorStop(1, '#C8A278');

    this.ctx.fillStyle = gradient;
    this.roundRect(prepTableX, prepTableY, prepTableW, prepTableH, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(139,90,43,0.3)';
    this.ctx.lineWidth = 1;
    for (let y = prepTableY + 10; y < prepTableY + prepTableH - 10; y += 12) {
      this.ctx.beginPath();
      this.ctx.moveTo(prepTableX + 10, y + (Math.random() - 0.5) * 3);
      this.ctx.lineTo(prepTableX + prepTableW - 10, y + (Math.random() - 0.5) * 3);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = '#8B4513';
    this.ctx.font = 'bold 18px KaiTi, 楷体, STKaiti, serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('备料台', prepTableX + prepTableW / 2, prepTableY + 35);

    for (const bowl of this.kitchen.bowlPositions) {
      this.drawIngredientBowl(bowl.x, bowl.y, bowl.ingredient);
    }
  }

  drawIngredientBowl(x: number, y: number, ingredient: IngredientType) {
    const data = INGREDIENTS_DATA[ingredient];

    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 5, BOWL_RADIUS, BOWL_RADIUS * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#6B4423';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, BOWL_RADIUS, BOWL_RADIUS * 0.4, 0, Math.PI, Math.PI * 2);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fill();
    this.ctx.strokeStyle = '#5C2E0A';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, BOWL_RADIUS - 4, (BOWL_RADIUS - 4) * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = data.color;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x - BOWL_RADIUS * 0.3, y - BOWL_RADIUS * 0.1, BOWL_RADIUS * 0.4, BOWL_RADIUS * 0.12, -0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.font = '14px KaiTi, 楷体, STKaiti, serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(data.name, x, y + BOWL_RADIUS + 20);
  }

  drawFinishedTable() {
    const { finishedTableX, finishedTableY, finishedTableW, finishedTableH } = this.kitchen;

    const gradient = this.ctx.createLinearGradient(finishedTableX, finishedTableY, finishedTableX, finishedTableY + finishedTableH);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, '#F8F8FF');
    gradient.addColorStop(1, '#E8E8F0');

    this.ctx.fillStyle = gradient;
    this.roundRect(finishedTableX, finishedTableY, finishedTableW, finishedTableH, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(180,180,200,0.4)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath();
      const startX = finishedTableX + Math.random() * finishedTableW;
      this.ctx.moveTo(startX, finishedTableY);
      this.ctx.bezierCurveTo(
        startX + 30, finishedTableY + finishedTableH * 0.3,
        startX - 20, finishedTableY + finishedTableH * 0.6,
        startX + 10, finishedTableY + finishedTableH
      );
      this.ctx.stroke();
    }

    this.ctx.fillStyle = '#4169E1';
    this.ctx.font = 'bold 18px KaiTi, 楷体, STKaiti, serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('成品台', finishedTableX + finishedTableW / 2, finishedTableY + 35);
  }

  drawStoves(currentTime: number) {
    for (let i = 0; i < this.kitchen.stoves.length; i++) {
      this.drawStove(this.kitchen.stoves[i], currentTime);
    }
  }

  drawStove(stove: Stove, currentTime: number) {
    const { x, y } = stove;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 5, STOVE_RADIUS, STOVE_RADIUS * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#2F2F2F';
    this.ctx.fill();

    const stoveGradient = this.ctx.createRadialGradient(x, y, 0, x, y, STOVE_RADIUS);
    stoveGradient.addColorStop(0, '#1a1a1a');
    stoveGradient.addColorStop(0.7, '#2F4F4F');
    stoveGradient.addColorStop(1, '#1a2a2a');
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, STOVE_RADIUS, 0, Math.PI * 2);
    this.ctx.fillStyle = stoveGradient;
    this.ctx.fill();

    if (stove.warningActive) {
      const elapsed = currentTime - stove.warningStartTime;
      const cycleTime = 600;
      const phase = elapsed % cycleTime;
      const show = phase < cycleTime / 2;
      if (show) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, STOVE_RADIUS, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
      }
    }

    if (this.kitchen.selectedStove === stove.index) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, STOVE_RADIUS + 5, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([8, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    if (stove.ringActive) {
      const elapsed = currentTime - stove.ringStartTime;
      const progress = Math.min(elapsed / 800, 1);
      const radius = progress * 200;
      const alpha = 1 - progress;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
      this.ctx.lineWidth = 6 * (1 - progress * 0.5);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.6})`;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    if (stove.state === 'cooking' && stove.ingredient) {
      this.drawCookingIngredient(stove);
      this.drawTimerRing(stove, currentTime);
    }
  }

  drawCookingIngredient(stove: Stove) {
    if (!stove.ingredient) return;
    const data = INGREDIENTS_DATA[stove.ingredient];
    const x = stove.x;
    const y = stove.y;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, STOVE_RADIUS - 20, (STOVE_RADIUS - 20) * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 2, STOVE_RADIUS - 25, (STOVE_RADIUS - 25) * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = data.color;
    this.ctx.fill();

    const bubbleCount = Math.floor(stove.elapsedTime / 2) % 3 + 1;
    for (let i = 0; i < bubbleCount; i++) {
      const bx = x + (Math.random() - 0.5) * 30;
      const by = y - 5 - Math.random() * 15;
      this.ctx.beginPath();
      this.ctx.arc(bx, by, 2 + Math.random() * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
      this.ctx.fill();
    }
  }

  drawTimerRing(stove: Stove, currentTime: number) {
    const x = stove.x;
    const y = stove.y - STOVE_RADIUS - 50;

    const progress = stove.elapsedTime / stove.maxCookTime;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;

    this.ctx.beginPath();
    this.ctx.arc(x, y, RING_RADIUS, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fill();

    const gradient = this.ctx.createLinearGradient(x - RING_RADIUS, y, x + RING_RADIUS, y);
    gradient.addColorStop(0, '#00FF00');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF4500');

    this.ctx.beginPath();
    this.ctx.arc(x, y, RING_RADIUS, startAngle, endAngle);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    const remaining = Math.ceil(stove.maxCookTime - stove.elapsedTime);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${remaining}s`, x, y);
    this.ctx.textBaseline = 'alphabetic';
  }

  drawFireButtons() {
    if (this.kitchen.selectedStove === null) return;

    const stove = this.kitchen.stoves[this.kitchen.selectedStove];
    const positions = this.kitchen.getFireButtonPositions(stove);
    const labels: { level: FireLevel; label: string; color: string }[] = [
      { level: 'gentle', label: '文', color: '#4CAF50' },
      { level: 'medium', label: '中', color: '#FF9800' },
      { level: 'strong', label: '武', color: '#F44336' }
    ];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const btn = labels[i];
      const isSelected = stove.fireLevel === btn.level;

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      
      const gradient = this.ctx.createRadialGradient(pos.x - 5, pos.y - 5, 0, pos.x, pos.y, 20);
      gradient.addColorStop(0, isSelected ? '#FFD700' : btn.color);
      gradient.addColorStop(1, btn.color);
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      if (isSelected) {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px KaiTi, 楷体, STKaiti, serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(btn.label, pos.x, pos.y);
      this.ctx.textBaseline = 'alphabetic';
    }
  }

  drawDraggingIngredient() {
    if (!this.kitchen.draggingIngredient) return;

    const data = INGREDIENTS_DATA[this.kitchen.draggingIngredient];
    const x = this.kitchen.dragX;
    const y = this.kitchen.dragY;

    this.ctx.globalAlpha = 0.6;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 3, BOWL_RADIUS, BOWL_RADIUS * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#6B4423';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, BOWL_RADIUS, BOWL_RADIUS * 0.4, 0, Math.PI, Math.PI * 2);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, BOWL_RADIUS - 4, (BOWL_RADIUS - 4) * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = data.color;
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }

  drawParticles(currentTime: number) {
    for (const p of this.kitchen.particles) {
      const alpha = Math.min(p.life / p.maxLife, 1);
      
      if (p.type === 'flame') {
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient.addColorStop(0.4, p.color.startsWith('#FFFF') 
          ? `rgba(255, 255, 150, ${alpha * 0.8})` 
          : p.color.startsWith('#FFA5') 
            ? `rgba(255, 165, 0, ${alpha * 0.8})`
            : `rgba(255, 69, 0, ${alpha * 0.8})`);
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      } else if (p.type === 'spark') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 150, ${alpha * 0.3})`;
        this.ctx.fill();
      } else if (p.type === 'smoke') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(105, 105, 105, ${alpha * 0.3})`;
        this.ctx.fill();
      } else if (p.type === 'gold') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.9})`;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3})`;
        this.ctx.fill();
      }
    }
  }

  drawFlyingDishes(currentTime: number) {
    for (const stove of this.kitchen.stoves) {
      if (!stove.flyingDish) continue;
      const fd = stove.flyingDish;
      const elapsed = currentTime - fd.startTime;
      const t = Math.min(elapsed / fd.duration, 1);
      
      const x = fd.startX + (fd.targetX - fd.startX) * t;
      const parabola = -4 * fd.arcHeight * t * (t - 1);
      const y = fd.startY + (fd.targetY - fd.startY) * t - parabola;
      
      this.drawDishPlate(x, y, fd.ingredient, fd.score, currentTime, true);
    }
  }

  drawCompletedDishes(currentTime: number) {
    for (const dish of this.kitchen.completedDishes) {
      this.drawDishPlate(dish.x, dish.y, dish.ingredient, dish.score, currentTime, false);
    }
  }

  drawDishPlate(x: number, y: number, ingredient: IngredientType, score: number, currentTime: number, isFlying: boolean) {
    const data = INGREDIENTS_DATA[ingredient];
    const scale = isFlying ? 0.8 + 0.2 * Math.sin(currentTime * 0.01) : 1;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    this.ctx.beginPath();
    this.ctx.ellipse(0, 5, PLATE_RADIUS, PLATE_RADIUS * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, PLATE_RADIUS, 0, Math.PI * 2);
    const plateGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, PLATE_RADIUS);
    plateGradient.addColorStop(0, '#FFFFFF');
    plateGradient.addColorStop(0.7, '#F5F5F5');
    plateGradient.addColorStop(1, '#E8E8E8');
    this.ctx.fillStyle = plateGradient;
    this.ctx.fill();

    this.ctx.strokeStyle = '#4169E1';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, PLATE_RADIUS - 3, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, PLATE_RADIUS * 0.6, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(65,105,225,0.5)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.cos(angle) * PLATE_RADIUS * 0.82;
      const py = Math.sin(angle) * PLATE_RADIUS * 0.82;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#4169E1';
      this.ctx.fill();
    }

    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, PLATE_RADIUS - 15, (PLATE_RADIUS - 15) * 0.45, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = data.color;
    this.ctx.fill();

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const gx = Math.cos(angle) * (PLATE_RADIUS - 20);
      const gy = Math.sin(angle) * (PLATE_RADIUS - 20) * 0.4;
      this.ctx.beginPath();
      this.ctx.arc(gx, gy, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#228B22';
      this.ctx.fill();
    }

    this.ctx.restore();

    if (!isFlying) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 18px KaiTi, 楷体, STKaiti, serif';
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(`${score}分`, x, y - PLATE_RADIUS - 10);
      this.ctx.fillText(`${score}分`, x, y - PLATE_RADIUS - 10);
    }
  }

  drawScorePopups(currentTime: number) {
    for (const popup of this.kitchen.scorePopups) {
      const elapsed = currentTime - popup.startTime;
      const t = elapsed / popup.duration;
      const alpha = 1 - t;
      const yOffset = -30 * t;
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 28px KaiTi, 楷体, STKaiti, serif';
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(`+${popup.score}分`, popup.x, popup.y + yOffset);
      this.ctx.fillText(`+${popup.score}分`, popup.x, popup.y + yOffset);
      this.ctx.restore();
    }
  }

  drawScore(currentTime: number) {
    const x = 30;
    const y = 50;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(this.kitchen.scoreScaleCurrent, this.kitchen.scoreScaleCurrent);
    this.ctx.translate(-x, -y);

    this.ctx.fillStyle = '#8B4513';
    this.ctx.font = 'bold 24px KaiTi, 楷体, STKaiti, serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`御膳得分：${this.kitchen.totalScore}`, x, y);

    this.ctx.restore();
  }

  drawDataPanel(currentTime: number) {
    const panelH = 80;
    const panelY = this.kitchen.height - panelH - 10;

    this.ctx.fillStyle = '#00000080';
    this.roundRect(20, panelY, this.kitchen.width - 40, panelH, 10);
    this.ctx.fill();

    const sectionW = (this.kitchen.width - 80) / 3;

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px KaiTi, 楷体, STKaiti, serif';
    this.ctx.textAlign = 'left';

    const x1 = 60;
    this.ctx.fillText('烹饪中：', x1, panelY + 35);
    this.drawStoveIcon(x1 + 90, panelY + 25, 20, 20);
    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = '#FFA500';
    this.ctx.fillText(`${this.kitchen.dataPanel.cookingCount}`, x1 + 120, panelY + 38);

    const x2 = 60 + sectionW;
    this.ctx.font = '16px KaiTi, 楷体, STKaiti, serif';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('平均评分：', x2, panelY + 35);
    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillText(`${this.kitchen.dataPanel.avgScore}`, x2 + 110, panelY + 38);

    const x3 = 60 + sectionW * 2;
    this.ctx.font = '16px KaiTi, 楷体, STKaiti, serif';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('连击数：', x3, panelY + 35);
    this.drawFireIcon(x3 + 90, panelY + 25, 20, 20);
    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = '#FF4500';
    this.ctx.fillText(`${this.kitchen.dataPanel.highScoreStreak}`, x3 + 120, panelY + 38);

    const tipX = this.kitchen.width / 2;
    this.ctx.font = '13px KaiTi, 楷体, STKaiti, serif';
    this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('拖拽食材到炉灶开始烹饪 | 点击炉灶调节火力 | 时间越接近理想时间得分越高', tipX, panelY + 65);
  }

  drawStoveIcon(x: number, y: number, w: number, h: number) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2;

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fillStyle = '#2F4F4F';
    this.ctx.fill();

    const gradient = this.ctx.createRadialGradient(cx, cy + 2, 0, cx, cy, r - 3);
    gradient.addColorStop(0, '#FFFF00');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF4500');

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawFireIcon(x: number, y: number, w: number, h: number) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - h / 2);
    this.ctx.bezierCurveTo(
      cx + w / 2, cy - h / 4,
      cx + w / 3, cy + h / 2,
      cx, cy + h / 2
    );
    this.ctx.bezierCurveTo(
      cx - w / 3, cy + h / 2,
      cx - w / 2, cy - h / 4,
      cx, cy - h / 2
    );
    
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, h / 2);
    gradient.addColorStop(0, '#FFFF00');
    gradient.addColorStop(0.6, '#FF6600');
    gradient.addColorStop(1, '#FF0000');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawComboEffect(currentTime: number) {
    if (!this.kitchen.comboActive) return;

    const elapsed = currentTime - this.kitchen.comboStartTime;
    const duration = 3000;
    const alpha = elapsed < 500 
      ? elapsed / 500 
      : elapsed > duration - 500 
        ? (duration - elapsed) / 500 
        : 1;

    if (alpha <= 0) return;

    const cx = this.kitchen.width / 2;
    const cy = 120;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 48px KaiTi, 楷体, STKaiti, serif';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 6;
    const pulse = 1 + Math.sin(elapsed * 0.01) * 0.1;
    this.ctx.translate(cx, cy);
    this.ctx.scale(pulse, pulse);
    this.ctx.strokeText('御膳连击！', 0, 0);
    this.ctx.fillText('御膳连击！', 0, 0);
    this.ctx.restore();
  }

  roundRect(x: number, y: number, w: number, h: number, r: number) {
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
  }
}
