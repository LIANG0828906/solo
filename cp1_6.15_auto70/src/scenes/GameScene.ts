import Phaser from 'phaser';
import { FarmManager } from '../systems/FarmManager';
import { CombatManager } from '../systems/CombatManager';
import {
  GameState, Crop, CropType, Creature, Monster, DefenseTower, EventType,
  CROP_CONFIG, CREATURE_CONFIG, SHOP_CONFIG, CropStage, ShopItemType
} from '../types';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const GRID_SIZE = 6;
const CELL_SIZE = 60;
const FARM_START_X = 120;
const FARM_START_Y = 200;
const FARM_CENTER_X = FARM_START_X + (GRID_SIZE * CELL_SIZE) / 2;
const FARM_CENTER_Y = FARM_START_Y + (GRID_SIZE * CELL_SIZE) / 2;
const PEN_START_X = 680;
const PEN_START_Y = 180;
const PEN_WIDTH = 150;
const PEN_HEIGHT = 100;
const SHOP_X = GAME_WIDTH - 20;
const SHOP_WIDTH = 220;

export class GameScene extends Phaser.Scene {
  private farmManager!: FarmManager;
  private combatManager!: CombatManager;
  private state!: GameState;

  private gridCells: Phaser.GameObjects.Container[] = [];
  private cropSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private creatureSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private monsterSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private towerSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private bulletSprites: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private penFences: Phaser.GameObjects.Graphics[] = [];
  private fenceAnimOffset: number = 0;

  private resourceBar!: Phaser.GameObjects.Container;
  private resourceTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private shopPanel!: Phaser.GameObjects.Container;
  private shopOpen: boolean = false;
  private eventBanner!: Phaser.GameObjects.Container;
  private eventBannerTimer: number = 0;
  private shopButton!: Phaser.GameObjects.Container;
  private saveButton!: Phaser.GameObjects.Container;
  private leaderboardButton!: Phaser.GameObjects.Container;
  private leaderboardPanel!: Phaser.GameObjects.Container;
  private gameOverPanel!: Phaser.GameObjects.Container;
  private nameInput: HTMLInputElement | null = null;

  private nextEventTime: number = 0;
  private lastAutoSave: number = 0;
  private selectedSeedType: CropType = 'firePepper';
  private seedSelector!: Phaser.GameObjects.Container;

  private rainDrops: Phaser.GameObjects.Graphics[] = [];
  private rotatingLights: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: { state: GameState }) {
    this.state = data.state;
  }

  create(): void {
    this.farmManager = new FarmManager(this.state, () => this.renderUpdate());
    this.combatManager = new CombatManager(this.state, () => this.renderUpdate());

    this.createBackground();
    this.createFarmGrid();
    this.createPens();
    this.createResourceBar();
    this.createSeedSelector();
    this.createShopButton();
    this.createShopPanel();
    this.createSaveAndLeaderboardButtons();
    this.createEventBanner();
    this.createLeaderboardPanel();
    this.createGameOverPanel();

    this.nextEventTime = Date.now() + 60000 + Math.random() * 30000;
    this.lastAutoSave = Date.now();

    this.initializeExistingEntities();
    this.setupResizeHandler();
  }

  private initializeExistingEntities(): void {
    this.state.crops.forEach(crop => this.addCropSprite(crop));
    this.state.creatures.forEach(creature => {
      this.addCreatureSprite(creature);
      this.createPen(creature.penIndex, true);
    });
    this.state.towers.forEach(tower => this.addTowerSprite(tower));
  }

  private createBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x98d8c8, 0x98d8c8, 1);
    sky.fillRect(0, 0, GAME_WIDTH, 180);

    const grass = this.add.graphics();
    for (let y = 180; y < GAME_HEIGHT - 80; y += 40) {
      for (let x = 0; x < GAME_WIDTH; x += 40) {
        const shade = 0x3a7d3a + Math.floor(Math.random() * 0x102010);
        grass.fillStyle(shade, 0.8);
        grass.fillRect(x, y, 40, 40);
      }
    }

    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.8);
    [[100, 60, 50], [350, 40, 40], [700, 70, 60], [1000, 50, 45]].forEach(([x, y, s]) => {
      clouds.fillEllipse(x, y, s * 2, s * 0.7);
      clouds.fillEllipse(x + s * 0.6, y + 5, s * 1.3, s * 0.6);
      clouds.fillEllipse(x - s * 0.6, y + 5, s * 1.2, s * 0.5);
    });

    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x5c4033, 1);
    bottomBar.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    bottomBar.fillStyle(0x3e2a1f, 1);
    bottomBar.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 4);
  }

  private createFarmGrid(): void {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const x = FARM_START_X + gx * CELL_SIZE;
        const y = FARM_START_Y + gy * CELL_SIZE;
        const cell = this.add.container(x, y);

        const bg = this.add.graphics();
        const brownShade = 0xc4a484 + Math.floor(Math.random() * 0x1a140c);
        bg.fillStyle(brownShade, 1);
        bg.fillRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4);
        bg.lineStyle(2, 0x8b6914, 0.8);
        bg.strokeRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4);

        for (let i = 0; i < 5; i++) {
          const dx = 10 + Math.random() * 40;
          const dy = 10 + Math.random() * 40;
          bg.fillStyle(0xb8956e, 0.5);
          bg.fillRect(dx, dy, 8 + Math.random() * 6, 2);
        }

        cell.add(bg);
        cell.setSize(CELL_SIZE, CELL_SIZE);
        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => this.onCellClick(gx, gy, cell));

        this.gridCells.push(cell);
      }
    }
  }

  private createPens(): void {
    for (let i = 0; i < 3; i++) {
      this.createPen(i, false);
    }
  }

  private createPen(index: number, hasCreature: boolean): void {
    const x = PEN_START_X + (index % 2) * (PEN_WIDTH + 20);
    const y = PEN_START_Y + Math.floor(index / 2) * (PEN_HEIGHT + 30);

    if (this.penFences[index]) {
      this.penFences[index].destroy();
    }

    const container = this.add.container(x, y);
    container.setData('penIndex', index);
    container.setData('baseX', x);
    container.setData('baseY', y);

    const ground = this.add.graphics();
    ground.fillStyle(0x8b6914, 1);
    ground.fillRect(0, 0, PEN_WIDTH, PEN_HEIGHT);
    const innerColor = hasCreature ? 0x90e090 : 0x7cb87c;
    ground.fillStyle(innerColor, 1);
    ground.fillRect(6, 6, PEN_WIDTH - 12, PEN_HEIGHT - 12);
    for (let i = 0; i < 20; i++) {
      const gx = 10 + Math.random() * (PEN_WIDTH - 20);
      const gy = 10 + Math.random() * (PEN_HEIGHT - 20);
      ground.fillStyle(hasCreature ? 0x6fb86f : 0x5a9a5a, 0.6);
      ground.fillRect(gx, gy, 4 + Math.random() * 4, 2);
    }
    container.add(ground);

    const fenceGraphics = this.add.graphics();
    this.drawWoodenFence(fenceGraphics, 0, 0);
    container.add(fenceGraphics);
    container.setData('fenceGraphics', fenceGraphics);

    this.penFences[index] = container as unknown as Phaser.GameObjects.Graphics;

    if (!this.state.creatures.find(c => c.penIndex === index)) {
      const placeholder = this.add.text(PEN_WIDTH / 2, PEN_HEIGHT / 2, '空围栏\n(商店购买)', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '14px',
        color: '#5c4033',
        align: 'center'
      }).setOrigin(0.5);
      placeholder.setData('penPlaceholder', index);
      container.add(placeholder);
    }
  }

  private drawWoodenFence(graphics: Phaser.GameObjects.Graphics, offsetX: number, offsetY: number): void {
    const postSpacing = 22;
    const postWidth = 6;
    const postHeight = 14;
    const railHeight = 4;

    for (let side = 0; side < 4; side++) {
      const isTopOrBottom = side < 2;
      const isTop = side === 0;
      const isBottom = side === 1;
      const isLeft = side === 2;

      if (isTopOrBottom) {
        const y = isTop ? offsetY - 2 : offsetY + PEN_HEIGHT - 2;
        for (let px = offsetX; px <= offsetX + PEN_WIDTH; px += postSpacing) {
          graphics.fillStyle(0x5c3a1e, 1);
          graphics.fillRect(px - postWidth / 2, y - postHeight / 2, postWidth, postHeight);
          graphics.fillStyle(0x7a4d2b, 1);
          graphics.fillRect(px - postWidth / 2 + 1, y - postHeight / 2 + 1, 2, postHeight - 2);
          graphics.fillStyle(0x4a2e15, 1);
          graphics.fillRect(px + 1, y - postHeight / 2 + 1, 2, postHeight - 2);
        }
        graphics.fillStyle(0x8b5a2b, 1);
        graphics.fillRect(offsetX, y - 1, PEN_WIDTH, railHeight);
        graphics.fillStyle(0xa06b36, 1);
        graphics.fillRect(offsetX, y - 1, PEN_WIDTH, 1);
        graphics.fillStyle(0x6b4423, 1);
        graphics.fillRect(offsetX, y + railHeight - 2, PEN_WIDTH, 1);
        for (let nx = offsetX; nx < offsetX + PEN_WIDTH; nx += 18) {
          graphics.fillStyle(0x5c3a1e, 0.4);
          graphics.fillRect(nx, y, 10, railHeight);
        }
      } else {
        const x = isLeft ? offsetX - 2 : offsetX + PEN_WIDTH - 2;
        for (let py = offsetY; py <= offsetY + PEN_HEIGHT; py += postSpacing) {
          graphics.fillStyle(0x5c3a1e, 1);
          graphics.fillRect(x - postHeight / 2, py - postWidth / 2, postHeight, postWidth);
          graphics.fillStyle(0x7a4d2b, 1);
          graphics.fillRect(x - postHeight / 2 + 1, py - postWidth / 2 + 1, postHeight - 2, 2);
          graphics.fillStyle(0x4a2e15, 1);
          graphics.fillRect(x - postHeight / 2 + 1, py + 1, postHeight - 2, 2);
        }
        graphics.fillStyle(0x8b5a2b, 1);
        graphics.fillRect(x - 1, offsetY, railHeight, PEN_HEIGHT);
      }
    }
    for (let px = offsetX + postSpacing; px < offsetX + PEN_WIDTH; px += postSpacing) {
      graphics.fillStyle(0x3a2510, 0.6);
      graphics.fillCircle(px, offsetY - 2, 1);
      graphics.fillCircle(px, offsetY + PEN_HEIGHT - 2, 1);
    }
  }

  private createResourceBar(): void {
    this.resourceBar = this.add.container(10, 10);
    const bg = this.add.graphics();
    bg.fillStyle(0x5c4033, 0.9);
    bg.fillRoundedRect(0, 0, GAME_WIDTH - 40, 60, 10);
    bg.lineStyle(3, 0xd4a76a, 1);
    bg.strokeRoundedRect(0, 0, GAME_WIDTH - 40, 60, 10);
    this.resourceBar.add(bg);

    const items: Array<{ key: string; icon: string; color: number; label: string }> = [
      { key: 'coins', icon: '💰', color: 0xffd700, label: '金币' },
      { key: 'firePepper', icon: '🌶️', color: 0xff4444, label: '火焰椒' },
      { key: 'iceRadish', icon: '🥕', color: 0x44aaff, label: '冰晶萝卜' },
      { key: 'windWheat', icon: '🌾', color: 0xffdd44, label: '风铃麦' },
      { key: 'flameEgg', icon: '🥚', color: 0xff7722, label: '鸡蛋' },
      { key: 'frostWool', icon: '🧶', color: 0xaaddff, label: '羊毛' },
      { key: 'thunderShard', icon: '⚡', color: 0xffff66, label: '雷电碎片' },
      { key: 'seeds', icon: '🌱', color: 0x88cc44, label: '种子' },
    ];

    items.forEach((item, idx) => {
      const ix = 20 + idx * 150;
      const iy = 15;
      const iconText = this.add.text(ix, iy, item.icon, {
        fontFamily: 'Arial',
        fontSize: '28px'
      });
      const valueText = this.add.text(ix + 35, iy + 5, `${(this.state.resources as any)[item.key]}`, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      this.resourceBar.add(iconText);
      this.resourceBar.add(valueText);
      this.resourceTexts.set(item.key, valueText);
    });
  }

  private createSeedSelector(): void {
    this.seedSelector = this.add.container(10, 80);
    const bg = this.add.graphics();
    bg.fillStyle(0x5c4033, 0.9);
    bg.fillRoundedRect(0, 0, 380, 50, 10);
    bg.lineStyle(2, 0xd4a76a, 1);
    bg.strokeRoundedRect(0, 0, 380, 50, 10);
    this.seedSelector.add(bg);

    const label = this.add.text(10, 15, '选择种子:', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '16px',
      color: '#ffffff'
    });
    this.seedSelector.add(label);

    const seeds: CropType[] = ['firePepper', 'iceRadish', 'windWheat'];
    seeds.forEach((type, idx) => {
      const config = CROP_CONFIG[type];
      const sx = 110 + idx * 90;
      const btn = this.add.container(sx, 25);
      const btnBg = this.add.graphics();
      btnBg.fillStyle(config.color, 0.8);
      btnBg.fillRoundedRect(-40, -18, 80, 36, 8);
      btnBg.lineStyle(2, this.selectedSeedType === type ? 0xffffff : 0x000000, 1);
      btnBg.strokeRoundedRect(-40, -18, 80, 36, 8);
      btn.add(btnBg);
      const nameText = this.add.text(0, 0, config.name, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      btn.add(nameText);
      btn.setSize(80, 36);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.selectedSeedType = type;
        this.createSeedSelector();
        this.seedSelector.setPosition(10, 80);
      });
      this.seedSelector.add(btn);
    });
  }

  private createShopButton(): void {
    this.shopButton = this.add.container(GAME_WIDTH - 130, 80);
    const bg = this.add.graphics();
    bg.fillStyle(0xd4a76a, 1);
    bg.fillRoundedRect(0, 0, 120, 45, 10);
    bg.lineStyle(3, 0x8b6914, 1);
    bg.strokeRoundedRect(0, 0, 120, 45, 10);
    this.shopButton.add(bg);
    const text = this.add.text(60, 22, '🏪 商店', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '18px',
      color: '#5c4033',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.shopButton.add(text);
    this.shopButton.setSize(120, 45);
    this.shopButton.setInteractive({ useHandCursor: true });
    this.shopButton.on('pointerdown', () => this.toggleShop());
  }

  private createShopPanel(): void {
    this.shopPanel = this.add.container(GAME_WIDTH, 10);
    this.shopPanel.setVisible(false);
    const panelBg = this.add.graphics();
    const panelHeight = GAME_HEIGHT - 140;
    panelBg.fillStyle(0xfaf0e6, 0.97);
    panelBg.fillRoundedRect(-SHOP_WIDTH, 50, SHOP_WIDTH, panelHeight, 12);
    panelBg.lineStyle(4, 0x8b6914, 1);
    panelBg.strokeRoundedRect(-SHOP_WIDTH, 50, SHOP_WIDTH, panelHeight, 12);
    this.shopPanel.add(panelBg);

    const title = this.add.text(-SHOP_WIDTH / 2, 70, '🏪 魔法商店', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '20px',
      color: '#5c4033',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.shopPanel.add(title);

    const items: ShopItemType[] = ['seed', 'fenceUpgrade', 'defenseTower', 'flameChicken', 'frostSheep', 'thunderBird'];
    const iconMap: Record<ShopItemType, string> = {
      seed: '🌱', fenceUpgrade: '🔧', defenseTower: '🗼',
      flameChicken: '🐔', frostSheep: '🐑', thunderBird: '🐦'
    };

    items.forEach((type, idx) => {
      const config = SHOP_CONFIG[type];
      const iy = 115 + idx * 82;
      const itemBg = this.add.graphics();
      itemBg.fillStyle(0xffffff, 0.9);
      itemBg.fillRoundedRect(-SHOP_WIDTH + 12, iy, SHOP_WIDTH - 24, 72, 8);
      itemBg.lineStyle(2, 0xd4a76a, 1);
      itemBg.strokeRoundedRect(-SHOP_WIDTH + 12, iy, SHOP_WIDTH - 24, 72, 8);
      this.shopPanel.add(itemBg);

      const icon = this.add.text(-SHOP_WIDTH + 32, iy + 18, iconMap[type], {
        fontFamily: 'Arial',
        fontSize: '26px'
      });
      this.shopPanel.add(icon);

      const nameText = this.add.text(-SHOP_WIDTH + 70, iy + 10, config.name, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '14px',
        color: '#5c4033',
        fontStyle: 'bold'
      });
      this.shopPanel.add(nameText);

      const descText = this.add.text(-SHOP_WIDTH + 70, iy + 32, config.description, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '11px',
        color: '#8b6914',
        wordWrap: { width: 110 }
      });
      this.shopPanel.add(descText);

      const buyBtn = this.add.container(-SHOP_WIDTH + 160, iy + 50);
      const btnBg = this.add.graphics();
      const canAfford = this.state.resources.coins >= config.price;
      btnBg.fillStyle(canAfford ? 0x88cc44 : 0x999999, 1);
      btnBg.fillRoundedRect(-42, -14, 84, 28, 6);
      btnBg.lineStyle(2, canAfford ? 0x448822 : 0x666666, 1);
      btnBg.strokeRoundedRect(-42, -14, 84, 28, 6);
      buyBtn.add(btnBg);
      const btnText = this.add.text(0, 0, `💰 ${config.price}`, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      buyBtn.add(btnText);
      buyBtn.setSize(84, 28);
      buyBtn.setInteractive({ useHandCursor: canAfford });
      buyBtn.on('pointerdown', () => this.buyShopItem(type));
      this.shopPanel.add(buyBtn);
    });

    const closeBtn = this.add.container(-20, 70);
    const cBg = this.add.graphics();
    cBg.fillStyle(0xcc4444, 1);
    cBg.fillCircle(0, 0, 16);
    closeBtn.add(cBg);
    const cText = this.add.text(0, 0, '✕', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    closeBtn.add(cText);
    closeBtn.setSize(32, 32);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleShop());
    this.shopPanel.add(closeBtn);
  }

  private createSaveAndLeaderboardButtons(): void {
    this.saveButton = this.add.container(GAME_WIDTH - 280, GAME_HEIGHT - 60);
    const sBg = this.add.graphics();
    sBg.fillStyle(0x4488cc, 1);
    sBg.fillRoundedRect(0, 0, 120, 40, 8);
    sBg.lineStyle(2, 0x2266aa, 1);
    sBg.strokeRoundedRect(0, 0, 120, 40, 8);
    this.saveButton.add(sBg);
    const sText = this.add.text(60, 20, '💾 存档', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.saveButton.add(sText);
    this.saveButton.setSize(120, 40);
    this.saveButton.setInteractive({ useHandCursor: true });
    this.saveButton.on('pointerdown', () => this.manualSave());

    this.leaderboardButton = this.add.container(GAME_WIDTH - 140, GAME_HEIGHT - 60);
    const lBg = this.add.graphics();
    lBg.fillStyle(0xffaa22, 1);
    lBg.fillRoundedRect(0, 0, 120, 40, 8);
    lBg.lineStyle(2, 0xdd8800, 1);
    lBg.strokeRoundedRect(0, 0, 120, 40, 8);
    this.leaderboardButton.add(lBg);
    const lText = this.add.text(60, 20, '🏆 排行', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.leaderboardButton.add(lText);
    this.leaderboardButton.setSize(120, 40);
    this.leaderboardButton.setInteractive({ useHandCursor: true });
    this.leaderboardButton.on('pointerdown', () => this.showLeaderboard());
  }

  private createEventBanner(): void {
    this.eventBanner = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.eventBanner.setVisible(false);
    this.eventBanner.setDepth(1000);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-250, -80, 500, 160, 20);
    this.eventBanner.add(bg);

    this.eventBanner.setData('graphics', bg);
  }

  private createLeaderboardPanel(): void {
    this.leaderboardPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + 250);
    this.leaderboardPanel.setDepth(900);
    this.leaderboardPanel.setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0xfaf0e6, 1);
    bg.fillRoundedRect(-280, -220, 560, 440, 16);
    bg.lineStyle(4, 0x8b6914, 1);
    bg.strokeRoundedRect(-280, -220, 560, 440, 16);
    this.leaderboardPanel.add(bg);

    const title = this.add.text(0, -190, '🏆 全服排行榜', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '28px',
      color: '#5c4033',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.leaderboardPanel.add(title);

    const closeBtn = this.add.container(250, -190);
    const cBg = this.add.graphics();
    cBg.fillStyle(0xcc4444, 1);
    cBg.fillCircle(0, 0, 20);
    closeBtn.add(cBg);
    const cText = this.add.text(0, 0, '✕', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    closeBtn.add(cText);
    closeBtn.setSize(40, 40);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hideLeaderboard());
    this.leaderboardPanel.add(closeBtn);
  }

  private createGameOverPanel(): void {
    this.gameOverPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.gameOverPanel.setDepth(1100);
    this.gameOverPanel.setVisible(false);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.gameOverPanel.add(overlay);

    const panel = this.add.graphics();
    panel.fillStyle(0xfaf0e6, 1);
    panel.fillRoundedRect(-250, -180, 500, 360, 16);
    panel.lineStyle(4, 0xcc4444, 1);
    panel.strokeRoundedRect(-250, -180, 500, 360, 16);
    this.gameOverPanel.add(panel);

    const title = this.add.text(0, -140, '💔 游戏结束', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '32px',
      color: '#cc4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.gameOverPanel.add(title);

    const coinsLabel = this.add.text(0, -80, `最终金币数:`, {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '20px',
      color: '#5c4033'
    }).setOrigin(0.5);
    this.gameOverPanel.add(coinsLabel);

    const coinsValue = this.add.text(0, -40, `${this.state.resources.coins}`, {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.gameOverPanel.add(coinsValue);

    const nameLabel = this.add.text(-200, 10, '请输入你的名字:', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '16px',
      color: '#5c4033'
    });
    this.gameOverPanel.add(nameLabel);

    const submitBtn = this.add.container(0, 110);
    const sbBg = this.add.graphics();
    sbBg.fillStyle(0x88cc44, 1);
    sbBg.fillRoundedRect(-100, -25, 200, 50, 10);
    sbBg.lineStyle(3, 0x448822, 1);
    sbBg.strokeRoundedRect(-100, -25, 200, 50, 10);
    submitBtn.add(sbBg);
    const sbText = this.add.text(0, 0, '提交到排行榜', {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    submitBtn.add(sbText);
    submitBtn.setSize(200, 50);
    submitBtn.setInteractive({ useHandCursor: true });
    submitBtn.on('pointerdown', () => this.submitToLeaderboard());
    this.gameOverPanel.add(submitBtn);
  }

  private setupResizeHandler(): void {
  }

  private onCellClick(gx: number, gy: number, cell: Phaser.GameObjects.Container): void {
    const crop = this.farmManager.getCropAt(gx, gy);
    if (crop) {
      if (crop.stage === 'mature') {
        this.harvestCrop(crop, cell);
      } else {
        this.tweens.add({
          targets: cell,
          scale: { from: 1.05, to: 1 },
          duration: 200,
          ease: 'Quad.easeOut'
        });
      }
    } else {
      if (this.farmManager.plantCrop(gx, gy, this.selectedSeedType)) {
        this.tweens.add({
          targets: cell,
          scale: { from: 1.1, to: 1 },
          duration: 200,
          ease: 'Back.easeOut'
        });
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.5);
        flash.fillRect(FARM_START_X + gx * CELL_SIZE, FARM_START_Y + gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 300,
          onComplete: () => flash.destroy()
        });
      }
    }
  }

  private harvestCrop(crop: Crop, cell: Phaser.GameObjects.Container): void {
    if (!this.farmManager.harvestCrop(crop.id)) return;
    const sprite = this.cropSprites.get(crop.id);
    if (sprite) {
      const targetY = sprite.y - 40;
      this.tweens.add({
        targets: sprite,
        y: targetY,
        alpha: 0,
        scale: 1.2,
        duration: 400,
        ease: 'Back.easeIn',
        onComplete: () => {
          sprite.destroy();
          this.cropSprites.delete(crop.id);
        }
      });
    }
    const config = CROP_CONFIG[crop.type];
    const floatText = this.add.text(
      FARM_START_X + crop.gridX * CELL_SIZE + CELL_SIZE / 2,
      FARM_START_Y + crop.gridY * CELL_SIZE,
      `+${config.harvestAmount}`,
      {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '20px',
        color: `#${config.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.tweens.add({
      targets: floatText,
      y: floatText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => floatText.destroy()
    });
    this.animateResourceChange();
  }

  private animateResourceChange(): void {
    this.resourceTexts.forEach((text, key) => {
      const oldVal = parseInt(text.text);
      const newVal = (this.state.resources as any)[key];
      if (oldVal !== newVal) {
        this.tweens.addCounter({
          from: oldVal,
          to: newVal,
          duration: 400,
          ease: 'Cubic.easeOut',
          onUpdate: (tween: Phaser.Tweens.Tween) => {
            const val = tween.getValue();
            text.setText(`${Math.floor(val ?? 0)}`);
          }
        });
        this.tweens.add({
          targets: text,
          scale: { from: 1.2, to: 1 },
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
    });
  }

  private addCropSprite(crop: Crop): void {
    const x = FARM_START_X + crop.gridX * CELL_SIZE + CELL_SIZE / 2;
    const y = FARM_START_Y + crop.gridY * CELL_SIZE + CELL_SIZE / 2;
    const container = this.add.container(x, y);
    this.renderCropStage(crop, container);
    this.cropSprites.set(crop.id, container);
  }

  private renderCropStage(crop: Crop, container: Phaser.GameObjects.Container): void {
    container.removeAll(true);
    const config = CROP_CONFIG[crop.type];
    const graphics = this.add.graphics();
    const stageSizes: Record<CropStage, number> = { seed: 8, sprout: 16, growing: 24, mature: 32 };
    const size = stageSizes[crop.stage];
    const color = crop.stage === 'seed' ? config.seedColor : config.color;
    graphics.fillStyle(color, 1);
    if (crop.stage === 'seed') {
      graphics.fillCircle(0, 8, size);
    } else if (crop.stage === 'sprout') {
      graphics.fillEllipse(0, 0, size * 0.6, size);
      graphics.fillStyle(0x228b22, 1);
      graphics.fillEllipse(-6, -4, size * 0.4, size * 0.5);
      graphics.fillEllipse(6, -4, size * 0.4, size * 0.5);
    } else if (crop.stage === 'growing') {
      graphics.fillStyle(0x228b22, 1);
      graphics.fillRect(-3, -size, 6, size);
      graphics.fillStyle(color, 1);
      graphics.fillEllipse(-8, -size + 4, size * 0.4, size * 0.6);
      graphics.fillEllipse(8, -size + 4, size * 0.4, size * 0.6);
      graphics.fillEllipse(0, -size - 6, size * 0.5, size * 0.7);
    } else {
      graphics.fillStyle(0x228b22, 1);
      graphics.fillRect(-3, -size + 5, 6, size);
      graphics.fillStyle(color, 1);
      graphics.fillCircle(-10, -size + 10, size * 0.35);
      graphics.fillCircle(10, -size + 10, size * 0.35);
      graphics.fillCircle(0, -size - 5, size * 0.45);
      graphics.fillStyle(config.glowColor, 0.4);
      graphics.fillCircle(0, -size, size * 0.7);
    }
    container.add(graphics);
    container.setData('graphics', graphics);
  }

  private addCreatureSprite(creature: Creature): void {
    const x = PEN_START_X + (creature.penIndex % 2) * (PEN_WIDTH + 20) + PEN_WIDTH / 2;
    const y = PEN_START_Y + Math.floor(creature.penIndex / 2) * (PEN_HEIGHT + 30) + PEN_HEIGHT / 2;
    const container = this.add.container(x, y);
    this.renderCreature(creature, container);
    this.creatureSprites.set(creature.id, container);
    this.createPen(creature.penIndex, true);
  }

  private renderCreature(creature: Creature, container: Phaser.GameObjects.Container): void {
    container.removeAll(true);
    const config = CREATURE_CONFIG[creature.type];
    const graphics = this.add.graphics();
    graphics.fillStyle(config.color, 1);
    if (creature.type === 'flameChicken') {
      graphics.fillEllipse(0, 5, 22, 18);
      graphics.fillCircle(10, -10, 10);
      graphics.fillStyle(0xff2200, 1);
      graphics.fillTriangle(20, -10, 28, -7, 20, -4);
      graphics.fillStyle(0xffcc00, 1);
      for (let i = 0; i < 3; i++) {
        graphics.fillTriangle(8 + i * 3, -18, 10 + i * 3, -24, 12 + i * 3, -18);
      }
    } else if (creature.type === 'frostSheep') {
      graphics.fillStyle(0xffffff, 0.9);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        graphics.fillCircle(Math.cos(angle) * 10, Math.sin(angle) * 8, 10);
      }
      graphics.fillCircle(0, 0, 14);
      graphics.fillStyle(config.color, 1);
      graphics.fillEllipse(-18, -5, 10, 8);
      graphics.fillStyle(0x8866aa, 1);
      graphics.fillTriangle(-22, -10, -26, -20, -18, -12);
    } else {
      graphics.fillEllipse(0, 0, 20, 14);
      graphics.fillStyle(0xffaa00, 1);
      graphics.fillCircle(12, -6, 9);
      graphics.fillStyle(0xff6600, 1);
      graphics.fillTriangle(20, -6, 28, -4, 20, -2);
      graphics.fillStyle(config.color, 0.6);
      graphics.fillEllipse(-5, -14, 14, 6);
      graphics.fillEllipse(-5, 14, 14, 6);
    }
    container.add(graphics);
    container.setData('graphics', graphics);
    container.setData('baseX', container.x);
    container.setData('baseY', container.y);
  }

  private addTowerSprite(tower: DefenseTower): void {
    const container = this.add.container(tower.x, tower.y);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x696969, 1);
    graphics.fillRect(-12, 0, 24, 40);
    graphics.fillStyle(0x8b4513, 1);
    for (let i = 0; i < 4; i++) {
      graphics.fillRect(-14, 8 + i * 10, 28, 2);
    }
    graphics.fillStyle(0x444444, 1);
    graphics.fillTriangle(-18, 0, 18, 0, 0, -20);
    graphics.fillStyle(0xffff88, 1);
    graphics.fillCircle(0, -10, 5);
    container.add(graphics);
    this.towerSprites.set(tower.id, container);
  }

  private addMonsterSprite(monster: Monster): void {
    const container = this.add.container(monster.x, monster.y);
    container.setAlpha(0);
    container.setScale(1.5);
    const graphics = this.add.graphics();
    this.renderMonster(monster, graphics);
    container.add(graphics);
    container.setData('graphics', graphics);
    this.monsterSprites.set(monster.id, container);
    const shockwave = this.add.graphics();
    shockwave.lineStyle(4, 0xff0000, 0.8);
    shockwave.strokeCircle(monster.x, monster.y, 10);
    this.tweens.add({
      targets: shockwave,
      scale: { from: 0.5, to: 3 },
      alpha: { from: 1, to: 0 },
      duration: 500,
      onComplete: () => shockwave.destroy()
    });
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
    container.setSize(40, 40);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => this.onMonsterClick(monster.id));
  }

  private renderMonster(monster: Monster, graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();
    graphics.fillStyle(0x2c1654, 1);
    graphics.fillEllipse(0, 5, 22, 18);
    graphics.fillCircle(-5, -10, 12);
    graphics.fillTriangle(-12, -18, -16, -28, -8, -20);
    graphics.fillTriangle(2, -18, -2, -28, 6, -20);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(-9, -10, 3);
    graphics.fillCircle(-1, -10, 3);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillTriangle(-6, -4, -2, -2, -5, 0);
    graphics.fillTriangle(2, -4, 6, -2, 3, 0);
    graphics.fillStyle(0x1a0d3a, 1);
    graphics.fillEllipse(-10, 20, 5, 6);
    graphics.fillEllipse(10, 20, 5, 6);
    const hpRatio = monster.hp / monster.maxHp;
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(-18, -36, 36, 5);
    graphics.fillStyle(hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xffaa00 : 0xff4444, 1);
    graphics.fillRect(-18, -36, 36 * hpRatio, 5);
  }

  private onMonsterClick(monsterId: string): void {
    const result = this.combatManager.attackMonster(monsterId);
    const sprite = this.monsterSprites.get(monsterId);
    if (sprite) {
      const graphics = sprite.getData('graphics') as Phaser.GameObjects.Graphics;
      const monster = this.combatManager.getMonsters().find(m => m.id === monsterId);
      if (monster && graphics) {
        this.renderMonster(monster, graphics);
      }
      this.tweens.add({
        targets: sprite,
        scaleX: { from: 0.8, to: 1 },
        scaleY: { from: 1.2, to: 1 },
        duration: 150,
        ease: 'Quad.easeOut'
      });
    }
    if (result.defeated) {
      if (sprite) {
        this.tweens.add({
          targets: sprite,
          alpha: 0,
          scale: 1.5,
          rotation: Math.PI / 2,
          duration: 350,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            sprite.destroy();
            this.monsterSprites.delete(monsterId);
          }
        });
      }
      const coinText = this.add.text(result.x, result.y - 30, '+5 💰', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '18px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: coinText,
        y: coinText.y - 40,
        alpha: 0,
        duration: 700,
        onComplete: () => coinText.destroy()
      });
      this.animateResourceChange();
    }
  }

  private toggleShop(): void {
    this.shopOpen = !this.shopOpen;
    if (this.shopOpen) {
      this.createShopPanel();
      this.shopPanel.setX(GAME_WIDTH);
    }
    this.shopPanel.setVisible(true);
    this.tweens.add({
      targets: this.shopPanel,
      x: this.shopOpen ? GAME_WIDTH - SHOP_WIDTH / 2 : GAME_WIDTH,
      duration: 400,
      ease: this.shopOpen ? 'Back.easeOut' : 'Cubic.easeIn',
      onComplete: () => {
        if (!this.shopOpen) this.shopPanel.setVisible(false);
      }
    });
  }

  private buyShopItem(type: ShopItemType): void {
    const config = SHOP_CONFIG[type];
    if (this.state.resources.coins < config.price) return;
    let success = false;
    this.state.resources.coins -= config.price;
    if (type === 'seed') {
      this.state.resources.seeds++;
      success = true;
    } else if (type === 'fenceUpgrade') {
      this.farmManager.upgradeFence();
      success = true;
    } else if (type === 'defenseTower') {
      const positions = [
        { x: 550, y: 300 }, { x: 550, y: 450 }, { x: 550, y: 600 }
      ];
      const used = new Set(this.state.towers.map(t => `${t.x},${t.y}`));
      const pos = positions.find(p => !used.has(`${p.x},${p.y}`));
      if (pos) {
        this.farmManager.addTower(pos.x, pos.y);
        const tower = this.state.towers[this.state.towers.length - 1];
        this.addTowerSprite(tower);
        success = true;
      } else {
        this.state.resources.coins += config.price;
        this.showToast('❌ 防御塔位置已满');
      }
    } else if (type === 'flameChicken' || type === 'frostSheep' || type === 'thunderBird') {
      const usedPens = new Set(this.state.creatures.map(c => c.penIndex));
      const emptyPen = [0, 1, 2].find(p => !usedPens.has(p));
      if (emptyPen !== undefined) {
        const creatureType = type as 'flameChicken' | 'frostSheep' | 'thunderBird';
        this.farmManager.addCreature(creatureType, emptyPen);
        const creature = this.state.creatures[this.state.creatures.length - 1];
        this.addCreatureSprite(creature);
        success = true;
      } else {
        this.state.resources.coins += config.price;
        this.showToast('❌ 没有空余围栏');
      }
    }
    if (success) {
      this.animateResourceChange();
      this.toggleShop();
    }
  }

  private showEventBanner(eventType: EventType): void {
    this.eventBanner.removeAll(true);
    this.rainDrops = [];
    this.rotatingLights = [];
    this.eventBannerTimer = 3000;
    const bg = this.add.graphics();

    if (eventType === 'acidRain') {
      bg.fillStyle(0x1a3366, 0.95);
      bg.fillRoundedRect(-230, -80, 460, 160, 20);
      bg.lineStyle(3, 0x4488ff, 0.8);
      bg.strokeRoundedRect(-230, -80, 460, 160, 20);
      this.eventBanner.add(bg);

      for (let i = 0; i < 30; i++) {
        const drop = this.add.graphics();
        const dx = -200 + Math.random() * 400;
        const dy = -140 + Math.random() * 280;
        drop.setData('baseX', dx);
        drop.setData('baseY', dy);
        drop.setData('speed', 1.5 + Math.random() * 2.5);
        drop.setData('offset', Math.random() * Math.PI * 2);
        drop.fillStyle(0x66bbff, 0.7 + Math.random() * 0.3);
        drop.fillEllipse(dx, dy, 2 + Math.random() * 2, 6 + Math.random() * 6);
        this.rainDrops.push(drop);
        this.eventBanner.add(drop);
      }

      for (let i = 0; i < 3; i++) {
        const splash = this.add.graphics();
        splash.fillStyle(0x88ccff, 0.4);
        splash.fillEllipse(-150 + i * 150, 50 + Math.random() * 20, 30 + Math.random() * 20, 6 + Math.random() * 4);
        this.eventBanner.add(splash);
        this.tweens.add({
          targets: splash,
          scaleX: { from: 0.5, to: 1.5 },
          scaleY: { from: 0.5, to: 2 },
          alpha: { from: 0.6, to: 0 },
          duration: 1500,
          delay: i * 300,
          loop: -1
        });
      }

      const text = this.add.text(0, -25, '💧 酸雨来袭！', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '34px',
        color: '#88ccff',
        fontStyle: 'bold',
        stroke: '#2244aa',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.eventBanner.add(text);
      this.tweens.add({
        targets: text,
        scale: { from: 0.8, to: 1 },
        duration: 500,
        yoyo: true,
        loop: -1
      });

      const subText = this.add.text(0, 25, '作物生长减速50%，持续15秒', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '16px',
        color: '#aaddff'
      }).setOrigin(0.5);
      this.eventBanner.add(subText);

    } else if (eventType === 'monsterRaid') {
      const warningFrame = this.add.graphics();
      this.eventBanner.add(warningFrame);
      const animateWarning = () => {
        if (!this.eventBanner.visible) return;
        warningFrame.clear();
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
        warningFrame.lineStyle(8, 0xff2222, pulse);
        warningFrame.strokeRoundedRect(-245, -85, 490, 170, 15);
        warningFrame.lineStyle(4, 0xff6666, pulse * 0.8);
        warningFrame.strokeRoundedRect(-240, -80, 480, 160, 15);
        this.time.delayedCall(30, animateWarning);
      };
      animateWarning();

      bg.fillStyle(0x3d0000, 0.95);
      bg.fillRoundedRect(-235, -75, 470, 150, 12);
      this.eventBanner.add(bg);

      for (let i = 0; i < 4; i++) {
        const corner = this.add.graphics();
        corner.lineStyle(4, 0xff4444, 1);
        const cx = -200 + i * 400 / 3;
        corner.beginPath();
        corner.moveTo(cx - 20, -60);
        corner.lineTo(cx, -40);
        corner.lineTo(cx + 20, -60);
        corner.strokePath();
        this.eventBanner.add(corner);
        this.tweens.add({
          targets: corner,
          scaleY: { from: 1, to: 1.3 },
          alpha: { from: 1, to: 0.3 },
          duration: 400,
          delay: i * 100,
          yoyo: true,
          loop: -1
        });
      }

      const text = this.add.text(0, -25, '⚠️ 怪物侵扰！', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '34px',
        color: '#ff4444',
        fontStyle: 'bold',
        stroke: '#660000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.eventBanner.add(text);
      this.tweens.add({
        targets: text,
        scale: { from: 1, to: 1.08 },
        duration: 200,
        yoyo: true,
        loop: -1,
        ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: text,
        x: { from: -3, to: 3 },
        duration: 80,
        yoyo: true,
        loop: -1,
        ease: 'Sine.easeInOut'
      });

      const subText = this.add.text(0, 25, '暗影狼出现！点击攻击击败它', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '16px',
        color: '#ffaaaa'
      }).setOrigin(0.5);
      this.eventBanner.add(subText);

      for (let i = 0; i < 6; i++) {
        const sparkle = this.add.graphics();
        sparkle.fillStyle(0xff6666, 0.8);
        const sx = -180 + i * 70;
        const sy = -55 + (i % 2) * 110;
        sparkle.fillCircle(sx, sy, 4);
        sparkle.fillStyle(0xffaaaa, 0.6);
        sparkle.fillCircle(sx - 3, sy - 3, 2);
        sparkle.fillCircle(sx + 3, sy - 3, 2);
        sparkle.fillCircle(sx, sy + 4, 2);
        this.eventBanner.add(sparkle);
        this.tweens.add({
          targets: sparkle,
          alpha: { from: 0.8, to: 0 },
          scale: { from: 0.5, to: 1.5 },
          duration: 600,
          delay: i * 150,
          loop: -1
        });
      }

    } else {
      bg.fillStyle(0x228855, 0.95);
      bg.fillRoundedRect(-230, -80, 460, 160, 20);
      bg.lineStyle(3, 0x66ddaa, 0.8);
      bg.strokeRoundedRect(-230, -80, 460, 160, 20);
      this.eventBanner.add(bg);

      for (let i = 0; i < 20; i++) {
        const light = this.add.graphics();
        const angle = (i / 20) * Math.PI * 2;
        const radius = 100 + Math.random() * 80;
        light.setData('baseAngle', angle);
        light.setData('radius', radius);
        light.setData('speed', 0.5 + Math.random() * 1.5);
        light.setData('size', 2 + Math.random() * 4);
        light.setPosition(Math.cos(angle) * radius, Math.sin(angle) * 60);
        light.fillStyle(0xaaffbb, 0.7 + Math.random() * 0.3);
        light.fillCircle(0, 0, light.getData('size'));
        this.rotatingLights.push(light);
        this.eventBanner.add(light);
      }

      for (let i = 0; i < 8; i++) {
        const leaf = this.add.graphics();
        leaf.fillStyle(0x88dd88, 0.8);
        const lx = -180 + Math.random() * 360;
        const ly = -100 + Math.random() * 200;
        leaf.setData('baseX', lx);
        leaf.setData('baseY', ly);
        leaf.setData('rotSpeed', (Math.random() - 0.5) * 0.05);
        leaf.setData('floatOffset', Math.random() * Math.PI * 2);
        leaf.beginPath();
        leaf.moveTo(0, -8);
        (leaf as any).quadraticCurveTo(6, 0, 0, 8);
        (leaf as any).quadraticCurveTo(-6, 0, 0, -8);
        leaf.fillPath();
        leaf.setPosition(lx, ly);
        this.rotatingLights.push(leaf);
        this.eventBanner.add(leaf);
      }

      const text = this.add.text(0, -25, '🍃 丰收之风！', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '34px',
        color: '#ddffdd',
        fontStyle: 'bold',
        stroke: '#226644',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.eventBanner.add(text);
      this.tweens.add({
        targets: text,
        rotation: { from: -0.03, to: 0.03 },
        scale: { from: 0.95, to: 1.05 },
        duration: 1500,
        yoyo: true,
        loop: -1,
        ease: 'Sine.easeInOut'
      });

      const subText = this.add.text(0, 25, '所有作物立即缩短一个生长阶段', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '16px',
        color: '#bbffbb'
      }).setOrigin(0.5);
      this.eventBanner.add(subText);

      const windLine = this.add.graphics();
      this.eventBanner.add(windLine);
      const animateWind = () => {
        if (!this.eventBanner.visible) return;
        windLine.clear();
        const t = Date.now() * 0.003;
        for (let i = 0; i < 4; i++) {
          const y = -60 + i * 40;
          const offset = Math.sin(t + i) * 10;
          windLine.lineStyle(2, 0xaaffbb, 0.4 + 0.2 * Math.sin(t * 2 + i));
          windLine.beginPath();
          windLine.moveTo(-200, y + offset);
          for (let x = -200; x < 200; x += 10) {
            const wy = y + offset + Math.sin((x + t * 100) * 0.02 + i) * 5;
            windLine.lineTo(x, wy);
          }
          windLine.strokePath();
        }
        this.time.delayedCall(30, animateWind);
      };
      animateWind();
    }

    this.eventBanner.setVisible(true);
    this.eventBanner.setAlpha(0);
    this.eventBanner.setScale(0.5);
    this.tweens.add({
      targets: this.eventBanner,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private hideEventBanner(): void {
    this.tweens.add({
      targets: this.eventBanner,
      alpha: 0,
      scale: 0.8,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.eventBanner.setVisible(false);
        this.rainDrops = [];
        this.rotatingLights = [];
      }
    });
  }

  private triggerRandomEvent(): void {
    const events: EventType[] = ['acidRain', 'monsterRaid', 'harvestWind'];
    const eventType = events[Math.floor(Math.random() * events.length)];
    this.state.activeEvent = eventType;
    this.showEventBanner(eventType);
    if (eventType === 'acidRain') {
      this.state.acidRainEndTime = Date.now() + 15000;
    } else if (eventType === 'monsterRaid') {
      const monster = this.combatManager.spawnMonster(-40, FARM_CENTER_Y);
      this.addMonsterSprite(monster);
    } else if (eventType === 'harvestWind') {
      this.farmManager.applyHarvestWind();
    }
    this.nextEventTime = Date.now() + 60000 + Math.random() * 30000;
  }

  private async manualSave(): Promise<void> {
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: this.state.playerName,
          state: this.state
        })
      });
      this.showToast('💾 存档成功！');
    } catch (e) {
      this.showToast('❌ 存档失败');
    }
  }

  private showToast(message: string): void {
    const toast = this.add.text(GAME_WIDTH / 2, 100, message, {
      fontFamily: 'Comic Sans MS, Microsoft YaHei',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({
      targets: toast,
      y: 140,
      alpha: 0,
      delay: 1200,
      duration: 600,
      onComplete: () => toast.destroy()
    });
  }

  private async showLeaderboard(): Promise<void> {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success) {
        this.renderLeaderboard(data.data);
      }
    } catch (e) {
      this.renderLeaderboard([]);
    }
    this.leaderboardPanel.setVisible(true);
    this.tweens.add({
      targets: this.leaderboardPanel,
      y: GAME_HEIGHT / 2,
      duration: 600,
      ease: 'Back.easeOut'
    });
  }

  private renderLeaderboard(entries: Array<{ playerName: string; coins: number }>): void {
    const existing = this.leaderboardPanel.list.filter((o: any) => o.getData && o.getData('isEntry'));
    existing.forEach((e: any) => e.destroy());
    if (entries.length === 0) {
      const empty = this.add.text(0, 0, '暂无排行记录', {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '18px',
        color: '#999999'
      }).setOrigin(0.5).setData('isEntry', true);
      this.leaderboardPanel.add(empty);
      return;
    }
    entries.forEach((entry, idx) => {
      const y = -150 + idx * 35;
      const container = this.add.container(0, y);
      container.setData('isEntry', true);
      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#ffffff', '#ffffff'];
      const rankColor = idx < 3 ? rankColors[idx] : '#cccccc';
      const rankText = this.add.text(-220, 0, `#${idx + 1}`, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '18px',
        color: rankColor,
        fontStyle: 'bold'
      });
      const nameText = this.add.text(-160, 0, entry.playerName, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '16px',
        color: '#5c4033'
      });
      const coinsText = this.add.text(200, 0, `${entry.coins} 💰`, {
        fontFamily: 'Comic Sans MS, Microsoft YaHei',
        fontSize: '18px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(1, 0);
      container.add([rankText, nameText, coinsText]);
      this.leaderboardPanel.add(container);
    });
  }

  private hideLeaderboard(): void {
    this.tweens.add({
      targets: this.leaderboardPanel,
      y: GAME_HEIGHT + 250,
      duration: 500,
      ease: 'Cubic.easeIn',
      onComplete: () => this.leaderboardPanel.setVisible(false)
    });
  }

  private submitToLeaderboard(): void {
    if (this.nameInput && this.nameInput.value.trim()) {
      this.state.playerName = this.nameInput.value.trim();
    }
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: this.state.playerName || '匿名玩家',
        coins: this.state.resources.coins
      })
    }).then(() => {
      this.gameOverPanel.setVisible(false);
      this.showLeaderboard();
    });
  }

  private checkGameOver(): void {
    if (this.state.resources.coins <= 0 && !this.state.gameOver) {
      this.state.gameOver = true;
      this.showGameOver();
    }
  }

  private showGameOver(): void {
    this.gameOverPanel.setVisible(true);
    if (!this.nameInput) {
      this.nameInput = document.createElement('input');
      this.nameInput.type = 'text';
      this.nameInput.placeholder = '请输入名字';
      this.nameInput.maxLength = 12;
      this.nameInput.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(calc(-50% + 20px), calc(-50% - 20px));
        width: 240px;
        height: 36px;
        padding: 6px 12px;
        border: 3px solid #8b6914;
        border-radius: 8px;
        font-size: 16px;
        font-family: 'Comic Sans MS', 'Microsoft YaHei';
        background: #ffffff;
        color: #5c4033;
        z-index: 1200;
        box-sizing: border-box;
      `;
      document.body.appendChild(this.nameInput);
      if (this.state.playerName) this.nameInput.value = this.state.playerName;
    }
  }

  update(time: number, delta: number): void {
    this.farmManager.updateCrops();
    this.farmManager.updateCreatures();
    this.combatManager.updateMonsters(delta, FARM_START_X, FARM_START_Y);
    this.combatManager.updateTowers(delta);
    this.combatManager.updateBullets(delta);

    this.fenceAnimOffset += delta * 0.003;
    this.animateFences();

    if (Date.now() >= this.nextEventTime) {
      this.triggerRandomEvent();
    }

    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer -= delta;
      this.animateEventBanner(delta);
      if (this.eventBannerTimer <= 0) {
        this.hideEventBanner();
      }
    }

    this.syncCropSprites();
    this.syncCreatureSprites(delta);
    this.syncMonsterSprites();
    this.syncTowerSprites();
    this.syncBulletSprites();

    if (Date.now() - this.lastAutoSave >= 60000) {
      this.lastAutoSave = Date.now();
      this.manualSave();
    }

    this.checkGameOver();
  }

  private animateFences(): void {
    const t = Date.now() * 0.002;
    this.penFences.forEach((fence, idx) => {
      if (!fence) return;
      const container = fence as unknown as Phaser.GameObjects.Container;
      if (container.getData) {
        const baseX = container.getData('baseX') as number;
        const fenceGraphics = container.getData('fenceGraphics') as Phaser.GameObjects.Graphics;
        if (fenceGraphics && baseX !== undefined) {
          const swayOffset = Math.sin(t + idx * 1.3) * 0.8;
          container.x = baseX + swayOffset;
          const rotOffset = Math.sin(t * 1.5 + idx) * 0.005;
          container.rotation = rotOffset;
        }
      }
    });
  }

  private animateEventBanner(delta: number): void {
    const t = Date.now() * 0.001;
    this.rainDrops.forEach((drop, i) => {
      if (drop.active) {
        const speed = (drop.getData('speed') as number) || 2;
        const offset = (drop.getData('offset') as number) || 0;
        drop.y += delta * 0.1 * speed;
        drop.x += Math.sin(drop.y * 0.015 + offset) * 0.4;
        if (drop.y > 80) {
          drop.y = -140 + Math.random() * 60;
          drop.x = -200 + Math.random() * 400;
        }
        const alpha = 0.5 + 0.5 * Math.sin(t * 4 + i * 0.3);
        const width = 2 + Math.sin(t * 2 + i) * 1;
        const height = 6 + Math.sin(t * 3 + i * 0.5) * 3;
        drop.fillStyle(0x66bbff, alpha);
        drop.clear();
        drop.fillEllipse(0, 0, width, height);
      }
    });
    this.rotatingLights.forEach((particle, i) => {
      if (particle.active) {
        const isLeaf = particle.getData('baseX') !== undefined;
        if (isLeaf) {
          const baseX = particle.getData('baseX') as number;
          const baseY = particle.getData('baseY') as number;
          const rotSpeed = (particle.getData('rotSpeed') as number) || 0.02;
          const floatOffset = (particle.getData('floatOffset') as number) || 0;
          particle.x = baseX + Math.sin(t * 1.5 + floatOffset) * 15;
          particle.y = baseY + Math.cos(t * 2 + floatOffset) * 10;
          particle.rotation += rotSpeed;
          const alpha = 0.6 + 0.4 * Math.sin(t * 3 + i);
          particle.fillStyle(0x88dd88, alpha);
        } else {
          const baseAngle = (particle.getData('baseAngle') as number) || 0;
          const radius = (particle.getData('radius') as number) || 130;
          const speed = (particle.getData('speed') as number) || 1;
          const size = (particle.getData('size') as number) || 3;
          const angle = baseAngle + t * 2 * speed;
          const r = radius + Math.sin(t * 3 + i) * 15;
          particle.x = Math.cos(angle) * r;
          particle.y = Math.sin(angle) * 60;
          const alpha = 0.4 + 0.6 * Math.sin(t * 4 + i * 0.4);
          const s = size + Math.sin(t * 2 + i) * 2;
          particle.fillStyle(0xaaffbb, alpha);
          particle.clear();
          particle.fillCircle(0, 0, Math.max(1, s));
        }
      }
    });
  }

  private syncTowerSprites(): void {
    const now = Date.now();
    this.state.towers.forEach(tower => {
      const sprite = this.towerSprites.get(tower.id);
      if (!sprite) {
        this.addTowerSprite(tower);
        return;
      }
      const graphics = sprite.list[0] as Phaser.GameObjects.Graphics;
      if (graphics) {
        graphics.clear();
        const canShoot = now - tower.lastShootTime >= 2000;
        const isShooting = now - tower.lastShootTime < 200;
        graphics.fillStyle(0x696969, 1);
        graphics.fillRect(-12, 0, 24, 40);
        graphics.fillStyle(0x8b4513, 1);
        for (let i = 0; i < 4; i++) {
          graphics.fillRect(-14, 8 + i * 10, 28, 2);
        }
        graphics.fillStyle(0x555555, 1);
        graphics.fillTriangle(-18, 0, 18, 0, 0, -20);
        graphics.fillStyle(0x444444, 1);
        graphics.fillTriangle(-15, 0, 15, 0, 0, -17);
        const glowIntensity = isShooting ? 1 : (canShoot ? 0.6 + 0.4 * Math.sin(now * 0.008) : 0.3);
        const glowSize = isShooting ? 10 : (canShoot ? 7 : 5);
        graphics.fillStyle(0xffff00, glowIntensity * 0.4);
        graphics.fillCircle(0, -10, glowSize + 3);
        graphics.fillStyle(0xffff66, glowIntensity * 0.7);
        graphics.fillCircle(0, -10, glowSize);
        graphics.fillStyle(0xffffff, glowIntensity);
        graphics.fillCircle(0, -10, glowSize * 0.6);
        if (isShooting) {
          const flash = this.add.graphics();
          flash.fillStyle(0xffffff, 0.8);
          flash.fillCircle(tower.x, tower.y - 10, 15);
          this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 150,
            onComplete: () => flash.destroy()
          });
        }
      }
    });
  }

  private syncCropSprites(): void {
    const currentIds = new Set(this.state.crops.map(c => c.id));
    this.cropSprites.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.cropSprites.delete(id);
      }
    });
    this.state.crops.forEach(crop => {
      let sprite = this.cropSprites.get(crop.id);
      if (!sprite) {
        this.addCropSprite(crop);
        sprite = this.cropSprites.get(crop.id);
      }
      const currentStage = sprite?.getData('stage') as CropStage | undefined;
      if (sprite && currentStage !== crop.stage) {
        this.renderCropStage(crop, sprite);
        sprite.setData('stage', crop.stage);
        this.tweens.add({
          targets: sprite,
          scale: { from: 1.2, to: 1 },
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
      if (sprite && crop.stage === 'mature') {
        const pulse = 0.9 + 0.1 * Math.sin(Date.now() * 0.005);
        sprite.setScale(pulse);
      } else if (sprite) {
        sprite.setScale(1);
      }
    });
  }

  private syncCreatureSprites(delta: number): void {
    const currentIds = new Set(this.state.creatures.map(c => c.id));
    this.creatureSprites.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.creatureSprites.delete(id);
      }
    });
    this.state.creatures.forEach(creature => {
      let sprite = this.creatureSprites.get(creature.id);
      if (!sprite) {
        this.addCreatureSprite(creature);
        sprite = this.creatureSprites.get(creature.id);
      }
      if (!sprite) return;
      const baseX = sprite.getData('baseX') as number;
      const baseY = sprite.getData('baseY') as number;
      const t = Date.now() * 0.001;
      if (creature.currentAction === 'flapJump') {
        sprite.x = baseX + Math.sin(t * 6) * 8;
        sprite.y = baseY + Math.abs(Math.sin(t * 4)) * -15;
        sprite.rotation = Math.sin(t * 8) * 0.1;
      } else if (creature.currentAction === 'graze') {
        sprite.x = baseX + Math.sin(t * 1.5) * 15;
        sprite.y = baseY + Math.sin(t * 3) * 2;
        sprite.rotation = Math.sin(t * 2) * 0.05;
      } else if (creature.currentAction === 'soarCry') {
        sprite.x = baseX + Math.cos(t * 2) * 20;
        sprite.y = baseY - 10 + Math.sin(t * 4) * 8;
        sprite.rotation = Math.sin(t * 2) * 0.08;
      } else {
        sprite.x = baseX + Math.sin(t + creature.penIndex) * 1;
        sprite.y = baseY + Math.sin(t * 1.5 + creature.penIndex) * 1;
        sprite.rotation = 0;
      }
    });
  }

  private syncMonsterSprites(): void {
    const currentIds = new Set(this.state.monsters.map(m => m.id));
    this.monsterSprites.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.monsterSprites.delete(id);
      }
    });
    this.state.monsters.forEach(monster => {
      let sprite = this.monsterSprites.get(monster.id);
      if (!sprite) {
        this.addMonsterSprite(monster);
        sprite = this.monsterSprites.get(monster.id);
      }
      if (sprite) {
        sprite.x = monster.x;
        sprite.y = monster.y;
        const graphics = sprite.getData('graphics') as Phaser.GameObjects.Graphics;
        if (graphics) this.renderMonster(monster, graphics);
      }
    });
  }

  private syncBulletSprites(): void {
    const currentIds = new Set(this.combatManager.getBullets().map(b => b.id));
    this.bulletSprites.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.bulletSprites.delete(id);
      }
    });
    this.combatManager.getBullets().forEach(bullet => {
      let sprite = this.bulletSprites.get(bullet.id);
      if (!sprite) {
        sprite = this.add.graphics();
        this.bulletSprites.set(bullet.id, sprite);
      }
      sprite.clear();
      sprite.fillStyle(0xffffff, 1);
      sprite.fillCircle(bullet.x, bullet.y, 4);
      sprite.fillStyle(0xffffaa, 0.6);
      sprite.fillCircle(bullet.x, bullet.y, 7);
      const trailX = bullet.x - bullet.vx * 0.02;
      const trailY = bullet.y - bullet.vy * 0.02;
      sprite.lineStyle(3, 0xffff88, 0.6);
      sprite.lineBetween(trailX, trailY, bullet.x, bullet.y);
    });
  }

  private renderUpdate(): void {
    this.resourceTexts.forEach((text, key) => {
      const newVal = (this.state.resources as any)[key];
      if (parseInt(text.text) !== newVal) {
        this.tweens.addCounter({
          from: parseInt(text.text),
          to: newVal,
          duration: 300,
          ease: 'Cubic.easeOut',
          onUpdate: (tween: Phaser.Tweens.Tween) => {
            const val = tween.getValue();
            text.setText(`${Math.floor(val ?? 0)}`);
          }
        });
      }
    });
  }

  resize(): void {
  }

  destroy(): void {
  }
}
