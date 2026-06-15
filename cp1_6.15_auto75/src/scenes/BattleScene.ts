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
  eyeGlowLeft: Phaser.GameObjects.Graphics;
  eyeGlowRight: Phaser.GameObjects.Graphics;
  hpBarBg: Phaser.GameObjects.Graphics;
  hpBarFill: Phaser.GameObjects.Graphics;
  hpBarBorder: Phaser.GameObjects.Graphics;
  hpText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  statusBadge: Phaser.GameObjects.Graphics;
  scoreText: Phaser.GameObjects.Text;
  currentHp: number;
  targetHp: number;
  maxHp: number;
  baseX: number;
  baseY: number;
  color: number;
  defeated: boolean;
  idleTween: Phaser.Tweens.Tween | null;
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
  private platformGraphics!: Phaser.GameObjects.Graphics;
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private ambientParticles: Phaser.GameObjects.Graphics[] = [];
  private beamPool: Phaser.GameObjects.Graphics[] = [];
  private title!: Phaser.GameObjects.Text;

  private readonly CAT_SIZE = 56;
  private readonly HP_BAR_W = 72;
  private readonly HP_BAR_H = 8;
  private readonly PLATFORM_W = 320;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    this.createBackground();
    this.createAmbientParticles();
    this.createPlatforms();
    this.createEdgeFlashOverlays();
    this.createFlashOverlay();
    this.createCountdownText();
    this.createScoreContainer();
    this.createTitle();
    this.initBeamPool();

    this.scale.on('resize', () => {
      this.redrawAll();
    });
  }

  private redrawAll(): void {
    const { w, h } = this.getCanvasSize();
    this.drawGradientBg(w, h);
    this.drawPlatforms();
  }

  private getCanvasSize(): { w: number; h: number } {
    return { w: this.scale.width, h: this.scale.height };
  }

  private createBackground(): void {
    this.backgroundGraphics = this.add.graphics();
    const { w, h } = this.getCanvasSize();
    this.drawGradientBg(w, h);
  }

  private drawGradientBg(w: number, h: number): void {
    this.backgroundGraphics.clear();
    this.backgroundGraphics.fillStyle(0x0f0f1e, 1);
    this.backgroundGraphics.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 2) {
      const t = y / h;
      const r = Math.floor(15 + (15) * t);
      const g = Math.floor(15 + (52 - 15) * t);
      const b = Math.floor(30 + (96 - 30) * t);
      const color = (r << 16) | (g << 8) | b;
      this.backgroundGraphics.fillStyle(color, 0.015);
      this.backgroundGraphics.fillRect(0, y, w, 2);
    }

    for (let i = 0; i < 40; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 73.7) % h;
      const size = 1 + (i % 3);
      const alpha = 0.2 + (i % 5) * 0.1;
      this.backgroundGraphics.fillStyle(0x00d4ff, alpha);
      this.backgroundGraphics.fillRect(x, y, size, size);
    }

    this.backgroundGraphics.setDepth(0);
  }

  private createAmbientParticles(): void {
    for (let i = 0; i < 12; i++) {
      const p = this.add.graphics();
      p.setDepth(2);
      this.ambientParticles.push(p);
    }

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.updateAmbientParticles(),
    });
  }

  private updateAmbientParticles(): void {
    const { w, h } = this.getCanvasSize();
    this.ambientParticles.forEach((p, i) => {
      p.clear();
      const seed = (Date.now() + i * 311) / 2000;
      const x = ((Math.sin(seed + i) + 1) / 2) * w;
      const y = ((Math.cos(seed * 0.7 + i * 1.3) + 1) / 2) * h;
      const size = 2 + Math.abs(Math.sin(seed * 2 + i)) * 3;
      const alpha = 0.1 + Math.abs(Math.sin(seed * 3 + i)) * 0.2;
      const color = i % 3 === 0 ? 0x00d4ff : 0xff6b35;
      p.fillStyle(color, alpha);
      p.fillCircle(x, y, size);
    });
  }

  private createPlatforms(): void {
    this.platformGraphics = this.add.graphics();
    this.platformGraphics.setDepth(3);
    this.drawPlatforms();
  }

  private drawPlatforms(): void {
    this.platformGraphics.clear();
    const { w, h } = this.getCanvasSize();
    const px = (w - this.PLATFORM_W) / 2;
    const pyTop = h * 0.3;
    const pyBot = h * 0.72;

    for (const py of [pyTop, pyBot]) {
      this.platformGraphics.fillGradientStyle(0x00d4ff, 0x00d4ff, 0x00d4ff, 0x00d4ff, 0.15, 0.08, 0.15, 0.08);
      this.platformGraphics.fillRoundedRect(px - 6, py - 36, this.PLATFORM_W + 12, 40, 6);

      this.platformGraphics.lineStyle(2, 0x00d4ff, 0.5);
      this.platformGraphics.strokeRoundedRect(px - 6, py - 36, this.PLATFORM_W + 12, 40, 6);

      this.platformGraphics.fillStyle(0x00d4ff, 0.3);
      this.platformGraphics.fillRoundedRect(px, py - 4, this.PLATFORM_W, 8, 2);

      this.platformGraphics.lineStyle(1, 0x00d4ff, 0.6);
      this.platformGraphics.strokeRoundedRect(px, py - 4, this.PLATFORM_W, 8, 2);

      this.platformGraphics.lineStyle(1, 0x00d4ff, 0.12);
      for (let gx = px + 20; gx < px + this.PLATFORM_W; gx += 28) {
        this.platformGraphics.beginPath();
        this.platformGraphics.moveTo(gx, py - 4);
        this.platformGraphics.lineTo(gx, py + 4);
        this.platformGraphics.strokePath();
      }

      this.platformGraphics.lineStyle(1, 0x00d4ff, 0.08);
      for (let gy = py - 32; gy < py; gy += 9) {
        this.platformGraphics.beginPath();
        this.platformGraphics.moveTo(px, gy);
        this.platformGraphics.lineTo(px + this.PLATFORM_W, gy);
        this.platformGraphics.strokePath();
      }

      this.platformGraphics.fillStyle(0x00d4ff, 0.7);
      this.platformGraphics.fillCircle(px, py, 4);
      this.platformGraphics.fillCircle(px + this.PLATFORM_W, py, 4);
    }
  }

  private createTitle(): void {
    const { w } = this.getCanvasSize();
    this.title = this.add.text(w / 2, 20, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#00d4ff',
      letterSpacing: '3px',
    });
    this.title.setOrigin(0.5, 0);
    this.title.setAlpha(0.7);
    this.title.setDepth(40);
  }

  private createEdgeFlashOverlays(): void {
    const { w, h } = this.getCanvasSize();
    const thickness = 50;

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
      fontSize: '80px',
      color: '#00d4ff',
      stroke: '#0f3460',
      strokeThickness: 6,
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(90);
    this.countdownText.setVisible(false);
  }

  private createScoreContainer(): void {
    const { w } = this.getCanvasSize();
    this.scoreContainer = this.add.container(w - 16, 48);
    this.scoreContainer.setDepth(50);

    const label = this.add.text(0, 0, 'SCOREBOARD', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '11px',
      color: '#00d4ff',
      letterSpacing: '2px',
    });
    label.setOrigin(1, 0);
    this.scoreContainer.add(label);
  }

  private initBeamPool(): void {
    for (let i = 0; i < 10; i++) {
      const b = this.add.graphics();
      b.setDepth(55);
      b.setVisible(false);
      this.beamPool.push(b);
    }
  }

  private drawPixelCat(g: Phaser.GameObjects.Graphics, color: number, scale = 1): void {
    const s = this.CAT_SIZE * scale;
    const u = s / 28;

    const darkColor = Phaser.Display.Color.IntegerToColor(color).darken(35).color;
    const lightColor = Phaser.Display.Color.IntegerToColor(color).lighten(25).color;

    g.fillStyle(color, 1);

    g.fillRect(u * 5, u * 11, u * 18, u * 11);
    g.fillRect(u * 8, u * 9, u * 12, u * 15);
    g.fillRect(u * 11, u * 22, u * 6, u * 2);

    g.fillStyle(darkColor, 1);
    g.fillRect(u * 12, u * 11, u * 4, u * 11);
    g.fillRect(u * 4, u * 13, u * 3, u * 8);
    g.fillRect(u * 21, u * 13, u * 3, u * 8);
    g.fillRect(u * 14, u * 22, u * 3, u * 2);

    g.fillStyle(color, 1);
    g.fillTriangle(
      u * 7, u * 11,
      u * 4, u * 3,
      u * 11, u * 9
    );
    g.fillTriangle(
      u * 21, u * 11,
      u * 24, u * 3,
      u * 17, u * 9
    );

    g.fillStyle(0xff6b35, 0.9);
    g.fillTriangle(
      u * 8, u * 10,
      u * 6, u * 5,
      u * 10, u * 9
    );
    g.fillTriangle(
      u * 20, u * 10,
      u * 22, u * 5,
      u * 18, u * 9
    );

    g.fillStyle(0xffffff, 1);
    g.fillRect(u * 8, u * 13, u * 4, u * 4);
    g.fillRect(u * 16, u * 13, u * 4, u * 4);

    g.fillStyle(0x000000, 1);
    g.fillRect(u * 9, u * 14, u * 2, u * 2);
    g.fillRect(u * 17, u * 14, u * 2, u * 2);

    g.fillStyle(lightColor, 0.8);
    g.fillRect(u * 8, u * 13, u * 1, u * 1);
    g.fillRect(u * 16, u * 13, u * 1, u * 1);

    g.fillStyle(0xff6b35, 1);
    g.fillRect(u * 13, u * 18, u * 2, u * 2);

    g.lineStyle(u * 0.5, darkColor, 0.7);
    g.beginPath();
    g.moveTo(u * 13, u * 20);
    g.quadraticCurveTo(u * 11, u * 22, u * 9, u * 21);
    g.strokePath();
    g.beginPath();
    g.moveTo(u * 15, u * 20);
    g.quadraticCurveTo(u * 17, u * 22, u * 19, u * 21);
    g.strokePath();

    g.lineStyle(u * 0.4, lightColor, 0.7);
    g.beginPath();
    g.moveTo(u * 1, u * 15);
    g.lineTo(u * 7, u * 16);
    g.strokePath();
    g.beginPath();
    g.moveTo(u * 1, u * 17);
    g.lineTo(u * 7, u * 17);
    g.strokePath();
    g.beginPath();
    g.moveTo(u * 27, u * 15);
    g.lineTo(u * 21, u * 16);
    g.strokePath();
    g.beginPath();
    g.moveTo(u * 27, u * 17);
    g.lineTo(u * 21, u * 17);
    g.strokePath();

    g.fillStyle(darkColor, 0.8);
    g.fillRect(u * 7, u * 24, u * 3, u * 2);
    g.fillRect(u * 18, u * 24, u * 3, u * 2);
  }

  private drawEyeGlow(g: Phaser.GameObjects.Graphics): void {
    const u = this.CAT_SIZE / 28;
    g.fillStyle(0x00d4ff, 0.6);
    g.fillCircle(u * 10, u * 15, u * 1.2);
    g.fillCircle(u * 18, u * 15, u * 1.2);
  }

  private getHpColor(ratio: number): number {
    if (ratio > 0.6) return 0x00d4ff;
    if (ratio > 0.3) return 0xff6b35;
    return 0xff4444;
  }

  private getPlayerPositions(count: number): Array<{ x: number; y: number }> {
    const { w, h } = this.getCanvasSize();
    const px = (w - this.PLATFORM_W) / 2;
    const pyTop = h * 0.3;
    const pyBot = h * 0.72;

    const positions: Array<{ x: number; y: number }> = [];
    const topCount = Math.min(Math.ceil(count / 2), 2);
    const botCount = Math.min(count - topCount, 2);

    const topStart = px + this.PLATFORM_W / 2 - ((topCount - 1) * 150) / 2;
    for (let i = 0; i < topCount; i++) {
      positions.push({
        x: topStart + i * 150,
        y: pyTop - 30,
      });
    }

    const botStart = px + this.PLATFORM_W / 2 - ((botCount - 1) * 150) / 2;
    for (let i = 0; i < botCount; i++) {
      positions.push({
        x: botStart + i * 150,
        y: pyBot - 30,
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

      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.35);
      shadow.fillEllipse(0, this.CAT_SIZE / 2 + 4, this.CAT_SIZE * 0.7, this.CAT_SIZE * 0.15);
      container.add(shadow);

      const catGfx = this.add.graphics();
      this.drawPixelCat(catGfx, color);
      catGfx.setPosition(-this.CAT_SIZE / 2, -this.CAT_SIZE / 2);

      const eyeLeft = this.add.graphics();
      const eyeRight = this.add.graphics();
      this.drawEyeGlow(eyeLeft);
      this.drawEyeGlow(eyeRight);
      eyeLeft.setPosition(-this.CAT_SIZE / 2, -this.CAT_SIZE / 2);
      eyeRight.setPosition(-this.CAT_SIZE / 2, -this.CAT_SIZE / 2);

      const nameBadge = this.add.graphics();
      nameBadge.fillStyle(0x000000, 0.5);
      nameBadge.fillRoundedRect(-40, this.CAT_SIZE / 2 + 6, 80, 18, 3);
      nameBadge.lineStyle(1, color, 0.5);
      nameBadge.strokeRoundedRect(-40, this.CAT_SIZE / 2 + 6, 80, 18, 3);
      container.add(nameBadge);

      const nameText = this.add.text(0, this.CAT_SIZE / 2 + 15, p.nickname, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: '#ffffff',
      });
      nameText.setOrigin(0.5);

      const statusBadge = this.add.graphics();
      statusBadge.fillStyle(0x888888, 0.2);
      statusBadge.fillRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);

      const statusText = this.add.text(0, this.CAT_SIZE / 2 + 33, '待提交', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '9px',
        color: '#aaaaaa',
      });
      statusText.setOrigin(0.5);

      const hpBarBg = this.add.graphics();
      hpBarBg.fillStyle(0x111122, 0.8);
      hpBarBg.fillRoundedRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 20, this.HP_BAR_W, this.HP_BAR_H + 4, 3);

      const hpBarBorder = this.add.graphics();
      hpBarBorder.lineStyle(1, 0x555577, 0.7);
      hpBarBorder.strokeRoundedRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 20, this.HP_BAR_W, this.HP_BAR_H + 4, 3);

      const hpRatio = p.hp / p.maxHp;
      const hpBarFill = this.add.graphics();
      hpBarFill.fillStyle(this.getHpColor(hpRatio), 1);
      hpBarFill.fillRoundedRect(
        -this.HP_BAR_W / 2 + 2,
        -this.CAT_SIZE / 2 - 18,
        (this.HP_BAR_W - 4) * hpRatio,
        this.HP_BAR_H,
        2
      );

      const hpText = this.add.text(0, -this.CAT_SIZE / 2 - 28, `${p.hp}/${p.maxHp}`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      });
      hpText.setOrigin(0.5);

      container.add([catGfx, eyeLeft, eyeRight, nameText, statusBadge, statusText, hpBarBg, hpBarBorder, hpBarFill, hpText]);

      const scoreBg = this.add.graphics();
      scoreBg.fillStyle(0x111122, 0.6);
      scoreBg.fillRoundedRect(0, 20 + i * 20, 150, 18, 3);
      scoreBg.lineStyle(1, color, 0.4);
      scoreBg.strokeRoundedRect(0, 20 + i * 20, 150, 18, 3);

      const scoreText = this.add.text(8, 20 + i * 20 + 9, `${p.nickname}: ${p.score}`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: color,
      });
      scoreText.setOrigin(0, 0.5);
      this.scoreContainer.add([scoreBg, scoreText]);

      const idleTween = this.tweens.add({
        targets: container,
        y: pos.y - 4,
        duration: 900 + i * 120,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this.players.set(p.id, {
        catContainer: container,
        catGraphics: catGfx,
        eyeGlowLeft: eyeLeft,
        eyeGlowRight: eyeRight,
        hpBarBg,
        hpBarFill,
        hpBarBorder,
        hpText,
        nameText,
        statusText,
        statusBadge,
        scoreText,
        currentHp: p.hp,
        targetHp: p.hp,
        maxHp: p.maxHp,
        baseX: pos.x,
        baseY: pos.y,
        color,
        defeated: false,
        idleTween,
      });
    });
  }

  updatePlayerStatus(playerId: string, status: string): void {
    const v = this.players.get(playerId);
    if (!v) return;

    const labels: Record<string, string> = {
      waiting: '待提交',
      coding: '编写中',
      running: '运行中',
      done: '已完成',
    };
    const label = labels[status] || status;
    v.statusText.setText(label);

    v.statusBadge.clear();

    if (status === 'running') {
      v.statusText.setColor('#00d4ff');
      v.statusBadge.fillStyle(0x00d4ff, 0.25);
      v.statusBadge.fillRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);
      v.statusBadge.lineStyle(1, 0x00d4ff, 0.6);
      v.statusBadge.strokeRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);

      this.tweens.add({
        targets: v.catContainer,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 180,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      v.eyeGlowLeft.alpha = 0;
      v.eyeGlowRight.alpha = 0;
      this.tweens.add({
        targets: [v.eyeGlowLeft, v.eyeGlowRight],
        alpha: { from: 0, to: 1 },
        duration: 300,
        yoyo: true,
        repeat: 2,
      });
    } else if (status === 'done') {
      v.statusText.setColor('#4ade80');
      v.statusBadge.fillStyle(0x4ade80, 0.2);
      v.statusBadge.fillRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);
      v.statusBadge.lineStyle(1, 0x4ade80, 0.5);
      v.statusBadge.strokeRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);
    } else if (status === 'coding') {
      v.statusText.setColor('#00d4ff');
      v.statusBadge.fillStyle(0x00d4ff, 0.15);
      v.statusBadge.fillRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);
    } else {
      v.statusText.setColor('#888888');
      v.statusBadge.fillStyle(0x888888, 0.15);
      v.statusBadge.fillRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);
    }
  }

  applyDamage(fromId: string, toId: string, amount: number, type: string): void {
    const from = this.players.get(fromId);
    const to = this.players.get(toId);

    if (type === 'fast' || type === 'slow') {
      if (!from || !to || to.defeated) return;
      to.targetHp = Math.max(0, to.targetHp - amount);

      if (type === 'fast') {
        this.playFlashBomb(from);
        this.playRecoil(to, amount);
        this.playEdgeFlash(0xff6b35);
        this.cameras.main.shake(200, 0.008);
      } else {
        this.playBeam(from, to);
        this.playRecoil(to, amount);
        this.playEdgeFlash(0x00d4ff);
      }
    } else if (type === 'error') {
      if (!from || from.defeated) return;
      this.playShake(from);
      this.playTintRed(from);
      this.playSparkBurst(from, 0xff4444);
    }
  }

  private playFlashBomb(from: PlayerVisuals): void {
    const { x, y } = from.catContainer;

    const flashGfx = this.add.graphics();
    flashGfx.setDepth(60);

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 400,
      onUpdate: (t) => {
        flashGfx.clear();
        const progress = t.getValue();
        const radius = 8 + progress * 90;
        const alpha = 1 - progress;

        flashGfx.lineStyle(6, 0xffffff, alpha);
        flashGfx.strokeCircle(x, y, radius);
        flashGfx.lineStyle(3, 0xff6b35, alpha * 0.8);
        flashGfx.strokeCircle(x, y, radius * 0.7);
        flashGfx.fillStyle(0x00d4ff, alpha * 0.15);
        flashGfx.fillCircle(x, y, radius * 0.5);
      },
      onComplete: () => flashGfx.destroy(),
    });

    this.flashOverlay.setFillStyle(0xffffff, 0.45);
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

    const colors = [0xffffff, 0xff6b35, 0x00d4ff, 0xffff00];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i + Math.random() * 0.3;
      const p = this.add.graphics();
      p.setDepth(58);
      p.fillStyle(colors[i % colors.length], 1);
      p.fillRect(-3, -3, 6, 6);
      p.setPosition(x, y);

      const dist = 40 + Math.random() * 70;
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;

      this.tweens.add({
        targets: p,
        x: tx,
        y: ty,
        alpha: 0,
        scaleX: 0.3 + Math.random() * 0.4,
        scaleY: 0.3 + Math.random() * 0.4,
        angle: Math.random() * 360,
        duration: 450,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    this.cameras.main.flash(100, 255, 255, 255, false);

    if (from.idleTween) from.idleTween.pause();
    from.catContainer.setScale(1.15);
    this.tweens.add({
      targets: from.catContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => { if (from.idleTween) from.idleTween.resume(); },
    });
  }

  private playBeam(from: PlayerVisuals, to: PlayerVisuals): void {
    const fx = from.catContainer.x;
    const fy = from.catContainer.y;
    const tx = to.catContainer.x;
    const ty = to.catContainer.y;

    const beamGfx = this.add.graphics();
    beamGfx.setDepth(55);

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 400,
      onUpdate: (tween) => {
        beamGfx.clear();
        const t = tween.getValue();
        const fadeIn = Math.min(1, t * 6);
        const fadeOut = Math.max(0, (t - 0.5) * 2);
        const alpha = fadeIn * (1 - fadeOut);

        const segs = 12;
        beamGfx.lineStyle(5, 0x00d4ff, alpha * 0.3);
        beamGfx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const s = i / segs;
          const jitter = Math.sin(t * Math.PI * 4 + i) * 4 * (1 - Math.abs(s - 0.5) * 2);
          const px = fx + (tx - fx) * s + (i === 0 || i === segs ? 0 : jitter);
          const py = fy + (ty - fy) * s + (i === 0 || i === segs ? 0 : jitter * 0.7);
          if (i === 0) beamGfx.moveTo(px, py);
          else beamGfx.lineTo(px, py);
        }
        beamGfx.strokePath();

        beamGfx.lineStyle(2, 0xffffff, alpha);
        beamGfx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const s = i / segs;
          const jitter = Math.sin(t * Math.PI * 4 + i) * 3 * (1 - Math.abs(s - 0.5) * 2);
          const px = fx + (tx - fx) * s + (i === 0 || i === segs ? 0 : jitter);
          const py = fy + (ty - fy) * s + (i === 0 || i === segs ? 0 : jitter * 0.7);
          if (i === 0) beamGfx.moveTo(px, py);
          else beamGfx.lineTo(px, py);
        }
        beamGfx.strokePath();

        const progress = t;
        const hitX = fx + (tx - fx) * progress;
        const hitY = fy + (ty - fy) * progress;
        beamGfx.fillStyle(0xffffff, alpha);
        beamGfx.fillCircle(hitX, hitY, 4);
        beamGfx.fillStyle(0x00d4ff, alpha * 0.5);
        beamGfx.fillCircle(hitX, hitY, 8);
      },
      onComplete: () => beamGfx.destroy(),
    });

    for (let i = 0; i < 6; i++) {
      const delay = 50 + i * 35;
      setTimeout(() => {
        const p = this.add.graphics();
        p.setDepth(56);
        const tt = (i + 0.5) / 6;
        const px = fx + (tx - fx) * tt + (Math.random() - 0.5) * 12;
        const py = fy + (ty - fy) * tt + (Math.random() - 0.5) * 12;
        p.fillStyle(0x00d4ff, 0.8);
        p.fillCircle(0, 0, 2.5);
        p.setPosition(px, py);
        this.tweens.add({
          targets: p,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 300,
          onComplete: () => p.destroy(),
        });
      }, delay);
    }
  }

  private playRecoil(to: PlayerVisuals, amount: number): void {
    const intensity = Math.min(1, amount / 25);
    const offset = 6 + intensity * 16;

    if (to.idleTween) to.idleTween.pause();

    this.tweens.add({
      targets: to.catContainer,
      x: to.baseX + offset,
      y: to.baseY - 6 - intensity * 4,
      angle: 3 + intensity * 4,
      duration: 100,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete: () => {
        to.catContainer.setX(to.baseX);
        to.catContainer.setY(to.baseY);
        to.catContainer.setAngle(0);
        if (to.idleTween) to.idleTween.resume();
      },
    });

    this.playSparkBurst(to, amount > 15 ? 0xff6b35 : 0x00d4ff);
  }

  private playSparkBurst(target: PlayerVisuals, color: number): void {
    const { x, y } = target.catContainer;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
      const p = this.add.graphics();
      p.setDepth(57);
      p.fillStyle(color, 1);
      p.fillRect(-2, -2, 4, 4);
      p.setPosition(x, y - this.CAT_SIZE / 4);

      const dist = 15 + Math.random() * 25;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y - this.CAT_SIZE / 4 + Math.sin(angle) * dist,
        alpha: 0,
        duration: 250,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  private playEdgeFlash(color: number): void {
    const edges = [this.edgeFlashTop, this.edgeFlashBot, this.edgeFlashLeft, this.edgeFlashRight];

    const { w, h } = this.getCanvasSize();
    const t = 40;
    this.edgeFlashTop.setPosition(w / 2, t / 2);
    this.edgeFlashTop.setSize(w, t);
    this.edgeFlashBot.setPosition(w / 2, h - t / 2);
    this.edgeFlashBot.setSize(w, t);
    this.edgeFlashLeft.setPosition(t / 2, h / 2);
    this.edgeFlashLeft.setSize(t, h);
    this.edgeFlashRight.setPosition(w - t / 2, h / 2);
    this.edgeFlashRight.setSize(t, h);

    edges.forEach((edge) => {
      edge.setFillStyle(color, 0.45);
      edge.setAlpha(1);
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

  private playShake(from: PlayerVisuals): void {
    if (from.idleTween) from.idleTween.pause();

    const baseX = from.baseX;
    const baseY = from.baseY;
    const shake = 5;

    this.tweens.chain({
      targets: from.catContainer,
      tweens: [
        { x: baseX - shake, y: baseY + 1, duration: 35 },
        { x: baseX + shake, y: baseY - 1, duration: 35 },
        { x: baseX - shake * 0.8, y: baseY, duration: 35 },
        { x: baseX + shake * 0.8, y: baseY, duration: 35 },
        { x: baseX - shake * 0.5, y: baseY, duration: 35 },
        { x: baseX + shake * 0.5, y: baseY, duration: 35 },
        { x: baseX, y: baseY, duration: 35 },
      ],
      onComplete: () => {
        from.catContainer.setX(baseX);
        from.catContainer.setY(baseY);
        if (from.idleTween) from.idleTween.resume();
      },
    });
  }

  private playTintRed(from: PlayerVisuals): void {
    const tint = this.add.graphics();
    tint.setPosition(from.catGraphics.x, from.catGraphics.y);
    tint.setDepth(12);

    const u = this.CAT_SIZE / 28;
    const c = this.CAT_SIZE;

    tint.fillStyle(0xff0000, 0.55);
    tint.fillRect(u * 4, u * 3, u * 20, u * 23);
    tint.fillTriangle(u * 7, u * 11, u * 4, u * 3, u * 11, u * 9);
    tint.fillTriangle(u * 21, u * 11, u * 24, u * 3, u * 17, u * 9);

    from.catContainer.add(tint);

    this.tweens.add({
      targets: tint,
      alpha: { from: 0, to: 0.7 },
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => tint.destroy(),
    });

    this.tweens.add({
      targets: [from.eyeGlowLeft, from.eyeGlowRight],
      tint: { from: 0xffffff, to: 0xff0000 },
      duration: 200,
      yoyo: true,
    });
  }

  playerDefeated(playerId: string): void {
    const v = this.players.get(playerId);
    if (!v) return;
    v.defeated = true;

    if (v.idleTween) {
      v.idleTween.remove();
      v.idleTween = null;
    }

    const { x, y } = v.catContainer;

    const boom = this.add.graphics();
    boom.setDepth(60);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 500,
      onUpdate: (t) => {
        boom.clear();
        const p = t.getValue();
        const r = 4 + p * 55;
        const a = 1 - p;
        boom.lineStyle(5, 0xff4444, a);
        boom.strokeCircle(x, y, r);
        boom.lineStyle(3, 0xffaa00, a * 0.7);
        boom.strokeCircle(x, y, r * 0.6);
        boom.fillStyle(0xff6b35, a * 0.25);
        boom.fillCircle(x, y, r * 0.4);
      },
      onComplete: () => boom.destroy(),
    });

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const p = this.add.graphics();
      const colors = [0xff4444, 0xff6b35, 0xffaa00, 0xffffff];
      p.fillStyle(colors[i % colors.length], 1);
      p.fillRect(-3, -3, 6, 6);
      p.setPosition(x, y);
      p.setDepth(59);

      const dist = 30 + Math.random() * 70;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist + 40,
        angle: Math.random() * 720,
        alpha: 0,
        duration: 600 + Math.random() * 300,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    this.tweens.add({
      targets: v.catContainer,
      y: y + 120,
      x: x + (Math.random() - 0.5) * 30,
      alpha: 0,
      angle: 35 + Math.random() * 40,
      scaleX: 0.55,
      scaleY: 0.55,
      duration: 700,
      ease: 'Cubic.easeIn',
    });

    v.statusText.setText('💀 败北');
    v.statusText.setColor('#ff4444');
    v.statusBadge.clear();
    v.statusBadge.fillStyle(0xff4444, 0.25);
    v.statusBadge.fillRoundedRect(-32, this.CAT_SIZE / 2 + 26, 64, 14, 2);
  }

  showCountdown(seconds: number): void {
    const { w, h } = this.getCanvasSize();
    this.countdownText.setPosition(w / 2, h / 2);
    this.countdownText.setText(String(seconds));
    this.countdownText.setVisible(true);
    this.countdownText.setScale(0.4);
    this.countdownText.setAlpha(0);

    if (seconds <= 5) {
      this.countdownText.setColor('#ff6b35');
    } else {
      this.countdownText.setColor('#00d4ff');
    }

    this.tweens.add({
      targets: this.countdownText,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        if (seconds <= 1) {
          setTimeout(() => {
            this.countdownText.setVisible(false);
            this.countdownText.setText('GO!');
            this.countdownText.setColor('#4ade80');
            this.countdownText.setScale(0.5);
            this.countdownText.setAlpha(1);
            this.countdownText.setVisible(true);
            this.tweens.add({
              targets: this.countdownText,
              scaleX: 1.8,
              scaleY: 1.8,
              alpha: 0,
              duration: 500,
              onComplete: () => this.countdownText.setVisible(false),
            });
          }, 100);
        }
      },
    });
  }

  updateScore(playerId: string, score: number): void {
    const v = this.players.get(playerId);
    if (!v) return;

    v.scoreText.setText(`${v.nameText.text}: ${score}`);
    v.scoreText.setColor(v.color);

    this.tweens.add({
      targets: v.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    const plus = this.add.text(v.baseX, v.baseY - this.CAT_SIZE - 10, '+10', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    plus.setOrigin(0.5);
    plus.setDepth(80);
    plus.setScale(0.5);
    plus.setAlpha(0);

    this.tweens.chain({
      targets: plus,
      tweens: [
        { scaleX: 1.2, scaleY: 1.2, alpha: 1, duration: 150, ease: 'Back.easeOut' },
        { y: plus.y - 60, alpha: 0, duration: 900, ease: 'Cubic.easeIn' },
      ],
      onComplete: () => plus.destroy(),
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

    const label = this.add.text(0, 0, 'SCOREBOARD', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '11px',
      color: '#00d4ff',
      letterSpacing: '2px',
    });
    label.setOrigin(1, 0);
    this.scoreContainer.add(label);
  }

  private clearPlayers(): void {
    this.players.forEach((v) => {
      if (v.idleTween) v.idleTween.remove();
      v.catContainer.destroy(true);
    });
    this.players.clear();
    this.scoreContainer.removeAll(true);
  }

  update(_time: number, delta: number): void {
    const lerpFactor = Math.min(1, delta / 500);

    this.players.forEach((v) => {
      if (v.defeated) return;

      const needUpdate = Math.abs(v.currentHp - v.targetHp) > 0.1;
      if (needUpdate) {
        v.currentHp += (v.targetHp - v.currentHp) * lerpFactor;

        const ratio = Math.max(0, v.currentHp / v.maxHp);
        v.hpBarFill.clear();
        v.hpBarFill.fillStyle(this.getHpColor(ratio), 1);
        v.hpBarFill.fillRoundedRect(
          -this.HP_BAR_W / 2 + 2,
          -this.CAT_SIZE / 2 - 18,
          Math.max(0, (this.HP_BAR_W - 4) * ratio),
          this.HP_BAR_H,
          2
        );

        v.hpText.setText(`${Math.round(v.currentHp)}/${v.maxHp}`);

        if (ratio < 0.3 && Math.floor(_time / 250) % 2 === 0) {
          v.hpBarBorder.lineStyle(1, 0xff4444, 1);
          v.hpBarBorder.strokeRoundedRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 20, this.HP_BAR_W, this.HP_BAR_H + 4, 3);
        } else {
          v.hpBarBorder.lineStyle(1, 0x555577, 0.7);
          v.hpBarBorder.strokeRoundedRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 20, this.HP_BAR_W, this.HP_BAR_H + 4, 3);
        }
      } else if (v.currentHp !== v.targetHp) {
        v.currentHp = v.targetHp;
        const ratio = Math.max(0, v.currentHp / v.maxHp);
        v.hpBarFill.clear();
        v.hpBarFill.fillStyle(this.getHpColor(ratio), 1);
        v.hpBarFill.fillRoundedRect(
          -this.HP_BAR_W / 2 + 2,
          -this.CAT_SIZE / 2 - 18,
          Math.max(0, (this.HP_BAR_W - 4) * ratio),
          this.HP_BAR_H,
          2
        );
        v.hpText.setText(`${Math.round(v.currentHp)}/${v.maxHp}`);
      }
    });
  }
}
