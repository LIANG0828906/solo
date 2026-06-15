import Phaser from 'phaser';
import type { Resources, ShipStats, Tile, BuildingType, WeatherType } from './GameScene';

export default class UIScene extends Phaser.Scene {
  private resources!: Resources;
  private shipStats!: ShipStats;
  private tiles: Tile[][] = [];
  private weather: WeatherType = 'sunny';
  private isNight: boolean = false;

  private resourcePanel!: Phaser.GameObjects.Container;
  private buildingMenu!: Phaser.GameObjects.Container;
  private shipPanel!: Phaser.GameObjects.Container;
  private minimap!: Phaser.GameObjects.Container;

  private woodText!: Phaser.GameObjects.Text;
  private stoneText!: Phaser.GameObjects.Text;
  private grainText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;

  private woodIcon!: Phaser.GameObjects.Sprite;
  private stoneIcon!: Phaser.GameObjects.Sprite;
  private grainIcon!: Phaser.GameObjects.Sprite;
  private goldIcon!: Phaser.GameObjects.Sprite;

  private capacityText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private defenseText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  private _selectedBuilding: BuildingType = null;

  private buildingButtons: { type: BuildingType; button: Phaser.GameObjects.Container; icon: Phaser.GameObjects.Sprite; costText: Phaser.GameObjects.Text }[] = [];

  private upgradeShipButton!: Phaser.GameObjects.Container;

  private weatherIcon!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.resources = { wood: 20, stone: 10, grain: 15, gold: 50 };
    this.shipStats = { capacity: 100, speed: 1, defense: 1, level: 1 };

    this.createResourcePanel();
    this.createBuildingMenu();
    this.createShipPanel();
    this.createMinimap();
    this.createWeatherDisplay();

    this.setupEventListeners();

    this.time.delayedCall(100, () => {
      this.requestGameState();
    });
  }

  private setupEventListeners(): void {
    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('resourcesChanged', (resources: Resources) => {
      this.resources = { ...resources };
      this.updateResourceDisplay();
    });

    gameScene.events.on('shipStatsChanged', (stats: ShipStats) => {
      this.shipStats = { ...stats };
      this.updateShipDisplay();
    });

    gameScene.events.on('tilesUpdated', (tiles: Tile[][]) => {
      this.tiles = tiles;
      this.updateMinimap();
      this.updateBuildingButtons();
    });

    gameScene.events.on('weatherChanged', (weather: WeatherType) => {
      this.weather = weather;
      this.updateWeatherDisplay();
    });

    gameScene.events.on('dayNightChanged', (isNight: boolean) => {
      this.isNight = isNight;
      this.updateDayNightDisplay();
    });
  }

  private requestGameState(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.emit('getState');
  }

  private createResourcePanel(): void {
    this.resourcePanel = this.add.container(640, 680);

    const panelWidth = 600;
    const panelHeight = 70;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x3d2817, 0.9);

    panelBg.beginPath();
    panelBg.moveTo(-panelWidth / 2, -panelHeight);
    panelBg.lineTo(panelWidth / 2, -panelHeight);
    panelBg.lineTo(panelWidth / 2, 0);
    panelBg.lineTo(panelWidth / 2 - 30, panelHeight / 2);
    panelBg.lineTo(-panelWidth / 2 + 30, panelHeight / 2);
    panelBg.lineTo(-panelWidth / 2, 0);
    panelBg.closePath();
    panelBg.fillPath();

    panelBg.lineStyle(3, 0x8b6914, 1);
    panelBg.strokePath();

    this.resourcePanel.add(panelBg);

    const iconSize = 36;
    const spacing = 130;
    const startX = -spacing * 1.5;

    this.woodIcon = this.add.sprite(startX, -25, 'icon_wood');
    this.woodIcon.setDisplaySize(iconSize, iconSize);
    this.resourcePanel.add(this.woodIcon);

    this.woodText = this.add.text(startX, 10, '20', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.woodText.setResolution(2);
    this.resourcePanel.add(this.woodText);

    this.stoneIcon = this.add.sprite(startX + spacing, -25, 'icon_stone');
    this.stoneIcon.setDisplaySize(iconSize, iconSize);
    this.resourcePanel.add(this.stoneIcon);

    this.stoneText = this.add.text(startX + spacing, 10, '10', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.stoneText.setResolution(2);
    this.resourcePanel.add(this.stoneText);

    this.grainIcon = this.add.sprite(startX + spacing * 2, -25, 'icon_grain');
    this.grainIcon.setDisplaySize(iconSize, iconSize);
    this.resourcePanel.add(this.grainIcon);

    this.grainText = this.add.text(startX + spacing * 2, 10, '15', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.grainText.setResolution(2);
    this.resourcePanel.add(this.grainText);

    this.goldIcon = this.add.sprite(startX + spacing * 3, -25, 'icon_gold');
    this.goldIcon.setDisplaySize(iconSize, iconSize);
    this.resourcePanel.add(this.goldIcon);

    this.goldText = this.add.text(startX + spacing * 3, 10, '50', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.goldText.setResolution(2);
    this.resourcePanel.add(this.goldText);

    this.resourcePanel.setAlpha(0);
    this.tweens.add({
      targets: this.resourcePanel,
      alpha: 1,
      y: 660,
      duration: 500,
      ease: 'Back.Out',
      delay: 200
    });
  }

  private createBuildingMenu(): void {
    this.buildingMenu = this.add.container(1180, 360);

    const panelWidth = 160;
    const panelHeight = 400;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x3d2817, 0.9);
    panelBg.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
    panelBg.lineStyle(3, 0x8b6914, 1);
    panelBg.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
    this.buildingMenu.add(panelBg);

    const titleText = this.add.text(0, -panelHeight / 2 + 25, '建造', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    titleText.setResolution(2);
    this.buildingMenu.add(titleText);

    const buildings: { type: BuildingType; name: string; iconKey: string }[] = [
      { type: 'lumbermill', name: '伐木场', iconKey: 'lumbermill_1' },
      { type: 'quarry', name: '采石场', iconKey: 'quarry_1' },
      { type: 'farm', name: '农场', iconKey: 'farm_1' },
      { type: 'port', name: '港口', iconKey: 'port_1' }
    ];

    const buttonY = -120;
    const buttonSpacing = 90;

    buildings.forEach((b, index) => {
      const button = this.createBuildingButton(b.type!, b.name, b.iconKey, buttonY + index * buttonSpacing);
      this.buildingMenu.add(button);
    });

    this.buildingMenu.setX(1280 + panelWidth / 2);
    this.tweens.add({
      targets: this.buildingMenu,
      x: 1180,
      duration: 300,
      ease: 'Cubic.Out',
      delay: 400
    });
  }

  private createBuildingButton(type: BuildingType, name: string, iconKey: string, y: number): Phaser.GameObjects.Container {
    const button = this.add.container(0, y);
    button.setSize(120, 70);
    button.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(0x5c3d24, 1);
    bg.fillRect(-60, -35, 120, 70);
    bg.lineStyle(2, 0x8b6914, 1);
    bg.strokeRect(-60, -35, 120, 70);
    button.add(bg);

    const icon = this.add.sprite(-25, 0, iconKey);
    icon.setDisplaySize(40, 40);
    button.add(icon);

    const nameText = this.add.text(15, -10, name, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    nameText.setResolution(2);
    button.add(nameText);

    const costText = this.add.text(15, 12, '...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    costText.setResolution(2);
    button.add(costText);

    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x7c5d44, 1);
      bg.fillRect(-60, -35, 120, 70);
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRect(-60, -35, 120, 70);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x5c3d24, 1);
      bg.fillRect(-60, -35, 120, 70);
      bg.lineStyle(2, 0x8b6914, 1);
      bg.strokeRect(-60, -35, 120, 70);
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.85,
        scaleY: 0.85,
        duration: 80,
        yoyo: true,
        ease: 'Elastic.Out',
        hold: 20,
        repeat: 0
      });

      if (this.canAffordBuilding(type!)) {
        this._selectedBuilding = type;
        const gameScene = this.scene.get('GameScene');
        gameScene.events.emit('buildBuilding', type);
      }
    });

    this.buildingButtons.push({ type, button, icon, costText });

    return button;
  }

  private canAffordBuilding(type: BuildingType): boolean {
    if (!type) return false;
    const costs = this.getBuildingCost(type, 1);
    return this.resources.wood >= costs.wood &&
           this.resources.stone >= costs.stone &&
           this.resources.grain >= costs.grain &&
           this.resources.gold >= costs.gold;
  }

  private getBuildingCost(type: BuildingType, level: number): Resources {
    const baseCosts: Record<string, Resources> = {
      lumbermill: { wood: 20, stone: 5, grain: 0, gold: 10 },
      quarry: { wood: 10, stone: 20, grain: 0, gold: 10 },
      farm: { wood: 15, stone: 10, grain: 0, gold: 15 },
      port: { wood: 30, stone: 30, grain: 10, gold: 50 }
    };

    const base = baseCosts[type!] || { wood: 0, stone: 0, grain: 0, gold: 0 };
    const multiplier = level === 1 ? 1 : level === 2 ? 1.5 : 2;

    return {
      wood: Math.floor(base.wood * multiplier),
      stone: Math.floor(base.stone * multiplier),
      grain: Math.floor(base.grain * multiplier),
      gold: Math.floor(base.gold * multiplier)
    };
  }

  private updateBuildingButtons(): void {
    this.buildingButtons.forEach(({ type, icon, costText }) => {
      const canAfford = this.canAffordBuilding(type);
      icon.setAlpha(canAfford ? 1 : 0.4);

      const costs = this.getBuildingCost(type!, 1);
      let costStr = '';
      if (costs.wood > 0) costStr += `木${costs.wood} `;
      if (costs.stone > 0) costStr += `石${costs.stone} `;
      if (costs.gold > 0) costStr += `金${costs.gold}`;
      costText.setText(costStr);

      if (!canAfford) {
        costText.setColor('#ff6666');
      } else {
        costText.setColor('#88ff88');
      }
    });
  }

  private createShipPanel(): void {
    this.shipPanel = this.add.container(100, 360);

    const panelWidth = 180;
    const panelHeight = 200;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x3d2817, 0.9);
    panelBg.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
    panelBg.lineStyle(3, 0x8b6914, 1);
    panelBg.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
    this.shipPanel.add(panelBg);

    const titleText = this.add.text(0, -panelHeight / 2 + 25, '船只状态', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    titleText.setResolution(2);
    this.shipPanel.add(titleText);

    const shipIcon = this.add.sprite(0, -30, 'ship');
    shipIcon.setDisplaySize(60, 40);
    this.shipPanel.add(shipIcon);

    const startY = 20;
    const lineSpacing = 25;

    this.levelText = this.add.text(-panelWidth / 2 + 15, startY, '等级: 1', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    this.levelText.setResolution(2);
    this.shipPanel.add(this.levelText);

    this.capacityText = this.add.text(-panelWidth / 2 + 15, startY + lineSpacing, '容量: 100', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    this.capacityText.setResolution(2);
    this.shipPanel.add(this.capacityText);

    this.speedText = this.add.text(-panelWidth / 2 + 15, startY + lineSpacing * 2, '航速: 1.0x', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    this.speedText.setResolution(2);
    this.shipPanel.add(this.speedText);

    this.defenseText = this.add.text(-panelWidth / 2 + 15, startY + lineSpacing * 3, '防御: 1', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    this.defenseText.setResolution(2);
    this.shipPanel.add(this.defenseText);

    this.upgradeShipButton = this.createUpgradeButton();
    this.upgradeShipButton.setY(startY + lineSpacing * 4 + 10);
    this.shipPanel.add(this.upgradeShipButton);

    this.shipPanel.setX(-panelWidth / 2 - 100);
    this.tweens.add({
      targets: this.shipPanel,
      x: 100,
      duration: 300,
      ease: 'Cubic.Out',
      delay: 300
    });
  }

  private createUpgradeButton(): Phaser.GameObjects.Container {
    const button = this.add.container(0, 0);
    button.setSize(140, 35);
    button.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(0x228b22, 1);
    bg.fillRect(-70, -17, 140, 35);
    bg.lineStyle(2, 0x32cd32, 1);
    bg.strokeRect(-70, -17, 140, 35);
    button.add(bg);

    const text = this.add.text(0, 0, '升级船只', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    text.setResolution(2);
    button.add(text);

    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x32cd32, 1);
      bg.fillRect(-70, -17, 140, 35);
      bg.lineStyle(2, 0x90ee90, 1);
      bg.strokeRect(-70, -17, 140, 35);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x228b22, 1);
      bg.fillRect(-70, -17, 140, 35);
      bg.lineStyle(2, 0x32cd32, 1);
      bg.strokeRect(-70, -17, 140, 35);
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.85,
        scaleY: 0.85,
        duration: 80,
        yoyo: true,
        ease: 'Elastic.Out',
        hold: 20,
        repeat: 0
      });

      const gameScene = this.scene.get('GameScene');
      gameScene.events.emit('upgradeShip');
    });

    return button;
  }

  private createMinimap(): void {
    this.minimap = this.add.container(100, 80);

    const mapSize = 120;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f08, 0.9);
    bg.fillRect(-mapSize / 2 - 5, -mapSize / 2 - 5, mapSize + 10, mapSize + 10);
    bg.lineStyle(2, 0x8b6914, 1);
    bg.strokeRect(-mapSize / 2 - 5, -mapSize / 2 - 5, mapSize + 10, mapSize + 10);
    this.minimap.add(bg);

    const titleText = this.add.text(0, -mapSize / 2 - 20, '小地图', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    titleText.setResolution(2);
    this.minimap.add(titleText);

    this.minimap.setAlpha(0);
    this.tweens.add({
      targets: this.minimap,
      alpha: 1,
      duration: 500,
      delay: 500
    });
  }

  private updateMinimap(): void {
    const mapSize = 120;
    const tileSize = mapSize / 5;

    const oldTiles = this.minimap.getAll('name', 'minimapTile');
    oldTiles.forEach(t => t.destroy());

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (!this.tiles[y] || !this.tiles[y][x]) continue;

        const tile = this.tiles[y][x];
        let color: number;

        if (!tile.explored) {
          color = 0x1a1a2e;
        } else {
          switch (tile.type) {
            case 'forest': color = 0x2d5a27; break;
            case 'stone': color = 0x6b6b6b; break;
            case 'farm': color = 0xd4a84a; break;
            case 'ground': color = 0x8b6914; break;
            case 'water': color = 0x1e90ff; break;
            default: color = 0x333333;
          }
        }

        const graphics = this.add.graphics();
        graphics.setName('minimapTile');
        graphics.fillStyle(color, 1);
        graphics.fillRect(
          -mapSize / 2 + x * tileSize,
          -mapSize / 2 + y * tileSize,
          tileSize - 1,
          tileSize - 1
        );
        this.minimap.add(graphics);
      }
    }
  }

  private createWeatherDisplay(): void {
    this.weatherIcon = this.add.text(1180, 50, '☀️', {
      fontSize: '32px'
    }).setOrigin(0.5);
    this.weatherIcon.setResolution(2);
  }

  private updateWeatherDisplay(): void {
    switch (this.weather) {
      case 'sunny':
        this.weatherIcon.setText('☀️');
        break;
      case 'cloudy':
        this.weatherIcon.setText('⛅');
        break;
      case 'rainy':
        this.weatherIcon.setText('🌧️');
        break;
    }
  }

  private updateDayNightDisplay(): void {
    if (this.isNight) {
      this.cameras.main.setAlpha(0.95);
    } else {
      this.cameras.main.setAlpha(1);
    }
  }

  private updateResourceDisplay(): void {
    this.woodText.setText(`${this.resources.wood}`);
    this.stoneText.setText(`${this.resources.stone}`);
    this.grainText.setText(`${this.resources.grain}`);
    this.goldText.setText(`${this.resources.gold}`);

    this.checkLowResources();
    this.updateBuildingButtons();
  }

  private checkLowResources(): void {
    const threshold = 5;

    if (this.resources.wood < threshold) {
      this.pulseIcon(this.woodIcon);
    } else {
      this.woodIcon.clearAlpha();
    }

    if (this.resources.stone < threshold) {
      this.pulseIcon(this.stoneIcon);
    } else {
      this.stoneIcon.clearAlpha();
    }

    if (this.resources.grain < threshold) {
      this.pulseIcon(this.grainIcon);
    } else {
      this.grainIcon.clearAlpha();
    }

    if (this.resources.gold < threshold) {
      this.pulseIcon(this.goldIcon);
    } else {
      this.goldIcon.clearAlpha();
    }
  }

  private pulseIcon(icon: Phaser.GameObjects.Sprite): void {
    if (this.tweens.isTweening(icon)) return;

    this.tweens.add({
      targets: icon,
      alpha: 0.3,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  private updateShipDisplay(): void {
    this.levelText.setText(`等级: ${this.shipStats.level}`);
    this.capacityText.setText(`容量: ${this.shipStats.capacity}`);
    this.speedText.setText(`航速: ${this.shipStats.speed.toFixed(1)}x`);
    this.defenseText.setText(`防御: ${this.shipStats.defense}`);
  }

  public getResources(): Resources {
    return { ...this.resources };
  }
}
