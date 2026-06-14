import { Customer, MaterialBottle, Cauldron, Potion, Particle, GoldFlyEffect, MATERIAL_COLORS, PourEffect } from './entities';
import { Rect } from './gameState';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground(): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawHeader(title: string, gold: number, level: number, goldScale: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, 60);

    this.ctx.save();
    this.ctx.font = 'bold 24px system-ui, sans-serif';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText(title, this.canvas.width / 2 - 100, 30);
    this.ctx.restore();

    this.ctx.save();
    const goldX = this.canvas.width / 2 + 100;
    const goldY = 30;
    
    this.ctx.translate(goldX, goldY);
    this.ctx.scale(goldScale, goldScale);
    this.ctx.translate(-goldX, -goldY);
    
    this.ctx.beginPath();
    this.ctx.arc(goldX, goldY, 12, 0, Math.PI * 2);
    const goldGradient = this.ctx.createRadialGradient(goldX - 3, goldY - 3, 0, goldX, goldY, 12);
    goldGradient.addColorStop(0, '#fef3c7');
    goldGradient.addColorStop(0.5, '#fbbf24');
    goldGradient.addColorStop(1, '#d97706');
    this.ctx.fillStyle = goldGradient;
    this.ctx.fill();
    this.ctx.strokeStyle = '#92400e';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.font = 'bold 16px system-ui, sans-serif';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`: ${gold}`, goldX + 18, goldY);
    this.ctx.restore();

    this.ctx.font = '14px system-ui, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`等级 ${level}`, this.canvas.width - 20, 30);
  }

  drawArea(area: Rect, label: string): void {
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    this.ctx.lineWidth = 1;
    
    this.roundRect(area.x, area.y, area.width, area.height, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = '12px system-ui, sans-serif';
    this.ctx.fillStyle = '#64748b';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(label, area.x + 12, area.y + 10);
  }

  drawCustomerArea(customers: Customer[], area: Rect): void {
    this.drawArea(area, '顾客队列');
    customers.forEach(customer => {
      this.drawPixelCharacter(customer);
      if (customer.state === 'waiting' || customer.state === 'angry') {
        this.drawOrderBubble(customer);
        this.drawWaitProgress(customer);
      }
      if (customer.state === 'angry' && customer.angerEmojiTimer > 0) {
        this.drawAngerEmoji(customer);
      }
    });
  }

  drawPixelCharacter(customer: Customer): void {
    const x = customer.position.x;
    const y = customer.position.y;
    const size = 32;
    const pixel = size / 8;
    const color = customer.getDisplayColor();

    this.ctx.save();

    this.ctx.fillStyle = color;
    this.fillRect(x - size / 2 + pixel * 2, y - size / 2, pixel * 4, pixel * 2);
    this.fillRect(x - size / 2 + pixel, y - size / 2 + pixel * 2, pixel * 6, pixel * 3);
    this.fillRect(x - size / 2 + pixel * 2, y - size / 2 + pixel * 5, pixel * 4, pixel * 3);

    this.ctx.fillStyle = '#0f172a';
    this.fillRect(x - size / 2 + pixel * 2.5, y - size / 2 + pixel * 3, pixel, pixel);
    this.fillRect(x - size / 2 + pixel * 4.5, y - size / 2 + pixel * 3, pixel, pixel);

    if (customer.state === 'angry') {
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x - size / 2 + pixel * 2, y - size / 2 + pixel * 2.5);
      this.ctx.lineTo(x - size / 2 + pixel * 3.5, y - size / 2 + pixel * 3);
      this.ctx.moveTo(x - size / 2 + pixel * 4.5, y - size / 2 + pixel * 3);
      this.ctx.lineTo(x - size / 2 + pixel * 6, y - size / 2 + pixel * 2.5);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawOrderBubble(customer: Customer): void {
    const x = customer.position.x;
    const y = customer.position.y - 75;
    const paddingX = 12;
    const borderRadius = 12;

    const MATERIAL_NAMES: Record<string, string> = {
      fire: '红药水',
      nature: '绿药水',
      water: '蓝药水',
      earth: '黄药水'
    };

    const ingredientCounts: Map<string, number> = new Map();
    customer.order.ingredients.forEach(ing => {
      ingredientCounts.set(ing, (ingredientCounts.get(ing) || 0) + 1);
    });

    this.ctx.font = 'bold 12px system-ui, sans-serif';
    const titleMetrics = this.ctx.measureText(customer.order.name);
    const titleWidth = titleMetrics.width;

    this.ctx.font = '11px system-ui, sans-serif';
    let materialsRowWidth = 0;
    const materialEntries = Array.from(ingredientCounts.entries());
    materialEntries.forEach(([mat, count], idx) => {
      const label = `${MATERIAL_NAMES[mat]}×${count}`;
      const metrics = this.ctx.measureText(label);
      materialsRowWidth += metrics.width + 20;
      if (idx < materialEntries.length - 1) materialsRowWidth += 4;
    });

    const totalWidth = Math.max(titleWidth + paddingX * 2, materialsRowWidth + paddingX * 2);
    const bubbleHeight = 58;

    const bubbleX = x - totalWidth / 2;
    const bubbleY = y - bubbleHeight / 2;

    this.ctx.fillStyle = '#1e293b';
    this.roundRect(bubbleX, bubbleY, totalWidth, bubbleHeight, borderRadius);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    this.ctx.lineWidth = 1;
    this.roundRect(bubbleX, bubbleY, totalWidth, bubbleHeight, borderRadius);
    this.ctx.stroke();

    this.ctx.font = 'bold 13px system-ui, sans-serif';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(251, 191, 36, 0.3)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(customer.order.name, x, bubbleY + 16);
    this.ctx.shadowBlur = 0;

    const rowY = bubbleY + bubbleHeight - 20;
    let matX = x - materialsRowWidth / 2;

    this.ctx.font = '11px system-ui, sans-serif';
    this.ctx.textAlign = 'left';
    materialEntries.forEach(([mat, count]) => {
      const color = MATERIAL_COLORS[mat as keyof typeof MATERIAL_COLORS];
      const label = `${MATERIAL_NAMES[mat]}×${count}`;

      this.ctx.save();
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 5;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(matX + 7, rowY, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(matX + 5, rowY - 2, 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, matX + 18, rowY);

      const metrics = this.ctx.measureText(label);
      matX += metrics.width + 20 + 4;
    });

    this.ctx.beginPath();
    this.ctx.moveTo(x - 7, y + bubbleHeight / 2);
    this.ctx.lineTo(x + 7, y + bubbleHeight / 2);
    this.ctx.lineTo(x, y + bubbleHeight / 2 + 10);
    this.ctx.closePath();
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawWaitProgress(customer: Customer): void {
    const x = customer.position.x - 20;
    const y = customer.position.y + 25;
    const width = 40;
    const height = 4;
    const progress = customer.getWaitProgress();

    this.ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
    this.roundRect(x, y, width, height, 2);
    this.ctx.fill();

    const barColor = progress > 0.7 ? '#ef4444' : progress > 0.4 ? '#fbbf24' : '#22c55e';
    this.ctx.fillStyle = barColor;
    this.roundRect(x, y, width * (1 - progress), height, 2);
    this.ctx.fill();
  }

  drawAngerEmoji(customer: Customer): void {
    const x = customer.position.x;
    const y = customer.position.y - 90;
    const alpha = Math.min(1, customer.angerEmojiTimer / 0.5);
    
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.font = 'bold 24px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('😠', x, y);
    this.ctx.restore();
  }

  drawCabinetArea(bottles: MaterialBottle[], area: Rect): void {
    this.drawArea(area, '药柜');
    
    const cols = 4;
    const rows = 3;
    const cellWidth = area.width / cols;
    const cellHeight = (area.height - 40) / rows;

    bottles.forEach(bottle => {
      const col = bottle.gridIndex.col;
      const row = bottle.gridIndex.row;
      const baseX = area.x + cellWidth * (col + 0.5);
      const baseY = area.y + 40 + cellHeight * (row + 0.5);

      if (!bottle.isDragging && !bottle.isSelected) {
        bottle.position.x = baseX;
        bottle.position.y = baseY;
        bottle.originalPosition = { x: baseX, y: baseY };
      }

      this.drawMaterialBottle(bottle);
    });
  }

  drawMaterialBottle(bottle: MaterialBottle): void {
    const x = bottle.position.x;
    const y = bottle.position.y;
    const width = 24;
    const height = 40;

    this.ctx.save();

    if (bottle.glowRadius > 0) {
      const gradient = this.ctx.createRadialGradient(x, y + height / 2, 0, x, y + height / 2, bottle.glowRadius);
      gradient.addColorStop(0, 'rgba(248, 250, 252, 0.47)');
      gradient.addColorStop(1, 'rgba(248, 250, 252, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y + height / 2, bottle.glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = bottle.color;
    this.roundRect(x - width / 2, y - height / 2 + 8, width, height - 8, 4);
    this.ctx.fill();

    this.ctx.fillStyle = '#334155';
    this.roundRect(x - width / 3, y - height / 2, width * 2 / 3, 12, 2);
    this.ctx.fill();

    const highlightGradient = this.ctx.createLinearGradient(x - width / 2 + 2, y, x - width / 2 + 6, y);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = highlightGradient;
    this.roundRect(x - width / 2 + 2, y - height / 2 + 12, 4, height - 16, 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawCauldronArea(cauldron: Cauldron, potion: Potion | null, area: Rect, currentRecipeStep: number, totalSteps: number): void {
    this.drawArea(area, '坩埚');

    cauldron.position.x = area.x + area.width / 2;
    cauldron.position.y = area.y + area.height / 2 + 30;
    cauldron.size.width = Math.min(180, area.width * 0.6);
    cauldron.size.height = Math.min(120, area.height * 0.4);

    if (cauldron.smokeParticles) {
      this.drawParticles(cauldron.smokeParticles);
    }
    if (cauldron.pourEffects) {
      cauldron.pourEffects.forEach(pourEffect => {
        this.drawLiquidPourEffect(pourEffect);
      });
    }
    this.drawCauldron(cauldron);
    if (cauldron.pourEffects) {
      cauldron.pourEffects.forEach(pourEffect => {
        if (pourEffect.splashParticles) {
          this.drawParticles(pourEffect.splashParticles);
        }
      });
    }

    if (totalSteps > 0) {
      this.drawRecipeProgress(area, currentRecipeStep, totalSteps);
    }

    if (potion && !potion.isFlying) {
      this.drawPotionBottle(potion);
    }
  }

  drawCauldron(cauldron: Cauldron): void {
    const x = cauldron.position.x;
    const y = cauldron.position.y;
    const w = Math.max(60, cauldron.size.width);
    const h = Math.max(40, cauldron.size.height);

    this.ctx.save();

    const outerRx = Math.max(2, w / 2);
    const outerRy = Math.max(2, h / 2);
    const rimY = y + 5;
    const rimRy = Math.max(2, 10);

    this.ctx.fillStyle = '#334155';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, outerRx, outerRy, 0, 0, Math.PI, true);
    this.ctx.lineTo(x + outerRx, rimY);
    this.ctx.ellipse(x, rimY, outerRx, rimRy, 0, 0, Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    const innerRx = Math.max(2, w / 2 - 8);
    const innerRy = Math.max(2, h / 2 - 5);
    const innerGradR = Math.max(2, w / 3);
    const innerGradient = this.ctx.createRadialGradient(x, y - h / 4, 0, x, y - h / 4, innerGradR);
    innerGradient.addColorStop(0, '#1e293b');
    innerGradient.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = innerGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, innerRx, innerRy, 0, 0, Math.PI, true);
    this.ctx.closePath();
    this.ctx.fill();

    if (cauldron.ingredients.length > 0) {
      const liquidColor = this.mixLiquidColors(cauldron.ingredients);
      const liquidRx = Math.max(2, w / 2 - 12);
      const baseLiquidRy = Math.max(3, h / 4);
      const fillProgress = Math.min(cauldron.ingredients.length / 3, 1);
      const liquidRy = Math.max(2, baseLiquidRy + fillProgress * (h / 8));
      const liquidGradR = Math.max(2, w / 3);
      const liquidY = y - h / 6;
      const liquidGradient = this.ctx.createRadialGradient(x, liquidY, 0, x, liquidY, liquidGradR);
      liquidGradient.addColorStop(0, this.lightenColor(liquidColor, 20));
      liquidGradient.addColorStop(1, liquidColor);
      this.ctx.fillStyle = liquidGradient;
      this.ctx.globalAlpha = 0.8;
      this.ctx.beginPath();
      this.ctx.ellipse(x, liquidY, liquidRx, liquidRy, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }

    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, outerRx, outerRy, 0, 0, Math.PI, true);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawLiquidPourEffect(pourEffect: PourEffect): void {
    if (pourEffect.liquidTrail.length < 2) return;

    this.ctx.save();

    for (let i = 1; i < pourEffect.liquidTrail.length; i++) {
      const prev = pourEffect.liquidTrail[i - 1];
      const curr = pourEffect.liquidTrail[i];
      const alpha = (i / pourEffect.liquidTrail.length) * 0.9;

      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = pourEffect.color;
      this.ctx.lineWidth = curr.r;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(prev.x, prev.y);
      this.ctx.lineTo(curr.x, curr.y);
      this.ctx.stroke();

      this.ctx.fillStyle = pourEffect.color;
      this.ctx.globalAlpha = alpha * 0.7;
      this.ctx.beginPath();
      this.ctx.arc(curr.x, curr.y, curr.r * 0.7, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (pourEffect.liquidTrail.length > 0) {
      const last = pourEffect.liquidTrail[pourEffect.liquidTrail.length - 1];
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = pourEffect.color;
      this.ctx.shadowColor = pourEffect.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(last.x, last.y, last.r * 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawRecipeProgress(area: Rect, current: number, total: number): void {
    const x = area.x + area.width / 2;
    const y = area.y + 35;

    this.ctx.font = '12px system-ui, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`配方进度: ${current}/${total}`, x, y);

    const barWidth = 100;
    const barHeight = 6;
    const barX = x - barWidth / 2;
    const barY = y + 12;

    this.ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    this.roundRect(barX, barY, barWidth, barHeight, 3);
    this.ctx.fill();

    this.ctx.fillStyle = '#22c55e';
    this.roundRect(barX, barY, barWidth * (current / total), barHeight, 3);
    this.ctx.fill();
  }

  drawPotionBottle(potion: Potion): void {
    const x = potion.position.x;
    const y = potion.position.y;
    const width = 20;
    const height = 40;

    this.ctx.save();

    if (potion.isFlying) {
      this.ctx.shadowColor = potion.color;
      this.ctx.shadowBlur = 15;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(x - width / 2, y + height / 2);
    this.ctx.quadraticCurveTo(x - width / 2, y + height / 2 - 15, x - width / 3, y);
    this.ctx.lineTo(x - width / 3, y - height / 2 + 10);
    this.ctx.lineTo(x - width / 4, y - height / 2);
    this.ctx.lineTo(x + width / 4, y - height / 2);
    this.ctx.lineTo(x + width / 3, y - height / 2 + 10);
    this.ctx.lineTo(x + width / 3, y);
    this.ctx.quadraticCurveTo(x + width / 2, y + height / 2 - 15, x + width / 2, y + height / 2);
    this.ctx.closePath();
    
    const bottleGradient = this.ctx.createLinearGradient(x - width / 2, y, x + width / 2, y);
    bottleGradient.addColorStop(0, potion.color);
    bottleGradient.addColorStop(0.3, this.lightenColor(potion.color, 10));
    bottleGradient.addColorStop(0.7, potion.color);
    bottleGradient.addColorStop(1, this.darkenColor(potion.color, 20));
    this.ctx.fillStyle = bottleGradient;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = '#334155';
    this.roundRect(x - width / 4, y - height / 2 - 5, width / 2, 8, 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.roundRect(x - width / 3 + 2, y - 5, 3, height / 2 - 5, 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawParticles(particles: Particle[]): void {
    if (!particles) return;
    particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.getAlpha();
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.position.x, particle.position.y, Math.max(0.1, Math.abs(particle.size)), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawGoldFlyEffects(effects: GoldFlyEffect[]): void {
    effects.forEach(effect => {
      const pos = effect.getPosition();
      const scale = effect.getScale();

      this.ctx.save();
      this.ctx.translate(pos.x, pos.y);
      this.ctx.scale(scale, scale);
      this.ctx.translate(-pos.x, -pos.y);

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(pos.x - 2, pos.y - 2, 0, pos.x, pos.y, 10);
      gradient.addColorStop(0, '#fef3c7');
      gradient.addColorStop(0.5, '#fbbf24');
      gradient.addColorStop(1, '#d97706');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.strokeStyle = '#92400e';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = 'bold 12px system-ui, sans-serif';
      this.ctx.fillStyle = '#fef3c7';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`+${effect.amount}`, pos.x, pos.y - 20);

      this.ctx.restore();
    });
  }

  drawUpgradeModal(show: boolean, level: number, scale: number): void {
    if (scale <= 0) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const modalWidth = 320;
    const modalHeight = 200;

    this.ctx.save();

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-centerX, -centerY);

    this.ctx.fillStyle = '#1e293b';
    this.ctx.strokeStyle = '#fbbf24';
    this.ctx.lineWidth = 1;
    this.roundRect(centerX - modalWidth / 2, centerY - modalHeight / 2, modalWidth, modalHeight, 16);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 20px system-ui, sans-serif';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🎉 店铺升级!', centerX, centerY - 50);

    this.ctx.font = '16px system-ui, sans-serif';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`恭喜升级到 ${level} 级`, centerX, centerY - 10);
    this.ctx.fillText('可接待更多顾客了!', centerX, centerY + 15);

    const buttonX = centerX - 40;
    const buttonY = centerY + 50;
    const buttonWidth = 80;
    const buttonHeight = 32;

    this.ctx.fillStyle = '#ef4444';
    this.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
    this.ctx.fill();

    this.ctx.font = '14px system-ui, sans-serif';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('确定', centerX, buttonY + buttonHeight / 2);

    this.ctx.restore();

    if (show) {
      (window as any).__upgradeModalRect = {
        x: centerX - 40,
        y: centerY + 50,
        width: 80,
        height: 32
      };
    }
  }

  drawFlyingPotion(potion: Potion): void {
    if (potion.isFlying) {
      this.drawPotionBottle(potion);
    }
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private fillRect(x: number, y: number, w: number, h: number): void {
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  }

  private mixLiquidColors(ingredients: string[]): string {
    let r = 0, g = 0, b = 0;
    for (const ing of ingredients) {
      const hex = MATERIAL_COLORS[ing as keyof typeof MATERIAL_COLORS];
      r += parseInt(hex.slice(1, 3), 16);
      g += parseInt(hex.slice(3, 5), 16);
      b += parseInt(hex.slice(5, 7), 16);
    }
    r = Math.round(r / ingredients.length);
    g = Math.round(g / ingredients.length);
    b = Math.round(b / ingredients.length);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
}
