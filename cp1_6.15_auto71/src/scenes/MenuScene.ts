import Phaser from 'phaser';
import { DIFFICULTY_CONFIG, Difficulty, GAME_CONFIG } from '../config';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'normal';
  private difficultyCards: Map<Difficulty, Phaser.GameObjects.Container> = new Map();
  private starField: Phaser.GameObjects.Group | null = null;
  private isMobile: boolean = false;
  private uiScale: number = 1;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.checkMobile();
    this.createStarField();
    this.createTitle();
    this.createDifficultyCarousel();
    this.createStartButton();
    this.createInputHandlers();

    this.scale.on('resize', this.handleResize, this);
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < GAME_CONFIG.MOBILE_BREAKPOINT;
    this.uiScale = this.isMobile ? GAME_CONFIG.UI_SCALE_MOBILE : 1;
  }

  private createStarField(): void {
    this.starField = this.add.group();
    const starCount = this.isMobile ? 100 : 200;

    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const size = Phaser.Math.Between(1, 3) * this.uiScale;
      const alpha = Phaser.Math.FloatBetween(0.3, 1);

      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      star.setData('baseAlpha', alpha);
      star.setData('twinkleSpeed', Phaser.Math.FloatBetween(0.5, 2));
      this.starField.add(star);
    }
  }

  private createTitle(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.text(centerX, centerY - 200 * this.uiScale, '法阵召唤模拟器', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: `${48 * this.uiScale}px`,
      color: '#e0b0ff',
      stroke: '#4a0080',
      strokeThickness: 4 * this.uiScale,
      align: 'center'
    }).setOrigin(0.5).setShadow(0, 0, 10 * this.uiScale, '#9933ff');

    this.add.text(centerX, centerY - 140 * this.uiScale, '选择难度开始召唤', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${20 * this.uiScale}px`,
      color: '#b080ff'
    }).setOrigin(0.5);
  }

  private createDifficultyCarousel(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const cardWidth = 180 * this.uiScale;
    const cardHeight = 220 * this.uiScale;
    const spacing = 40 * this.uiScale;

    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
    const startX = centerX - (cardWidth + spacing);

    difficulties.forEach((diff, index) => {
      const x = startX + index * (cardWidth + spacing);
      const card = this.createDifficultyCard(diff, x, centerY - 20 * this.uiScale, cardWidth, cardHeight);
      this.difficultyCards.set(diff, card);

      card.setData('originalX', x);
      card.setData('index', index);
    });

    this.updateCardSelection();
  }

  private createDifficultyCard(
    difficulty: Difficulty,
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const config = DIFFICULTY_CONFIG[difficulty];
    const container = this.add.container(x, y);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    const bg = this.add.rectangle(0, 0, width, height, 0x1a1a2e, 0.9)
      .setStrokeStyle(2 * this.uiScale, 0x4a4a6a);
    bg.setData('glow', this.add.graphics());

    const glow = bg.getData('glow') as Phaser.GameObjects.Graphics;
    glow.lineStyle(3 * this.uiScale, 0x9933ff, 0);
    glow.strokeRoundedRect(-width / 2, -height / 2, width, height, 10 * this.uiScale);

    const iconColors: Record<Difficulty, number> = {
      easy: 0x90ee90,
      normal: 0xffd700,
      hard: 0xff6347
    };

    const icon = this.add.circle(0, -height / 4, 35 * this.uiScale, iconColors[difficulty], 0.3)
      .setStrokeStyle(3 * this.uiScale, iconColors[difficulty]);

    const iconText = this.add.text(0, -height / 4, config.name.charAt(0), {
      fontFamily: 'Arial Black',
      fontSize: `${32 * this.uiScale}px`,
      color: '#ffffff'
    }).setOrigin(0.5);

    const nameText = this.add.text(0, 20 * this.uiScale, config.name, {
      fontFamily: 'Arial Black',
      fontSize: `${24 * this.uiScale}px`,
      color: '#ffffff'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 55 * this.uiScale, config.description, {
      fontFamily: 'Arial',
      fontSize: `${14 * this.uiScale}px`,
      color: '#a0a0c0',
      wordWrap: { width: width - 20 * this.uiScale }
    }).setOrigin(0.5);

    container.add([bg, glow, icon, iconText, nameText, descText]);

    container.on('pointerdown', () => {
      this.selectDifficulty(difficulty);
    });

    container.on('pointerover', () => {
      if (this.selectedDifficulty !== difficulty) {
        this.tweens.add({
          targets: bg,
          scale: 1.05,
          duration: 200,
          ease: 'Power2'
        });
      }
    });

    container.on('pointerout', () => {
      if (this.selectedDifficulty !== difficulty) {
        this.tweens.add({
          targets: bg,
          scale: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });

    return container;
  }

  private selectDifficulty(difficulty: Difficulty): void {
    if (this.selectedDifficulty === difficulty) return;

    const oldCard = this.difficultyCards.get(this.selectedDifficulty);
    const newCard = this.difficultyCards.get(difficulty);

    if (oldCard) {
      this.tweens.add({
        targets: oldCard,
        scale: 1,
        duration: 400,
        ease: 'Elastic.easeOut'
      });
    }

    if (newCard) {
      this.tweens.add({
        targets: newCard,
        scale: 1.15,
        duration: 400,
        ease: 'Elastic.easeOut'
      });
    }

    this.selectedDifficulty = difficulty;
    this.updateCardSelection();
  }

  private updateCardSelection(): void {
    this.difficultyCards.forEach((card, difficulty) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      const glow = bg.getData('glow') as Phaser.GameObjects.Graphics;

      if (difficulty === this.selectedDifficulty) {
        card.setScale(1.15);
        glow.clear();
        glow.lineStyle(3 * this.uiScale, 0x9933ff, 1);
        glow.strokeRoundedRect(
          -(180 * this.uiScale) / 2,
          -(220 * this.uiScale) / 2,
          180 * this.uiScale,
          220 * this.uiScale,
          10 * this.uiScale
        );

        this.tweens.add({
          targets: glow,
          alpha: { from: 0.5, to: 1 },
          duration: 800,
          repeat: -1,
          yoyo: true
        });
      } else {
        card.setScale(1);
        glow.clear();
        glow.lineStyle(3 * this.uiScale, 0x9933ff, 0);
        glow.strokeRoundedRect(
          -(180 * this.uiScale) / 2,
          -(220 * this.uiScale) / 2,
          180 * this.uiScale,
          220 * this.uiScale,
          10 * this.uiScale
        );
        this.tweens.killTweensOf(glow);
      }
    });
  }

  private createStartButton(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const buttonBg = this.add.rectangle(centerX, centerY + 150 * this.uiScale, 200 * this.uiScale, 60 * this.uiScale, 0x6b238e)
      .setStrokeStyle(2 * this.uiScale, 0xe0b0ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(centerX, centerY + 150 * this.uiScale, '开始召唤', {
      fontFamily: 'Arial Black',
      fontSize: `${24 * this.uiScale}px`,
      color: '#ffffff'
    }).setOrigin(0.5);

    buttonBg.on('pointerover', () => {
      this.tweens.add({
        targets: buttonBg,
        scale: 1.05,
        duration: 150,
        ease: 'Power2'
      });
    });

    buttonBg.on('pointerout', () => {
      this.tweens.add({
        targets: buttonBg,
        scale: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    buttonBg.on('pointerdown', () => {
      this.tweens.add({
        targets: buttonBg,
        scale: 0.95,
        duration: 100,
        ease: 'Power2',
        yoyo: true,
        onComplete: () => {
          this.startGame();
        }
      });
    });
  }

  private createInputHandlers(): void {
    this.input.keyboard?.on('keydown-LEFT', () => {
      const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
      const currentIndex = difficulties.indexOf(this.selectedDifficulty);
      if (currentIndex > 0) {
        this.selectDifficulty(difficulties[currentIndex - 1]);
      }
    });

    this.input.keyboard?.on('keydown-RIGHT', () => {
      const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
      const currentIndex = difficulties.indexOf(this.selectedDifficulty);
      if (currentIndex < difficulties.length - 1) {
        this.selectDifficulty(difficulties[currentIndex + 1]);
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
    });
  }

  update(time: number, _delta: number): void {
    if (this.starField) {
      this.starField.getChildren().forEach(star => {
        const sprite = star as Phaser.GameObjects.Arc;
        const baseAlpha = sprite.getData('baseAlpha') as number;
        const twinkleSpeed = sprite.getData('twinkleSpeed') as number;
        const twinkle = Math.sin(time * 0.001 * twinkleSpeed) * 0.3 + 0.7;
        sprite.setAlpha(baseAlpha * twinkle);
      });
    }
  }

  private handleResize(): void {
    this.checkMobile();
    this.scene.restart();
  }
}
