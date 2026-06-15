import Phaser from 'phaser';
import { BattleLogic } from '../logic/Battle';
import { AssembledMech, BattleResult, BattleLogEntry, BattleMech } from '../types';
import { MAX_ROUNDS, ROUND_INTERVAL } from '../data/parts';

export class BattleScene extends Phaser.Scene {
  private playerData!: AssembledMech;
  private onComplete!: (result: BattleResult) => void;
  private battleResult!: BattleResult;
  private currentRound = 0;
  private currentLogIndex = 0;
  private playerMech!: BattleMech;
  private enemyMech!: BattleMech;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private playerContainer!: Phaser.GameObjects.Container;
  private enemyContainer!: Phaser.GameObjects.Container;
  private floatingTexts: Phaser.GameObjects.Text[] = [];
  private attackFxTimer = 0;
  private isFinished = false;

  constructor() {
    super('BattleScene');
  }

  init(data: any) {
    this.playerData = data.playerData;
    this.onComplete = data.onComplete || (() => {});
  }

  create() {
    this.drawBackground();
    this.createBattleArena();
    this.createMechDisplays();
    this.createHUD();
    this.simulateAndPlay();
  }

  private drawBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d24, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x2a2d35, 0.5);
    const gridSize = 45;
    for (let x = 0; x <= width; x += gridSize) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      bg.lineBetween(0, y, width, y);
    }

    const horizon = this.add.graphics();
    horizon.fillGradientStyle(0x3a2a2a, 0x1a1d24, 0x3a2a2a, 0x1a1d24, 0.4, 0.05, 0.4, 0.05);
    horizon.fillEllipse(width * 0.5, height * 0.7, width, 400);

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x2a1f2a, 0x1a1d24, 0x2a1f2a, 0x1a1d24, 0.5, 0.05, 0.5, 0.05);
    sky.fillEllipse(width * 0.5, height * 0.1, width * 1.2, 300);

    const moon = this.add.graphics();
    moon.fillStyle(0xff8c42, 0.15);
    moon.fillCircle(width - 120, 100, 50);
    moon.fillStyle(0xffaa66, 0.08);
    moon.fillCircle(width - 120, 100, 80);
  }

  private createBattleArena() {
    const { width, height } = this.scale;
    const groundY = height * 0.78;

    const platform = this.add.graphics();
    platform.fillGradientStyle(0x3a3d45, 0x1a1d24, 0x3a3d45, 0x1a1d24, 0.8, 1, 0.8, 1);
    platform.fillRoundedRect(width * 0.08, groundY, width * 0.84, height - groundY - 10, 12);
    platform.lineStyle(2, 0xff8c42, 0.4);
    platform.strokeRoundedRect(width * 0.08, groundY, width * 0.84, height - groundY - 10, 12);

    platform.lineStyle(1, 0xff8c42, 0.15);
    for (let i = 0; i < 8; i++) {
      const x = width * 0.08 + (i + 1) * (width * 0.84 / 9);
      platform.lineBetween(x, groundY + 10, x, height - 18);
    }

    const vsText = this.add.text(width / 2, height * 0.15, 'VS', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '54px',
      color: '#ff8c42',
      fontStyle: 'bold',
      stroke: '#1a1d24',
      strokeThickness: 6
    }).setOrigin(0.5);
    vsText.setScale(0);
    this.tweens.add({
      targets: vsText,
      scale: 1,
      duration: 500,
      ease: 'Back.Out',
      yoyo: true,
      hold: 500,
      repeat: 0
    });

    this.roundText = this.add.text(width / 2, height * 0.23, '第 1 / ' + MAX_ROUNDS + ' 回合', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#cfd6e4',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  private createMechDisplays() {
    const { width, height } = this.scale;
    const groundY = height * 0.78;

    this.battleResult = BattleLogic.simulateBattle(this.playerData);
    this.playerMech = this.battleResult.playerMech;
    this.enemyMech = this.battleResult.enemyMech;

    this.playerContainer = this.add.container(width * 0.22, groundY - 10);
    this.enemyContainer = this.add.container(width * 0.78, groundY - 10);

    this.createPlayerMech(this.playerContainer);
    this.createEnemyMech(this.enemyContainer);

    const pGlow = this.add.graphics();
    pGlow.fillGradientStyle(0x5b8def, 0x1a1d24, 0x5b8def, 0x1a1d24, 0.25, 0.02, 0.25, 0.02);
    pGlow.fillEllipse(width * 0.22, groundY - 10, 300, 350);
    const eGlow = this.add.graphics();
    eGlow.fillGradientStyle(0xe15d44, 0x1a1d24, 0xe15d44, 0x1a1d24, 0.25, 0.02, 0.25, 0.02);
    eGlow.fillEllipse(width * 0.78, groundY - 10, 300, 350);

    const playerLabelBg = this.add.graphics();
    playerLabelBg.fillStyle(0x5b8def, 0.85);
    playerLabelBg.fillRoundedRect(width * 0.22 - 80, 50, 160, 36, 8);
    this.add.text(width * 0.22, 68, '🛡 我方战甲', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const enemyLabelBg = this.add.graphics();
    enemyLabelBg.fillStyle(0xe15d44, 0.85);
    enemyLabelBg.fillRoundedRect(width * 0.78 - 80, 50, 160, 36, 8);
    this.add.text(width * 0.78, 68, '☠ 变异巨兽', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.createHpBars();
  }

  private createPlayerMech(container: Phaser.GameObjects.Container) {
    const g = this.add.graphics();
    const c = 0x5b8def;
    const h = 0x7da9ff;

    g.fillStyle(c, 1);
    g.lineStyle(2, h, 0.9);
    g.fillRoundedRect(-50, -40, 100, 90, 10);
    g.strokeRoundedRect(-50, -40, 100, 90, 10);
    g.fillStyle(h, 0.6);
    g.fillRoundedRect(-40, -30, 80, 20, 5);
    g.fillStyle(0x1a1d24, 1);
    g.fillCircle(0, 20, 12);
    g.fillStyle(h, 1);
    g.fillCircle(0, 20, 7);

    g.fillStyle(c, 1);
    g.lineStyle(2, h, 0.8);
    g.fillEllipse(0, -80, 55, 50);
    g.strokeEllipse(0, -80, 55, 50);
    g.fillStyle(0x1a1d24, 1);
    g.fillRect(-20, -88, 40, 12);
    g.fillStyle(0xff8c42, 1);
    g.fillRect(-17, -86, 12, 8);
    g.fillRect(5, -86, 12, 8);

    g.fillStyle(c, 1);
    g.lineStyle(2, h, 0.8);
    g.fillRoundedRect(-85, -30, 30, 70, 6);
    g.strokeRoundedRect(-85, -30, 30, 70, 6);
    g.fillRoundedRect(55, -30, 30, 70, 6);
    g.strokeRoundedRect(55, -30, 30, 70, 6);
    g.fillStyle(h, 1);
    g.fillRoundedRect(-83, 32, 26, 22, 5);
    g.fillRoundedRect(57, 32, 26, 22, 5);

    g.fillStyle(c, 1);
    g.lineStyle(2, h, 0.8);
    g.fillRoundedRect(-35, 45, 28, 50, 6);
    g.strokeRoundedRect(-35, 45, 28, 50, 6);
    g.fillRoundedRect(7, 45, 28, 50, 6);
    g.strokeRoundedRect(7, 45, 28, 50, 6);
    g.fillStyle(h, 0.9);
    g.fillRoundedRect(-45, 88, 42, 18, 5);
    g.fillRoundedRect(3, 88, 42, 18, 5);

    container.add(g);
  }

  private createEnemyMech(container: Phaser.GameObjects.Container) {
    const g = this.add.graphics();
    const c = 0x8b3a3a;
    const h = 0xe15d44;

    g.fillStyle(c, 1);
    g.lineStyle(3, h, 0.9);
    g.beginPath();
    g.moveTo(-65, 60);
    g.lineTo(-75, -20);
    g.lineTo(-40, -50);
    g.lineTo(40, -50);
    g.lineTo(75, -20);
    g.lineTo(65, 60);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(h, 0.5);
    g.fillTriangle(-30, -20, 0, -45, 30, -20);

    g.fillStyle(c, 1);
    g.lineStyle(3, h, 0.8);
    g.fillTriangle(-40, -50, -15, -115, 10, -55);
    g.strokeTriangle(-40, -50, -15, -115, 10, -55);
    g.fillTriangle(40, -50, 15, -115, -10, -55);
    g.strokeTriangle(40, -50, 15, -115, -10, -55);

    g.fillStyle(0xff0000, 0.95);
    g.fillCircle(-20, -85, 7);
    g.fillCircle(20, -85, 7);
    g.fillStyle(0xffff00, 1);
    g.fillCircle(-20, -85, 3);
    g.fillCircle(20, -85, 3);

    g.fillStyle(h, 1);
    g.fillTriangle(-30, -60, -25, -48, -20, -60);
    g.fillTriangle(30, -60, 25, -48, 20, -60);

    g.fillStyle(c, 1);
    g.lineStyle(3, h, 0.8);
    for (let i = 0; i < 3; i++) {
      const angle = -140 + i * 40;
      const rad = Phaser.Math.DegToRad(angle);
      const x1 = Math.cos(rad) * 15;
      const y1 = Math.sin(rad) * 10 - 10;
      const x2 = Math.cos(rad) * 70;
      const y2 = Math.sin(rad) * 60 + 30;
      g.lineStyle(12, c, 1);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(3, h, 0.9);
      g.lineBetween(x1, y1, x2, y2);
      g.fillStyle(h, 1);
      g.fillCircle(x2, y2, 8);
    }
    for (let i = 0; i < 3; i++) {
      const angle = -40 + i * 40;
      const rad = Phaser.Math.DegToRad(angle);
      const x1 = Math.cos(rad) * 15;
      const y1 = Math.sin(rad) * 10 - 10;
      const x2 = Math.cos(rad) * 70;
      const y2 = Math.sin(rad) * 60 + 30;
      g.lineStyle(12, c, 1);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(3, h, 0.9);
      g.lineBetween(x1, y1, x2, y2);
      g.fillStyle(h, 1);
      g.fillCircle(x2, y2, 8);
    }

    g.fillStyle(0x4a2020, 0.7);
    g.fillTriangle(-20, -20, 0, 10, 20, -20);
    g.fillStyle(h, 0.9);
    for (let i = 0; i < 4; i++) {
      g.fillTriangle(-18 + i * 12, -18 - i * 0.5, -12 + i * 12, -6 - i * 1, -6 + i * 12, -18 - i * 0.5);
    }

    container.add(g);
  }

  private createHpBars() {
    const { width } = this.scale;

    const createBar = (cx: number, cy: number, color: number) => {
      const barW = 220;
      const barH = 24;
      const bg = this.add.graphics();
      bg.fillStyle(0x121520, 0.95);
      bg.fillRoundedRect(cx - barW / 2 - 3, cy - 3, barW + 6, barH + 6, 8);
      bg.lineStyle(2, 0x4a4d55, 0.7);
      bg.strokeRoundedRect(cx - barW / 2 - 3, cy - 3, barW + 6, barH + 6, 8);

      const frame = this.add.graphics();
      frame.fillStyle(0x2a2d35, 1);
      frame.fillRoundedRect(cx - barW / 2, cy, barW, barH, 6);

      const bar = this.add.graphics();
      return { bar, cx, cy, barW, barH, color };
    };

    const playerBar = createBar(width * 0.22, 110, 0x5b8def);
    this.playerHpBar = playerBar.bar;

    const enemyBar = createBar(width * 0.78, 110, 0xe15d44);
    this.enemyHpBar = enemyBar.bar;

    this.updateHpBar(this.playerHpBar, this.playerMech.hp, this.playerMech.maxHp, 0x5b8def, playerBar.cx, playerBar.cy, playerBar.barW, playerBar.barH);
    this.updateHpBar(this.enemyHpBar, this.enemyMech.hp, this.enemyMech.maxHp, 0xe15d44, enemyBar.cx, enemyBar.cy, enemyBar.barW, enemyBar.barH);

    this.playerHpText = this.add.text(width * 0.22, 122, `${this.playerMech.hp} / ${this.playerMech.maxHp}`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.enemyHpText = this.add.text(width * 0.78, 122, `${this.enemyMech.hp} / ${this.enemyMech.maxHp}`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  private updateHpBar(bar: Phaser.GameObjects.Graphics, hp: number, maxHp: number, color: number, cx: number, cy: number, barW: number, barH: number) {
    bar.clear();
    const ratio = Math.max(0, hp / maxHp);
    const fillW = Math.max(3, barW * ratio);

    const t = ratio;
    const r = Math.round(Phaser.Math.Linear(225, 91, t));
    const g = Math.round(Phaser.Math.Linear(93, 141, t));
    const b = Math.round(Phaser.Math.Linear(68, 239, t));
    const gradColor = Phaser.Display.Color.GetColor(r, g, b);

    bar.fillStyle(gradColor, 1);
    bar.fillRoundedRect(cx - barW / 2, cy, fillW, barH, 5);

    bar.fillGradientStyle(0xffffff, gradColor, 0xffffff, gradColor, 0.4, 0.1, 0.4, 0.1);
    bar.fillRoundedRect(cx - barW / 2, cy, fillW, barH / 2, 5);

    bar.lineStyle(1, 0xffffff, 0.3);
    bar.strokeRoundedRect(cx - barW / 2 + 2, cy + 2, fillW - 4, 3, 2);
  }

  private createHUD() {
    const { width, height } = this.scale;

    const panelX = width / 2;
    const panelY = height * 0.42;
    const panelW = 440;
    const panelH = height * 0.28;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1d24, 0.85);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0xff8c42, 0.4);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);

    panel.fillStyle(0xff8c42, 0.15);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, 36, 12);

    this.add.text(panelX, panelY - panelH / 2 + 18, '⚔ 战斗日志', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ff8c42',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.logText = this.add.text(panelX - panelW / 2 + 20, panelY - panelH / 2 + 50, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '12px',
      color: '#cfd6e4',
      wordWrap: { width: panelW - 40 },
      lineSpacing: 5
    });
  }

  private simulateAndPlay() {
    const logs = this.battleResult.logs;
    const playNext = () => {
      if (this.currentLogIndex >= logs.length || this.isFinished) {
        this.finishBattle();
        return;
      }
      const log = logs[this.currentLogIndex];
      if (log.round !== this.currentRound) {
        this.currentRound = log.round;
        this.roundText.setText(`第 ${this.currentRound} / ${MAX_ROUNDS} 回合`);
        this.roundText.setScale(1.2);
        this.tweens.add({
          targets: this.roundText,
          scale: 1,
          duration: 300,
          ease: 'Cubic.Out'
        });
      }
      this.executeLog(log);
      this.currentLogIndex++;
      this.time.delayedCall(ROUND_INTERVAL / 2, playNext);
    };
    this.time.delayedCall(800, playNext);
  }

  private executeLog(log: BattleLogEntry) {
    const color = log.attacker === 'player' ? '#88b04b' : '#e15d44';
    const prefix = log.attacker === 'player' ? '🟢' : '🔴';
    const prevText = this.logText.text;
    const newLine = `${prefix} [回合${log.round}] ${log.action}: 造成 <color=${color}>-${log.damage}</color>  HP:${log.defenderHp}\n`;
    this.logText.setText(prevText + newLine);

    const { width, height } = this.scale;
    if (log.attacker === 'player') {
      this.enemyMech.hp = log.defenderHp;
      const target = this.enemyContainer;
      this.tweens.add({
        targets: this.playerContainer,
        x: width * 0.22 + 40,
        duration: 200,
        ease: 'Cubic.Out',
        yoyo: true,
        hold: 50
      });
      this.time.delayedCall(180, () => {
        this.shakeTarget(target);
        this.showFloatingText(width * 0.78, height * 0.5, `-${log.damage}`, 0xff4444);
        this.spawnHitFx(width * 0.78, height * 0.55);
      });
      const barData = { cx: width * 0.78, cy: 110, barW: 220, barH: 24 };
      this.tweenHp(this.enemyHpBar, this.enemyMech.hp + log.damage, this.enemyMech.hp, this.enemyMech.maxHp, 0xe15d44, barData);
      this.enemyHpText.setText(`${Math.max(0, log.defenderHp)} / ${this.enemyMech.maxHp}`);
    } else {
      this.playerMech.hp = log.defenderHp;
      const target = this.playerContainer;
      this.tweens.add({
        targets: this.enemyContainer,
        x: width * 0.78 - 40,
        duration: 200,
        ease: 'Cubic.Out',
        yoyo: true,
        hold: 50
      });
      this.time.delayedCall(180, () => {
        this.shakeTarget(target);
        this.showFloatingText(width * 0.22, height * 0.5, `-${log.damage}`, 0xff4444);
        this.spawnHitFx(width * 0.22, height * 0.55);
      });
      const barData = { cx: width * 0.22, cy: 110, barW: 220, barH: 24 };
      this.tweenHp(this.playerHpBar, this.playerMech.hp + log.damage, this.playerMech.hp, this.playerMech.maxHp, 0x5b8def, barData);
      this.playerHpText.setText(`${Math.max(0, log.defenderHp)} / ${this.playerMech.maxHp}`);
    }
  }

  private tweenHp(bar: Phaser.GameObjects.Graphics, fromHp: number, toHp: number, maxHp: number, color: number, data: { cx: number; cy: number; barW: number; barH: number }) {
    this.tweens.addCounter({
      from: fromHp,
      to: toHp,
      duration: 400,
      ease: 'Cubic.Out',
      onUpdate: (t: Phaser.Tweens.Tween) => {
        this.updateHpBar(bar, t.getValue(), maxHp, color, data.cx, data.cy, data.barW, data.barH);
      }
    });
  }

  private shakeTarget(target: Phaser.GameObjects.Container) {
    const origX = target.x;
    this.tweens.add({
      targets: target,
      x: origX + Phaser.Math.Between(-8, 8),
      y: Phaser.Math.Between(-4, 4),
      duration: 40,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        target.x = origX;
        target.y = 0;
      }
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: number) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#1a1d24',
      strokeThickness: 4
    }).setOrigin(0.5);
    t.setAlpha(0);
    t.setScale(0.5);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 1,
      scale: 1.2,
      duration: 200,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t,
          y: y - 120,
          alpha: 0,
          scale: 0.8,
          duration: 500,
          delay: 400,
          ease: 'Cubic.In',
          onComplete: () => t.destroy()
        });
      }
    });
    this.floatingTexts.push(t);
  }

  private spawnHitFx(x: number, y: number) {
    const fx = this.add.graphics();
    const color = 0xff8c42;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;
      fx.lineStyle(3, color, 0.9);
      fx.lineBetween(x, y, x + Math.cos(angle) * 10, y + Math.sin(angle) * 10);
      this.tweens.addCounter({
        from: 10,
        to: distance,
        duration: 250,
        ease: 'Cubic.Out',
        onUpdate: (t) => {
          fx.clear();
          const d = t.getValue();
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * Math.PI * 2;
            const ex = x + Math.cos(a) * d;
            const ey = y + Math.sin(a) * d;
            fx.lineStyle(3, color, 1 - d / distance);
            fx.lineBetween(x, y, ex, ey);
          }
        },
        onComplete: () => fx.destroy()
      });
    }
    const flash = this.add.graphics();
    flash.fillStyle(color, 0.6);
    flash.fillCircle(x, y, 30);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 250,
      ease: 'Cubic.Out',
      onComplete: () => flash.destroy()
    });
  }

  private finishBattle() {
    if (this.isFinished) return;
    this.isFinished = true;
    this.time.delayedCall(1000, () => this.showResultModal());
  }

  private showResultModal() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);

    const mw = 480;
    const mh = 360;
    const mx = (width - mw) / 2;
    const my = (height - mh) / 2;

    const modal = this.add.container(mx, my);
    modal.setScale(0.3);
    modal.setAlpha(0);

    const winner = this.battleResult.winner;
    const isWin = winner === 'player';
    const isDraw = winner === 'draw';

    const title = isWin ? '🏆 战斗胜利!' : isDraw ? '⚖ 战斗平局' : '💀 战斗失败';
    const titleColor = isWin ? 0x88b04b : isDraw ? 0xf7b500 : 0xe15d44;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e2230, 0.98);
    panel.fillRoundedRect(0, 0, mw, mh, 16);
    panel.lineStyle(3, titleColor, 0.9);
    panel.strokeRoundedRect(0, 0, mw, mh, 16);
    modal.add(panel);

    const glow = this.add.graphics();
    glow.lineStyle(8, titleColor, 0.2 + Math.sin(this.time.now / 200) * 0.1);
    glow.strokeRoundedRect(-4, -4, mw + 8, mh + 8, 18);
    modal.add(glow);

    modal.add(this.add.text(mw / 2, 60, title, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: '#' + titleColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#1a1d24',
      strokeThickness: 4
    }).setOrigin(0.5));

    const summary1 = `共进行 ${this.battleResult.rounds} 回合`;
    modal.add(this.add.text(mw / 2, 115, summary1, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfd6e4'
    }).setOrigin(0.5));

    const stats = [
      { label: '我方剩余HP', val: `${Math.max(0, this.playerMech.hp)} / ${this.playerMech.maxHp}`, color: '#5b8def' },
      { label: '敌方剩余HP', val: `${Math.max(0, this.enemyMech.hp)} / ${this.enemyMech.maxHp}`, color: '#e15d44' }
    ];
    stats.forEach((s, i) => {
      const yy = 155 + i * 36;
      const itemBg = this.add.graphics();
      itemBg.fillStyle(0x121520, 0.9);
      itemBg.fillRoundedRect(40, yy - 14, mw - 80, 28, 6);
      modal.add(itemBg);
      modal.add(this.add.text(56, yy, s.label, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#9fb0c8'
      }));
      modal.add(this.add.text(mw - 56, yy, s.val, {
        fontFamily: 'Consolas, monospace',
        fontSize: '14px',
        color: s.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0));
    });

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(isWin ? 0x88b04b : isDraw ? 0xf7b500 : 0xe15d44, 0.95);
    confirmBtn.fillRoundedRect(mw / 2 - 90, mh - 80, 180, 48, 10);
    confirmBtn.lineStyle(2, 0xffffff, 0.4);
    confirmBtn.strokeRoundedRect(mw / 2 - 90, mh - 80, 180, 48, 10);
    modal.add(confirmBtn);
    const btnText = this.add.text(mw / 2, mh - 56, '返回组装台', {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#1a1d24',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(btnText);

    this.add.zone(mw / 2, mh - 56, 180, 48).setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.tweens.add({ targets: [confirmBtn, btnText], scaleX: 1.05, scaleY: 1.05, x: mw / 2, y: mh - 56, duration: 120 });
      })
      .on('pointerout', () => {
        this.tweens.add({ targets: [confirmBtn, btnText], scaleX: 1, scaleY: 1, duration: 120 });
      })
      .on('pointerdown', () => {
        confirmBtn.y = 2;
        btnText.y = mh - 54;
      })
      .on('pointerup', () => {
        confirmBtn.y = 0;
        btnText.y = mh - 56;
        this.onComplete(this.battleResult);
      });
    modal.add(this.add.zone(mw / 2, mh / 2, mw, mh));

    this.tweens.add({
      targets: modal,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.Out'
    });

    const centerX = mx + mw / 2;
    const centerY = my + mh / 2;
    for (let i = 0; i < 25; i++) {
      const angle = (i / 25) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 100 + Math.random() * 100;
      const particle = this.add.circle(centerX, centerY, 4 + Math.random() * 4, titleColor, 0.95);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      const tx = centerX + Math.cos(angle) * speed;
      const ty = centerY + Math.sin(angle) * speed + 50;
      this.tweens.add({
        targets: particle,
        x: tx,
        y: ty,
        alpha: 0,
        scale: 0.2,
        duration: 800 + Math.random() * 300,
        ease: 'Cubic.Out',
        onComplete: () => particle.destroy()
      });
    }
  }
}
