import { GameState, Boomerang, Star, Meteor, BackgroundStar, CatchRing, AimState, Vector2 } from '../types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  clear(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0B0D2E');
    gradient.addColorStop(1, '#1A1A3A');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackgroundStars(stars: BackgroundStar[]): void {
    for (const star of stars) {
      const alpha = 0.5 + Math.sin(star.twinklePhase) * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  drawTrack(points: Vector2[]): void {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.strokeStyle = 'rgba(136, 204, 255, 0.3)';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y - 30);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y - 30);
    }
    this.ctx.strokeStyle = 'rgba(136, 204, 255, 0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y + 30);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y + 30);
    }
    this.ctx.stroke();
  }

  drawStar(star: Star): void {
    if (star.collected) return;

    const pulse = 1 + Math.sin(star.pulsePhase) * 0.2;
    const radius = star.radius * pulse;

    const glow = this.ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, radius * 2
    );
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(star.x, star.y, radius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.save();
    this.ctx.translate(star.x, star.y);
    this.ctx.rotate(star.pulsePhase * 0.5);

    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
      
      if (i === 0) {
        this.ctx.moveTo(
          Math.cos(outerAngle) * radius,
          Math.sin(outerAngle) * radius
        );
      } else {
        this.ctx.lineTo(
          Math.cos(outerAngle) * radius,
          Math.sin(outerAngle) * radius
        );
      }
      this.ctx.lineTo(
        Math.cos(innerAngle) * radius * 0.5,
        Math.sin(innerAngle) * radius * 0.5
      );
    }
    this.ctx.closePath();
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFA500';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawMeteor(meteor: Meteor): void {
    this.ctx.save();
    this.ctx.translate(meteor.x, meteor.y);
    this.ctx.rotate(meteor.rotation);

    this.ctx.beginPath();
    for (let i = 0; i < meteor.vertices.length; i++) {
      const v = meteor.vertices[i];
      if (i === 0) {
        this.ctx.moveTo(v.x, v.y);
      } else {
        this.ctx.lineTo(v.x, v.y);
      }
    }
    this.ctx.closePath();

    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.radius);
    gradient.addColorStop(0, '#6A6A6A');
    gradient.addColorStop(1, '#4A4A4A');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.strokeStyle = '#3A3A3A';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(-meteor.radius * 0.3, -meteor.radius * 0.2, meteor.radius * 0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#3A3A3A';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(meteor.radius * 0.2, meteor.radius * 0.3, meteor.radius * 0.15, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawBoomerang(boomerang: Boomerang): void {
    if (boomerang.trail.length > 1) {
      for (let i = 0; i < boomerang.trail.length - 1; i++) {
        const alpha = (i / boomerang.trail.length) * 0.6;
        const p1 = boomerang.trail[i];
        const p2 = boomerang.trail[i + 1];
        
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 4 * (i / boomerang.trail.length);
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }
    }

    this.ctx.save();
    this.ctx.translate(boomerang.position.x, boomerang.position.y);
    this.ctx.rotate(boomerang.angle);
    this.ctx.scale(boomerang.scale, boomerang.scale);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.quadraticCurveTo(15, -20, 30, -5);
    this.ctx.quadraticCurveTo(10, 0, 0, 0);
    this.ctx.moveTo(0, 0);
    this.ctx.quadraticCurveTo(-20, -15, -25, 10);
    this.ctx.quadraticCurveTo(-10, 5, 0, 0);

    const gradient = this.ctx.createLinearGradient(-25, -20, 30, 10);
    gradient.addColorStop(0, '#E8E8E8');
    gradient.addColorStop(0.5, '#C0C0C0');
    gradient.addColorStop(1, '#A0A0A0');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.strokeStyle = '#909090';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(20, -3);
    this.ctx.lineTo(28, -6);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCatchRings(rings: CatchRing[]): void {
    for (const ring of rings) {
      this.ctx.beginPath();
      this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity})`;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
  }

  drawAimLine(aim: AimState): void {
    if (!aim.isAiming) return;

    const dx = aim.startX - aim.currentX;
    const dy = aim.startY - aim.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 100;
    const power = Math.min(distance / maxDistance, 1);

    this.ctx.beginPath();
    this.ctx.moveTo(aim.startX, aim.startY);
    this.ctx.lineTo(aim.currentX, aim.currentY);
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + power * 0.5})`;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    const angle = Math.atan2(dy, dx);
    const predictX = aim.startX + Math.cos(angle) * (50 + power * 150);
    const predictY = aim.startY + Math.sin(angle) * (50 + power * 150);

    this.ctx.beginPath();
    this.ctx.arc(predictX, predictY, 5 + power * 5, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + power * 0.5})`;
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`力度: ${Math.round(power * 100)}%`, aim.startX, aim.startY - 30);
  }

  drawHUD(state: GameState): void {
    const padding = 20;
    const boxWidth = 180;
    const boxHeight = 90;
    const x = this.canvas.width - boxWidth - padding;
    const y = padding;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, boxWidth, boxHeight, 12);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText(`${state.score}`, x + boxWidth - 15, y + 40);
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`等级 ${state.level}`, x + boxWidth - 15, y + 65);

    if (state.comboBonusActive) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(`连击x2  ${Math.ceil(state.comboBonusTimer / 1000)}s`, x + boxWidth - 15, y + 85);
    }

    const leftBoxWidth = 150;
    const leftBoxHeight = 60;
    const leftX = padding;
    const leftY = this.canvas.height - leftBoxHeight - padding;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(leftX, leftY, leftBoxWidth, leftBoxHeight, 12);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('投掷次数', leftX + 15, leftY + 25);

    for (let i = 0; i < state.maxThrows; i++) {
      const dotX = leftX + 20 + i * 22;
      const dotY = leftY + 42;
      
      if (i < state.throwCount) {
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    const recoveryProgress = state.throwRecoveryTimer / 30000;
    if (state.throwCount < state.maxThrows) {
      const nextDotIndex = state.throwCount;
      const dotX = leftX + 20 + nextDotIndex * 22;
      const dotY = leftY + 42;
      
      this.ctx.beginPath();
      this.ctx.arc(dotX, dotY, 10, -Math.PI / 2, -Math.PI / 2 + recoveryProgress * Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(136, 204, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    if (state.comboBonusActive) {
      const borderGlow = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      this.ctx.strokeStyle = `rgba(255, 215, 0, ${borderGlow})`;
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
    }
  }

  drawGameOver(state: GameState, onRestart: () => void): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cardWidth = 400;
    const cardHeight = 320;
    const cardX = (this.canvas.width - cardWidth) / 2;
    const cardY = (this.canvas.height - cardHeight) / 2;

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 20);
    this.ctx.fill();

    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.canvas.width / 2, cardY + 55);

    this.ctx.fillStyle = '#666666';
    this.ctx.font = '18px Arial';
    this.ctx.fillText('最终得分', this.canvas.width / 2, cardY + 100);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillText(`${state.score}`, this.canvas.width / 2, cardY + 155);

    this.ctx.fillStyle = '#666666';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`最高连击: ${state.maxCombo}`, this.canvas.width / 2, cardY + 195);

    this.ctx.fillText(`到达等级: ${state.level}`, this.canvas.width / 2, cardY + 220);

    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = (this.canvas.width - buttonWidth) / 2;
    const buttonY = cardY + cardHeight - 70;

    const buttonGradient = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    buttonGradient.addColorStop(0, '#4CAF50');
    buttonGradient.addColorStop(1, '#388E3C');
    this.ctx.fillStyle = buttonGradient;
    this.ctx.beginPath();
    this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 25);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('再来一局', this.canvas.width / 2, buttonY + buttonHeight / 2);
    this.ctx.textBaseline = 'alphabetic';

    (this.canvas as any)._restartButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      onClick: onRestart
    };
  }

  applyScreenShake(intensity: number): void {
    if (intensity > 0) {
      const shakeX = (Math.random() - 0.5) * 10 * intensity;
      const shakeY = (Math.random() - 0.5) * 10 * intensity;
      this.ctx.translate(shakeX, shakeY);
    }
  }

  resetTransform(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
