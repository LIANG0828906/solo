import Phaser from 'phaser';
import {
  SpellSystem,
  SpellProjectile,
  SPELL_CONFIGS,
  FUSION_MAP,
  SpellElement,
  SpellSlotState,
  FusionEffect,
} from './playerModule/spellSystem';
import { AIController, AIState } from './aiModule/aiController';

interface Character {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  halo: Phaser.GameObjects.Graphics;
  body: Phaser.GameObjects.Graphics;
  name: string;
  damageFlash: number;
}

interface SpellIcon {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  border: Phaser.GameObjects.Graphics;
  cooldownOverlay: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
  cooldownText: Phaser.GameObjects.Text;
  element: SpellElement;
  slotIndex: number;
  rotationTween: Phaser.Tweens.Tween | null;
  pulseTween: Phaser.Tweens.Tween | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

type GameState = 'setup' | 'playing' | 'ended';

export class GameScene extends Phaser.Scene {
  private spellSystem!: SpellSystem;
  private aiController!: AIController;
  private player!: Character;
  private enemy!: Character;

  private gameState: GameState = 'setup';
  private battleDuration: number = 60000;
  private battleTimer: number = 0;
  private timerText!: Phaser.GameObjects.Text;

  private playerHealthBar!: Phaser.GameObjects.Graphics;
  private playerHealthBarBg!: Phaser.GameObjects.Graphics;
  private enemyHealthBar!: Phaser.GameObjects.Graphics;
  private enemyHealthBarBg!: Phaser.GameObjects.Graphics;
  private playerHealthText!: Phaser.GameObjects.Text;
  private enemyHealthText!: Phaser.GameObjects.Text;

  private spellIcons: SpellIcon[] = [];
  private selectedSpellSlot: number = 0;

  private backgroundParticles: Particle[] = [];
  private explosionParticles: Particle[] = [];
  private maxExplosionParticles: number = 200;

  private warningOverlay!: Phaser.GameObjects.Graphics;
  private warningActive: boolean = false;
  private warningTween: Phaser.Tweens.Tween | null = null;

  private shieldOverlay!: Phaser.GameObjects.Graphics;
  private shieldPulse: number = 0;

  private resultText!: Phaser.GameObjects.Text;
  private resultSubText!: Phaser.GameObjects.Text;
  private restartButton!: Phaser.GameObjects.Container;

  private lastUpdateTime: number = 0;
  private physicsUpdateAccumulator: number = 0;
  private readonly PHYSICS_INTERVAL: number = 1000 / 30;

  private fusionHintText!: Phaser.GameObjects.Text;
  private fusionHintTimer: number = 0;

  private battleArena!: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  public init(): void {
    this.gameState = 'setup';
  }

  public create(): void {
    const { width, height } = this.scale;

    this.createBattleArena(width, height);
    this.createBackgroundParticles();
    this.createCharacters(width, height);
    this.createHealthBars(width);
    this.createSpellIcons(width, height);
    this.createWarningOverlay(width, height);
    this.createShieldOverlay();
    this.createTimer(width);
    this.createFusionHint(width, height);
    this.createResultUI(width, height);

    this.spellSystem = new SpellSystem(this);
    this.spellSystem.setSlotElements(['fire', 'water']);

    this.aiController = new AIController(
      this,
      this.spellSystem,
      this.enemy.x,
      this.enemy.y,
      this.player.x,
      this.player.y
    );

    this.setupSpellEvents();
    this.setupAIEvents();
    this.setupInput();

    this.gameState = 'playing';
    this.battleTimer = this.battleDuration;

    this.showFusionHint('点击选择法术，再点击画面施放！\n两个飞行中不同属性的法术碰撞会产生融合效果！', 5000);
  }

  private createBattleArena(width: number, height: number): void {
    this.battleArena = this.add.graphics();

    const arenaX = 40;
    const arenaY = 90;
    const arenaW = width - 80;
    const arenaH = height - 200;

    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(15 + t * 20);
      const g = Math.floor(20 + t * 35);
      const b = Math.floor(45 + t * 50);
      const color = (r << 16) | (g << 8) | b;
      const alpha = 0.3 + t * 0.3;
      this.battleArena.fillStyle(color, alpha);
      const lineH = arenaH / gradientSteps;
      this.battleArena.fillRect(arenaX, arenaY + i * lineH, arenaW, lineH + 1);
    }

    this.battleArena.lineStyle(3, 0x4fc3f7, 0.8);
    this.battleArena.strokeRoundedRect(arenaX, arenaY, arenaW, arenaH, 16);

    this.battleArena.lineStyle(1, 0x4fc3f7, 0.15);
    for (let i = 1; i < 6; i++) {
      const x = arenaX + (arenaW * i) / 6;
      this.battleArena.beginPath();
      this.battleArena.moveTo(x, arenaY);
      this.battleArena.lineTo(x, arenaY + arenaH);
      this.battleArena.strokePath();
    }
    for (let i = 1; i < 4; i++) {
      const y = arenaY + (arenaH * i) / 4;
      this.battleArena.beginPath();
      this.battleArena.moveTo(arenaX, y);
      this.battleArena.lineTo(arenaX + arenaW, y);
      this.battleArena.strokePath();
    }

    this.battleArena.lineStyle(2, 0xef5350, 0.4);
    this.battleArena.setLineDash([8, 8]);
    this.battleArena.beginPath();
    this.battleArena.moveTo(width / 2, arenaY + 10);
    this.battleArena.lineTo(width / 2, arenaY + arenaH - 10);
    this.battleArena.strokePath();
    this.battleArena.setLineDash();
  }

  private createBackgroundParticles(): void {
    const count = 60;
    const { width, height } = this.scale;
    for (let i = 0; i < count; i++) {
      this.backgroundParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.3 - Math.random() * 0.6,
        life: 1,
        maxLife: 1,
        color: 0x80d8ff,
        size: 1 + Math.random() * 3,
      });
    }
  }

  private createCharacters(width: number, height: number): void {
    const arenaY = 90;
    const arenaH = height - 200;
    const centerY = arenaY + arenaH / 2;

    this.player = this.createCharacter(120, centerY, 0x2196f3, '玩家');
    this.enemy = this.createCharacter(width - 120, centerY, 0xef5350, 'AI 对手');
  }

  private createCharacter(x: number, y: number, haloColor: number, name: string): Character {
    const halo = this.add.graphics();
    const body = this.add.graphics();

    this.drawCharacter(halo, body, haloColor);

    halo.setPosition(x, y);
    body.setPosition(x, y);

    const nameText = this.add.text(x, y + 50, name, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: haloColor === 0x2196f3 ? '#64b5f6' : '#ef9a9a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    return {
      x,
      y,
      radius: 28,
      health: 100,
      maxHealth: 100,
      halo,
      body,
      name,
      damageFlash: 0,
    };
  }

  private drawCharacter(halo: Phaser.GameObjects.Graphics, body: Phaser.GameObjects.Color, color: number): void {
    halo.clear();
    body.clear();

    halo.fillStyle(color, 0.15);
    halo.fillCircle(0, 0, 48);
    halo.fillStyle(color, 0.3);
    halo.fillCircle(0, 0, 38);
    halo.lineStyle(2, color, 0.6);
    halo.strokeCircle(0, 0, 42);

    const isBlue = color === 0x2196f3;
    const mainColor = isBlue ? 0x64b5f6 : 0xef5350;
    const darkColor = isBlue ? 0x1565c0 : 0xc62828;

    body.fillStyle(mainColor, 1);
    body.beginPath();
    body.moveTo(0, -22);
    body.lineTo(18, 10);
    body.lineTo(10, 10);
    body.lineTo(10, 22);
    body.lineTo(-10, 22);
    body.lineTo(-10, 10);
    body.lineTo(-18, 10);
    body.closePath();
    body.fillPath();

    body.fillStyle(0xe1f5fe, 1);
    body.fillCircle(0, -28, 11);

    body.lineStyle(2, darkColor, 1);
    body.beginPath();
    body.moveTo(0, -22);
    body.lineTo(18, 10);
    body.lineTo(10, 10);
    body.lineTo(10, 22);
    body.lineTo(-10, 22);
    body.lineTo(-10, 10);
    body.lineTo(-18, 10);
    body.closePath();
    body.strokePath();

    body.fillStyle(0x263238, 1);
    body.fillCircle(-4, -29, 2);
    body.fillCircle(4, -29, 2);
  }

  private createHealthBars(width: number): void {
    const barWidth = 280;
    const barHeight = 22;

    this.playerHealthBarBg = this.add.graphics();
    this.playerHealthBar = this.add.graphics();
    this.enemyHealthBarBg = this.add.graphics();
    this.enemyHealthBar = this.add.graphics();

    const playerX = 50;
    const enemyX = width - 50 - barWidth;
    const barY = 25;

    this.drawHealthBarBg(this.playerHealthBarBg, playerX, barY, barWidth, barHeight);
    this.drawHealthBarBg(this.enemyHealthBarBg, enemyX, barY, barWidth, barHeight);
    this.updateHealthBars();

    this.playerHealthText = this.add.text(playerX + barWidth / 2, barY + barHeight / 2, '100 / 100', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.enemyHealthText = this.add.text(enemyX + barWidth / 2, barY + barHeight / 2, '100 / 100', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const playerLabel = this.add.text(playerX + barWidth / 2, barY - 14, '玩家', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#64b5f6',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const enemyLabel = this.add.text(enemyX + barWidth / 2, barY - 14, 'AI 对手', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ef9a9a',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private drawHealthBarBg(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    g.clear();
    g.fillStyle(0x1a1a2e, 0.9);
    g.fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 8);

    g.fillStyle(0x263238, 1);
    g.fillRoundedRect(x, y, w, h, 6);

    g.lineStyle(2, 0x546e7a, 0.8);
    g.strokeRoundedRect(x, y, w, h, 6);
  }

  private updateHealthBars(): void {
    this.drawHealthBar(
      this.playerHealthBar,
      50,
      25,
      280,
      22,
      this.player.health,
      this.player.maxHealth,
      'player'
    );
    this.drawHealthBar(
      this.enemyHealthBar,
      this.scale.width - 50 - 280,
      25,
      280,
      22,
      this.enemy.health,
      this.enemy.maxHealth,
      'enemy'
    );

    this.playerHealthText.setText(`${Math.ceil(this.player.health)} / ${this.player.maxHealth}`);
    this.enemyHealthText.setText(`${Math.ceil(this.enemy.health)} / ${this.enemy.maxHealth}`);

    const playerCritical = this.player.health <= this.player.maxHealth * 0.3;
    this.setWarning(playerCritical);
  }

  private drawHealthBar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    health: number,
    maxHealth: number,
    type: 'player' | 'enemy'
  ): void {
    g.clear();
    const percent = Math.max(0, health / maxHealth);
    const fillW = Math.max(0, (w - 4) * percent);
    if (fillW <= 0) return;

    const isCritical = percent <= 0.3;
    const isWarning = percent <= 0.5;

    let color1: number, color2: number;
    if (isCritical) {
      color1 = 0xff1744;
      color2 = 0xb71c1c;
    } else if (isWarning) {
      color1 = 0xffc107;
      color2 = 0xff6f00;
    } else {
      color1 = type === 'player' ? 0x66bb6a : 0xef5350;
      color2 = type === 'player' ? 0x2e7d32 : 0xc62828;
    }

    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(((color1 >> 16) & 0xff) * (1 - t) + ((color2 >> 16) & 0xff) * t);
      const gComp = Math.floor(((color1 >> 8) & 0xff) * (1 - t) + ((color2 >> 8) & 0xff) * t);
      const b = Math.floor((color1 & 0xff) * (1 - t) + (color2 & 0xff) * t);
      const color = (r << 16) | (gComp << 8) | b;
      const segW = fillW / steps;
      g.fillStyle(color, 1);
      g.fillRect(x + 2 + i * segW, y + 2, segW + 1, h - 4);
    }

    g.fillStyle(0xffffff, 0.25);
    g.fillRect(x + 2, y + 2, fillW, (h - 4) * 0.3);
  }

  private createSpellIcons(width: number, height: number): void {
    const iconSize = 60;
    const spacing = 30;
    const elements: SpellElement[] = ['fire', 'water', 'wind', 'earth'];
    const totalWidth = elements.length * iconSize + (elements.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + iconSize / 2;
    const y = height - 60;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const x = startX + i * (iconSize + spacing);
      const icon = this.createSpellIcon(x, y, iconSize, element, i);
      this.spellIcons.push(icon);
    }
  }

  private createSpellIcon(
    x: number,
    y: number,
    size: number,
    element: SpellElement,
    slotIndex: number
  ): SpellIcon {
    const config = SPELL_CONFIGS[element];
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1e1e3f, 0.95);
    bg.fillCircle(0, 0, size / 2);
    bg.fillStyle(config.color, 0.2);
    bg.fillCircle(0, 0, size / 2 - 5);

    const border = this.add.graphics();
    border.lineStyle(4, config.color, 1);
    border.strokeCircle(0, 0, size / 2);

    const cooldownOverlay = this.add.graphics();

    const icon = this.add.text(0, 0, config.icon, {
      fontSize: '28px',
    }).setOrigin(0.5);

    const cooldownText = this.add.text(0, 0, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 'bold 16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const keyHint = this.add.text(size / 2 - 5, -size / 2 + 5, `${slotIndex + 1}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#37474f',
      padding: { x: 4, y: 1 },
    }).setOrigin(1, 0);

    container.add([bg, border, cooldownOverlay, icon, cooldownText, keyHint]);

    container.setSize(size, size);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.selectSpellSlot(slotIndex);
    });

    const pulseTween = this.tweens.add({
      targets: border,
      scale: { from: 1, to: 1.08 },
      alpha: { from: 1, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    return {
      container,
      bg,
      border,
      cooldownOverlay,
      icon,
      cooldownText,
      element,
      slotIndex,
      rotationTween: null,
      pulseTween,
    };
  }

  private selectSpellSlot(slotIndex: number): void {
    this.selectedSpellSlot = slotIndex;
    this.spellIcons.forEach((icon) => {
      const isSelected = icon.slotIndex === slotIndex;
      icon.border.clear();
      const config = SPELL_CONFIGS[icon.element];
      icon.border.lineStyle(isSelected ? 5 : 3, config.color, isSelected ? 1 : 0.7);
      icon.border.strokeCircle(0, 0, 30 + (isSelected ? 2 : 0));
    });
  }

  private updateSpellIcons(): void {
    for (const icon of this.spellIcons) {
      const cooldown = this.spellSystem.getSpellCooldown(icon.element);
      const onCooldown = cooldown > 0;
      const config = SPELL_CONFIGS[icon.element];
      const size = 60;

      icon.cooldownOverlay.clear();

      if (onCooldown) {
        const percent = cooldown / config.cooldown;
        const angle = percent * Math.PI * 2;

        icon.cooldownOverlay.fillStyle(0x000000, 0.65);
        icon.cooldownOverlay.beginPath();
        icon.cooldownOverlay.moveTo(0, 0);
        icon.cooldownOverlay.arc(0, 0, size / 2, -Math.PI / 2, -Math.PI / 2 + angle, false);
        icon.cooldownOverlay.closePath();
        icon.cooldownOverlay.fillPath();

        icon.cooldownOverlay.lineStyle(2, 0x78909c, 0.6);
        icon.cooldownOverlay.beginPath();
        icon.cooldownOverlay.arc(0, 0, size / 2, -Math.PI / 2, -Math.PI / 2 + angle, false);
        icon.cooldownOverlay.strokePath();

        icon.cooldownText.setText((cooldown / 1000).toFixed(1) + 's');
        icon.cooldownText.setVisible(true);
        icon.cooldownText.setColor('#90a4ae');

        icon.icon.setAlpha(0.5);

        icon.border.clear();
        icon.border.lineStyle(3, 0x546e7a, 0.8);
        icon.border.strokeCircle(0, 0, size / 2);

        if (!icon.rotationTween) {
          icon.bg.setScale(0.92);
          icon.rotationTween = this.tweens.add({
            targets: icon.bg,
            angle: 360,
            duration: 3500,
            repeat: -1,
            ease: 'Linear',
          });
        }
      } else {
        icon.cooldownText.setVisible(false);
        icon.icon.setAlpha(1);

        const isSelected = icon.slotIndex === this.selectedSpellSlot;
        icon.border.clear();
        icon.border.lineStyle(isSelected ? 5 : 3, config.color, isSelected ? 1 : 0.9);
        icon.border.strokeCircle(0, 0, size / 2 + (isSelected ? 2 : 0));

        if (icon.rotationTween) {
          icon.rotationTween.stop();
          icon.rotationTween = null;
          icon.bg.setScale(1);
          icon.bg.setAngle(0);
        }

        icon.bg.clear();
        icon.bg.fillStyle(0x1e1e3f, 0.95);
        icon.bg.fillCircle(0, 0, size / 2);
        icon.bg.fillStyle(config.color, 0.25);
        icon.bg.fillCircle(0, 0, size / 2 - 5);
      }
    }
  }

  private createWarningOverlay(width: number, height: number): void {
    this.warningOverlay = this.add.graphics();
    this.warningOverlay.setDepth(1000);
    this.warningOverlay.setAlpha(0);
  }

  private setWarning(active: boolean): void {
    if (this.warningActive === active) return;
    this.warningActive = active;

    if (active) {
      if (this.warningTween) this.warningTween.stop();
      this.warningTween = this.tweens.add({
        targets: this.warningOverlay,
        alpha: { from: 0, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          this.drawWarningOverlay();
        },
      });
    } else {
      if (this.warningTween) {
        this.warningTween.stop();
        this.warningTween = null;
      }
      this.warningOverlay.setAlpha(0);
      this.warningOverlay.clear();
    }
  }

  private drawWarningOverlay(): void {
    const { width, height } = this.scale;
    this.warningOverlay.clear();
    const alpha = this.warningOverlay.alpha;

    const borderWidth = 50;
    this.warningOverlay.fillStyle(0xff0000, alpha * 0.45);
    this.warningOverlay.fillRect(0, 0, width, borderWidth);
    this.warningOverlay.fillRect(0, height - borderWidth, width, borderWidth);
    this.warningOverlay.fillRect(0, 0, borderWidth, height);
    this.warningOverlay.fillRect(width - borderWidth, 0, borderWidth, height);

    this.warningOverlay.fillStyle(0xff0000, alpha * 0.15);
    this.warningOverlay.fillRect(0, 0, width, height);
  }

  private createShieldOverlay(): void {
    this.shieldOverlay = this.add.graphics();
    this.shieldOverlay.setDepth(500);
  }

  private updateShield(): void {
    this.shieldOverlay.clear();
    if (!this.aiController.isShieldActive()) return;

    this.shieldPulse += 0.1;
    const pulse = Math.sin(this.shieldPulse) * 0.2 + 1;
    const r = 55 * pulse;

    this.shieldOverlay.lineStyle(3, 0x00e5ff, 0.8);
    this.shieldOverlay.strokeCircle(this.enemy.x, this.enemy.y, r);

    this.shieldOverlay.fillStyle(0x00e5ff, 0.15);
    this.shieldOverlay.fillCircle(this.enemy.x, this.enemy.y, r);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.shieldPulse * 0.5;
      const px = this.enemy.x + Math.cos(angle) * r;
      const py = this.enemy.y + Math.sin(angle) * r;
      this.shieldOverlay.fillStyle(0x80deea, 0.9);
      this.shieldOverlay.fillCircle(px, py, 4);
    }
  }

  private createTimer(width: number): void {
    this.timerText = this.add.text(width / 2, 60, '60', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1a237e',
      strokeThickness: 4,
    }).setOrigin(0.5);
  }

  private updateTimer(): void {
    const seconds = Math.max(0, Math.ceil(this.battleTimer / 1000));
    this.timerText.setText(seconds.toString());

    if (seconds <= 10) {
      this.timerText.setColor(seconds % 2 === 0 ? '#ff5252' : '#ffffff');
      this.timerText.setFontSize(36 + (seconds % 2) * 4);
    }
  }

  private createFusionHint(width: number, height: number): void {
    this.fusionHintText = this.add.text(width / 2, height / 2 - 80, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);
    this.fusionHintText.setDepth(2000);
    this.fusionHintText.setVisible(false);
  }

  private showFusionHint(text: string, duration: number): void {
    this.fusionHintText.setText(text);
    this.fusionHintText.setVisible(true);
    this.fusionHintText.setAlpha(0);
    this.fusionHintTimer = duration;

    this.tweens.add({
      targets: this.fusionHintText,
      alpha: 1,
      duration: 300,
    });
  }

  private createResultUI(width: number, height: number): void {
    this.resultText = this.add.text(width / 2, height / 2 - 40, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.resultText.setDepth(3000);
    this.resultText.setVisible(false);

    this.resultSubText = this.add.text(width / 2, height / 2 + 30, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.resultSubText.setDepth(3000);
    this.resultSubText.setVisible(false);

    this.restartButton = this.add.container(width / 2, height / 2 + 100);
    this.restartButton.setDepth(3000);
    this.restartButton.setVisible(false);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2979ff, 0.95);
    btnBg.fillRoundedRect(-100, -25, 200, 50, 12);
    btnBg.lineStyle(3, 0x82b1ff, 1);
    btnBg.strokeRoundedRect(-100, -25, 200, 50, 12);

    const btnText = this.add.text(0, 0, '再战一场', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.restartButton.add([btnBg, btnText]);
    this.restartButton.setSize(200, 50);
    this.restartButton.setInteractive({ useHandCursor: true });

    this.restartButton.on('pointerdown', () => {
      this.resetGame();
    });
  }

  private endGame(): void {
    if (this.gameState === 'ended') return;
    this.gameState = 'ended';

    let result: string;
    let subText: string;
    let color: string;

    if (this.player.health > this.enemy.health) {
      result = '胜 利！';
      color = '#66bb6a';
      subText = `玩家 ${Math.ceil(this.player.health)} : ${Math.ceil(this.enemy.health)} AI 对手`;
    } else if (this.player.health < this.enemy.health) {
      result = '失 败...';
      color = '#ef5350';
      subText = `玩家 ${Math.ceil(this.player.health)} : ${Math.ceil(this.enemy.health)} AI 对手`;
    } else {
      result = '平 局';
      color = '#ffca28';
      subText = `双方同归于尽！`;
    }

    this.resultText.setText(result);
    this.resultText.setColor(color);
    this.resultSubText.setText(subText);

    this.resultText.setVisible(true);
    this.resultSubText.setVisible(true);
    this.restartButton.setVisible(true);

    this.resultText.setScale(0);
    this.tweens.add({
      targets: this.resultText,
      scale: 1,
      duration: 500,
      ease: 'Back.Out',
    });

    this.cameras.main.flash(500, 255, 255, 255);
  }

  private resetGame(): void {
    this.player.health = this.player.maxHealth;
    this.enemy.health = this.enemy.maxHealth;
    this.battleTimer = this.battleDuration;
    this.gameState = 'playing';

    this.spellSystem.clearAllProjectiles();
    this.aiController.reset();
    this.explosionParticles = [];

    this.updateHealthBars();

    this.resultText.setVisible(false);
    this.resultSubText.setVisible(false);
    this.restartButton.setVisible(false);
    this.setWarning(false);
  }

  private setupSpellEvents(): void {
    const emitter = this.spellSystem.getEventEmitter();
    emitter.on('spellCast', (data: { element: SpellElement; owner: 'player' | 'ai' }) => {
      if (data.owner === 'player') {
        this.aiController.updatePlayerSpellCast(data.element);
      }
    });
    emitter.on('fusionCreated', (data: any) => {
      const typeName = data.type ? this.getFusionName(data.type) : '融合';
      this.showFusionHint(`✨ ${typeName}！`, 1800);
    });
  }

  private getFusionName(type: string): string {
    const map: Record<string, string> = {
      steam: '蒸汽爆炸',
      firestorm: '火焰旋风',
      mudslide: '泥石流',
      sandstorm: '沙暴',
    };
    return map[type] || '融合技';
  }

  private setupAIEvents(): void {
    const emitter = this.aiController.getEventEmitter();
    emitter.on('shieldActivated', () => {
      this.showFusionHint('🛡️ AI 开启护盾！', 1500);
      this.cameras.main.flash(200, 0, 229, 255);
    });
    emitter.on('shieldBlocked', () => {
      const { x, y } = this.enemy;
      this.createSparks(x, y, 0x00e5ff, 0x80deea, 12);
    });
    emitter.on('defeated', () => {
      setTimeout(() => this.endGame(), 600);
    });
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState !== 'playing') return;

      const elements: SpellElement[] = ['fire', 'water', 'wind', 'earth'];
      const element = elements[this.selectedSpellSlot];
      if (!this.spellSystem.isSpellReady(element)) return;

      this.castPlayerSpell(element, pointer.x, pointer.y);
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.gameState !== 'playing') return;
      const num = parseInt(event.key);
      if (num >= 1 && num <= 4) {
        this.selectSpellSlot(num - 1);
      }
    });
  }

  private castPlayerSpell(element: SpellElement, targetX: number, targetY: number): void {
    const elements: SpellElement[] = ['fire', 'water', 'wind', 'earth'];
    const slotIndex = elements.indexOf(element);
    if (slotIndex === -1) return;

    this.spellSystem.castSpell(
      slotIndex,
      this.player.x,
      this.player.y,
      targetX,
      targetY,
      'player'
    );

    const config = SPELL_CONFIGS[element];
    this.createSparks(this.player.x + 20, this.player.y, config.glowColor, config.color, 8);
  }

  private createSparks(x: number, y: number, color1: number, color2: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.explosionParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 300,
        maxLife: 800,
        color: Math.random() < 0.5 ? color1 : color2,
        size: 2 + Math.random() * 4,
      });
    }
  }

  private createExplosion(
    x: number,
    y: number,
    element: SpellElement | 'fusion',
    fusion: FusionEffect | null,
    isFused: boolean
  ): void {
    let mainColor: number, glowColor: number, count: number;

    if (isFused && fusion) {
      mainColor = fusion.color;
      glowColor = fusion.glowColor;
      count = Math.floor(50 * fusion.radiusMultiplier);
    } else if (element !== 'fusion') {
      const config = SPELL_CONFIGS[element as SpellElement];
      mainColor = config.color;
      glowColor = config.glowColor;
      count = 30;
    } else {
      mainColor = 0xffffff;
      glowColor = 0xffffff;
      count = 40;
    }

    const toAdd = Math.min(count, this.maxExplosionParticles - this.explosionParticles.length);
    const realCount = Math.max(10, toAdd);

    for (let i = 0; i < realCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 160;
      this.explosionParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 400 + Math.random() * 700,
        maxLife: 1100,
        color: Math.random() < 0.5 ? mainColor : glowColor,
        size: isFused ? 3 + Math.random() * 6 : 2 + Math.random() * 5,
      });
    }

    this.cameras.main.shake(isFused ? 180 : 100, isFused ? 0.008 : 0.004);
  }

  public update(time: number, delta: number): void {
    if (this.gameState === 'ended') return;

    if (this.gameState === 'playing') {
      this.battleTimer -= delta;
      if (this.battleTimer <= 0) {
        this.battleTimer = 0;
        this.endGame();
      }
      this.updateTimer();
    }

    this.spellSystem.update(time, delta);
    this.aiController.update(time, delta);

    this.physicsUpdateAccumulator += delta;
    while (this.physicsUpdateAccumulator >= this.PHYSICS_INTERVAL) {
      this.physicsStep(this.PHYSICS_INTERVAL);
      this.physicsUpdateAccumulator -= this.PHYSICS_INTERVAL;
    }

    this.updateSpellIcons();
    this.updateShield();
    this.updateParticles(delta);
    this.updateDamageFlash(delta);

    if (this.fusionHintTimer > 0) {
      this.fusionHintTimer -= delta;
      if (this.fusionHintTimer <= 0) {
        this.fusionHintTimer = 0;
        this.tweens.add({
          targets: this.fusionHintText,
          alpha: 0,
          duration: 300,
          onComplete: () => this.fusionHintText.setVisible(false),
        });
      }
    }
  }

  private physicsStep(delta: number): void {
    this.checkProjectileCollisions();
    this.checkCharacterCollisions();
  }

  private checkProjectileCollisions(): void {
    const projectiles = this.spellSystem.getProjectiles();

    for (let i = 0; i < projectiles.length; i++) {
      for (let j = i + 1; j < projectiles.length; j++) {
        const p1 = projectiles[i];
        const p2 = projectiles[j];
        if (!p1.active || !p2.active) continue;
        if (p1.id === p2.id) continue;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const collisionDist = p1.radius + p2.radius;

        if (dist < collisionDist) {
          this.handleProjectileCollision(p1, p2);
        }
      }
    }
  }

  private handleProjectileCollision(p1: SpellProjectile, p2: SpellProjectile): void {
    if (p1.isFused || p2.isFused) {
      const fused = p1.isFused ? p1 : p2;
      const other = p1.isFused ? p2 : p1;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      this.createExplosion(midX, midY, 'fusion', fused.fusionEffect, true);
      this.spellSystem.removeProjectile(p1);
      this.spellSystem.removeProjectile(p2);
      return;
    }

    if (p1.element === p2.element) {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      this.createExplosion(midX, midY, p1.element, null, false);
      this.spellSystem.removeProjectile(p1);
      this.spellSystem.removeProjectile(p2);
      return;
    }

    const key = `${p1.element}+${p2.element}`;
    const fusion = FUSION_MAP[key];
    if (fusion) {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const owner = p1.owner;
      this.spellSystem.removeProjectile(p1);
      this.spellSystem.removeProjectile(p2);

      const target = owner === 'player' ? { x: this.enemy.x, y: this.enemy.y } : { x: this.player.x, y: this.player.y };
      const newProj = this.spellSystem.castSpellByElement(
        p1.element,
        midX,
        midY,
        target.x,
        target.y,
        owner
      );

      if (newProj) {
        newProj.applyFusion(fusion);
        this.spellSystem.getEventEmitter().emit('fusionCreated', {
          type: fusion.type,
          position: { x: midX, y: midY },
        });
      }
      return;
    }

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    this.createExplosion(midX, midY, p1.element, null, false);
    this.spellSystem.removeProjectile(p1);
    this.spellSystem.removeProjectile(p2);
  }

  private checkCharacterCollisions(): void {
    const projectiles = this.spellSystem.getProjectiles();

    for (const proj of projectiles) {
      if (!proj.active) continue;

      if (proj.owner !== 'player') {
        const dx = proj.x - this.player.x;
        const dy = proj.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < proj.radius + this.player.radius) {
          this.damagePlayer(proj.damage);
          this.createExplosion(proj.x, proj.y, proj.element, proj.fusionEffect, proj.isFused);
          this.spellSystem.removeProjectile(proj);
          continue;
        }
      }

      if (proj.owner !== 'ai') {
        const dx = proj.x - this.enemy.x;
        const dy = proj.y - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < proj.radius + this.enemy.radius) {
          const actualDamage = this.aiController.takeDamage(proj.damage);
          if (actualDamage > 0) {
            this.enemy.health = this.aiController.getHealth();
            this.enemy.damageFlash = 400;
          }
          this.createExplosion(proj.x, proj.y, proj.element, proj.fusionEffect, proj.isFused);
          this.spellSystem.removeProjectile(proj);
          this.updateHealthBars();
          continue;
        }
      }
    }
  }

  private damagePlayer(damage: number): void {
    this.player.health = Math.max(0, this.player.health - damage);
    this.player.damageFlash = 400;
    this.updateHealthBars();

    if (this.player.health <= 0) {
      setTimeout(() => this.endGame(), 600);
    }
  }

  private updateDamageFlash(delta: number): void {
    if (this.player.damageFlash > 0) {
      this.player.damageFlash -= delta;
      const intensity = Math.max(0, this.player.damageFlash / 400);
      this.player.body.setAlpha(1 - intensity * 0.5);
      if (Math.floor(this.player.damageFlash / 60) % 2 === 0) {
        this.player.body.setTint(0xff0000);
      } else {
        this.player.body.clearTint();
      }
    } else {
      this.player.body.setAlpha(1);
      this.player.body.clearTint();
    }

    if (this.enemy.damageFlash > 0) {
      this.enemy.damageFlash -= delta;
      const intensity = Math.max(0, this.enemy.damageFlash / 400);
      this.enemy.body.setAlpha(1 - intensity * 0.5);
      if (Math.floor(this.enemy.damageFlash / 60) % 2 === 0) {
        this.enemy.body.setTint(0xff0000);
      } else {
        this.enemy.body.clearTint();
      }
    } else {
      this.enemy.body.setAlpha(1);
      this.enemy.body.clearTint();
    }
  }

  private updateParticles(delta: number): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();

    for (const p of this.backgroundParticles) {
      p.x += p.vx * (delta / 16);
      p.y += p.vy * (delta / 16);

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
    }

    this.drawBackgroundParticles();

    this.explosionParticles = this.explosionParticles.filter((p) => {
      p.life -= delta;
      if (p.life <= 0) return false;

      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx * (delta / 16);
      p.y += p.vy * (delta / 16);
      return true;
    });

    this.drawExplosionParticles();
  }

  private drawBackgroundParticles(): void {
    const g = this.backgroundParticles.length > 0 ? (this.add.graphics() as any) : null;
    if (!g) return;
    if ((window as any).__bgCache) {
      (window as any).__bgCache.destroy();
    }

    const gg = this.add.graphics();
    for (const p of this.backgroundParticles) {
      const alpha = 0.3 + Math.sin(Date.now() * 0.002 + p.x * 0.01) * 0.2;
      gg.fillStyle(p.color, alpha);
      gg.fillCircle(p.x, p.y, p.size);
      gg.fillStyle(0xffffff, alpha * 0.5);
      gg.fillCircle(p.x - p.size * 0.2, p.y - p.size * 0.2, p.size * 0.4);
    }
    (window as any).__bgCache = gg;
  }

  private drawExplosionParticles(): void {
    if ((window as any).__exCache) {
      (window as any).__exCache.destroy();
    }

    if (this.explosionParticles.length === 0) return;

    const g = this.add.graphics();
    for (const p of this.explosionParticles) {
      const alpha = Math.min(1, p.life / (p.maxLife * 0.5));
      const size = p.size * alpha;
      g.fillStyle(p.color, alpha);
      g.fillCircle(p.x, p.y, size);
      g.fillStyle(0xffffff, alpha * 0.8);
      g.fillCircle(p.x - size * 0.2, p.y - size * 0.2, size * 0.5);
    }
    (window as any).__exCache = g;
  }
}
