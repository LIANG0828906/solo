import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.createMenu();
  }

  private createMenu(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x2a3a14).setOrigin(0, 0);

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(2, 6);
      this.add.rectangle(x, y, size, size, 0x4a5d23, 0.5);
    }

    const titleY = centerY - 120;
    this.add.text(centerX, titleY, '★ 微型拼图冒险 ★', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '42px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#8b6914',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(centerX, titleY + 60, '收集碎片 · 拼合拼图 · 传送冒险', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '20px',
      color: '#d4a574'
    }).setOrigin(0.5);

    this.drawPixelCharacter(centerX - 100, centerY - 20);
    this.drawPixelChest(centerX + 100, centerY - 20);
    this.drawPixelPortal(centerX, centerY + 100);

    const btnX = centerX;
    const btnY = centerY + 170;

    const btnBg = this.add.rectangle(btnX, btnY, 200, 60, 0x8b6914)
      .setStrokeStyle(4, 0xf1c40f)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(btnX, btnY, '开始游戏', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '26px',
      color: '#f5e6c8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0xa67c00);
      btnText.setColor('#ffffff');
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x8b6914);
      btnText.setColor('#f5e6c8');
    });
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameScene', { level: 1 });
      });
    });

    this.add.text(centerX, this.cameras.main.height - 40,
      '方向键/WASD 移动  ·  E 键开宝箱  ·  鼠标拖拽拼图', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '14px',
        color: '#a0a0a0'
      }).setOrigin(0.5);

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameScene', { level: 1 });
      });
    });
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameScene', { level: 1 });
      });
    });
  }

  showVictory(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x2a3a14).setOrigin(0, 0);

    this.add.text(centerX, centerY - 100, '🎉 恭喜通关！🎉', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '48px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#8b6914',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 20, '你成功完成了5关拼图冒险！', {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '22px',
      color: '#d4a574'
    }).setOrigin(0.5);

    this.startConfetti();

    this.time.delayedCall(4000, () => {
      this.createMenu();
    });
  }

  private startConfetti(): void {
    const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22, 0xffffff];
    const confetti: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(-100, -20);
      const w = Phaser.Math.Between(4, 8);
      const h = Phaser.Math.Between(8, 14);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const piece = this.add.rectangle(x, y, w, h, color);
      confetti.push(piece);

      this.tweens.add({
        targets: piece,
        y: 650,
        x: x + Phaser.Math.Between(-100, 100),
        rotation: Phaser.Math.Between(-6.28, 6.28),
        duration: Phaser.Math.Between(2500, 4000),
        ease: 'Cubic.easeIn',
        delay: Phaser.Math.Between(0, 1000)
      });
    }
  }

  private drawPixelCharacter(x: number, y: number): void {
    const s = 4;
    const pattern = [
      '  ####  ',
      ' #RRRR# ',
      ' #RRRR# ',
      ' #FFFF# ',
      '  #FF#  ',
      ' #RRRR# ',
      ' #RRRR# ',
      ' ##  ## '
    ];
    const colorMap: Record<string, number> = { '#': 0x333333, 'R': 0xc0392b, 'F': 0xf5cba7 };
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const ch = pattern[py][px];
        if (colorMap[ch]) {
          this.add.rectangle(x - pattern[py].length * s / 2 + px * s, y - pattern.length * s / 2 + py * s, s, s, colorMap[ch]);
        }
      }
    }
  }

  private drawPixelChest(x: number, y: number): void {
    const s = 4;
    const pattern = [
      ' ###### ',
      '#YYYYYY#',
      '#YBBBBY#',
      '#YBYYBY#',
      '########',
      '#YBBBBY#',
      '#YBBBBY#',
      '########'
    ];
    const colorMap: Record<string, number> = { '#': 0x4a3520, 'Y': 0xf1c40f, 'B': 0x8b5a2b };
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const ch = pattern[py][px];
        if (colorMap[ch]) {
          this.add.rectangle(x - pattern[py].length * s / 2 + px * s, y - pattern.length * s / 2 + py * s, s, s, colorMap[ch]);
        }
      }
    }
  }

  private drawPixelPortal(x: number, y: number): void {
    const s = 4;
    const radius = 24;
    for (let angle = 0; angle < 360; angle += 10) {
      const rad = Phaser.Math.DegToRad(angle);
      const px = x + Math.cos(rad) * radius;
      const py = y + Math.sin(rad) * radius;
      const brightness = 0.5 + 0.5 * Math.sin(angle * 0.1);
      this.add.rectangle(px, py, s, s, 0xf1c40f).setAlpha(brightness);
    }
    this.add.circle(x, y, 14, 0xf1c40f, 0.3).setStrokeStyle(2, 0xf1c40f);
    this.add.circle(x, y, 8, 0xffffff, 0.5);
  }
}
