import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../main';

export class MenuScene extends Phaser.Scene {
  private selectedLevel = 0;
  private totalLevels = 3;
  private stars: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.createParticleTexture();
  }

  private createParticleTexture(): void {
    if (this.textures.exists('particle')) return;
    const gfx = this.make.graphics();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(16, 16, 16);
    gfx.generateTexture('particle', 32, 32);
    gfx.destroy();
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createLevelSelect();
    this.createStartButton();
    this.createControlsInfo();
    this.createRewindTutorial();
  }

  private createBackground(): void {
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x0a0a2e, 0x1a1a4e, 0x0d0d3a, 0x151550, 1);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2.5);
      const star = this.add.graphics();
      const color = Phaser.Utils.Array.GetRandom([0xffffff, 0x88aaff, 0xffaaff, 0xaaffff]);
      star.fillStyle(color, Phaser.Math.FloatBetween(0.4, 0.9));
      star.fillCircle(x, y, size);
      this.stars.push(star);
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.2, 0.9),
        duration: Phaser.Math.Between(1500, 4000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        this.stars.forEach(s => {
          s.y += Phaser.Math.FloatBetween(0.05, 0.2);
          if (s.y > GAME_HEIGHT) {
            s.y = 0;
            s.x = Phaser.Math.Between(0, GAME_WIDTH);
          }
        });
      }
    });
  }

  private createTitle(): void {
    const glow = this.add.graphics();
    this.createGlowText(GAME_WIDTH / 2, 100, glow, 0x8a2be2, 0.08);

    const title = this.add.text(GAME_WIDTH / 2, 100, '时间倒流', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '72px',
      color: '#e0b0ff'
    }).setOrigin(0.5);
    title.setFontStyle('bold');
    title.setStroke('#00ffff', 4);
    title.setShadow(4, 4, 'rgba(0,255,255,0.5)', 8, true, true);

    const subtitle = this.add.text(GAME_WIDTH / 2, 170, '记忆碎片 · Memory Fragments', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '28px',
      color: '#00ffff'
    }).setOrigin(0.5);
    subtitle.setStroke('#7b2fbe', 2);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.03 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createGlowText(x: number, y: number, gfx: Phaser.GameObjects.Graphics, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    for (let r = 150; r > 0; r -= 10) {
      gfx.fillCircle(x, y, r);
    }
  }

  private createLevelSelect(): void {
    const containerY = 260;
    this.add.text(GAME_WIDTH / 2, containerY, '选择关卡', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '32px',
      color: '#aaffff'
    }).setOrigin(0.5).setFontStyle('bold');

    const spacing = 180;
    const startX = GAME_WIDTH / 2 - spacing;

    for (let i = 0; i < this.totalLevels; i++) {
      this.createLevelCard(startX + i * spacing, containerY + 70, i + 1, i === 0);
    }
  }

  private createLevelCard(x: number, y: number, level: number, unlocked: boolean): void {
    const card = this.add.container(x, y);
    const cardGfx = this.add.graphics();
    cardGfx.lineStyle(2, unlocked ? 0x00ffff : 0x555577, 1);
    cardGfx.fillStyle(unlocked ? 0x1a0a3e : 0x15152a, 0.9);
    cardGfx.fillRoundedRect(-70, -80, 140, 160, 12);
    cardGfx.strokeRoundedRect(-70, -80, 140, 160, 12);
    card.add(cardGfx);

    if (!unlocked) {
      const lock = this.add.text(0, -10, '🔒', { fontSize: '42px' }).setOrigin(0.5);
      card.add(lock);
    } else {
      const num = this.add.text(0, -25, String(level), {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '52px',
        color: '#ffd700'
      }).setOrigin(0.5);
      num.setFontStyle('bold');
      num.setStroke('#ff6600', 3);
      card.add(num);

      const name = this.add.text(0, 30, this.getLevelName(level), {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        color: '#ccffff'
      }).setOrigin(0.5);
      card.add(name);

      card.setSize(140, 160);
      card.setInteractive({ useHandCursor: true });

      const isSelected = () => this.selectedLevel === level - 1;

      card.on('pointerover', () => {
        this.tweens.add({ targets: card, scale: 1.06, duration: 150 });
        cardGfx.clear();
        cardGfx.lineStyle(3, 0x39ff14, 1);
        cardGfx.fillStyle(0x2a1a4e, 0.95);
        cardGfx.fillRoundedRect(-70, -80, 140, 160, 12);
        cardGfx.strokeRoundedRect(-70, -80, 140, 160, 12);
      });
      card.on('pointerout', () => {
        this.tweens.add({ targets: card, scale: 1, duration: 150 });
        const selColor = isSelected() ? 0xffd700 : 0x00ffff;
        cardGfx.clear();
        cardGfx.lineStyle(isSelected() ? 3 : 2, selColor, 1);
        cardGfx.fillStyle(isSelected() ? 0x2a1a3e : 0x1a0a3e, 0.9);
        cardGfx.fillRoundedRect(-70, -80, 140, 160, 12);
        cardGfx.strokeRoundedRect(-70, -80, 140, 160, 12);
      });
      card.on('pointerdown', () => {
        this.selectedLevel = level - 1;
      });
    }
  }

  private getLevelName(n: number): string {
    return ['时光初醒', '裂隙迷途', '归墟之境'][n - 1] || '未知';
  }

  private createStartButton(): void {
    const btnGfx = this.add.graphics();
    const btnX = GAME_WIDTH / 2;
    const btnY = 510;
    const w = 260, h = 70;

    const drawBtn = (hover: boolean) => {
      btnGfx.clear();
      btnGfx.fillGradientStyle(
        hover ? 0x8a2be2 : 0x6b1fc2,
        hover ? 0x9d4edd : 0x7b2fbe,
        hover ? 0x4b0082 : 0x483d8b,
        hover ? 0x6a0dad : 0x551a8b, 1);
      btnGfx.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      btnGfx.lineStyle(3, hover ? 0x39ff14 : 0x00ffff, 1);
      btnGfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    };
    drawBtn(false);

    const btn = this.add.container(btnX, btnY, [btnGfx]);
    const btnText = this.add.text(0, 0, '开 始 游 戏', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '30px',
      color: '#ffffff'
    }).setOrigin(0.5);
    btnText.setFontStyle('bold');
    btnText.setStroke('#000000', 2);
    btn.add(btnText);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { drawBtn(true); this.tweens.add({ targets: btn, scale: 1.04, duration: 120 }); });
    btn.on('pointerout', () => { drawBtn(false); this.tweens.add({ targets: btn, scale: 1, duration: 120 }); });
    btn.on('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    this.cameras.main.fadeOut(500, 10, 0, 30);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { level: this.selectedLevel + 1 });
    });
  }

  private createControlsInfo(): void {
    const box = this.add.graphics();
    box.lineStyle(1, 0x6a5acd, 0.6);
    box.fillStyle(0x15153a, 0.7);
    box.fillRoundedRect(50, GAME_HEIGHT - 180, 340, 130, 10);
    box.strokeRoundedRect(50, GAME_HEIGHT - 180, 340, 130, 10);

    const info = [
      ['移动', '← →  /  A D'],
      ['跳跃', '↑ / W / Space'],
      ['时间倒流', '按住 Shift']
    ];
    info.forEach((row, i) => {
      this.add.text(80, GAME_HEIGHT - 155 + i * 36, row[0], {
        fontFamily: 'Segoe UI, Arial',
        fontSize: '18px',
        color: '#88ddff'
      });
      const keyText = this.add.text(220, GAME_HEIGHT - 155 + i * 36, row[1], {
        fontFamily: 'Consolas, monospace',
        fontSize: '16px',
        color: '#ffdd66',
        backgroundColor: '#00000055'
      });
      keyText.setPadding(8, 2, 8, 2);
    });
  }

  private createRewindTutorial(): void {
    const baseX = GAME_WIDTH - 280;
    const baseY = GAME_HEIGHT - 180;

    const box = this.add.graphics();
    box.lineStyle(1, 0xff00ff, 0.6);
    box.fillStyle(0x1a0a2e, 0.7);
    box.fillRoundedRect(baseX - 30, baseY - 20, 270, 130, 10);
    box.strokeRoundedRect(baseX - 30, baseY - 20, 270, 130, 10);

    this.add.text(baseX, baseY, '倒流教学', {
      fontFamily: 'Segoe UI, Arial',
      fontSize: '20px',
      color: '#ff88ff'
    }).setFontStyle('bold');

    const demo = this.add.container(baseX + 100, baseY + 65);
    const trail: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 10; i++) {
      const d = this.add.circle(0, 0, 6 - i * 0.4, 0x00ffff, 0.3 - i * 0.025);
      trail.push(d);
      demo.add(d);
    }
    const charDot = this.add.circle(0, 0, 10, 0xff00ff, 0.9);
    charDot.setStrokeStyle(2, 0xffffff, 1);
    demo.add(charDot);

    const path = new Phaser.Curves.Ellipse(0, 0, 60, 35);

    const rippleGfx = this.add.graphics();
    demo.add(rippleGfx);

    let t = 0;
    let rewinding = false;
    const positions: Array<{x:number,y:number}> = [];
    let posIdx = 0;

    this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (positions.length > 80) positions.shift();

        if (!rewinding) {
          t += 0.015;
          const p = path.getPoint(t % 1);
          positions.push({ x: p.x * 1, y: p.y * 1 });
          posIdx = positions.length - 1;
          rippleGfx.clear();
        } else {
          posIdx = Math.max(0, posIdx - 2);
          const pulse = Math.abs(Math.sin(this.time.now * 0.01)) * 50 + 10;
          rippleGfx.clear();
          rippleGfx.lineStyle(2, 0x00ffff, 0.7 - pulse / 200);
          rippleGfx.strokeCircle(0, 0, pulse);
          rippleGfx.lineStyle(1, 0xff00ff, 0.5 - pulse / 300);
          rippleGfx.strokeCircle(0, 0, pulse * 0.6);

          if (posIdx <= 0) { rewinding = false; }
        }

        const pos = positions[posIdx] || { x: 0, y: 0 };
        charDot.setPosition(pos.x, pos.y);
        for (let i = 0; i < trail.length; i++) {
          const ti = Math.max(0, posIdx - i * 2);
          const tp = positions[ti] || pos;
          trail[i].setPosition(tp.x, tp.y);
          trail[i].setAlpha(rewinding ? 0.6 - i * 0.05 : Math.max(0, 0.3 - i * 0.025));
        }
      }
    });

    this.time.addEvent({
      delay: 3000,
      loop: true,
      startAt: 1800,
      callback: () => { rewinding = true; }
    });

    const hint = this.add.text(baseX, baseY + 100, '轨迹回放中...', {
      fontFamily: 'Segoe UI, Arial',
      fontSize: '14px',
      color: '#aaaaff'
    });
    let hintTog = 0;
    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        hintTog++;
        hint.setText(hintTog % 2 ? '← 时间倒流中' : '正常前进中 →');
        hint.setColor(hintTog % 2 ? '#00ffff' : '#ffdd66');
      }
    });
  }
}
