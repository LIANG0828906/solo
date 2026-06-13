import { EntityState, Player, Enemy, Bullet, Particle, Star, Explosion, BeatPulse } from './EntityManager';

export interface GameUIState {
  score: number;
  combo: number;
  syncRate: number;
  heatLevel: number;
  maxHeat: number;
  isOverheated: boolean;
  beatProgress: number;
  beatCount: number;
  beatsPerCycle: number;
  gameTime: number;
  gameDuration: number;
  showBeatIndicator: boolean;
  resultAnimationProgress: number;
  finalScore: number;
  finalSyncRate: number;
}

export type GameScene = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'gameOver' | 'victory';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private particleQuality: number = 1;
  private starTwinkleEnabled: boolean = true;
  private enemyDetailLevel: number = 2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setPerformanceLevel(fps: number): void {
    if (fps >= 55) {
      this.particleQuality = 1;
      this.starTwinkleEnabled = true;
      this.enemyDetailLevel = 2;
    } else if (fps >= 50) {
      this.particleQuality = 0.7;
      this.starTwinkleEnabled = true;
      this.enemyDetailLevel = 2;
    } else if (fps >= 40) {
      this.particleQuality = 0.5;
      this.starTwinkleEnabled = false;
      this.enemyDetailLevel = 1;
    } else if (fps >= 30) {
      this.particleQuality = 0.3;
      this.starTwinkleEnabled = false;
      this.enemyDetailLevel = 0;
    } else {
      this.particleQuality = 0.2;
      this.starTwinkleEnabled = false;
      this.enemyDetailLevel = 0;
    }
  }

  render(state: EntityState, uiState: GameUIState, scene: GameScene, levelInfo?: { name: string; bpm: number }): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawStars(state.stars);

    if (scene === 'menu') {
      this.drawMenuScene();
    } else if (scene === 'levelSelect') {
      this.drawLevelSelectScene();
    } else if (scene === 'playing' || scene === 'paused') {
      this.drawGameScene(state, uiState);
      
      if (scene === 'paused') {
        this.drawPauseOverlay();
      }
    } else if (scene === 'victory' || scene === 'gameOver') {
      this.drawGameScene(state, uiState);
      this.drawResultOverlay(scene === 'victory', uiState);
    }
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.6, '#302b63');
    gradient.addColorStop(1, '#24243e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawStars(stars: Star[]): void {
    for (const star of stars) {
      const alpha = this.starTwinkleEnabled ? star.alpha : star.baseAlpha;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawGameScene(state: EntityState, uiState: GameUIState): void {
    if (uiState.showBeatIndicator) {
      this.drawBeatPulses(state.beatPulses);
    }

    this.drawEnemies(state.enemies);
    this.drawBullets(state.bullets);
    this.drawPlayer(state.player, uiState.isOverheated);
    this.drawExplosions(state.explosions);
    this.drawParticles(state.particles);
    this.drawUI(uiState);
  }

  private drawPlayer(player: Player, isOverheated: boolean): void {
    const ctx = this.ctx;
    
    this.drawThrusterParticles(player.thrusterParticles);

    ctx.save();
    ctx.translate(player.x, player.y);

    const bodyGradient = ctx.createLinearGradient(-player.width / 2, 0, player.width / 2, 0);
    bodyGradient.addColorStop(0, '#3a7bd5');
    bodyGradient.addColorStop(1, '#00d2ff');

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(player.width / 2, 0);
    ctx.lineTo(-player.width / 2, -player.height / 2);
    ctx.lineTo(-player.width / 3, 0);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(player.width / 6, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isOverheated) {
      const flashSpeed = 10;
      const flashAlpha = Math.abs(Math.sin(performance.now() / 1000 * flashSpeed));
      ctx.fillStyle = `rgba(255, 71, 87, ${flashAlpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(player.width / 2, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawThrusterParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    
    for (const p of particles) {
      const stretch = 1.5;
      const particleWidth = p.size * stretch * 2;
      const particleHeight = p.size * 0.8;
      
      const gradient = ctx.createLinearGradient(
        p.x, p.y,
        p.x - particleWidth * 1.5, p.y
      );
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.5, this.interpolateColor(p.color, '#ffa502', 0.5));
      gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
      
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.9;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, particleWidth, particleHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private drawEnemies(enemies: Enemy[]): void {
    for (const enemy of enemies) {
      this.drawEnemy(enemy);
    }
  }

  private drawEnemy(enemy: Enemy): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    switch (enemy.type) {
      case 'diamond':
        this.drawDiamondEnemy(enemy);
        break;
      case 'circle':
        this.drawCircleEnemy(enemy);
        break;
      case 'triangle':
        this.drawTriangleEnemy(enemy);
        break;
    }

    if (this.enemyDetailLevel >= 1 && enemy.health < enemy.maxHealth) {
      const barWidth = enemy.radius * 2;
      const barHeight = 3;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(-barWidth / 2, -enemy.radius - 10, barWidth, barHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#2ed573' : healthPercent > 0.25 ? '#ffa502' : '#ff4757';
      ctx.fillRect(-barWidth / 2, -enemy.radius - 10, barWidth * healthPercent, barHeight);
    }

    ctx.restore();
  }

  private drawDiamondEnemy(enemy: Enemy): void {
    const ctx = this.ctx;
    const size = 10;
    
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.enemyDetailLevel >= 2) {
      ctx.fillStyle = 'rgba(255, 107, 129, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.lineTo(size * 0.4, 0);
      ctx.lineTo(0, size * 0.6);
      ctx.lineTo(-size * 0.4, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCircleEnemy(enemy: Enemy): void {
    const ctx = this.ctx;
    const radius = 12;
    
    const gradient = ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, 0,
      0, 0, radius
    );
    gradient.addColorStop(0, '#ffcc00');
    gradient.addColorStop(0.7, '#ffa502');
    gradient.addColorStop(1, '#ff8c00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.enemyDetailLevel >= 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 71, 87, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTriangleEnemy(enemy: Enemy): void {
    const ctx = this.ctx;
    const sideLength = 18;
    const radius = sideLength / 2;
    
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    ctx.moveTo(-radius, -radius * 0.866);
    ctx.lineTo(-radius, radius * 0.866);
    ctx.lineTo(radius, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.enemyDetailLevel >= 2) {
      ctx.fillStyle = 'rgba(123, 237, 159, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-radius * 0.7, -radius * 0.5);
      ctx.lineTo(-radius * 0.7, radius * 0.5);
      ctx.lineTo(radius * 0.3, 0);
      ctx.closePath();
      ctx.fill();

      const eyeAngle = Math.sin(performance.now() / 200) * 0.3;
      ctx.fillStyle = 'rgba(255, 71, 87, 0.9)';
      ctx.beginPath();
      ctx.arc(-radius * 0.3 + eyeAngle, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBullets(bullets: Bullet[]): void {
    for (const bullet of bullets) {
      this.drawBullet(bullet);
    }
  }

  private drawBullet(bullet: Bullet): void {
    const ctx = this.ctx;

    if (bullet.trail.length > 1) {
      ctx.strokeStyle = bullet.color;
      ctx.lineWidth = bullet.radius * 0.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
      
      for (let i = 1; i < bullet.trail.length; i++) {
        ctx.globalAlpha = 0.8 * (1 - i / bullet.trail.length);
        ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const gradient = ctx.createRadialGradient(
      bullet.x, bullet.y, 0,
      bullet.x, bullet.y, bullet.radius
    );
    
    if (bullet.isPerfect) {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#ffd700');
      gradient.addColorStop(1, '#ff8c00');
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#00d2ff');
      gradient.addColorStop(1, '#3a7bd5');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();

    if (bullet.isPerfect) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawParticles(particles: Particle[]): void {
    const count = Math.floor(particles.length * this.particleQuality);
    
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawExplosions(explosions: Explosion[]): void {
    for (const explosion of explosions) {
      this.drawExplosion(explosion);
    }
  }

  private drawExplosion(explosion: Explosion): void {
    const count = Math.floor(explosion.particles.length * this.particleQuality);
    
    for (let i = 0; i < count; i++) {
      const p = explosion.particles[i];
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }

  private drawBeatPulses(beatPulses: BeatPulse[]): void {
    for (const pulse of beatPulses) {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse.alpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(pulse.x, pulse.y, pulse.currentRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawUI(uiState: GameUIState): void {
    this.drawSyncIndicator(uiState.syncRate);
    this.drawScoreAndCombo(uiState.score, uiState.combo);
    this.drawHeatBar(uiState.heatLevel, uiState.maxHeat);
    this.drawBeatProgressBar(uiState.beatProgress, uiState.beatCount, uiState.beatsPerCycle);
  }

  private drawSyncIndicator(syncRate: number): void {
    const x = 50;
    const y = 50;
    const radius = 25;

    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI, 0);
    ctx.stroke();

    const progress = syncRate / 100;
    const color = this.getSyncColor(syncRate);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI, Math.PI + progress * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(syncRate)}%`, x, y + 5);

    ctx.fillStyle = '#aaa';
    ctx.font = '10px "Exo 2", sans-serif';
    ctx.fillText('同步率', x, y + 30);
  }

  private getSyncColor(syncRate: number): string {
    if (syncRate >= 80) return '#2ed573';
    if (syncRate >= 60) return '#ffa502';
    return '#ff4757';
  }

  private drawScoreAndCombo(score: number, combo: number): void {
    const ctx = this.ctx;
    const x = this.width - 30;
    const y = 30;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Exo 2", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${score}`, x, y);

    ctx.fillStyle = '#aaa';
    ctx.font = '12px "Exo 2", sans-serif';
    ctx.fillText('得分', x, y + 28);

    if (combo > 0) {
      let comboY = y + 55;
      let fontSize = 18;
      let color = '#00d2ff';
      
      if (combo > 10) {
        fontSize = Math.floor(18 * 1.2);
        color = '#ffd700';
        const shake = Math.sin(performance.now() / 50) * 2;
        comboY += shake;
      }

      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px "Exo 2", sans-serif`;
      ctx.fillText(`${combo} 连击`, x, comboY);
    }
  }

  private drawHeatBar(heatLevel: number, maxHeat: number): void {
    const ctx = this.ctx;
    const x = 15;
    const y = 75;
    const width = 200;
    const height = 10;

    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(x, y, width, height);

    const heatPercent = heatLevel / maxHeat;
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#2ed573');
    gradient.addColorStop(0.5, '#ffa502');
    gradient.addColorStop(1, '#ff4757');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width * heatPercent, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#aaa';
    ctx.font = '10px "Exo 2", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('武器热量', x, y + height + 5);
  }

  private drawBeatProgressBar(beatProgress: number, beatCount: number, beatsPerCycle: number): void {
    const ctx = this.ctx;
    const barWidth = this.width * 0.8;
    const x = (this.width - barWidth) / 2;
    const y = this.height - 30;
    const height = 8;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x, y, barWidth, height);

    const currentCycleBeat = beatCount % beatsPerCycle;
    const totalProgress = (currentCycleBeat + beatProgress) / beatsPerCycle;
    
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#2ed573');
    gradient.addColorStop(1, '#00d2ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * totalProgress, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= beatsPerCycle; i++) {
      const lineX = x + (barWidth * i) / beatsPerCycle;
      ctx.beginPath();
      ctx.moveTo(lineX, y - 2);
      ctx.lineTo(lineX, y + height + 2);
      ctx.stroke();
    }
  }

  private drawMenuScene(): void {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const gradient = ctx.createLinearGradient(centerX - 200, centerY - 50, centerX + 200, centerY + 50);
    gradient.addColorStop(0, '#00d2ff');
    gradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = gradient;
    ctx.fillText('RHYTHM SPACE', centerX, centerY - 80);
    
    ctx.font = 'bold 36px "Exo 2", sans-serif';
    ctx.fillText('SHOOTER', centerX, centerY - 30);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '18px "Spectral", serif';
    ctx.fillText('跟随节拍，征服星空', centerX, centerY + 20);

    const btnY = centerY + 80;
    const btnWidth = 200;
    const btnHeight = 50;

    ctx.fillStyle = 'rgba(58, 123, 213, 0.3)';
    ctx.strokeStyle = '#3a7bd5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - btnWidth / 2, btnY, btnWidth, btnHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Exo 2", sans-serif';
    ctx.fillText('开始游戏', centerX, btnY + btnHeight / 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Exo 2", sans-serif';
    ctx.fillText('WASD / 方向键 移动 | 空格 / J 射击', centerX, this.height - 50);
    ctx.fillText('按 Enter 开始', centerX, this.height - 30);
  }

  private drawLevelSelectScene(): void {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择关卡', centerX, centerY - 120);

    const levels = [
      { name: 'Neon Pulse', bpm: 120, difficulty: '简单', color: '#2ed573' },
      { name: 'Cyber Drift', bpm: 140, difficulty: '中等', color: '#ffa502' },
      { name: 'Quantum Rush', bpm: 170, difficulty: '困难', color: '#ff4757' }
    ];

    const cardWidth = 220;
    const cardHeight = 150;
    const gap = 40;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    levels.forEach((level, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = centerY;

      ctx.fillStyle = 'rgba(15, 12, 41, 0.9)';
      ctx.strokeStyle = level.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = level.color;
      ctx.font = 'bold 20px "Exo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(level.name, x, y - 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px "Exo 2", sans-serif';
      ctx.fillText(`${level.bpm} BPM`, x, y);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '14px "Exo 2", sans-serif';
      ctx.fillText(level.difficulty, x, y + 30);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px "Exo 2", sans-serif';
      ctx.fillText(`按 ${index + 1} 选择`, x, y + 55);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Exo 2", sans-serif';
    ctx.fillText('按 ESC 返回主菜单', centerX, this.height - 40);
  }

  private drawPauseOverlay(): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂停', centerX, centerY - 20);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '18px "Exo 2", sans-serif';
    ctx.fillText('按 ESC / P 继续', centerX, centerY + 30);
  }

  private drawResultOverlay(isVictory: boolean, uiState: GameUIState): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const cardWidth = 500;
    const cardHeight = 300;

    const gradient = ctx.createLinearGradient(
      centerX - cardWidth / 2, centerY - cardHeight / 2,
      centerX + cardWidth / 2, centerY + cardHeight / 2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');

    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.roundRect(centerX - cardWidth / 2, centerY - cardHeight / 2, cardWidth, cardHeight, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(58, 123, 213, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const titleText = isVictory ? '闯关成功！' : '游戏结束';
    const titleColor = isVictory ? '#ffd700' : '#ff4757';
    
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 32px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(titleText, centerX, centerY - cardHeight / 2 + 30);

    const progress = uiState.resultAnimationProgress;
    const easedProgress = this.easeOutCubic(progress);
    const animatedScore = Math.floor(uiState.finalScore * easedProgress);
    const animatedSyncRate = Math.floor(uiState.finalSyncRate * easedProgress);

    const statsY = centerY - cardHeight / 2 + 80;
    const stats = [
      { label: '最终得分', value: animatedScore.toString() },
      { label: '节拍同步率', value: `${animatedSyncRate}%` }
    ];

    stats.forEach((stat, index) => {
      const x = centerX - 100 + index * 200;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px "Exo 2", sans-serif';
      ctx.fillText(stat.label, x, statsY);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Exo 2", sans-serif';
      ctx.fillText(stat.value, x, statsY + 25);
    });

    let message = '';
    if (progress >= 0.8) {
      if (isVictory) {
        if (uiState.finalSyncRate >= 80) {
          message = '你是节奏大师！';
        } else if (uiState.finalSyncRate >= 60) {
          message = '不错，再有几次就完美了';
        } else {
          message = '继续练习，节奏在等你';
        }
      } else {
        message = '再接再厉，节奏与你同在';
      }
    }

    const messageAlpha = Math.max(0, Math.min(1, (progress - 0.8) / 0.2));
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * messageAlpha})`;
    ctx.font = '16px "Spectral", serif';
    ctx.fillText(message, centerX, statsY + 80);

    const footerAlpha = Math.max(0, Math.min(1, (progress - 0.9) / 0.1));
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * footerAlpha})`;
    ctx.font = '14px "Exo 2", sans-serif';
    ctx.fillText('按 Enter 返回选关 | 按 R 重新开始', centerX, centerY + cardHeight / 2 - 40);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
