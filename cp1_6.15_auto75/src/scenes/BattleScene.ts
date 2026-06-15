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
}

export class BattleScene extends Phaser.Scene {
  private players: Map<string, PlayerVisuals> = new Map();
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  private scoreContainer!: Phaser.GameObjects.Container;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private backgroundGraphics!: Phaser.GameObjects.Graphics;

  private readonly CANVAS_W = 800;
  private readonly CANVAS_H = 600;
  private readonly PLATFORM_W = 300;
  private readonly PLATFORM_H = 4;
  private readonly PLATFORM_Y_TOP = 200;
  private readonly PLATFORM_Y_BOT = 420;
  private readonly CAT_SIZE = 48;
  private readonly HP_BAR_W = 54;
  private readonly HP_BAR_H = 6;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    this.createBackground();
    this.createGridPlatforms();
    this.createFlashOverlay();
    this.createCountdownText();
    this.createScoreContainer();
  }

  private createBackground(): void {
    this.backgroundGraphics = this.add.graphics();
    const gradient = this.backgroundGraphics.createLinearGradient(
      0, 0, 0, this.CANVAS_H
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f3460');
    this.backgroundGraphics.fillStyle(gradient, 1);
    this.backgroundGraphics.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);
    this.backgroundGraphics.setDepth(0);
  }

  private createGridPlatforms(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x00d4ff, 0.3);

    const platformX = (this.CANVAS_W - this.PLATFORM_W) / 2;

    for (const py of [this.PLATFORM_Y_TOP, this.PLATFORM_Y_BOT]) {
      this.gridGraphics.fillStyle(0x00d4ff, 0.15);
      this.gridGraphics.fillRect(platformX, py, this.PLATFORM_W, this.PLATFORM_H);

      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(platformX, py);
      this.gridGraphics.lineTo(platformX + this.PLATFORM_W, py);
      this.gridGraphics.strokePath();

      for (let gx = platformX; gx <= platformX + this.PLATFORM_W; gx += 30) {
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(gx, py - 6);
        this.gridGraphics.lineTo(gx, py + this.PLATFORM_H + 6);
        this.gridGraphics.strokePath();
      }
    }

    this.gridGraphics.setDepth(1);
  }

  private createFlashOverlay(): void {
    this.flashOverlay = this.add.rectangle(
      this.CANVAS_W / 2, this.CANVAS_H / 2,
      this.CANVAS_W, this.CANVAS_H,
      0xffffff, 0
    );
    this.flashOverlay.setDepth(100);
    this.flashOverlay.setVisible(false);
  }

  private createCountdownText(): void {
    this.countdownText = this.add.text(
      this.CANVAS_W / 2, this.CANVAS_H / 2, '',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '60px',
        color: '#00d4ff',
        stroke: '#0f3460',
        strokeThickness: 4,
      }
    );
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(90);
    this.countdownText.setVisible(false);
  }

  private createScoreContainer(): void {
    this.scoreContainer = this.add.container(this.CANVAS_W - 20, 20);
    this.scoreContainer.setDepth(50);
  }

  private drawCat(graphics: Phaser.GameObjects.Graphics, color: number): void {
    const s = this.CAT_SIZE;
    const cx = s / 2;
    const cy = s / 2;

    graphics.fillStyle(color, 1);
    graphics.fillCircle(cx, cy + 2, 16);

    graphics.fillStyle(color, 1);
    graphics.fillTriangle(
      cx - 14, cy - 8,
      cx - 6, cy - 20,
      cx - 2, cy - 6
    );
    graphics.fillTriangle(
      cx + 14, cy - 8,
      cx + 6, cy - 20,
      cx + 2, cy - 6
    );

    graphics.fillStyle(0x00d4ff, 1);
    graphics.fillRect(cx - 8, cy - 2, 4, 4);
    graphics.fillRect(cx + 4, cy - 2, 4, 4);

    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(cx - 7, cy - 1, 2, 2);
    graphics.fillRect(cx + 5, cy - 1, 2, 2);

    graphics.lineStyle(1, color, 0.6);
    graphics.beginPath();
    graphics.moveTo(cx - 16, cy + 2);
    graphics.lineTo(cx - 6, cy + 4);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(cx - 16, cy + 5);
    graphics.lineTo(cx - 6, cy + 5);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(cx + 16, cy + 2);
    graphics.lineTo(cx + 6, cy + 4);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(cx + 16, cy + 5);
    graphics.lineTo(cx + 6, cy + 5);
    graphics.strokePath();

    graphics.fillStyle(0xff6b35, 1);
    graphics.fillTriangle(cx - 2, cy + 4, cx + 2, cy + 4, cx, cy + 8);
  }

  private getHpColor(ratio: number): number {
    const r = Math.floor(0x00 + (0xff - 0x00) * (1 - ratio));
    const g = Math.floor(0xd4 + (0x6b - 0xd4) * (1 - ratio));
    const b = Math.floor(0xff + (0x35 - 0xff) * (1 - ratio));
    return (r << 16) | (g << 8) | b;
  }

  private getPlayerPositions(count: number): Array<{ x: number; y: number }> {
    const platformX = (this.CANVAS_W - this.PLATFORM_W) / 2;
    const positions: Array<{ x: number; y: number }> = [];

    const topSlots = Math.min(Math.ceil(count / 2), 2);
    const botSlots = Math.min(count - topSlots, 2);

    for (let i = 0; i < topSlots; i++) {
      positions.push({
        x: platformX + 80 + i * 140,
        y: this.PLATFORM_Y_TOP - this.CAT_SIZE / 2 - 4,
      });
    }
    for (let i = 0; i < botSlots; i++) {
      positions.push({
        x: platformX + 80 + i * 140,
        y: this.PLATFORM_Y_BOT - this.CAT_SIZE / 2 - 4,
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
      this.drawCat(catGfx, color);

      const hpBarBg = this.add.graphics();
      hpBarBg.fillStyle(0x333333, 1);
      hpBarBg.fillRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 16, this.HP_BAR_W, this.HP_BAR_H);

      const hpRatio = p.hp / p.maxHp;
      const hpBarFill = this.add.graphics();
      hpBarFill.fillStyle(this.getHpColor(hpRatio), 1);
      hpBarFill.fillRect(-this.HP_BAR_W / 2, -this.CAT_SIZE / 2 - 16, this.HP_BAR_W * hpRatio, this.HP_BAR_H);

      const hpText = this.add.text(0, -this.CAT_SIZE / 2 - 20, `${p.hp}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      });
      hpText.setOrigin(0.5);

      const nameText = this.add.text(0, this.CAT_SIZE / 2 + 4, p.nickname, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      });
      nameText.setOrigin(0.5);

      const statusText = this.add.text(0, this.CAT_SIZE / 2 + 18, this.statusLabel(p.status), {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#888888',
      });
      statusText.setOrigin(0.5);

      container.add([catGfx, hpBarBg, hpBarFill, hpText, nameText, statusText]);

      const scoreText = this.add.text(0, 24 + i * 22, `${p.nickname}: ${p.score}`, {
        fontFamily: 'monospace',
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
      });
    });
  }

  private statusLabel(status: string): string {
    switch (status) {
      case 'submitting': return '待提交';
      case 'running': return '运行中';
      case 'result': return '结果';
      default: return status;
    }
  }

  updatePlayerStatus(playerId: string, status: string): void {
    const v = this.players.get(playerId);
    if (!v) return;
    v.statusText.setText(this.statusLabel(status));

    if (status === 'running') {
      v.statusText.setColor('#00d4ff');
    } else if (status === 'result') {
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
    const circle = this.add.circle(from.baseX, from.baseY, 8, 0xffffff, 0.9);
    circle.setDepth(60);
    this.tweens.add({
      targets: circle,
      radius: 50,
      alpha: 0,
      duration: 300,
      onUpdate: (_tween, target) => {
        const c = target as Phaser.GameObjects.Arc;
        c.setRadius(c.radius);
      },
      onComplete: () => circle.destroy(),
    });
  }

  private playRecoil(to: PlayerVisuals): void {
    this.tweens.add({
      targets: to.catContainer,
      x: to.baseX + 10,
      duration: 150,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  private playEdgeFlash(color: number): void {
    this.flashOverlay.setFillStyle(color, 0.5);
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
  }

  private playBeam(from: PlayerVisuals | undefined, to: PlayerVisuals): void {
    if (!from) return;
    const beam = this.add.graphics();
    beam.setDepth(55);
    beam.lineStyle(2, 0x00d4ff, 0.7);
    beam.beginPath();
    beam.moveTo(from.baseX, from.baseY);
    beam.lineTo(to.baseX, to.baseY);
    beam.strokePath();

    this.tweens.addCounter({
      from: 0.7,
      to: 0,
      duration: 300,
      onUpdate: (tween) => {
        beam.clear();
        beam.lineStyle(2, 0x00d4ff, tween.getValue());
        beam.beginPath();
        beam.moveTo(from.baseX, from.baseY);
        beam.lineTo(to.baseX, to.baseY);
        beam.strokePath();
      },
      onComplete: () => beam.destroy(),
    });
  }

  private playShake(from: PlayerVisuals | undefined): void {
    if (!from) return;
    this.tweens.add({
      targets: from.catContainer,
      x: from.baseX - 5,
      duration: 33,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        from.catContainer.setX(from.baseX);
      },
    });
  }

  private playTintRed(from: PlayerVisuals | undefined): void {
    if (!from) return;
    from.catGraphics.setAlpha(1);
    const tintOverlay = this.add.graphics();
    tintOverlay.setPosition(from.catGraphics.x, from.catGraphics.y);
    tintOverlay.setDepth(11);

    const s = this.CAT_SIZE;
    const cx = s / 2;
    const cy = s / 2;
    tintOverlay.fillStyle(0xff0000, 0.5);
    tintOverlay.fillCircle(cx, cy + 2, 16);
    tintOverlay.fillTriangle(cx - 14, cy - 8, cx - 6, cy - 20, cx - 2, cy - 6);
    tintOverlay.fillTriangle(cx + 14, cy - 8, cx + 6, cy - 20, cx + 2, cy - 6);
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

    this.tweens.add({
      targets: v.catContainer,
      y: v.baseY + 120,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
    });

    v.statusText.setText('败北');
    v.statusText.setColor('#ff6b35');
  }

  showCountdown(seconds: number): void {
    this.countdownText.setText(String(seconds));
    this.countdownText.setVisible(true);
    this.countdownText.setScale(1);
    this.countdownText.setAlpha(1);

    this.tweens.add({
      targets: this.countdownText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  updateScore(playerId: string, score: number): void {
    const v = this.players.get(playerId);
    if (!v) return;

    v.scoreText.setText(`${v.nameText.text}: ${score}`);

    this.tweens.add({
      targets: v.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  reset(): void {
    this.clearPlayers();
    this.countdownText.setVisible(false);
    this.countdownText.setText('');
    this.flashOverlay.setVisible(false);
    this.flashOverlay.setAlpha(0);
    this.scoreContainer.removeAll(true);
  }

  private clearPlayers(): void {
    this.players.forEach((v) => {
      v.catContainer.destroy(true);
      v.scoreText.destroy();
    });
    this.players.clear();
    this.scoreContainer.removeAll(true);
  }

  update(): void {
    this.players.forEach((v) => {
      if (v.currentHp !== v.targetHp) {
        const diff = v.targetHp - v.currentHp;
        const step = diff * 0.05;
        if (Math.abs(diff) < 0.5) {
          v.currentHp = v.targetHp;
        } else {
          v.currentHp += step;
        }

        const ratio = Math.max(0, v.currentHp / v.maxHp);
        v.hpBarFill.clear();
        v.hpBarFill.fillStyle(this.getHpColor(ratio), 1);
        v.hpBarFill.fillRect(
          -this.HP_BAR_W / 2,
          -this.CAT_SIZE / 2 - 16,
          this.HP_BAR_W * ratio,
          this.HP_BAR_H
        );

        v.hpText.setText(String(Math.round(v.currentHp)));
      }
    });
  }
}
