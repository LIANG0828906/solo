import Phaser from 'phaser';

export class UIManager {
  private scene: Phaser.Scene;

  public score: number = 0;
  public combo: number = 0;
  public maxCombo: number = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboGlow!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  private centerBeatRing!: Phaser.GameObjects.Arc;
  private outerBeatRing1!: Phaser.GameObjects.Arc;
  private outerBeatRing2!: Phaser.GameObjects.Arc;
  private outerBeatRing3!: Phaser.GameObjects.Arc;
  private beatTargetRing!: Phaser.GameObjects.Arc;

  private edgeGlowTop!: Phaser.GameObjects.Rectangle;
  private edgeGlowBottom!: Phaser.GameObjects.Rectangle;
  private edgeGlowLeft!: Phaser.GameObjects.Rectangle;
  private edgeGlowRight!: Phaser.GameObjects.Rectangle;

  private screenFlash!: Phaser.GameObjects.Rectangle;
  private particlePool: Phaser.GameObjects.Arc[] = [];
  private floatingTexts: Phaser.GameObjects.Text[] = [];

  private gameWidth: number;
  private gameHeight: number;

  constructor(scene: Phaser.Scene, gameWidth: number, gameHeight: number) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.createScoreDisplay();
    this.createComboDisplay();
    this.createBeatIndicator();
    this.createEdgeGlow();
    this.createScreenFlash();
    this.createHintText();
    this.initParticlePool();
  }

  private createScoreDisplay(): void {
    this.scoreText = this.scene.add.text(this.gameWidth - 20, 20, '分数: 0', {
      fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setDepth(100);
    this.scoreText.setShadow(0, 0, 15, 'rgba(255, 215, 0, 0.8)', true, true);
  }

  private createComboDisplay(): void {
    this.comboText = this.scene.add.text(20, 20, '连击: 0', {
      fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.comboText.setOrigin(0, 0);
    this.comboText.setDepth(100);

    this.comboGlow = this.scene.add.text(20, 20, '连击: 0', {
      fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.comboGlow.setOrigin(0, 0);
    this.comboGlow.setDepth(99);
    this.comboGlow.setAlpha(0);
  }

  private createBeatIndicator(): void {
    const cx = this.gameWidth / 2;
    const cy = this.gameHeight / 2;

    this.outerBeatRing3 = this.scene.add.circle(cx, cy, 100, 0x000000, 0);
    this.outerBeatRing3.setStrokeStyle(3, 0xffd700, 0.15);
    this.outerBeatRing3.setDepth(200);

    this.outerBeatRing2 = this.scene.add.circle(cx, cy, 75, 0x000000, 0);
    this.outerBeatRing2.setStrokeStyle(3, 0xffd700, 0.25);
    this.outerBeatRing2.setDepth(200);

    this.outerBeatRing1 = this.scene.add.circle(cx, cy, 50, 0x000000, 0);
    this.outerBeatRing1.setStrokeStyle(3, 0xffd700, 0.4);
    this.outerBeatRing1.setDepth(200);

    this.beatTargetRing = this.scene.add.circle(cx, cy, 30, 0x000000, 0);
    this.beatTargetRing.setStrokeStyle(4, 0xffd700, 0.9);
    this.beatTargetRing.setDepth(200);

    this.centerBeatRing = this.scene.add.circle(cx, cy, 8, 0xffd700, 0.9);
    this.centerBeatRing.setDepth(200);
  }

  private createEdgeGlow(): void {
    const glowSize = 30;
    const alpha = 0.3;

    this.edgeGlowTop = this.scene.add.rectangle(
      this.gameWidth / 2, glowSize / 2, this.gameWidth, glowSize, 0xffd700, 0
    );
    this.edgeGlowTop.setDepth(150);
    this.edgeGlowTop.setAlpha(alpha);

    this.edgeGlowBottom = this.scene.add.rectangle(
      this.gameWidth / 2, this.gameHeight - glowSize / 2, this.gameWidth, glowSize, 0xffd700, 0
    );
    this.edgeGlowBottom.setDepth(150);
    this.edgeGlowBottom.setAlpha(alpha);

    this.edgeGlowLeft = this.scene.add.rectangle(
      glowSize / 2, this.gameHeight / 2, glowSize, this.gameHeight, 0xffd700, 0
    );
    this.edgeGlowLeft.setDepth(150);
    this.edgeGlowLeft.setAlpha(alpha);

    this.edgeGlowRight = this.scene.add.rectangle(
      this.gameWidth - glowSize / 2, this.gameHeight / 2, glowSize, this.gameHeight, 0xffd700, 0
    );
    this.edgeGlowRight.setDepth(150);
    this.edgeGlowRight.setAlpha(alpha);
  }

  private createScreenFlash(): void {
    this.screenFlash = this.scene.add.rectangle(
      this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0xffffff, 0
    );
    this.screenFlash.setDepth(180);
  }

  private createHintText(): void {
    this.hintText = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight - 30,
      '方向键移动 | 空格攻击 | 跟随节拍行动！',
      {
        fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#9966cc',
        fontStyle: 'normal'
      }
    );
    this.hintText.setOrigin(0.5);
    this.hintText.setDepth(100);
    this.hintText.setAlpha(0.7);
  }

  private initParticlePool(): void {
    for (let i = 0; i < 60; i++) {
      const particle = this.scene.add.circle(0, 0, 3, 0xffd700, 0);
      particle.setDepth(90);
      particle.setVisible(false);
      this.particlePool.push(particle);
    }
  }

  updateBeatIndicator(progress: number): void {
    const maxRadius = 100;
    const targetRadius = 30;

    const easedProgress = Phaser.Math.Easing.Quadratic.InOut(progress);
    const currentRadius = maxRadius - (maxRadius - targetRadius) * easedProgress;

    this.outerBeatRing3.setRadius(maxRadius);
    this.outerBeatRing2.setRadius(currentRadius + 25 > maxRadius ? maxRadius : currentRadius + 25);
    this.outerBeatRing1.setRadius(currentRadius);

    const pulse = Math.sin(progress * Math.PI * 2) * 0.15 + 0.85;
    this.beatTargetRing.setScale(pulse);

    const ringAlpha = Math.sin(progress * Math.PI) * 0.6 + 0.4;
    this.outerBeatRing1.setStrokeStyle(3, 0xffd700, ringAlpha);
  }

  flashScreen(): void {
    this.scene.tweens.add({
      targets: this.screenFlash,
      fillAlpha: { from: 0, to: 0.08 },
      duration: 60,
      yoyo: true,
      ease: Phaser.Math.Easing.Linear
    });

    const edgeGlows = [this.edgeGlowTop, this.edgeGlowBottom, this.edgeGlowLeft, this.edgeGlowRight];
    edgeGlows.forEach((glow, idx) => {
      this.scene.tweens.add({
        targets: glow,
        fillAlpha: { from: 0, to: 0.5 },
        duration: 80,
        delay: idx * 10,
        yoyo: true,
        ease: Phaser.Math.Easing.Sine.Out
      });
    });

    this.scene.tweens.add({
      targets: this.centerBeatRing,
      scale: { from: 1, to: 2 },
      alpha: { from: 0.9, to: 0.3 },
      duration: 200,
      yoyo: true,
      ease: Phaser.Math.Easing.Back.Out
    });
  }

  addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`分数: ${this.score}`);

    this.scene.tweens.add({
      targets: this.scoreText,
      scale: { from: 1, to: 1.15 },
      duration: 100,
      yoyo: true,
      ease: Phaser.Math.Easing.Back.Out
    });
  }

  incrementCombo(): void {
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.updateComboDisplay();

    this.scene.tweens.add({
      targets: [this.comboText, this.comboGlow],
      scale: { from: 1, to: 1.3 },
      duration: 120,
      yoyo: true,
      ease: Phaser.Math.Easing.Back.Out
    });

    if (this.combo >= 5) {
      this.scene.tweens.add({
        targets: this.comboGlow,
        alpha: { from: 0.8, to: 0 },
        duration: 200,
        ease: Phaser.Math.Easing.Quadratic.Out
      });
    }
  }

  resetCombo(): void {
    if (this.combo > 0) {
      this.combo = 0;
      this.updateComboDisplay();
    }
  }

  private updateComboDisplay(): void {
    this.comboText.setText(`连击: ${this.combo}`);
    this.comboGlow.setText(`连击: ${this.combo}`);

    if (this.combo >= 10) {
      this.comboText.setColor('#ff4444');
    } else if (this.combo >= 5) {
      this.comboText.setColor('#ffaa00');
    } else {
      this.comboText.setColor('#ffd700');
    }
  }

  createParticles(x: number, y: number, type: 'hit' | 'death' | 'note'): void {
    const count = type === 'death' ? 20 : type === 'note' ? 12 : 8;
    const colors = type === 'hit'
      ? [0xffd700, 0xffb347, 0xffffff]
      : type === 'death'
      ? [0xff4444, 0xffd700, 0x8800ff, 0xffffff]
      : [0xffd700, 0xffffaa, 0xffffff];

    for (let i = 0; i < count; i++) {
      const particle = this.getPooledParticle();
      if (!particle) continue;

      particle.setPosition(x, y);
      particle.setVisible(true);
      particle.setAlpha(1);
      particle.setFillStyle(colors[Math.floor(Math.random() * colors.length)], 1);
      particle.setRadius(2 + Math.random() * 4);
      particle.setScale(1);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.2 },
        duration: 400 + Math.random() * 300,
        ease: Phaser.Math.Easing.Cubic.Out,
        onComplete: () => {
          particle.setVisible(false);
        }
      });
    }
  }

  private getPooledParticle(): Phaser.GameObjects.Arc | null {
    for (const p of this.particlePool) {
      if (!p.visible) return p;
    }
    const newP = this.scene.add.circle(0, 0, 3, 0xffd700, 0);
    newP.setDepth(90);
    newP.setVisible(false);
    this.particlePool.push(newP);
    return newP;
  }

  showFloatingText(x: number, y: number, text: string, color: string = '#ffd700'): void {
    const floating = this.scene.add.text(x, y, text, {
      fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color,
      fontStyle: 'bold'
    });
    floating.setOrigin(0.5);
    floating.setDepth(95);
    floating.setShadow(0, 0, 8, 'rgba(0,0,0,0.8)', true, true);

    this.floatingTexts.push(floating);

    this.scene.tweens.add({
      targets: floating,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.3 },
      duration: 800,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        floating.destroy();
        const idx = this.floatingTexts.indexOf(floating);
        if (idx > -1) this.floatingTexts.splice(idx, 1);
      }
    });
  }

  showGameOver(win: boolean, finalScore: number): void {
    const overlay = this.scene.add.rectangle(
      this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0x000000, 0.7
    );
    overlay.setDepth(300);

    const title = win ? '胜利！' : '游戏结束';
    const titleColor = win ? '#ffd700' : '#ff4444';

    const gameOverText = this.scene.add.text(this.gameWidth / 2, this.gameHeight / 2 - 40, title, {
      fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
      fontSize: '48px',
      color: titleColor,
      fontStyle: 'bold'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(301);
    gameOverText.setShadow(0, 0, 30, titleColor, true, true);
    gameOverText.setAlpha(0);

    const scoreText = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2 + 20,
      `最终分数: ${finalScore}\n最高连击: ${this.maxCombo}`,
      {
        fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#ffd700',
        align: 'center'
      }
    );
    scoreText.setOrigin(0.5);
    scoreText.setDepth(301);
    scoreText.setAlpha(0);

    const restartText = this.scene.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2 + 100,
      '点击任意位置重新开始',
      {
        fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#aa88ff'
      }
    );
    restartText.setOrigin(0.5);
    restartText.setDepth(301);
    restartText.setAlpha(0);

    this.scene.tweens.add({
      targets: [gameOverText, scoreText, restartText],
      alpha: 1,
      duration: 800,
      delay: 300,
      ease: Phaser.Math.Easing.Quadratic.Out
    });

    this.scene.input.once('pointerdown', () => {
      this.scene.scene.restart();
    });
  }

  fadeInUI(duration: number = 600): void {
    const elements = [
      this.scoreText, this.comboText, this.comboGlow,
      this.hintText, this.beatTargetRing, this.centerBeatRing,
      this.outerBeatRing1, this.outerBeatRing2, this.outerBeatRing3
    ];

    elements.forEach((el, i) => {
      el.setAlpha(0);
      this.scene.tweens.add({
        targets: el,
        alpha: i === 2 ? 0 : (el === this.hintText ? 0.7 : 1),
        duration,
        delay: i * 50,
        ease: Phaser.Math.Easing.Quadratic.Out
      });
    });
  }

  setHintText(text: string): void {
    this.hintText.setText(text);
  }

  destroy(): void {
    this.particlePool.forEach(p => p.destroy());
    this.floatingTexts.forEach(t => t.destroy());
  }
}
