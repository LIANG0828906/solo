import Phaser from 'phaser';
import { BADGE_DEFS, BadgeTier, badgeManager } from './BadgeManager';

export interface ScoreUpdate {
  score: number;
  combo: number;
  progress: number;
}

export interface GameEndData {
  score: number;
  perfect: number;
  good: number;
  miss: number;
  badges: BadgeTier[];
}

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private progressBarBg!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private badgeIcons: Phaser.GameObjects.Container[] = [];
  private currentScore = 0;
  private targetScore = 0;
  private scoreTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.scoreText = this.add.text(24, 24, '0', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Segoe UI, PingFang SC, Microsoft YaHei, sans-serif'
    }).setScrollFactor(0);
    this.scoreText.setShadow(0, 0, 'rgba(0,0,0,0.8)', 16, true, true);

    this.comboText = this.add.text(24, 74, '', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00e5ff',
      fontFamily: 'Segoe UI, PingFang SC, Microsoft YaHei, sans-serif'
    }).setScrollFactor(0);
    this.comboText.setShadow(0, 0, 'rgba(0,229,255,0.9)', 10, true, true);

    this.progressBarBg = this.add.graphics();
    this.progressBar = this.add.graphics();
    this.drawProgress(0);

    this.createBadgeMiniIcons();

    const beatScene = this.scene.get('BeatScene');
    beatScene.events.on('scoreUpdate', this.onScoreUpdate, this);
    beatScene.events.on('gameEnd', this.onGameEnd, this);

    this.events.once('shutdown', () => {
      beatScene.events.off('scoreUpdate', this.onScoreUpdate, this);
      beatScene.events.off('gameEnd', this.onGameEnd, this);
    });
  }

  private createBadgeMiniIcons(): void {
    const { width } = this.scale;
    const container = this.add.container(width - 24, 44);
    let x = 0;
    for (const def of BADGE_DEFS) {
      const icon = this.createMiniBadge(def.id);
      icon.setX(x);
      icon.setData('tier', def.id);
      icon.setAlpha(0.25);
      container.add(icon);
      this.badgeIcons.push(icon);
      x += 52;
    }
    container.setX(width - 24 - x + 52);
  }

  private createMiniBadge(tier: BadgeTier): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    if (tier === 'bronze') {
      const ring = this.add.circle(0, 0, 20, 0xcd7f32, 0.95)
        .setStrokeStyle(2, 0x6b3e14, 1);
      const note = this.add.text(0, 2, '♪', {
        fontSize: '22px', color: '#3d1f08', fontStyle: 'bold'
      }).setOrigin(0.5);
      c.add([ring, note]);
    } else if (tier === 'silver') {
      const star = this.add.polygon(0, 0, [
        0,-22, 7,-7, 22,-7, 10,3, 14,20, 0,10, -14,20, -10,3, -22,-7, -7,-7
      ], 0xd0d0d0, 0.95).setStrokeStyle(2, 0x5a5a5a, 1);
      c.add(star);
    } else {
      const crown = this.add.triangle(0, -4, -22, 10, 0, -18, 22, 10, 0xffd700, 0.95)
        .setStrokeStyle(2, 0x8a6200, 1);
      const base = this.add.ellipse(0, 10, 36, 10, 0xffd700, 0.95)
        .setStrokeStyle(2, 0x8a6200, 1);
      c.add([crown, base]);
    }
    return c;
  }

  private drawProgress(progress: number): void {
    const { width } = this.scale;
    const y = this.scale.height - 30;
    const barW = width - 80;
    const barH = 8;
    const x = 40;

    this.progressBarBg.clear();
    this.progressBarBg.fillStyle(0xffffff, 0.12);
    this.progressBarBg.fillRoundedRect(x, y, barW, barH, 4);

    this.progressBar.clear();
    const fillW = Math.max(0.0001, Math.min(1, progress)) * barW;
    if (fillW > 1) {
      const steps = Math.max(2, Math.ceil(fillW / 4));
      const stepW = fillW / steps;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const r = Phaser.Math.Linear(0, 255, t);
        const g = Phaser.Math.Linear(229, 77, t);
        const b = Phaser.Math.Linear(255, 210, t);
        const color = Phaser.Display.Color.GetColor(Math.round(r), Math.round(g), Math.round(b));
        this.progressBar.fillStyle(color, 1);
        const sx = x + i * stepW;
        const sw = Math.min(stepW + 0.5, x + fillW - sx);
        this.progressBar.fillRect(sx, y, sw, barH);
      }
      this.progressBar.setVisible(true);
    } else {
      this.progressBar.setVisible(false);
    }
  }

  private onScoreUpdate(data: ScoreUpdate): void {
    if (data.score !== this.targetScore) {
      this.targetScore = data.score;
      if (this.scoreTween) this.scoreTween.remove();
      this.scoreTween = this.tweens.addCounter({
        from: this.currentScore,
        to: this.targetScore,
        duration: 260,
        ease: 'Cubic.easeOut',
        onUpdate: t => {
          const val = t.getValue();
          this.currentScore = Math.round(val != null ? val : this.targetScore);
          this.scoreText.setText(String(this.currentScore));
        }
      });
    }

    let color = '#ffffff';
    let shadowColor = 'rgba(0,0,0,0.8)';
    if (data.combo >= 10) {
      color = '#ffd700';
      shadowColor = 'rgba(255,215,0,0.9)';
    } else if (data.combo >= 5) {
      color = '#00e5ff';
      shadowColor = 'rgba(0,229,255,0.9)';
    }
    this.scoreText.setColor(color);
    this.scoreText.setShadow(0, 0, shadowColor, data.combo >= 10 ? 18 : 16, true, true);

    if (data.combo > 0) {
      this.comboText.setText(`${data.combo} COMBO`);
    } else {
      this.comboText.setText('');
    }

    this.drawProgress(data.progress);
    this.updateBadgeIcons();
  }

  private updateBadgeIcons(): void {
    const unlocked = badgeManager.getUnlocked();
    for (const icon of this.badgeIcons) {
      const tier = icon.getData('tier') as BadgeTier;
      const isUnlocked = unlocked.includes(tier);
      const targetAlpha = isUnlocked ? 1 : 0.25;
      if (Math.abs(icon.alpha - targetAlpha) > 0.01) {
        this.tweens.add({
          targets: icon,
          alpha: targetAlpha,
          scale: isUnlocked ? { from: 0.6, to: 1.15 } : 1,
          duration: 420,
          ease: 'Back.easeOut'
        });
      }
    }
  }

  private onGameEnd(data: GameEndData): void {
    (window as any).__showResultPanel?.(data);
  }
}
