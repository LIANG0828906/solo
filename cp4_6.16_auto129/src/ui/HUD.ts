import Phaser from 'phaser';
import { useGameStore } from '../store/gameStore';
import { TOWER_CONFIGS, COLORS, TILE_SIZE, SIDEBAR_WIDTH, type TowerType, type Rune, RUNE_CONFIGS } from '../types';
import type { AudioManager } from '../audio/AudioManager';

console.log('[TRACE] 初始化 HUD 模块...');

export class HUD {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private sidebar!: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private towerButtons: Phaser.GameObjects.Container[] = [];
  private towerInfoPanel: Phaser.GameObjects.Container | null = null;
  private buildPreview: Phaser.GameObjects.Rectangle | null = null;
  private runeInventoryPanel: Phaser.GameObjects.Container | null = null;
  private draggingRune: { rune: Rune; sprite: Phaser.GameObjects.Container } | null = null;
  private waveButton!: Phaser.GameObjects.Container;
  private selectedSlotIndex: number | null = null;
  private selectedTowerId: string | null = null;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    console.log('[TRACE] HUD 实例已创建');

    this.sidebar = this.scene.add.container(0, 0);
    this.sidebar.setDepth(1000);

    this.createSidebar();
    this.createTowerButtons();
    this.createWaveButton();
    this.createBuildPreview();
    this.setupStoreSubscriptions();
  }

  private createSidebar() {
    const bg = this.scene.add.rectangle(
      SIDEBAR_WIDTH / 2,
      this.scene.cameras.main.height / 2,
      SIDEBAR_WIDTH,
      this.scene.cameras.main.height,
      0x1E293B,
      0.85
    );
    bg.setStrokeStyle(1, COLORS.GRID_LINE, 0.5);

    const title = this.scene.add.text(SIDEBAR_WIDTH / 2, 20, 'AetherGrid', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#7DD3FC',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const statsBg = this.scene.add.rectangle(SIDEBAR_WIDTH / 2, 70, SIDEBAR_WIDTH - 20, 70, 0x0F172A, 0.6);
    statsBg.setStrokeStyle(1, COLORS.UI_PRIMARY, 0.3);

    this.goldText = this.scene.add.text(20, 55, '💰 200', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FBBF24'
    });

    this.livesText = this.scene.add.text(20, 80, '❤️ 20', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#EF4444'
    });

    this.waveText = this.scene.add.text(130, 55, '🌊 0', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#7DD3FC'
    });

    this.sidebar.add([bg, title, statsBg, this.goldText, this.livesText, this.waveText]);
  }

  private createTowerButtons() {
    const towerTypes: TowerType[] = ['arrow', 'frost', 'fire', 'electric'];
    const startY = 170;
    const spacing = 80;

    towerTypes.forEach((type, index) => {
      const config = TOWER_CONFIGS[type];
      const btn = this.scene.add.container(SIDEBAR_WIDTH / 2, startY + index * spacing);
      btn.setDepth(1001);

      const bg = this.scene.add.circle(0, 0, 30, 0x334155, 0.9);
      bg.setStrokeStyle(2, config.color, 0.6);
      bg.setInteractive();

      const icon = this.scene.add.circle(0, 0, 20, config.color, 0.9);
      icon.setStrokeStyle(2, 0xffffff, 0.4);

      const cost = this.scene.add.text(0, 25, `${config.cost}g`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#FBBF24'
      });
      cost.setOrigin(0.5);

      const name = this.scene.add.text(0, -30, config.name, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#CBD5E1'
      });
      name.setOrigin(0.5);

      const glow = this.scene.add.circle(0, 0, 35, config.color, 0);
      glow.setStrokeStyle(2, config.color, 0);

      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0, to: 0.3 },
        scale: { from: 0.9, to: 1.1 },
        duration: 1500 + index * 200,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });

      btn.add([bg, icon, cost, name, glow]);

      bg.on('pointerover', () => {
        this.scene.tweens.add({ targets: bg, scale: 1.1, duration: 200 });
        this.scene.tweens.add({ targets: glow, strokeAlpha: 0.6, duration: 200 });
      });

      bg.on('pointerout', () => {
        this.scene.tweens.add({ targets: bg, scale: 1, duration: 200 });
        this.scene.tweens.add({ targets: glow, strokeAlpha: 0, duration: 200 });
      });

      bg.on('pointerdown', () => {
        this.audioManager.play('click');
        const currentState = useGameStore.getState();
        if (currentState.gold >= config.cost) {
          useGameStore.getState().setSelectedTowerType(type);
          this.updateTowerSelection(type);
        } else {
          this.audioManager.play('error');
          this.shakeElement(bg);
        }
      });

      this.towerButtons.push(btn);
      this.sidebar.add(btn);
    });
  }

  private createWaveButton() {
    this.waveButton = this.scene.add.container(SIDEBAR_WIDTH / 2, this.scene.cameras.main.height - 50);
    this.waveButton.setDepth(1001);

    const bg = this.scene.add.rectangle(0, 0, 180, 40, 0x7C3AED, 0.9);
    bg.setStrokeStyle(2, 0xA78BFA, 0.8);
    bg.setInteractive();

    const text = this.scene.add.text(0, 0, '▶ 开始波次', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);

    this.waveButton.add([bg, text]);

    bg.on('pointerover', () => {
      this.scene.tweens.add({ targets: bg, scale: 1.05, duration: 200 });
    });

    bg.on('pointerout', () => {
      this.scene.tweens.add({ targets: bg, scale: 1, duration: 200 });
    });

    bg.on('pointerdown', () => {
      this.audioManager.play('wave');
      useGameStore.getState().startWave();
    });

    this.sidebar.add(this.waveButton);
  }

  private createBuildPreview() {
    this.buildPreview = this.scene.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, COLORS.PLACE_VALID, 0.4);
    this.buildPreview.setStrokeStyle(2, COLORS.PLACE_VALID, 0.8);
    this.buildPreview.setVisible(false);
    this.buildPreview.setDepth(500);
  }

  private setupStoreSubscriptions() {
    let prevType = useGameStore.getState().selectedTowerType;
    let prevTowerId = useGameStore.getState().selectedTowerId;
    let prevRuneLen = useGameStore.getState().runeInventory.length;

    useGameStore.subscribe((state) => {
      this.updateStats(state.gold, state.lives, state.wave);
      this.updateWaveButton(state.isWaveActive);
      this.updateTowerAvailability(state.gold);

      if (state.selectedTowerType !== prevType) {
        if (!state.selectedTowerType && this.buildPreview) {
          this.buildPreview.setVisible(false);
        }
        prevType = state.selectedTowerType;
      }

      if (state.selectedTowerId !== prevTowerId) {
        this.selectedTowerId = state.selectedTowerId;
        if (state.selectedTowerId) {
          this.showTowerInfoPanel(state.selectedTowerId);
        } else {
          this.hideTowerInfoPanel();
        }
        prevTowerId = state.selectedTowerId;
      }

      if (state.runeInventory.length !== prevRuneLen) {
        if (this.runeInventoryPanel) {
          this.updateRuneInventory();
        }
        prevRuneLen = state.runeInventory.length;
      }
    });
  }

  private updateStats(gold: number, lives: number, wave: number) {
    this.goldText.setText(`💰 ${gold}`);
    this.livesText.setText(`❤️ ${lives}`);
    this.waveText.setText(`🌊 ${wave}`);
  }

  private updateWaveButton(active: boolean) {
    const bg = this.waveButton.getAt(0) as Phaser.GameObjects.Rectangle;
    const text = this.waveButton.getAt(1) as Phaser.GameObjects.Text;

    if (active) {
      bg.setFillStyle(0x64748B, 0.9);
      bg.setStrokeStyle(2, 0x94A3B8, 0.8);
      text.setText('⏳ 进行中...');
      bg.disableInteractive();
    } else {
      bg.setFillStyle(0x7C3AED, 0.9);
      bg.setStrokeStyle(2, 0xA78BFA, 0.8);
      text.setText('▶ 开始波次');
      bg.setInteractive();
    }
  }

  private updateTowerAvailability(gold: number) {
    this.towerButtons.forEach((btn, index) => {
      const types: TowerType[] = ['arrow', 'frost', 'fire', 'electric'];
      const config = TOWER_CONFIGS[types[index]];
      const bg = btn.getAt(0) as Phaser.GameObjects.Arc;
      const cost = btn.getAt(2) as Phaser.GameObjects.Text;

      if (gold >= config.cost) {
        bg.setAlpha(1);
        cost.setColor('#FBBF24');
      } else {
        bg.setAlpha(0.5);
        cost.setColor('#EF4444');
      }
    });
  }

  private updateTowerSelection(selected: TowerType | null) {
    this.towerButtons.forEach((btn, index) => {
      const types: TowerType[] = ['arrow', 'frost', 'fire', 'electric'];
      const bg = btn.getAt(0) as Phaser.GameObjects.Arc;
      const glow = btn.getAt(4) as Phaser.GameObjects.Arc;

      if (types[index] === selected) {
        bg.setStrokeStyle(4, 0x22C55E, 1);
        glow.setStrokeStyle(3, 0x22C55E, 0.8);
      } else {
        const config = TOWER_CONFIGS[types[index]];
        bg.setStrokeStyle(2, config.color, 0.6);
        glow.setStrokeStyle(2, config.color, 0);
      }
    });
  }

  public showTowerInfoPanel(towerId: string) {
    this.hideTowerInfoPanel();

    const state = useGameStore.getState();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) return;

    const towerObj = this.scene.children.getByName('tower_' + towerId) as any;
    if (!towerObj) return;

    const towerData = state.towers.find(t => t.id === towerId);
    if (!towerData) return;

    const config = TOWER_CONFIGS[tower.type];
    const damage = config.damage * (1 + (tower.level - 1) * 0.3);
    const range = config.range * (1 + (tower.level - 1) * 0.1);
    const upgradeCost = Math.floor(50 * Math.pow(1.5, tower.level));

    this.towerInfoPanel = this.scene.add.container(
      towerObj.x + 60,
      towerObj.y - 100
    );
    this.towerInfoPanel.setDepth(2000);

    const panelBg = this.scene.add.rectangle(0, 0, 220, 280, 0x0F172A, 0.9);
    panelBg.setStrokeStyle(2, config.color, 0.6);

    const title = this.scene.add.text(0, -120, `${config.name} Lv.${tower.level}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#7DD3FC',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const stats = this.scene.add.text(-100, -90,
      `攻击力: ${damage.toFixed(0)}\n` +
      `射程: ${range.toFixed(0)}\n` +
      `攻速: ${(1000 / config.fireRate).toFixed(1)}/s`, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#CBD5E1'
    });

    const runeLabel = this.scene.add.text(0, -15, '符文槽', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#A78BFA',
      fontStyle: 'bold'
    });
    runeLabel.setOrigin(0.5);

    const slots: Phaser.GameObjects.Container[] = [];
    for (let i = 0; i < 3; i++) {
      const slot = this.createRuneSlot(i, towerData.runeSlots[i]);
      slot.x = -60 + i * 60;
      slot.y = 15;
      slots.push(slot);
      this.towerInfoPanel.add(slot);
    }

    const upgradeBtn = this.scene.add.container(0, 70);
    const upgradeBg = this.scene.add.rectangle(0, 0, 100, 30, 0x7C3AED, 0.9);
    upgradeBg.setStrokeStyle(2, 0xA78BFA, 0.6);
    upgradeBg.setInteractive();

    const upgradeText = this.scene.add.text(0, 0, tower.level >= 5 ? '已满级' : `升级 ${upgradeCost}g`, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    upgradeText.setOrigin(0.5);
    upgradeBtn.add([upgradeBg, upgradeText]);

    if (tower.level < 5) {
      upgradeBg.on('pointerdown', () => {
        if (useGameStore.getState().gold >= upgradeCost) {
          this.audioManager.play('upgrade');
          useGameStore.getState().upgradeTower(towerId);
          this.showTowerInfoPanel(towerId);
        } else {
          this.audioManager.play('error');
          this.shakeElement(upgradeBg);
        }
      });
    }

    const sellBtn = this.scene.add.container(0, 110);
    const sellBg = this.scene.add.rectangle(0, 0, 100, 25, 0x7F1D1D, 0.9);
    sellBg.setStrokeStyle(2, 0xEF4444, 0.6);
    sellBg.setInteractive();

    const sellText = this.scene.add.text(0, 0, `出售 +${Math.floor(config.cost * 0.6 * tower.level)}g`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FCA5A5'
    });
    sellText.setOrigin(0.5);
    sellBtn.add([sellBg, sellText]);

    sellBg.on('pointerdown', () => {
      this.audioManager.play('click');
      useGameStore.getState().sellTower(towerId);
      this.hideTowerInfoPanel();
    });

    const closeBtn = this.scene.add.circle(95, -125, 15, 0xEF4444, 0.8);
    closeBtn.setStrokeStyle(2, 0xFCA5A5, 0.8);
    closeBtn.setInteractive();

    const closeText = this.scene.add.text(95, -125, '×', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });
    closeText.setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      this.audioManager.play('click');
      useGameStore.getState().setSelectedTowerId(null);
    });

    this.towerInfoPanel.add([
      panelBg, title, stats, runeLabel,
      upgradeBtn, sellBtn, closeBtn, closeText
    ]);
  }

  private createRuneSlot(index: number, rune: Rune | null): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    const bg = this.scene.add.circle(0, 0, 20, rune ? rune.color : 0x334155, rune ? 0.9 : 0.6);
    bg.setStrokeStyle(2, rune ? 0xffffff : 0x64748B, rune ? 0.8 : 0.5);
    bg.setInteractive();

    if (rune) {
      const icon = this.scene.add.text(0, 0, this.getRuneIcon(rune.type), {
        fontFamily: 'Arial',
        fontSize: '16px'
      });
      icon.setOrigin(0.5);
      container.add(icon);

      bg.on('pointerover', () => {
        this.showRuneTooltip(rune);
      });

      bg.on('pointerout', () => {
        this.hideRuneTooltip();
      });

      bg.on('pointerdown', () => {
        this.audioManager.play('click');
        if (this.selectedTowerId) {
          const removed = useGameStore.getState().removeRune(this.selectedTowerId, index);
          if (removed) {
            this.audioManager.play('click');
            this.showTowerInfoPanel(this.selectedTowerId);
          }
        }
      });
    } else {
      bg.on('pointerdown', () => {
        this.audioManager.play('click');
        this.selectedSlotIndex = index;
        this.showRuneInventory();
      });
    }

    container.add(bg);
    return container;
  }

  private getRuneIcon(type: string): string {
    const icons: Record<string, string> = {
      slow: '❄️',
      splash: '💥',
      burn: '🔥',
      critical: '⚡',
      range: '🎯',
      speed: '⚙️'
    };
    return icons[type] || '✨';
  }

  private showRuneTooltip(rune: Rune) {
    const tooltip = this.scene.add.container(0, 0);
    tooltip.name = 'rune_tooltip';

    const bg = this.scene.add.rectangle(0, 0, 150, 50, 0x0F172A, 0.95);
    bg.setStrokeStyle(1, rune.color, 0.8);

    const name = this.scene.add.text(0, -15, rune.name, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    name.setOrigin(0.5);

    const desc = this.scene.add.text(0, 8, rune.description, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#94A3B8'
    });
    desc.setOrigin(0.5);

    tooltip.add([bg, name, desc]);
    this.scene.children.bringToTop(tooltip);
  }

  private hideRuneTooltip() {
    const tooltip = this.scene.children.getByName('rune_tooltip');
    if (tooltip) tooltip.destroy();
  }

  private showRuneInventory() {
    this.hideRuneInventory();

    const state = useGameStore.getState();
    if (state.runeInventory.length === 0) return;

    this.runeInventoryPanel = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2
    );
    this.runeInventoryPanel.setDepth(3000);

    const bg = this.scene.add.rectangle(0, 0, 300, 200, 0x0F172A, 0.95);
    bg.setStrokeStyle(2, 0xA78BFA, 0.6);

    const title = this.scene.add.text(0, -80, '选择符文镶嵌', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#A78BFA',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const closeBtn = this.scene.add.circle(130, -70, 15, 0xEF4444, 0.8);
    closeBtn.setStrokeStyle(2, 0xFCA5A5, 0.8);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.hideRuneInventory());

    const closeText = this.scene.add.text(130, -70, '×', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });
    closeText.setOrigin(0.5);

    state.runeInventory.forEach((rune, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const runeBtn = this.createRuneInventoryItem(rune);
      runeBtn.x = -100 + col * 50;
      runeBtn.y = -30 + row * 50;
      this.runeInventoryPanel!.add(runeBtn);
    });

    this.runeInventoryPanel.add([bg, title, closeBtn, closeText]);
  }

  private createRuneInventoryItem(rune: Rune): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    const bg = this.scene.add.circle(0, 0, 20, rune.color, 0.9);
    bg.setStrokeStyle(2, 0xffffff, 0.6);
    bg.setInteractive();

    const icon = this.scene.add.text(0, 0, this.getRuneIcon(rune.type), {
      fontFamily: 'Arial',
      fontSize: '16px'
    });
    icon.setOrigin(0.5);

    bg.on('pointerdown', () => {
      if (this.selectedSlotIndex !== null && this.selectedTowerId) {
        this.audioManager.play('embed');
        const success = useGameStore.getState().embedRune(this.selectedTowerId, this.selectedSlotIndex, rune.id);
        if (success) {
          this.hideRuneInventory();
          this.showTowerInfoPanel(this.selectedTowerId);
          this.selectedSlotIndex = null;
        }
      }
    });

    container.add([bg, icon]);
    return container;
  }

  private hideRuneInventory() {
    if (this.runeInventoryPanel) {
      this.runeInventoryPanel.destroy();
      this.runeInventoryPanel = null;
    }
  }

  private updateRuneInventory() {
    if (this.selectedTowerId) {
      this.showTowerInfoPanel(this.selectedTowerId);
    }
  }

  public hideTowerInfoPanel() {
    if (this.towerInfoPanel) {
      this.towerInfoPanel.destroy();
      this.towerInfoPanel = null;
    }
    this.hideRuneInventory();
    this.selectedSlotIndex = null;
  }

  public updateBuildPreview(worldX: number, worldY: number, canPlace: boolean) {
    if (!this.buildPreview) return;

    const gridX = Math.floor((worldX - SIDEBAR_WIDTH) / TILE_SIZE);
    const gridY = Math.floor(worldY / TILE_SIZE);

    this.buildPreview.x = SIDEBAR_WIDTH + gridX * TILE_SIZE + TILE_SIZE / 2;
    this.buildPreview.y = gridY * TILE_SIZE + TILE_SIZE / 2;

    if (canPlace) {
      this.buildPreview.setFillStyle(COLORS.PLACE_VALID, 0.4);
      this.buildPreview.setStrokeStyle(2, COLORS.PLACE_VALID, 0.8);
    } else {
      this.buildPreview.setFillStyle(COLORS.PLACE_INVALID, 0.4);
      this.buildPreview.setStrokeStyle(2, COLORS.PLACE_INVALID, 0.8);
    }

    this.buildPreview.setVisible(true);
  }

  public hideBuildPreview() {
    if (this.buildPreview) {
      this.buildPreview.setVisible(false);
    }
  }

  private shakeElement(element: Phaser.GameObjects.Shape | Phaser.GameObjects.Container) {
    const originalX = element.x;
    this.scene.tweens.add({
      targets: element,
      x: originalX + 5,
      duration: 50,
      yoyo: true,
      repeat: 3
    });
  }

  public destroy() {
    console.log('[TRACE] 销毁 HUD');
    this.sidebar.destroy();
    if (this.buildPreview) this.buildPreview.destroy();
    this.hideTowerInfoPanel();
    this.hideRuneInventory();
  }
}
