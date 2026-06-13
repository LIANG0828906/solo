import type { GameState, Player, Obstacle, Particle, GameConfig } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private buildings: { x: number; width: number; height: number; color: string }[] = [];
  private bgOffset: number = 0;
  private groundOffset: number = 0;
  private waveScrollOffset: number = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.generateBuildings();
    this.ctx.imageSmoothingEnabled = false;
  }

  private generateBuildings(): void {
    this.buildings = [];
    let x = 0;
    while (x < this.config.canvasWidth * 2) {
      const width = 30 + Math.random() * 50;
      const height = 60 + Math.random() * 150;
      const gray = 30 + Math.floor(Math.random() * 40);
      this.buildings.push({
        x,
        width,
        height,
        color: `rgb(${gray}, ${gray}, ${gray + 10})`
      });
      x += width + 5 + Math.random() * 20;
    }
  }

  render(
    state: GameState,
    player: Player,
    obstacles: Obstacle[],
    particles: Particle[]
  ): void {
    this.ctx.clearRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    this.drawBackground(state);
    this.drawBuildings(state);
    this.drawGround(state);
    this.drawObstacles(obstacles);
    this.drawPlayer(player);
    this.drawParticles(particles);
    this.drawHUD(state);
    this.drawWaveform(state);

    if (state.status === 'gameover') {
      this.drawGameOver(state);
    }

    if (state.status === 'idle') {
      this.drawStartScreen();
    }
  }

  private drawBackground(state: GameState): void {
    const progress = state.backgroundProgress;
    const startColor = this.hexToRgb('#87CEEB');
    const endColor = this.hexToRgb('#FF8C00');

    const r = Math.floor(startColor.r + (endColor.r - startColor.r) * progress);
    const g = Math.floor(startColor.g + (endColor.g - startColor.g) * progress);
    const b = Math.floor(startColor.b + (endColor.b - startColor.b) * progress);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.groundY);
    gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(1, `rgb(${Math.floor(r * 0.8)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.6)})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.groundY + 48);

    const sunY = 80 + progress * 150;
    const sunColor = progress > 0.5 ? '#FF6347' : '#FFD700';
    this.ctx.fillStyle = sunColor;
    this.ctx.beginPath();
    this.ctx.arc(500, sunY, 30, 0, Math.PI * 2);
    this.ctx.fill();

    if (progress > 0.3) {
      const alpha = (progress - 0.3) / 0.7;
      this.drawStar(100, 60, alpha * 0.5);
      this.drawStar(200, 40, alpha * 0.7);
      this.drawStar(350, 80, alpha * 0.4);
      this.drawStar(550, 30, alpha * 0.6);
      this.drawStar(420, 100, alpha * 0.3);
    }
  }

  private drawStar(x: number, y: number, alpha: number): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.fillRect(x, y, 2, 2);
    this.ctx.fillRect(x + 2, y + 2, 2, 2);
  }

  private drawBuildings(state: GameState): void {
    const speed = state.scrollSpeed * 0.3;
    this.bgOffset -= speed;

    const totalWidth = this.config.canvasWidth * 2;
    if (this.bgOffset < -totalWidth) {
      this.bgOffset += totalWidth;
    }

    for (let layer = 0; layer < 2; layer++) {
      const layerSpeed = layer === 0 ? 0.5 : 0.8;
      const offset = this.bgOffset * layerSpeed;

      for (const building of this.buildings) {
        let bx = building.x + offset + layer * totalWidth;
        while (bx < -building.width) {
          bx += totalWidth;
        }
        while (bx > this.config.canvasWidth) {
          bx -= totalWidth;
        }

        const darkFactor = layer === 0 ? 0.6 : 0.9;
        const baseGray = 20 + layer * 20;
        const color = `rgb(${Math.floor(baseGray * darkFactor)}, ${Math.floor(baseGray * darkFactor)}, ${Math.floor((baseGray + 10) * darkFactor)})`;

        this.ctx.fillStyle = color;
        const by = this.config.groundY - building.height * (0.5 + layer * 0.5) + 48;
        this.ctx.fillRect(Math.floor(bx), Math.floor(by), Math.floor(building.width), Math.floor(building.height * (0.5 + layer * 0.5)));

        this.ctx.fillStyle = '#FFE4B5';
        const windowSize = 3;
        const windowGap = 8;
        for (let wy = by + 8; wy < by + building.height * (0.5 + layer * 0.5) - 8; wy += windowGap) {
          for (let wx = bx + 4; wx < bx + building.width - 4; wx += windowGap) {
            if (Math.random() > 0.3) {
              this.ctx.fillRect(Math.floor(wx), Math.floor(wy), windowSize, windowSize);
            }
          }
        }
      }
    }
  }

  private drawGround(state: GameState): void {
    this.groundOffset -= state.scrollSpeed;
    if (this.groundOffset < -32) {
      this.groundOffset += 32;
    }

    this.ctx.fillStyle = '#3d5c3d';
    this.ctx.fillRect(0, this.config.groundY + 48, this.config.canvasWidth, 32);

    this.ctx.fillStyle = '#5a8a5a';
    for (let x = this.groundOffset; x < this.config.canvasWidth; x += 32) {
      this.ctx.fillRect(Math.floor(x), this.config.groundY + 48, 16, 4);
    }

    this.ctx.fillStyle = '#2d4a2d';
    for (let x = this.groundOffset + 8; x < this.config.canvasWidth; x += 32) {
      this.ctx.fillRect(Math.floor(x), this.config.groundY + 56, 12, 4);
    }
  }

  private drawObstacles(obstacles: Obstacle[]): void {
    for (const obs of obstacles) {
      switch (obs.type) {
        case 'box':
          this.drawBox(obs);
          break;
        case 'spike':
          this.drawSpike(obs);
          break;
        case 'barrier':
          this.drawBarrier(obs);
          break;
      }
    }
  }

  private drawBox(obs: Obstacle): void {
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = Math.floor(obs.width);
    const h = Math.floor(obs.height);

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x, y, w, h);

    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x + 2, y + 2, w - 4, 4);
    this.ctx.fillRect(x + 2, y + h - 6, w - 4, 4);

    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + h / 2);
    this.ctx.lineTo(x + w, y + h / 2);
    this.ctx.stroke();
  }

  private drawSpike(obs: Obstacle): void {
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = Math.floor(obs.width);
    const h = Math.floor(obs.height);

    this.ctx.fillStyle = '#708090';
    this.ctx.beginPath();
    this.ctx.moveTo(x + w / 2, y);
    this.ctx.lineTo(x + w, y + h);
    this.ctx.lineTo(x, y + h);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#A9A9A9';
    this.ctx.beginPath();
    this.ctx.moveTo(x + w / 2, y);
    this.ctx.lineTo(x + w / 2 + 3, y + h / 2);
    this.ctx.lineTo(x + w / 2 - 2, y + h / 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#505050';
    this.ctx.fillRect(x - 2, y + h - 4, w + 4, 6);
  }

  private drawBarrier(obs: Obstacle): void {
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = Math.floor(obs.width);
    const h = Math.floor(obs.height);

    this.ctx.fillStyle = '#FF6B35';
    this.ctx.fillRect(x, y, w, h);

    this.ctx.fillStyle = '#2C3E50';
    const stripeWidth = 8;
    for (let sx = 0; sx < w; sx += stripeWidth * 2) {
      this.ctx.fillRect(x + sx, y, stripeWidth, h);
    }

    this.ctx.fillStyle = '#1a252f';
    this.ctx.fillRect(x, y + h - 3, w, 3);
  }

  private drawPlayer(player: Player): void {
    const x = Math.floor(player.x);
    let y = Math.floor(player.y);
    let height = player.height;

    if (player.isCrouching) {
      height = player.height * 0.6;
      y = Math.floor(player.y + player.height - height);
    }

    if (player.isHurt) {
      const flash = Math.floor(player.hurtTimer * 20) % 2 === 0;
      if (!flash) {
        this.ctx.globalAlpha = 0.3;
      }
    }

    if (player.isDashing) {
      this.ctx.shadowColor = '#3498db';
      this.ctx.shadowBlur = 10;
    }

    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(x, y, player.width, height);

    this.ctx.fillStyle = '#F5CBA7';
    this.ctx.fillRect(x + 6, y + 4, 20, 16);

    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(x + 10, y + 8, 4, 4);
    this.ctx.fillRect(x + 18, y + 8, 4, 4);

    this.ctx.fillStyle = '#E74C3C';
    this.ctx.fillRect(x + 4, y + 20, 24, 20);

    if (!player.isCrouching) {
      const legOffset = player.isJumping ? 4 : Math.sin(player.animFrame * Math.PI / 2) * 4;
      this.ctx.fillStyle = '#2C3E50';
      this.ctx.fillRect(x + 6, y + height - 12, 8, 12 + legOffset);
      this.ctx.fillRect(x + 18, y + height - 12, 8, 12 - legOffset);
    }

    const armOffset = player.isJumping ? -4 : Math.sin(player.animFrame * Math.PI / 2) * 3;
    this.ctx.fillStyle = '#F5CBA7';
    this.ctx.fillRect(x - 2, y + 22 + armOffset, 6, 12);
    this.ctx.fillRect(x + player.width - 4, y + 22 - armOffset, 6, 12);

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  private drawParticles(particles: Particle[]): void {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(
        Math.floor(p.x - p.size / 2),
        Math.floor(p.y - p.size / 2),
        p.size,
        p.size
      );
    }
    this.ctx.globalAlpha = 1;
  }

  private drawHUD(state: GameState): void {
    this.ctx.font = 'bold 18px "Courier New", monospace';
    this.ctx.textBaseline = 'top';

    for (let i = 0; i < 3; i++) {
      const hx = 20 + i * 28;
      const hy = 20;
      if (i < state.lives) {
        this.drawHeart(hx, hy, '#e74c3c');
      } else {
        this.drawHeart(hx, hy, '#555555');
      }
    }

    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    const scoreText = `得分: ${state.score}`;
    this.ctx.strokeText(scoreText, 120, 22);
    this.ctx.fillText(scoreText, 120, 22);

    const volText = `音量: ${Math.floor(state.volume)}dB`;
    this.ctx.strokeText(volText, 280, 22);
    this.ctx.fillText(volText, 280, 22);
  }

  private drawHeart(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;

    this.ctx.fillRect(x + 4, y + 2, 6, 2);
    this.ctx.fillRect(x + 14, y + 2, 6, 2);
    this.ctx.fillRect(x + 2, y + 4, 22, 6);
    this.ctx.fillRect(x + 4, y + 10, 18, 4);
    this.ctx.fillRect(x + 6, y + 14, 14, 4);
    this.ctx.fillRect(x + 8, y + 18, 10, 2);
    this.ctx.fillRect(x + 10, y + 20, 6, 2);
    this.ctx.fillRect(x + 12, y + 22, 2, 2);

    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.fillRect(x + 4, y + 4, 4, 2);
  }

  private drawWaveform(state: GameState): void {
    const waveX = 20;
    const waveY = this.config.canvasHeight - 60;
    const waveWidth = 200;
    const waveHeight = 30;
    const padding = 4;

    this.waveScrollOffset += 2;
    if (this.waveScrollOffset >= waveWidth) {
      this.waveScrollOffset = 0;
    }

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(waveX - 4, waveY - 8, waveWidth + 8, waveHeight + 42);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(waveX, waveY, waveWidth, waveHeight);

    const barWidth = 3;
    const barGap = 2;
    const totalBars = Math.floor(waveWidth / (barWidth + barGap));
    const dataLength = state.waveData.length;

    for (let i = 0; i < totalBars; i++) {
      const scrollIdx = (i + Math.floor(this.waveScrollOffset / (barWidth + barGap))) % totalBars;
      const dataIdx = Math.floor((scrollIdx / totalBars) * dataLength);
      const value = (state.waveData[dataIdx] || 0) / 100;
      const barHeight = Math.max(2, value * waveHeight);
      const barX = waveX + i * (barWidth + barGap);
      const barY = waveY + waveHeight - barHeight;

      const progress = value;
      let color: string;
      if (progress < 0.33) {
        color = '#00ff88';
      } else if (progress < 0.66) {
        const t = (progress - 0.33) / 0.33;
        const r = Math.floor(0 + (136 - 0) * t);
        const g = Math.floor(255);
        const b = Math.floor(136 + (0 - 136) * t);
        color = `rgb(${r}, ${g}, ${b})`;
      } else {
        const t = (progress - 0.66) / 0.34;
        const r = Math.floor(136 + (255 - 136) * t);
        const g = Math.floor(255 + (136 - 255) * t);
        color = `rgb(${r}, ${g}, 0)`;
      }

      this.ctx.fillStyle = color;
      this.ctx.fillRect(Math.floor(barX), Math.floor(barY), barWidth, Math.ceil(barHeight));

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(Math.floor(barX), Math.floor(barY), barWidth, 1);
    }

    const currentVol = state.volume / 100;
    const needleX = waveX + currentVol * waveWidth;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(needleX, waveY);
    this.ctx.lineTo(needleX, waveY + waveHeight);
    this.ctx.stroke();
    this.ctx.lineWidth = 1;

    const confY = waveY + waveHeight + 8;

    this.ctx.font = 'bold 12px "Courier New", monospace';
    this.ctx.fillStyle = '#ffffff';
    const confPercent = Math.floor(state.confidence * 100);
    const confText = `置信度: ${confPercent}%`;
    this.ctx.fillText(confText, waveX, confY);

    const thresholdX = waveX + this.config.confidenceThreshold * waveWidth;

    const confBarX = waveX;
    const confBarY = confY + 16;
    const confBarWidth = waveWidth;
    const confBarHeight = 6;

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(confBarX, confBarY, confBarWidth, confBarHeight);

    const confProgress = state.confidence * confBarWidth;
    let confColor: string;
    if (state.confidence >= this.config.confidenceThreshold) {
      confColor = '#00ff88';
    } else if (state.confidence >= 0.5) {
      confColor = '#ffcc00';
    } else {
      confColor = '#ff4444';
    }

    const confGradient = this.ctx.createLinearGradient(confBarX, confBarY, confBarX + confProgress, confBarY);
    confGradient.addColorStop(0, confColor);
    confGradient.addColorStop(1, state.confidence >= 0.5 ? '#ffaa00' : '#ff6644');
    this.ctx.fillStyle = confGradient;
    this.ctx.fillRect(confBarX, confBarY, confProgress, confBarHeight);

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    this.ctx.beginPath();
    this.ctx.moveTo(thresholdX, confBarY - 2);
    this.ctx.lineTo(thresholdX, confBarY + confBarHeight + 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.font = '10px "Courier New", monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText('80%', thresholdX + 2, confBarY - 4);
  }

  private drawStartScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.fillStyle = '#f39c12';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('语音跑酷', this.config.canvasWidth / 2, 120);

    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Voice Runner', this.config.canvasWidth / 2, 160);

    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillStyle = '#cccccc';
    const lines = [
      '点击下方麦克风按钮开始游戏',
      '',
      '🎤 用声音控制角色',
      '🔊 音量越大，跳得越高',
      '🗣️ 说"跳"/"jump"跳跃',
      '🗣️ 说"蹲"/"crouch"蹲伏',
      '🗣️ 说"冲"/"dash"冲刺'
    ];

    lines.forEach((line, i) => {
      this.ctx.fillText(line, this.config.canvasWidth / 2, 220 + i * 24);
    });

    this.ctx.textAlign = 'left';
  }

  private drawGameOver(state: GameState): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    this.ctx.font = 'bold 40px "Courier New", monospace';
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.config.canvasWidth / 2, 140);

    this.ctx.font = 'bold 24px "Courier New", monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`最终得分: ${state.score}`, this.config.canvasWidth / 2, 200);

    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillStyle = '#f39c12';
    this.ctx.fillText('点击"重新开始"按钮再试一次', this.config.canvasWidth / 2, 250);

    const btnX = this.config.canvasWidth / 2 - 60;
    const btnY = 300;
    const btnW = 120;
    const btnH = 40;

    const gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    gradient.addColorStop(0, '#e67e22');
    gradient.addColorStop(1, '#d35400');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.roundRect(btnX, btnY, btnW, btnH, 8);
    this.ctx.fill();

    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('重新开始', this.config.canvasWidth / 2, btnY + 13);

    this.ctx.textAlign = 'left';
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  }

  isPointInRestartButton(x: number, y: number): boolean {
    const btnX = this.config.canvasWidth / 2 - 60;
    const btnY = 300;
    const btnW = 120;
    const btnH = 40;
    return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH;
  }
}
