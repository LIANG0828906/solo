import Phaser from 'phaser';
import { PlantType } from './Plant';

export type SeedStatus = 'available' | 'planted' | 'mature';

interface SeedSlotConfig {
  type: PlantType;
  status: SeedStatus;
  cost: number;
}

const SEED_NAMES: Record<PlantType, string> = {
  fireFlower: '火焰花',
  iceGrass: '冰晶草',
  windBell: '风铃藤'
};

const SEED_COLORS: Record<PlantType, { main: number; accent: number }> = {
  fireFlower: { main: 0xff6b35, accent: 0xffcc02 },
  iceGrass: { main: 0x74b9ff, accent: 0x00cec9 },
  windBell: { main: 0xa29bfe, accent: 0x55efc4 }
};

export class SeedSlot extends Phaser.GameObjects.Container {
  private plantType: PlantType;
  private status: SeedStatus;
  private cost: number;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private iconGraphics!: Phaser.GameObjects.Graphics;
  private labelText!: Phaser.GameObjects.Text;
  private costText!: Phaser.GameObjects.Text;
  private statusIndicator!: Phaser.GameObjects.Graphics;

  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: SeedSlotConfig
  ) {
    super(scene, x, y);
    this.plantType = config.type;
    this.status = config.status;
    this.cost = config.cost;

    this.createUI();
    this.setupInteraction();

    scene.add.existing(this);
  }

  private createUI(): void {
    const width = 90;
    const height = 100;

    this.bgGraphics = this.scene.add.graphics();
    this.drawBackground();

    this.iconGraphics = this.scene.add.graphics();
    this.drawIcon();

    this.labelText = this.scene.add.text(0, 30, SEED_NAMES[this.plantType], {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.costText = this.scene.add.text(0, 45, `☀ ${this.cost}`, {
      fontSize: '11px',
      color: '#ffd93d',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.statusIndicator = this.scene.add.graphics();
    this.drawStatusIndicator();

    this.add(this.bgGraphics);
    this.add(this.iconGraphics);
    this.add(this.labelText);
    this.add(this.costText);
    this.add(this.statusIndicator);
  }

  private drawRoundedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    g.lineTo(x + w, y + h - r);
    g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + r, y + h);
    g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    g.lineTo(x, y + r);
    g.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    g.closePath();
  }

  private drawBackground(): void {
    const width = 90;
    const height = 100;
    const radius = 15;
    const x = -width / 2;
    const y = -height / 2;

    this.bgGraphics.clear();

    let alpha = 0.7;
    if (this.isHovered) alpha = 0.9;
    if (this.isPressed) alpha = 1.0;

    this.bgGraphics.fillStyle(0x2d3436, alpha);
    this.drawRoundedRect(this.bgGraphics, x, y, width, height, radius);
    this.bgGraphics.fillPath();

    this.bgGraphics.lineStyle(2, 0x636e72, alpha);
    this.drawRoundedRect(this.bgGraphics, x, y, width, height, radius);
    this.bgGraphics.strokePath();
  }

  private drawIcon(): void {
    this.iconGraphics.clear();

    const colors = SEED_COLORS[this.plantType];

    this.iconGraphics.fillStyle(colors.main);
    this.iconGraphics.fillEllipse(0, -10, 18, 24);

    this.iconGraphics.fillStyle(colors.accent, 0.5);
    this.iconGraphics.fillEllipse(-5, -15, 6, 10);

    if (this.status === 'planted') {
      this.iconGraphics.fillStyle(0x2ecc71);
      this.iconGraphics.fillRect(-8, 10, 16, 4);
    } else if (this.status === 'mature') {
      this.iconGraphics.fillStyle(0xf1c40f);
      this.iconGraphics.fillCircle(0, 0, 8);
    }
  }

  private drawStatusIndicator(): void {
    this.statusIndicator.clear();

    const dotX = 25;
    const dotY = -35;

    let color: number;
    if (this.status === 'available') {
      color = 0x2ecc71;
    } else if (this.status === 'planted') {
      color = 0xf39c12;
    } else {
      color = 0xe74c3c;
    }

    this.statusIndicator.fillStyle(color);
    this.statusIndicator.fillCircle(dotX, dotY, 6);
  }

  private setupInteraction(): void {
    this.setSize(90, 100);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      this.isHovered = true;
      this.drawBackground();
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.isPressed = false;
      this.drawBackground();
    });

    this.on('pointerdown', () => {
      this.isPressed = true;
      this.drawBackground();
    });

    this.on('pointerup', () => {
      this.isPressed = false;
      this.drawBackground();
    });

    this.on('pointerupoutside', () => {
      this.isPressed = false;
      this.drawBackground();
    });
  }

  public setStatus(status: SeedStatus): void {
    this.status = status;
    this.drawIcon();
    this.drawStatusIndicator();

    if (status === 'mature') {
      this.scene.tweens.add({
        targets: this,
        scale: 1.1,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  public getStatus(): SeedStatus {
    return this.status;
  }

  public getType(): PlantType {
    return this.plantType;
  }

  public getCost(): number {
    return this.cost;
  }
}
