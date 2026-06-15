import Phaser from 'phaser';
import {
  RUNE_TYPES,
  RuneType,
  RUNE_COLORS,
  RUNE_SYMBOLS,
  DIFFICULTY_CONFIG,
  Difficulty,
  GAME_CONFIG
} from '../config';

interface Rune {
  type: RuneType;
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Arc;
  symbol: Phaser.GameObjects.Text;
  glow: Phaser.GameObjects.Arc;
  ripple: Phaser.GameObjects.Arc | null;
  isActive: boolean;
  isCorrect: boolean;
}

interface Particle {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class GameScene extends Phaser.Scene {
  private difficulty: Difficulty = 'normal';
  private sequence: RuneType[] = [];
  private playerInput: RuneType[] = [];
  private isShowingSequence: boolean = false;
  private canInteract: boolean = false;

  private timeRemaining: number = GAME_CONFIG.INITIAL_TIME;
  private score: number = 0;
  private isGameOver: boolean = false;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  private centerX: number = 0;
  private centerY: number = 0;
  private altarRadius: number = 0;
  private runeDiameter: number = 60;
  private runeRadius: number = 0;

  private hexagram: Phaser.GameObjects.Container | null = null;
  private hexagramRotationSpeed: number = GAME_CONFIG.HEXAGRAM_ROTATION_SPEED_NORMAL;

  private runes: Map<RuneType, Rune> = new Map();
  private particles: Particle[] = [];
  private rainParticles: Particle[] = [];

  private timeText: Phaser.GameObjects.Text | null = null;
  private hearts: Phaser.GameObjects.Text[] = [];
  private scoreText: Phaser.GameObjects.Text | null = null;

  private starField: Phaser.GameObjects.Group | null = null;

  private isMobile: boolean = false;
  private uiScale: number = 1;

  private summonedSprite: Phaser.GameObjects.Text | null = null;
  private summonedType: RuneType | null = null;

  private prevHeartsCount: number = -1;
  private blinkTimer: number = 0;
  private lastBlinkSecond: number = -1;

  constructor() {
    super('GameScene');
  }

  init(data: { difficulty: Difficulty }): void {
    this.difficulty = data.difficulty || 'normal';
  }

  create(): void {
    this.checkMobile();
    this.calculateDimensions();
    this.createStarField();
    this.createAltar();
    this.createHexagram();
    this.createRunes();
    this.createUI();
    this.startRound();

    this.scale.on('resize', this.handleResize, this);
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < GAME_CONFIG.MOBILE_BREAKPOINT;
    this.uiScale = this.isMobile ? GAME_CONFIG.UI_SCALE_MOBILE : 1;
    this.runeDiameter = this.isMobile ? GAME_CONFIG.RUNE_DIAMETER_MOBILE : GAME_CONFIG.RUNE_DIAMETER;
  }

  private calculateDimensions(): void {
    const heightRatio = this.isMobile
      ? GAME_CONFIG.ALTAR_HEIGHT_RATIO_MOBILE
      : GAME_CONFIG.ALTAR_HEIGHT_RATIO;

    this.centerX = this.scale.width / 2;
    this.centerY = this.scale.height / 2;
    this.altarRadius = Math.min(this.scale.width, this.scale.height) * heightRatio * 0.45;
    this.runeRadius = this.altarRadius * 0.75;
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

  private createAltar(): void {
    this.add.circle(
      this.centerX,
      this.centerY,
      this.altarRadius,
      0x1a0a2e,
      0.8
    ).setStrokeStyle(3 * this.uiScale, 0x6b238e);

    this.add.circle(
      this.centerX,
      this.centerY,
      this.altarRadius * 0.85,
      0x0d0517,
      0.9
    ).setStrokeStyle(2 * this.uiScale, 0x4a1a6b);

    this.add.circle(
      this.centerX,
      this.centerY,
      this.runeRadius,
      0x000000,
      0
    ).setStrokeStyle(1 * this.uiScale, 0x6b238e, 0.3);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * this.altarRadius * 0.9;
      const y = this.centerY + Math.sin(angle) * this.altarRadius * 0.9;

      const candle = this.add.circle(x, y, 6 * this.uiScale, 0xffd700, 0.6)
        .setStrokeStyle(2 * this.uiScale, 0xff8c00);
      candle.setData('flickerOffset', Math.random() * Math.PI * 2);
    }
  }

  private createHexagram(): void {
    this.hexagram = this.add.container(this.centerX, this.centerY);

    const graphics = this.add.graphics();
    const size = this.altarRadius * 0.6;

    graphics.lineStyle(3 * this.uiScale, 0x9933ff, 0.9);
    for (let i = 0; i < 2; i++) {
      const startAngle = (i * Math.PI) / 3;
      for (let j = 0; j < 3; j++) {
        const angle1 = startAngle + (j * 2 * Math.PI) / 3;
        const angle2 = startAngle + ((j + 1) * 2 * Math.PI) / 3;
        const x1 = Math.cos(angle1) * size;
        const y1 = Math.sin(angle1) * size;
        const x2 = Math.cos(angle2) * size;
        const y2 = Math.sin(angle2) * size;
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
      }
    }

    const innerCircle = this.add.circle(0, 0, size * 0.2, 0x2a0a4e, 0.5)
      .setStrokeStyle(2 * this.uiScale, 0xc060ff);

    const centerDot = this.add.circle(0, 0, size * 0.08, 0xff80ff, 0.8);
    centerDot.setData('pulsePhase', 0);

    this.hexagram.add([graphics, innerCircle, centerDot]);
  }

  private createRunes(): void {
    const runePositions: RuneType[] = ['fire', 'water', 'wind', 'earth'];

    runePositions.forEach((type, index) => {
      const angle = (index / 4) * Math.PI * 2 - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * this.runeRadius;
      const y = this.centerY + Math.sin(angle) * this.runeRadius;

      const container = this.add.container(x, y);
      container.setSize(this.runeDiameter, this.runeDiameter);
      container.setInteractive({ useHandCursor: true });

      const circle = this.add.circle(0, 0, this.runeDiameter / 2, 0x1a1a2e, 0.9)
        .setStrokeStyle(2 * this.uiScale, RUNE_COLORS[type], 0.5);

      const texture = this.add.graphics();
      for (let i = 0; i < 3; i++) {
        texture.lineStyle(1, RUNE_COLORS[type], 0.2 + i * 0.1);
        texture.beginPath();
        texture.arc(0, 0, this.runeDiameter / 2 - 5 - i * 6, 0, Math.PI * 2);
        texture.strokePath();
      }

      const symbol = this.add.text(0, 0, RUNE_SYMBOLS[type], {
        fontFamily: 'Arial',
        fontSize: `${this.runeDiameter * 0.5}px`
      }).setOrigin(0.5);

      const glow = this.add.circle(0, 0, this.runeDiameter / 2 + 5, RUNE_COLORS[type], 0)
        .setStrokeStyle(3 * this.uiScale, RUNE_COLORS[type], 0);

      const ripple = null;

      container.add([glow, circle, texture, symbol]);

      container.on('pointerdown', () => {
        if (this.canInteract && !this.isGameOver) {
          this.handleRuneClick(type);
        }
      });

      container.on('pointerover', () => {
        if (this.canInteract && !this.isGameOver) {
          this.tweens.add({
            targets: circle,
            strokeAlpha: 1,
            duration: 150,
            ease: 'Power2'
          });
        }
      });

      container.on('pointerout', () => {
        const rune = this.runes.get(type);
        if (rune && !rune.isCorrect) {
          this.tweens.add({
            targets: circle,
            strokeAlpha: 0.5,
            duration: 150,
            ease: 'Power2'
          });
        }
      });

      this.runes.set(type, {
        type,
        container,
        circle,
        symbol,
        glow,
        ripple,
        isActive: false,
        isCorrect: false
      });
    });
  }

  private createUI(): void {
    const padding = 20 * this.uiScale;

    this.timeText = this.add.text(padding, padding, `${Math.ceil(this.timeRemaining)}`, {
      fontFamily: 'Arial Black',
      fontSize: `${32 * this.uiScale}px`,
      color: '#87ceeb'
    }).setStroke('#1e90ff', 3 * this.uiScale);

    this.createHearts(padding);

    this.scoreText = this.add.text(
      this.scale.width - padding,
      padding,
      `得分: ${this.score}`,
      {
        fontFamily: 'Arial Black',
        fontSize: `${24 * this.uiScale}px`,
        color: '#ffd700'
      }
    ).setOrigin(1, 0).setStroke('#b8860b', 2 * this.uiScale);

    this.add.text(
      this.scale.width - padding,
      padding + 35 * this.uiScale,
      DIFFICULTY_CONFIG[this.difficulty].name,
      {
        fontFamily: 'Arial',
        fontSize: `${16 * this.uiScale}px`,
        color: this.difficulty === 'easy' ? '#90ee90' :
          this.difficulty === 'normal' ? '#ffd700' : '#ff6347'
      }
    ).setOrigin(1, 0);
  }

  private createHearts(padding: number): void {
    this.hearts.forEach(h => h.destroy());
    this.hearts = [];

    const heartSize = 24 * this.uiScale;
    const startY = padding + 45 * this.uiScale;
    const maxHearts = Math.ceil(GAME_CONFIG.INITIAL_TIME / 3);

    for (let i = 0; i < maxHearts; i++) {
      const heart = this.add.text(
        padding + i * (heartSize + 5),
        startY,
        '❤️',
        { fontSize: `${heartSize}px` }
      );
      this.hearts.push(heart);
    }
    this.updateHearts();
  }

  private updateHearts(): void {
    const fullHearts = Math.max(0, Math.ceil(this.timeRemaining / 3));
    const heartsChanged = this.prevHeartsCount !== -1 && fullHearts !== this.prevHeartsCount;
    const gained = heartsChanged && fullHearts > this.prevHeartsCount;

    this.hearts.forEach((heart, index) => {
      const wasActive = this.prevHeartsCount === -1 ? false : index < this.prevHeartsCount;
      const isActive = index < fullHearts;

      if (wasActive !== isActive) {
        this.tweens.killTweensOf(heart);
        this.tweens.add({
          targets: heart,
          scale: { from: 1, to: gained ? 1.6 : 0.5, yoyo: true },
          alpha: { from: heart.alpha, to: isActive ? 1 : 0.2 },
          duration: 350,
          ease: gained ? 'Elastic.easeOut' : 'Back.easeIn',
          hold: gained ? 100 : 0
        });
      } else if (!isActive && heart.alpha !== 0.2) {
        heart.setAlpha(0.2);
      } else if (isActive && heart.alpha !== 1) {
        heart.setAlpha(1);
      }
    });

    this.prevHeartsCount = fullHearts;
  }

  private startRound(): void {
    this.sequence = this.generateSequence();
    this.playerInput = [];
    this.canInteract = false;
    this.isShowingSequence = true;

    this.runes.forEach(rune => {
      rune.isActive = false;
      rune.isCorrect = false;
      rune.circle.setStrokeStyle(2 * this.uiScale, RUNE_COLORS[rune.type], 0.5);
      rune.glow.setAlpha(0);
    });

    this.showSequence();
    this.startTimer();
  }

  private generateSequence(): RuneType[] {
    const length = DIFFICULTY_CONFIG[this.difficulty].sequenceLength;
    const sequence: RuneType[] = [];

    for (let i = 0; i < length; i++) {
      sequence.push(RUNE_TYPES[Math.floor(Math.random() * RUNE_TYPES.length)]);
    }

    return sequence;
  }

  private showSequence(): void {
    const interval = DIFFICULTY_CONFIG[this.difficulty].interval;

    this.sequence.forEach((type, index) => {
      this.time.delayedCall(index * interval, () => {
        this.highlightRune(type);

        if (index === this.sequence.length - 1) {
          this.time.delayedCall(interval, () => {
            this.isShowingSequence = false;
            this.canInteract = true;
          });
        }
      });
    });
  }

  private highlightRune(type: RuneType): void {
    const rune = this.runes.get(type);
    if (!rune) return;

    this.tweens.add({
      targets: rune.container,
      scale: 1.2,
      duration: 250,
      ease: 'Elastic.easeOut',
      yoyo: true,
      hold: 0
    });

    this.tweens.add({
      targets: rune.glow,
      alpha: { from: 0, to: 0.8 },
      duration: 250,
      ease: 'Power2',
      yoyo: true
    });

    this.createRipple(type, RUNE_COLORS[type]);
  }

  private createRipple(type: RuneType, color: number): void {
    const rune = this.runes.get(type);
    if (!rune) return;

    const ripple = this.add.circle(
      rune.container.x,
      rune.container.y,
      this.runeDiameter / 2,
      color,
      0
    ).setStrokeStyle(3 * this.uiScale, color, 1);

    this.tweens.add({
      targets: ripple,
      radius: this.runeDiameter * 1.5,
      strokeAlpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        ripple.destroy();
      }
    });
  }

  private handleRuneClick(type: RuneType): void {
    if (!this.canInteract || this.isShowingSequence) return;

    const rune = this.runes.get(type);
    if (!rune) return;

    const originalY = rune.container.y;
    this.tweens.killTweensOf(rune.container);

    this.tweens.chain({
      targets: rune.container,
      tweens: [
        {
          y: originalY + 6,
          scale: 0.92,
          duration: 75,
          ease: 'Quad.easeIn'
        },
        {
          y: originalY,
          scale: 1,
          duration: 75,
          ease: 'Back.easeOut'
        }
      ]
    });

    const expectedType = this.sequence[this.playerInput.length];

    if (type === expectedType) {
      this.handleCorrectClick(type);
    } else {
      this.handleIncorrectClick(type);
    }
  }

  private handleCorrectClick(type: RuneType): void {
    const rune = this.runes.get(type);
    if (!rune) return;

    rune.isCorrect = true;
    rune.circle.setStrokeStyle(2 * this.uiScale, RUNE_COLORS[type], 1);

    this.tweens.add({
      targets: rune.glow,
      alpha: 0.6,
      duration: 300,
      ease: 'Power2'
    });

    this.createBurstParticles(rune.container.x, rune.container.y, RUNE_COLORS[type]);
    this.createRipple(type, RUNE_COLORS[type]);

    this.accelerateHexagram();

    this.playerInput.push(type);

    if (this.playerInput.length === this.sequence.length) {
      this.handleRoundComplete();
    }
  }

  private handleIncorrectClick(type: RuneType): void {
    const rune = this.runes.get(type);
    if (!rune) return;

    const originalStroke = rune.circle.strokeColor;
    rune.circle.setStrokeStyle(2 * this.uiScale, 0xff0000, 1);

    this.tweens.add({
      targets: rune.container,
      x: rune.container.x,
      y: rune.container.y,
      duration: 200,
      onUpdate: (tween) => {
        const progress = tween.progress;
        const shake = Math.sin(progress * Math.PI * 10) * 5;
        rune.container.x = rune.container.x + shake * (1 - progress);
      },
      onComplete: () => {
        rune.circle.setStrokeStyle(2 * this.uiScale, originalStroke, 0.5);
      }
    });

    this.timeRemaining = Math.max(0, this.timeRemaining - GAME_CONFIG.TIME_FAILURE_PENALTY);
    this.updateTimeDisplay();
    this.updateHearts();

    this.animateHeartLoss();
  }

  private accelerateHexagram(): void {
    this.tweens.addCounter({
      from: GAME_CONFIG.HEXAGRAM_ROTATION_SPEED_NORMAL,
      to: GAME_CONFIG.HEXAGRAM_ROTATION_SPEED_FAST,
      duration: GAME_CONFIG.HEXAGRAM_ROTATION_TRANSITION,
      onUpdate: (tween) => {
        const value = tween.getValue();
        if (value !== null) {
          this.hexagramRotationSpeed = value;
        }
      },
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.addCounter({
            from: GAME_CONFIG.HEXAGRAM_ROTATION_SPEED_FAST,
            to: GAME_CONFIG.HEXAGRAM_ROTATION_SPEED_NORMAL,
            duration: GAME_CONFIG.HEXAGRAM_ROTATION_TRANSITION,
            onUpdate: (tween) => {
              const value = tween.getValue();
              if (value !== null) {
                this.hexagramRotationSpeed = value;
              }
            }
          });
        });
      }
    });
  }

  private handleRoundComplete(): void {
    this.canInteract = false;
    this.score += this.sequence.length * 10;
    this.updateScoreDisplay();

    this.timeRemaining += GAME_CONFIG.TIME_SUCCESS_BONUS;
    this.updateTimeDisplay();
    this.updateHearts();
    this.animateHeartGain();

    this.summonSpirit();
  }

  private summonSpirit(): void {
    const types: RuneType[] = ['fire', 'water', 'wind', 'earth'];
    this.summonedType = types[Math.floor(Math.random() * types.length)];
    const color = RUNE_COLORS[this.summonedType];
    const symbol = RUNE_SYMBOLS[this.summonedType];

    this.summonedSprite = this.add.text(
      this.centerX,
      this.centerY,
      '✨',
      {
        fontFamily: 'Arial',
        fontSize: `${this.runeDiameter * 0.8}px`
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.summonedSprite,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.5 },
      y: this.centerY - 20,
      duration: 800,
      ease: 'Back.out',
      onComplete: () => {
        if (this.summonedSprite) {
          this.summonedSprite.setText(symbol);
          this.tweens.add({
            targets: this.summonedSprite,
            scale: 1.2,
            duration: 400,
            ease: 'Elastic.easeOut'
          });
        }
      }
    });

    this.createRainParticles(color);

    this.time.delayedCall(2000, () => {
      if (this.summonedSprite) {
        this.tweens.add({
          targets: this.summonedSprite,
          alpha: 0,
          y: this.centerY - 100,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            this.summonedSprite?.destroy();
            this.summonedSprite = null;
            this.startNextRound();
          }
        });
      } else {
        this.startNextRound();
      }
    });
  }

  private startNextRound(): void {
    if (this.timeRemaining <= 0) {
      this.endGame();
      return;
    }

    this.time.delayedCall(500, () => {
      this.startRound();
    });
  }

  private createBurstParticles(x: number, y: number, color: number): void {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(100, 250);
      const size = Phaser.Math.Between(2, 5) * this.uiScale;

      const sprite = this.add.circle(x, y, size, color, 1);

      this.particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        maxLife: 0.8
      });
    }

    this.trimParticles();
  }

  private createRainParticles(color: number): void {
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.scale.width;
      const y = -10 - Math.random() * 100;
      const size = Phaser.Math.Between(2, 4) * this.uiScale;

      const sprite = this.add.circle(x, y, size, color, 1);

      this.rainParticles.push({
        sprite,
        vx: Phaser.Math.Between(-20, 20),
        vy: Phaser.Math.Between(100, 200),
        life: 2,
        maxLife: 2
      });
    }

    this.trimParticles();
  }

  private trimParticles(): void {
    const total = this.particles.length + this.rainParticles.length;

    if (total > GAME_CONFIG.MAX_PARTICLES) {
      const toRemove = total - GAME_CONFIG.MAX_PARTICLES;

      for (let i = 0; i < toRemove; i++) {
        if (this.particles.length > 0) {
          const p = this.particles.shift();
          p?.sprite.destroy();
        } else if (this.rainParticles.length > 0) {
          const p = this.rainParticles.shift();
          p?.sprite.destroy();
        }
      }
    }
  }

  private startTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (!this.isGameOver) {
          this.timeRemaining -= 0.1;
          if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
          }
          this.updateTimeDisplay();
        }
      }
    });
  }

  private updateTimeDisplay(): void {
    if (!this.timeText) return;

    this.timeText.setText(`${Math.ceil(this.timeRemaining)}`);

    if (this.timeRemaining < 5) {
      this.timeText.setColor('#ff4444');
    } else if (this.timeRemaining < 10) {
      this.timeText.setColor('#ffaa00');
    } else {
      this.timeText.setColor('#87ceeb');
    }
  }

  private updateScoreDisplay(): void {
    if (this.scoreText) {
      this.scoreText.setText(`得分: ${this.score}`);

      this.tweens.add({
        targets: this.scoreText,
        scale: { from: 1, to: 1.2, yoyo: true },
        duration: 200,
        ease: 'Quad.easeInOut'
      });
    }
  }

  private animateHeartGain(): void {
    const fullHearts = Math.max(0, Math.ceil(this.timeRemaining / 3));
    const index = fullHearts - 1;

    if (index >= 0 && index < this.hearts.length) {
      this.tweens.add({
        targets: this.hearts[index],
        scale: { from: 1, to: 1.5, yoyo: true },
        duration: 300,
        ease: 'Elastic.easeOut'
      });
    }
  }

  private animateHeartLoss(): void {
    this.hearts.forEach(heart => {
      this.tweens.add({
        targets: heart,
        scale: { from: 1, to: 0.7, yoyo: true },
        duration: 200,
        ease: 'Quad.easeInOut'
      });
    });
  }

  private endGame(): void {
    this.isGameOver = true;
    this.canInteract = false;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    const overlay = this.add.rectangle(
      this.centerX,
      this.centerY,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    ).setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 500
    });

    this.add.text(this.centerX, this.centerY - 60, '游戏结束', {
      fontFamily: 'Arial Black',
      fontSize: `${48 * this.uiScale}px`,
      color: '#ff4444'
    }).setOrigin(0.5).setStroke('#880000', 4 * this.uiScale);

    this.add.text(this.centerX, this.centerY, `最终得分: ${this.score}`, {
      fontFamily: 'Arial Black',
      fontSize: `${32 * this.uiScale}px`,
      color: '#ffd700'
    }).setOrigin(0.5).setStroke('#b8860b', 3 * this.uiScale);

    const restartBtn = this.add.rectangle(
      this.centerX,
      this.centerY + 80,
      180 * this.uiScale,
      50 * this.uiScale,
      0x6b238e
    ).setStrokeStyle(2 * this.uiScale, 0xe0b0ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(this.centerX, this.centerY + 80, '返回菜单', {
      fontFamily: 'Arial Black',
      fontSize: `${20 * this.uiScale}px`,
      color: '#ffffff'
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('MenuScene');
      });
    });
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;

    if (this.starField) {
      this.starField.getChildren().forEach(star => {
        const sprite = star as Phaser.GameObjects.Arc;
        const baseAlpha = sprite.getData('baseAlpha') as number;
        const twinkleSpeed = sprite.getData('twinkleSpeed') as number;
        const twinkle = Math.sin(time * 0.001 * twinkleSpeed) * 0.3 + 0.7;
        sprite.setAlpha(baseAlpha * twinkle);
      });
    }

    if (this.hexagram) {
      this.hexagram.rotation += this.hexagramRotationSpeed * Math.PI * 2 * dt;

      const centerDot = this.hexagram.getAt(2) as Phaser.GameObjects.Arc;
      const phase = (centerDot.getData('pulsePhase') || 0) + dt * 3;
      centerDot.setData('pulsePhase', phase);
      centerDot.setScale(1 + Math.sin(phase) * 0.2);
    }

    this.updateParticles(dt);

    this.blinkTimer += delta;
    const currentSecond = Math.ceil(this.timeRemaining);
    if (this.timeText && this.timeRemaining > 0 && currentSecond > 0) {
      if (currentSecond % 5 === 0 && this.lastBlinkSecond !== currentSecond) {
        this.lastBlinkSecond = currentSecond;
        this.tweens.killTweensOf(this.timeText);
        this.tweens.add({
          targets: this.timeText,
          alpha: { from: 1, to: 0.25, yoyo: true },
          scale: { from: 1, to: 1.15, yoyo: true },
          duration: 450,
          ease: 'Quad.easeInOut'
        });
      }
    }
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) {
        p.sprite.destroy();
        return false;
      }

      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.vy += 200 * dt;
      p.sprite.setAlpha(p.life / p.maxLife);

      return true;
    });

    this.rainParticles = this.rainParticles.filter(p => {
      p.life -= dt;
      if (p.life <= 0 || p.sprite.y > this.scale.height + 50) {
        p.sprite.destroy();
        return false;
      }

      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.setAlpha(Math.min(1, p.life / p.maxLife * 2));

      return true;
    });
  }

  private handleResize(): void {
    this.checkMobile();
    this.scene.restart({ difficulty: this.difficulty });
  }

  shutdown(): void {
    this.runes.forEach(rune => {
      rune.container.destroy();
    });
    this.runes.clear();

    this.particles.forEach(p => p.sprite.destroy());
    this.particles = [];

    this.rainParticles.forEach(p => p.sprite.destroy());
    this.rainParticles = [];

    this.hearts.forEach(h => h.destroy());
    this.hearts = [];

    if (this.starField) {
      this.starField.clear(true, true);
      this.starField.destroy();
      this.starField = null;
    }

    if (this.hexagram) {
      this.hexagram.destroy();
      this.hexagram = null;
    }

    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }

    this.scale.off('resize', this.handleResize, this);
    this.tweens.killAll();
  }
}
