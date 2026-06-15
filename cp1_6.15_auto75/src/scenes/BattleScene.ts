import Phaser from 'phaser';

interface PlayerData {
  id: string;
  nickname: string;
  hp: number;
  maxHp: number;
  score: number;
  status: string;
}

interface PlayerVisuals {
  catContainer: Phaser.GameObjects.Container;
  catGraphics: Phaser.GameObjects.Graphics;
  hpBarBg: Phaser.GameObjects.Graphics;
  hpBarFill: Phaser.GameObjects.Graphics;
  hpText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  scoreText: Phaser.GameObjects.Text;
  currentHp: number;
  targetHp: number;
  maxHp: number;
  baseX: number;
  baseY: number;
  color: number;
}

export class BattleScene extends Phaser.Scene {
  private players: Map<string, PlayerVisuals> = new Map();
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private edgeFlashTop!: Phaser.GameObjects.Rectangle;
  private edgeFlashBot!: Phaser.GameObjects.Rectangle;
  private edgeFlashLeft!: Phaser.GameObjects.Rectangle;
  private edgeFlashRight!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  private scoreContainer!: Phaser.GameObjects.Container;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private particlePool: Phaser.GameObjects.Graphics[] = [];

  private readonly CAT_SIZE = 48;
  private readonly HP_BAR_W = 54;
  private readonly HP_BAR_H = 6;
  private readonly PLATFORM_W = 300;
  private readonly PLATFORM_H = 4;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    this.createBackground();
    this.createGridPlatforms();
    this.createEdgeFlashOverlays();
    this.createFlashOverlay();
    this.createCountdownText();
    this.createScoreContainer();
    this.initParticlePool();
  }

  private getCanvasSize(): { w: number; h: number } {
    return { w: this.scale.width, h: this.scale.height };
  }

  private createBackground(): void {
    this.backgroundGraphics = this.add.graphics();
    const { w, h } = this.getCanvasSize();
    this.drawGradientBg(w, h);
    this.scale.on('resize', () => {
      const s = this.getCanvasSize();
      this.drawGradientBg(s.w, s.h);
    });
  }

  private drawGradientBg(w: number, h: number): void {
    this.backgroundGraphics.clear();
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(0x1a + (0x0f - 0x1a) * t);
      const g = Math.floor(0x1a + (0x34 - 0x1a) * t);
      const b = Math.floor(0x2e + (0x60 - 0x2e) * t);
      const color = (r << 16) | (g << 8) | b;
      const y0 = (h / steps) * i;
      const y1 = (h / steps) * (i + 1);
      this.backgroundGraphics.fillStyle(color, 1);
      this.backgroundGraphics.fillRect(0, y0, w, y1 - y0 + 1);
    }
    this.backgroundGraphics.setDepth(0);
  }

  private createGridPlatforms(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(1);
    this.scale.on('resize', () => {
      this.gridGraphics.clear();
      this.drawPlatforms();
    });
    this.drawPlatforms();
  }

  private drawPlatforms(): void {
    const { w, h } = this.getCanvasSize();
    const px = (w - this.PLATFORM_W) / 2;
    const pyTop = h * 0.33;
    const pyBot = h * 0.7;

    this.gridGraphics.lineStyle(1, 0x00d4ff, 0.3);

    for (const py of [pyTop, pyBot]) {
      this.gridGraphics.fillStyle(0x00d4ff, 0.1);
      this.gridGraphics.fillRect(px, py, this.PLATFORM_W, this.PLATFORM_H);

      this.gridGraphics.fillStyle(0x00d4ff, 0.05);
      this.gridGraphics.fillRect(px, py - 40, this.PLATFORM_W, 40);

      this.gridGraphics.lineStyle(1, 0x00d4ff, 0.4);
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(px, py);
      this.gridGraphics.lineTo(px + this.PLATFORM_W, py);
      this.gridGraphics.strokePath();

      this.gridGraphics.lineStyle(1, 0x00d4ff, 0.15);
      for (let gx = px; gx <= px + this.PLATFORM_W; gx += 30) {
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(gx, py - 6);
        this.gridGraphics.lineTo(gx, py + this.PLATFORM_H + 6);
        this.gridGraphics.strokePath();
      }

      for (let gy = py - 30; gy < py; gy += 10) {
        this.gridGraphics.lineStyle(1, 0x00d4ff, 0.05);
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(px, gy);
        this.gridGraphics.lineTo(px + this.PLATFORM_W, gy);
        this.gridGraphics.strokePath();
      }
    }
  }

  private createEdgeFlashOverlays(): void {
    const { w, h } = this.getCanvasSize();
    const thickness = 40;

    this.edgeFlashTop = this.add.rectangle(w / 2, thickness / 2, w, thickness, 0xffffff, 0);
    this.edgeFlashBot = this.add.rectangle(w / 2, h - thickness / 2, w, thickness, 0xffffff, 0);
    this.edgeFlashLeft = this.add.rectangle(thickness / 2, h / 2, thickness, h, 0xffffff, 0);
    this.edgeFlashRight = this.add.rectangle(w - thickness / 2, h / 2, thickness, h, 0xffffff, 0);

    [this.edgeFlashTop, this.edgeFlashBot, this.edgeFlashLeft, this.edgeFlashRight].forEach((r) => {
      r.setDepth(99);
      r.setVisible(false);
    });
  }

  private createFlashOverlay(): void {
    const { w, h } = this.getCanvasSize();
    this.flashOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0);
    this.flashOverlay.setDepth(100);
    this.flashOverlay.setVisible(false);
  }

  private createCountdownText(): void {
    const { w, h } = this.getCanvasSize();
    this.countdownText = this.add.text(w / 2, h / 2, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '60px',
      color: '#00d4ff',
      stroke: '#0f3460',
      strokeThickness: 4,
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(90);
    this.countdownText.setVisible(false);
  }

  private createScoreContainer(): void {
    const { w } = this.getCanvasSize();
    this.scoreContainer = this.add.container(w - 20, 20);
    this.scoreContainer.setDepth(50);
  }

  private initParticlePool(): void {
    for (let i = 0; i < 40; i++) {
      const p = this.add.graphics();
      p.setDepth(55);
      p.setVisible(false);
      this.particlePool.push(p);
    }
  }

  private getParticle(): Phaser.GameObjects.Graphics {
    for (const p of this.particlePool) {
      if (!p.visible) return p;
    }
    const p = this.add.graphics();
    p.setDepth(55);
    this.particlePool.push(p);
    return p;
  }

  private drawPixelCat(graphics: Phaser.GameObjects.Graphics, color: number): void {
    const s = this.CAT_SIZE;
    const ox = s / 2;
    const oy = s / 2;

    const bodyColor = color;
    const darkColor = Phaser.Display.Color.IntegerToColor(color).darken(30).color;
    const lightColor = Phaser.Display.Color.IntegerToColor(color).lighten(20).color;

    graphics.fillStyle(bodyColor, 1);

    graphics.fillRect(ox - 8, oy - 6, 16, 14);
    graphics.fillRect(ox - 6, oy + 8, 12, 4);
    graphics.fillRect(ox - 10, oy - 4, 20, 10);

    graphics.fillStyle(darkColor, 1);
    graphics.fillRect(ox - 12, oy - 8, 4, 8);
    graphics.fillRect(ox + 8, oy - 8, 4, 8);

    graphics.fillStyle(bodyColor, 1);
    graphics.fillTriangle(
      ox - 10, oy - 8,
      ox - 4, oy - 18,
      ox - 2, oy - 6
    );
    graphics.fillTriangle(
      ox + 10, oy - 8,
      ox + 4, oy - 18,
      ox + 2, oy - 6
    );

    graphics.fillStyle(0xff6b35, 0.8);
    graphics.fillTriangle(
      ox - 10, oy - 8,
      ox - 6, oy - 16,
      ox - 4, oy - 8
    );
    graphics.fillTriangle(
      ox + 10, oy - 8,
      ox + 6, oy - 16,
      ox + 4, oy - 8
    );

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(ox - 7, oy - 4, 5, 5);
    graphics.fillRect(ox + 2, oy - 4, 5, 5);

    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(ox - 5, oy - 3, 3, 3);
    graphics.fillRect(ox + 4, oy - 3, 3, 3);

    graphics.fillStyle(0xff6b35, 1);
    graphics.fillRect(ox - 1, oy + 2, 2, 2);

    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillRect(ox - 7, oy - 4, 2, 2);
    graphics.fillRect(ox + 2, oy - 4, 2, 2);

    graphics.lineStyle(1, lightColor, 0.6);
    graphics.beginPath();
    graphics.moveTo(ox - 14, oy - 2);
    graphics.lineTo(ox - 8, oy);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(ox - 14, oy + 1);
    graphics.lineTo(ox - 8, oy + 1);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(ox + 14, oy - 2);
    graphics.lineTo(ox + 8, oy);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(ox + 14, oy + 1);
    graphics.lineTo(ox + 8, oy + 1);
    graphics.strokePath();

    graphics.fillStyle(bodyColor, 0.8);
    graphics.fillRect(ox - 6, oy + 12, 4, 3);
    graphics.fillRect(ox + 2, oy + 12, 4, 3);
  }

  private getHpColor(ratio: number): number {
    if (ratio > 0.6) return 0x00d4ff;
    if (ratio > 0.3) return 0xff6b35;
    return 0xff4444;
  }

  private getPlayerPositions(count: number): Array<{ x: number; y: number }> {
    const { w, h } = this.getCanvasSize();
    const px = (w - this.PLATFORM_W) / 2;
    const pyTop = h * 0.33;
    const pyBot = h * 0.7;

    const positions: Array<{ x: number; y: number }> = [];
    const topSlots = Math.min(Math.ceil(count / 2), 2);
    const botSlots = Math.min(count - topSlots, 2);

    for (let i = 0; i < topSlots; i++) {
      positions.push({
        x: px + 80 + i * 140,
        y: pyTop - this.CAT_SIZE / 2 - 4,
      });
    }
    for (let i = 0; i < botSlots; i++) {
      positions.push({
        x: px + 80 + i * 140,
        y: pyBot - this.CAT_SIZE / 2 - 4,
      });
    }

    return positions;
  }

  setupPlayers(players: Array<PlayerData>): void {
    this.clearPlayers();

    const positions = this.getPlayerPositions(players.length);
    const catColors = [0x00d4ff, 0xff6b35, 0x4ade80, 0xf472b6];

    players.forEach((p, i) => {
      const pos = positions[i];
      const color = catColors[i % catColors.length];

      const container = this.add.container(pos.x, pos.y);
      container.setDepth(10);

      const catGfx = this.add.graphics();
      catGfx.setPosition(-this.CAT_SIZE / 2, -this.CAT_SIZE / 2);
      this.drawPixelCat(catGfx, color);

      const hpBarBg = this.add.graphics();
      hpBarBg.fillStyle(0x333333, 1);
      hpBarBg.fillRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 18, this.HP_BAR_W, this.HP_BAR_H);

      const hpBarBorder = this.add.graphics();
      hpBarBorder.lineStyle(1, 0x555555, 0.5);
      hpBarBorder.strokeRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 18, this.HP_BAR_W, this.HP_BAR_H);

      const hpRatio = p.hp / p.maxHp;
      const hpBarFill = this.add.graphics();
      hpBarFill.fillStyle(this.getHpColor(hpRatio), 1);
      hpBarFill.fillRect(-this.HP_BAR_W / 2 + 1, -this.CAT_SIZE / 2 - 17, (this.HP_BAR_W - 2) * hpRatio, this.HP_BAR_H - 2);

      const hpText = this.add.text(0, -this.CAT_SIZE / 2 - 22, `${p.hp}`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        color: '#ffffff',
      });
      hpText.setOrigin(0.5);

      const nameText = this.add.text(0, this.CAT_SIZE / 2 + 6, p.nickname, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: '#ffffff',
      });
      nameText.setOrigin(0.5);

      const statusText = this.add.text(0, this.CAT_SIZE / 2 + 20, '待提交', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '9px',
        color: '#888888',
      });
      statusText.setOrigin(0.5);

      container.add([catGfx, hpBarBg, hpBarBorder, hpBarFill, hpText, nameText, statusText]);

      const scoreText = this.add.text(0, 24 + i * 22, `${p.nickname}: ${p.score}`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '13px',
        color: color,
      });
      scoreText.setOrigin(1, 0);
      this.scoreContainer.add(scoreText);

      this.players.set(p.id, {
        catContainer: container,
        catGraphics: catGfx,
        hpBarBg,
        hpBarFill,
        hpText,
        nameText,
        statusText,
        scoreText,
        currentHp: p.hp,
        targetHp: p.hp,
        maxHp: p.maxHp,
        baseX: pos.x,
        baseY: pos.y,
        color,
      });
    });
  }

  updatePlayerStatus(playerId: string, status: string): void {
    const v = this.players.get(playerId);
    if (!v) return;

    const label = status === 'waiting' ? '待提交' : status === 'coding' ? '编写中' : status === 'running' ? '运行中' : status === 'done' ? '已完成' : status;
    v.statusText.setText(label);

    if (status === 'running') {
      v.statusText.setColor('#00d4ff');
      this.tweens.add({
        targets: v.catContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 300,
        yoyo: true,
      });
    } else if (status === 'done') {
      v.statusText.setColor('#4ade80');
    } else {
      v.statusText.setColor('#888888');
    }
  }

  applyDamage(fromId: string, toId: string, amount: number, type: string): void {
    const from = this.players.get(fromId);
    const to = this.players.get(toId);
    if (!to) return;

    to.targetHp = Math.max(0, to.targetHp - amount);

    if (type === 'fast') {
      this.playFlashBomb(from);
      this.playRecoil(to);
      this.playEdgeFlash(0xff6b35);
      this.playScreenShake();
    } else if (type === 'slow') {
      this.playBeam(from, to);
      this.playEdgeFlash(0x00d4ff);
    } else if (type === 'error') {
      this.playShake(from);
      this.playTintRed(from);
    }
  }

  private playFlashBomb(from: PlayerVisuals | undefined): void {
    if (!from) return;
    const { x, y } = from.catContainer;

    const ring1 = this.add.circle(x, y, 4, 0xffffff, 0.9);
    ring1.setDepth(60);
    this.tweens.add({
      targets: ring1,
      radius: 60,
      alpha: 0,
      duration: 350,
      onUpdate: (_t, target) => {
        const c = target as Phaser.GameObjects.Arc;
        c.setRadius(c.radius);
      },
      onComplete: () => ring1.destroy(),
    });

    const ring2 = this.add.circle(x, y, 4, 0x00d4ff, 0.7);
    ring2.setDepth(60);
    this.tweens.add({
      targets: ring2,
      radius: 45,
      alpha: 0,
      duration: 300,
      delay: 50,
      onUpdate: (_t, target) => {
        const c = target as Phaser.GameObjects.Arc;
        c.setRadius(c.radius);
      },
      onComplete: () => ring2.destroy(),
    });

    this.flashOverlay.setFillStyle(0xffffff, 0.3);
    this.flashOverlay.setVisible(true);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.flashOverlay.setVisible(false);
        this.flashOverlay.setAlpha(0);
      },
    });

    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i;
      const p = this.getParticle();
      p.setVisible(true);
      p.clear();
      p.fillStyle(0xffffff, 0.9);
      p.fillRect(-2, -2, 4, 4);
      p.setPosition(x, y);

      const dist = 50 + Math.random() * 30;
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;

      this.tweens.add({
        targets: p,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => {
          p.setVisible(false);
          p.clear();
          p.setAlpha(1);
        },
      });
    }
  }

  private playRecoil(to: PlayerVisuals): void {
    this.tweens.add({
      targets: to.catContainer,
      x: to.baseX + 12,
      y: to.baseY - 4,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        to.catContainer.setX(to.baseX);
        to.catContainer.setY(to.baseY);
      },
    });
  }

  private playScreenShake(): void {
    this.cameras.main.shake(200, 0.005);
  }

  private playEdgeFlash(color: number): void {
    const edges = [this.edgeFlashTop, this.edgeFlashBot, this.edgeFlashLeft, this.edgeFlashRight];
    edges.forEach((edge) => {
      edge.setFillStyle(color, 0.5);
      edge.setVisible(true);
    });

    this.tweens.add({
      targets: edges,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        edges.forEach((edge) => {
          edge.setVisible(false);
          edge.setAlpha(0);
        });
      },
    });
  }

  private playBeam(from: PlayerVisuals | undefined, to: PlayerVisuals): void {
    if (!from) return;
    const fx = from.catContainer.x;
    const fy = from.catContainer.y;
    const tx = to.catContainer.x;
    const ty = to.catContainer.y;

    const beamGfx = this.add.graphics();
    beamGfx.setDepth(55);

    const dx = tx - fx;
    const dy = ty - fy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / 15);
    const particleCount = Math.min(steps, 12);

    for (let i = 0; i < particleCount; i++) {
      const t = (i + 0.5) / particleCount;
      const px = fx + dx * t;
      const py = fy + dy * t;

      const dot = this.add.circle(px, py, 3, 0x00d4ff, 0.8);
      dot.setDepth(56);
      this.tweens.add({
        targets: dot,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300,
        delay: t * 150,
        onComplete: () => dot.destroy(),
      });
    }

    this.tweens.addCounter({
      from: 1,
      to: 0,
      duration: 350,
      onUpdate: (tween) => {
        beamGfx.clear();
        const alpha = tween.getValue();
        beamGfx.lineStyle(3, 0x00d4ff, alpha * 0.8);
        beamGfx.beginPath();
        beamGfx.moveTo(fx, fy);
        beamGfx.lineTo(tx, ty);
        beamGfx.strokePath();

        beamGfx.lineStyle(6, 0x00d4ff, alpha * 0.2);
        beamGfx.beginPath();
        beamGfx.moveTo(fx, fy);
        beamGfx.lineTo(tx, ty);
        beamGfx.strokePath();
      },
      onComplete: () => beamGfx.destroy(),
    });
  }

  private playShake(from: PlayerVisuals | undefined): void {
    if (!from) return;

    const baseX = from.baseX;
    const timeline = this.tweens.createTimeline();

    timeline.add({
      targets: from.catContainer,
      x: baseX - 6,
      duration: 40,
    });
    timeline.add({
      targets: from.catContainer,
      x: baseX + 6,
      duration: 40,
    });
    timeline.add({
      targets: from.catContainer,
      x: baseX - 5,
      duration: 40,
    });
    timeline.add({
      targets: from.catContainer,
      x: baseX + 5,
      duration: 40,
    });
    timeline.add({
      targets: from.catContainer,
      x: baseX - 3,
      duration: 40,
    });
    timeline.add({
      targets: from.catContainer,
      x: baseX,
      duration: 40,
    });

    timeline.play();
  }

  private playTintRed(from: PlayerVisuals | undefined): void {
    if (!from) return;
    const tintOverlay = this.add.graphics();
    tintOverlay.setPosition(from.catGraphics.x, from.catGraphics.y);
    tintOverlay.setDepth(11);

    const s = this.CAT_SIZE;
    const cx = s / 2;
    const cy = s / 2;
    tintOverlay.fillStyle(0xff0000, 0.6);
    tintOverlay.fillRect(cx - 12, cy - 8, 24, 22);
    tintOverlay.fillTriangle(cx - 10, cy - 8, cx - 4, cy - 18, cx - 2, cy - 6);
    tintOverlay.fillTriangle(cx + 10, cy - 8, cx + 4, cy - 18, cx + 2, cy - 6);

    from.catContainer.add(tintOverlay);

    this.tweens.add({
      targets: tintOverlay,
      alpha: 0,
      duration: 200,
      onComplete: () => tintOverlay.destroy(),
    });
  }

  playerDefeated(playerId: string): void {
    const v = this.players.get(playerId);
    if (!v) return;

    const explosion = this.add.graphics();
    explosion.setDepth(60);
    explosion.fillStyle(0xff6b35, 0.6);
    explosion.fillCircle(v.baseX, v.baseY, 24);
    this.tweens.add({
      targets: explosion,
      alpha: 0,
      duration: 400,
      onComplete: () => explosion.destroy(),
    });

    this.tweens.add({
      targets: v.catContainer,
      y: v.baseY + 80,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 500,
      ease: 'Power2',
    });

    v.statusText.setText('败北');
    v.statusText.setColor('#ff4444');
  }

  showCountdown(seconds: number): void {
    const { w, h } = this.getCanvasSize();
    this.countdownText.setPosition(w / 2, h / 2);
    this.countdownText.setText(String(seconds));
    this.countdownText.setVisible(true);
    this.countdownText.setScale(0.5);
    this.countdownText.setAlpha(1);

    this.tweens.add({
      targets: this.countdownText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
    });
  }

  updateScore(playerId: string, score: number): void {
    const v = this.players.get(playerId);
    if (!v) return;

    v.scoreText.setText(`${v.nameText.text}: ${score}`);

    this.tweens.add({
      targets: v.scoreText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    const plusText = this.add.text(v.baseX, v.baseY - this.CAT_SIZE, '+10', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    plusText.setOrigin(0.5);
    plusText.setDepth(80);

    this.tweens.add({
      targets: plusText,
      y: plusText.y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => plusText.destroy(),
    });
  }

  reset(): void {
    this.clearPlayers();
    this.countdownText.setVisible(false);
    this.countdownText.setText('');
    this.flashOverlay.setVisible(false);
    this.flashOverlay.setAlpha(0);
    this.scoreContainer.removeAll(true);
    [this.edgeFlashTop, this.edgeFlashBot, this.edgeFlashLeft, this.edgeFlashRight].forEach((e) => {
      e.setVisible(false);
      e.setAlpha(0);
    });
  }

  private clearPlayers(): void {
    this.players.forEach((v) => {
      v.catContainer.destroy(true);
    });
    this.players.clear();
    this.scoreContainer.removeAll(true);
  }

  update(_time: number, delta: number): void {
    const lerpFactor = Math.min(1, delta / 500);

    this.players.forEach((v) => {
      if (Math.abs(v.currentHp - v.targetHp) > 0.5) {
        v.currentHp += (v.targetHp - v.currentHp) * lerpFactor;

        const ratio = Math.max(0, v.currentHp / v.maxHp);
        v.hpBarFill.clear();
        v.hpBarFill.fillStyle(this.getHpColor(ratio), 1);
        v.hpBarFill.fillRect(
          -this.HP_BAR_W / 2 + 1,
          -this.CAT_SIZE / 2 - 17,
          (this.HP_BAR_W - 2) * ratio,
          this.HP_BAR_H - 2
        );

        v.hpText.setText(String(Math.round(v.currentHp)));
      } else if (v.currentHp !== v.targetHp) {
        v.currentHp = v.targetHp;
        const ratio = Math.max(0, v.currentHp / v.maxHp);
        v.hpBarFill.clear();
        v.hpBarFill.fillStyle(this.getHpColor(ratio), 1);
        v.hpBarFill.fillRect(
          -this.HP_BAR_W / 2 + 1,
          -this.CAT_SIZE / 2 - 17,
          (this.HP_BAR_W - 2) * ratio,
          this.HP_BAR_H - 2
        );
        v.hpText.setText(String(Math.round(v.currentHp)));
      }
    });
  }
}
