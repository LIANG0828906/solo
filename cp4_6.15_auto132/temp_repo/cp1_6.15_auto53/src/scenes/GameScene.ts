import Phaser from 'phaser';
import { Plant, PlantType, EnvironmentParams } from '../objects/Plant';
import { SeedSlot, SeedStatus } from '../objects/SeedSlot';

export class GameScene extends Phaser.Scene {
  private plant: Plant | null = null;
  private seedSlots: SeedSlot[] = [];
  private sunPoints: number = 200;

  private environment: EnvironmentParams = {
    temperature: 50,
    humidity: 50,
    light: 50
  };

  private potGraphics!: Phaser.GameObjects.Graphics;
  private starfieldGraphics!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; size: number; brightness: number; twinkleSpeed: number }[] = [];
  private starfieldRotation: number = 0;

  private controlPanelContainer!: Phaser.GameObjects.Container;
  private controlPanelBg!: Phaser.GameObjects.Graphics;

  private temperatureSlider!: Phaser.GameObjects.Graphics;
  private temperatureHandle!: Phaser.GameObjects.Graphics;
  private temperatureText!: Phaser.GameObjects.Text;
  private temperatureIcon!: Phaser.GameObjects.Graphics;

  private humiditySlider!: Phaser.GameObjects.Graphics;
  private humidityHandle!: Phaser.GameObjects.Graphics;
  private humidityText!: Phaser.GameObjects.Text;
  private humidityIcon!: Phaser.GameObjects.Graphics;

  private lightSlider!: Phaser.GameObjects.Graphics;
  private lightHandle!: Phaser.GameObjects.Graphics;
  private lightText!: Phaser.GameObjects.Text;
  private lightIcon!: Phaser.GameObjects.Graphics;

  private sunPointsText!: Phaser.GameObjects.Text;
  private sunIcon!: Phaser.GameObjects.Graphics;
  private sunCounterContainer!: Phaser.GameObjects.Container;

  private isDraggingTemp: boolean = false;
  private isDraggingHumidity: boolean = false;
  private isDraggingLight: boolean = false;

  private sliderWidth: number = 140;
  private sliderHeight: number = 8;

  constructor() {
    super('GameScene');
  }

  preload(): void {}

  create(): void {
    this.createStarfield();
    this.createPot();
    this.createControlPanel();
    this.createSeedSlots();
    this.createSunCounter();
    this.setupInput();

    this.scale.on('resize', this.handleResize, this);
    this.handleResize();
  }

  private createStarfield(): void {
    this.starfieldGraphics = this.add.graphics();
    this.stars = [];

    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Phaser.Math.Between(-300, 300),
        y: Phaser.Math.Between(-300, 300),
        size: Phaser.Math.FloatBetween(0.5, 2.5),
        brightness: Phaser.Math.FloatBetween(0.3, 1),
        twinkleSpeed: Phaser.Math.FloatBetween(0.5, 2)
      });
    }
  }

  private createPot(): void {
    this.potGraphics = this.add.graphics();
    this.drawPot();
  }

  private drawPot(): void {
    this.potGraphics.clear();

    const centerX = this.scale.width / 2 - 120;
    const centerY = this.scale.height / 2 + 50;

    const potWidth = 160;
    const potHeight = 100;
    const potTopY = centerY - potHeight / 2;
    const potBottomY = centerY + potHeight / 2;

    const soilColor = 0x5d4e37;
    const potColor = 0x8b6914;
    const potHighlight = 0xa07d2a;

    this.potGraphics.fillStyle(potColor);
    this.potGraphics.beginPath();
    this.potGraphics.moveTo(centerX - potWidth / 2, potTopY);
    this.potGraphics.lineTo(centerX + potWidth / 2, potTopY);
    this.potGraphics.lineTo(centerX + potWidth / 2 - 15, potBottomY);
    this.potGraphics.lineTo(centerX - potWidth / 2 + 15, potBottomY);
    this.potGraphics.closePath();
    this.potGraphics.fillPath();

    this.potGraphics.fillStyle(potHighlight);
    this.potGraphics.beginPath();
    this.potGraphics.moveTo(centerX - potWidth / 2, potTopY);
    this.potGraphics.lineTo(centerX - potWidth / 2 + 20, potTopY);
    this.potGraphics.lineTo(centerX - potWidth / 2 + 10, potBottomY - 10);
    this.potGraphics.lineTo(centerX - potWidth / 2 + 15, potBottomY);
    this.potGraphics.closePath();
    this.potGraphics.fillPath();

    this.potGraphics.fillStyle(soilColor);
    this.potGraphics.fillEllipse(centerX, potTopY, potWidth / 2 - 5, 15);

    this.potGraphics.fillStyle(0x4a3c2a);
    for (let i = 0; i < 8; i++) {
      const dotX = centerX + Phaser.Math.Between(-60, 60);
      const dotY = potTopY + Phaser.Math.Between(2, 8);
      this.potGraphics.beginPath();
      this.potGraphics.arc(dotX, dotY, Phaser.Math.FloatBetween(2, 4), 0, Math.PI * 2);
      this.potGraphics.fillPath();
    }
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

  private createControlPanel(): void {
    this.controlPanelContainer = this.add.container(0, 0);

    this.controlPanelBg = this.add.graphics();

    this.temperatureIcon = this.add.graphics();
    this.temperatureSlider = this.add.graphics();
    this.temperatureHandle = this.add.graphics();
    this.temperatureText = this.add.text(0, 0, '50', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.humidityIcon = this.add.graphics();
    this.humiditySlider = this.add.graphics();
    this.humidityHandle = this.add.graphics();
    this.humidityText = this.add.text(0, 0, '50', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.lightIcon = this.add.graphics();
    this.lightSlider = this.add.graphics();
    this.lightHandle = this.add.graphics();
    this.lightText = this.add.text(0, 0, '50', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.controlPanelContainer.add([
      this.controlPanelBg,
      this.temperatureIcon, this.temperatureSlider, this.temperatureHandle, this.temperatureText,
      this.humidityIcon, this.humiditySlider, this.humidityHandle, this.humidityText,
      this.lightIcon, this.lightSlider, this.lightHandle, this.lightText
    ]);

    this.updateControlPanelPosition();

    this.temperatureHandle.setInteractive(
      new Phaser.Geom.Circle(0, 0, 14),
      Phaser.Geom.Circle.Contains
    );
    this.humidityHandle.setInteractive(
      new Phaser.Geom.Circle(0, 0, 14),
      Phaser.Geom.Circle.Contains
    );
    this.lightHandle.setInteractive(
      new Phaser.Geom.Circle(0, 0, 14),
      Phaser.Geom.Circle.Contains
    );

    this.temperatureSlider.setInteractive(
      new Phaser.Geom.Rectangle(-this.sliderWidth / 2, -14, this.sliderWidth, 28),
      Phaser.Geom.Rectangle.Contains
    );
    this.humiditySlider.setInteractive(
      new Phaser.Geom.Rectangle(-this.sliderWidth / 2, -14, this.sliderWidth, 28),
      Phaser.Geom.Rectangle.Contains
    );
    this.lightSlider.setInteractive(
      new Phaser.Geom.Rectangle(-this.sliderWidth / 2, -14, this.sliderWidth, 28),
      Phaser.Geom.Rectangle.Contains
    );
  }

  private updateControlPanelPosition(): void {
    const panelX = this.scale.width - 120;
    const panelY = this.scale.height / 2;

    this.controlPanelContainer.x = panelX;
    this.controlPanelContainer.y = panelY;

    this.controlPanelBg.clear();
    this.controlPanelBg.fillStyle(0xffffff, 0.1);
    this.controlPanelBg.lineStyle(1, 0xffffff, 0.2);
    this.drawRoundedRect(this.controlPanelBg, -90, -180, 180, 360, 20);
    this.controlPanelBg.fillPath();
    this.controlPanelBg.strokePath();

    const iconY = -130;
    const textY = -105;
    const sliderY = -80;
    const spacing = 100;

    this.drawIcon(this.temperatureIcon, 0, iconY, 'fire', 0xff6b35);
    this.temperatureText.setPosition(0, textY);
    this.drawSlider(this.temperatureSlider, this.temperatureHandle, 0, sliderY, this.environment.temperature, 0xff6b35);

    this.drawIcon(this.humidityIcon, 0, iconY + spacing, 'drop', 0x74b9ff);
    this.humidityText.setPosition(0, textY + spacing);
    this.drawSlider(this.humiditySlider, this.humidityHandle, 0, sliderY + spacing, this.environment.humidity, 0x74b9ff);

    this.drawIcon(this.lightIcon, 0, iconY + spacing * 2, 'sun', 0xffd93d);
    this.lightText.setPosition(0, textY + spacing * 2);
    this.drawSlider(this.lightSlider, this.lightHandle, 0, sliderY + spacing * 2, this.environment.light, 0xffd93d);
  }

  private drawIcon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, type: string, color: number): void {
    graphics.clear();
    graphics.fillStyle(color);

    if (type === 'fire') {
      graphics.beginPath();
      const segments = 10;
      const w = 10;
      const h = 14;
      graphics.moveTo(x, y - h);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const px = x + Math.sin(t * Math.PI) * w * (1 - t * 0.3);
        const py = y - h + h * t;
        graphics.lineTo(px, py);
      }
      for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        const px = x - Math.sin(t * Math.PI) * w * (1 - t * 0.3);
        const py = y - h + h * t;
        graphics.lineTo(px, py);
      }
      graphics.closePath();
      graphics.fillPath();
    } else if (type === 'drop') {
      graphics.beginPath();
      const w = 8;
      const h = 14;
      const segs = 12;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const angle = -Math.PI / 2 + t * Math.PI;
        const px = x + Math.cos(angle) * w * (0.5 + t * 0.5);
        const py = y + Math.sin(angle) * w * (0.5 + t * 0.5) - h * 0.3;
        if (i === 0) {
          graphics.moveTo(px, py);
        } else {
          graphics.lineTo(px, py);
        }
      }
      for (let i = segs; i >= 0; i--) {
        const t = i / segs;
        const angle = -Math.PI / 2 - t * Math.PI;
        const px = x + Math.cos(angle) * w * (0.5 + t * 0.5);
        const py = y + Math.sin(angle) * w * (0.5 + t * 0.5) - h * 0.3;
        graphics.lineTo(px, py);
      }
      graphics.closePath();
      graphics.fillPath();
    } else if (type === 'sun') {
      graphics.fillCircle(x, y, 10);

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rayX = x + Math.cos(angle) * 15;
        const rayY = y + Math.sin(angle) * 15;
        graphics.fillRect(rayX - 2, rayY - 2, 4, 4);
      }
    }
  }

  private drawSlider(
    sliderGraphics: Phaser.GameObjects.Graphics,
    handleGraphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    value: number,
    color: number
  ): void {
    sliderGraphics.clear();
    handleGraphics.clear();

    const width = this.sliderWidth;
    const height = this.sliderHeight;

    sliderGraphics.fillStyle(0x3d3d3d, 0.8);
    this.drawRoundedRect(sliderGraphics, x - width / 2, y - height / 2, width, height, height / 2);
    sliderGraphics.fillPath();

    const fillWidth = (value / 100) * width;
    sliderGraphics.fillStyle(color);
    this.drawRoundedRect(sliderGraphics, x - width / 2, y - height / 2, fillWidth, height, height / 2);
    sliderGraphics.fillPath();

    const handleX = x - width / 2 + fillWidth;
    handleGraphics.fillStyle(0xffffff);
    handleGraphics.lineStyle(2, color);
    handleGraphics.beginPath();
    handleGraphics.arc(0, 0, 10, 0, Math.PI * 2);
    handleGraphics.fillPath();
    handleGraphics.strokePath();

    handleGraphics.x = handleX;
    handleGraphics.y = y;
  }

  private createSeedSlots(): void {
    const seedTypes: PlantType[] = ['fireFlower', 'iceGrass', 'windBell'];
    const costs = [50, 60, 45];

    const bottomY = this.scale.height - 70;
    const startX = this.scale.width / 2 - 140;

    seedTypes.forEach((type, index) => {
      const slot = new SeedSlot(this, startX + index * 110, bottomY, {
        type,
        status: 'available',
        cost: costs[index]
      });

      slot.on('pointerdown', () => this.handleSeedSlotClick(slot));

      this.seedSlots.push(slot);
    });
  }

  private createSunCounter(): void {
    this.sunCounterContainer = this.add.container(0, 0);

    this.sunIcon = this.add.graphics();
    this.drawSunIcon();

    this.sunPointsText = this.add.text(25, 0, `${this.sunPoints}`, {
      fontSize: '20px',
      color: '#ffd93d',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.sunCounterContainer.add([this.sunIcon, this.sunPointsText]);
    this.sunCounterContainer.x = this.scale.width / 2;
    this.sunCounterContainer.y = this.scale.height - 130;
  }

  private drawSunIcon(): void {
    this.sunIcon.clear();
    this.sunIcon.fillStyle(0xffd93d);
    this.sunIcon.fillCircle(0, 0, 12);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rayX = Math.cos(angle) * 16;
      const rayY = Math.sin(angle) * 16;
      this.sunIcon.fillRect(rayX - 2, rayY - 2, 4, 4);
    }
  }

  private setupInput(): void {
    this.temperatureHandle.on('pointerdown', () => {
      this.isDraggingTemp = true;
    });
    this.humidityHandle.on('pointerdown', () => {
      this.isDraggingHumidity = true;
    });
    this.lightHandle.on('pointerdown', () => {
      this.isDraggingLight = true;
    });

    this.input.on('pointerup', () => {
      this.isDraggingTemp = false;
      this.isDraggingHumidity = false;
      this.isDraggingLight = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingTemp) {
        this.updateSliderFromPointer(pointer, 'temperature');
      }
      if (this.isDraggingHumidity) {
        this.updateSliderFromPointer(pointer, 'humidity');
      }
      if (this.isDraggingLight) {
        this.updateSliderFromPointer(pointer, 'light');
      }
    });

    this.temperatureSlider.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingTemp = true;
      this.updateSliderFromPointer(pointer, 'temperature');
    });
    this.humiditySlider.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingHumidity = true;
      this.updateSliderFromPointer(pointer, 'humidity');
    });
    this.lightSlider.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingLight = true;
      this.updateSliderFromPointer(pointer, 'light');
    });
  }

  private getSliderLocalX(pointer: Phaser.Input.Pointer, sliderY: number): number {
    const localPoint = this.controlPanelContainer.getLocalPoint(
      pointer.x,
      pointer.y
    );
    return localPoint.x;
  }

  private updateSliderFromPointer(pointer: Phaser.Input.Pointer, type: 'temperature' | 'humidity' | 'light'): void {
    const panelX = this.scale.width - 120;
    const relX = pointer.x - panelX;

    let sliderY: number;
    if (type === 'temperature') sliderY = -80;
    else if (type === 'humidity') sliderY = 20;
    else sliderY = 120;

    let value = (relX + this.sliderWidth / 2) / this.sliderWidth * 100;
    value = Phaser.Math.Clamp(value, 0, 100);

    if (type === 'temperature') {
      this.environment.temperature = value;
      this.temperatureText.setText(Math.round(value).toString());
      this.drawSlider(this.temperatureSlider, this.temperatureHandle, 0, -80, value, 0xff6b35);
    } else if (type === 'humidity') {
      this.environment.humidity = value;
      this.humidityText.setText(Math.round(value).toString());
      this.drawSlider(this.humiditySlider, this.humidityHandle, 0, 20, value, 0x74b9ff);
    } else if (type === 'light') {
      this.environment.light = value;
      this.lightText.setText(Math.round(value).toString());
      this.drawSlider(this.lightSlider, this.lightHandle, 0, 120, value, 0xffd93d);
    }

    if (this.plant) {
      this.plant.setEnvironment({ [type]: value });
    }
  }

  private handleSeedSlotClick(slot: SeedSlot): void {
    if (slot.getStatus() !== 'available') return;

    const cost = slot.getCost();
    if (this.sunPoints < cost) {
      this.showInsufficientSunWarning();
      return;
    }

    this.sunPoints -= cost;
    this.sunPointsText.setText(`${this.sunPoints}`);

    this.sunIcon.scale = 1.2;
    this.tweens.add({
      targets: this.sunIcon,
      scale: 1,
      duration: 200,
      ease: 'Bounce.easeOut'
    });

    if (this.plant) {
      this.plant.destroy();
      this.plant = null;
    }

    this.seedSlots.forEach(s => s.setStatus('available'));

    const centerX = this.scale.width / 2 - 120;
    const centerY = this.scale.height / 2 + 20;

    this.plant = new Plant(this, centerX, centerY, slot.getType());

    slot.setStatus('planted');

    this.plant.setEnvironment({ ...this.environment });

    const checkMature = () => {
      if (this.plant && this.plant.getStage() === 'mature') {
        slot.setStatus('mature');
        this.sunPoints += 30;
        this.sunPointsText.setText(`${this.sunPoints}`);
      } else if (this.plant) {
        this.time.delayedCall(1000, checkMature);
      }
    };
    this.time.delayedCall(1000, checkMature);
  }

  private showInsufficientSunWarning(): void {
    const warning = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 100,
      '阳光不足！',
      {
        fontSize: '24px',
        color: '#ff6b6b',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: warning,
      alpha: 0,
      y: warning.y - 30,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => warning.destroy()
    });
  }

  update(time: number, delta: number): void {
    this.updateStarfield(delta);

    if (this.plant) {
      this.plant.update(delta);
    }
  }

  private updateStarfield(delta: number): void {
    this.starfieldRotation += delta * 0.0002;

    this.starfieldGraphics.clear();

    const w = this.scale.width;
    const h = this.scale.height;

    this.starfieldGraphics.fillStyle(0x0a0a2e, 1);
    this.starfieldGraphics.fillRect(0, 0, w, h);

    const centerX = w / 2 - 120;
    const centerY = h / 2 - 50;

    const gradientLayers = 6;
    const maxRadius = Math.max(w, h) * 0.6;

    for (let i = gradientLayers; i >= 0; i--) {
      const t = i / gradientLayers;
      const radius = maxRadius * (0.2 + t * 0.8);
      const purple = Phaser.Math.Linear(0x2c1654, 0x1a1a4e, t);
      const alpha = (1 - t) * (1 - t) * 0.5;

      this.starfieldGraphics.fillStyle(purple, alpha);
      this.starfieldGraphics.beginPath();
      this.starfieldGraphics.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.starfieldGraphics.fillPath();
    }

    const time = this.time.now;
    this.stars.forEach((star, i) => {
      const angle = this.starfieldRotation + i * 0.1;
      const radius = 80 + (i % 5) * 40;
      const x = centerX + Math.cos(angle) * radius + star.x * 0.5;
      const y = centerY + Math.sin(angle) * radius + star.y * 0.5;

      if (x < 0 || x > w || y < 0 || y > h) return;

      const twinkle = (Math.sin(time * star.twinkleSpeed / 1000) + 1) / 2;
      const alpha = star.brightness * (0.5 + twinkle * 0.5);

      this.starfieldGraphics.fillStyle(0xffffff, alpha);
      this.starfieldGraphics.beginPath();
      this.starfieldGraphics.arc(x, y, star.size, 0, Math.PI * 2);
      this.starfieldGraphics.fillPath();
    });
  }

  private handleResize(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.drawPot();
    this.updateControlPanelPosition();

    if (this.plant) {
      this.plant.x = width / 2 - 120;
      this.plant.y = height / 2 + 20;
    }

    const bottomY = height - 70;
    const startX = width / 2 - 140;
    this.seedSlots.forEach((slot, index) => {
      slot.x = startX + index * 110;
      slot.y = bottomY;
    });

    if (this.sunCounterContainer) {
      this.sunCounterContainer.x = width / 2;
      this.sunCounterContainer.y = height - 130;
    }
  }
}
