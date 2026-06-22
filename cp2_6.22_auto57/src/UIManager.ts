import * as PIXI from 'pixi.js';
import { GameState } from './types';

export class UIManager {
  private app: PIXI.Application;
  private uiContainer: PIXI.Container;

  private healthBar: PIXI.Graphics;
  private healthBarBg: PIXI.Graphics;
  private healthText: PIXI.Text;

  private oxygenBar: PIXI.Graphics;
  private oxygenBarBg: PIXI.Graphics;
  private oxygenText: PIXI.Text;

  private crystalText: PIXI.Text;
  private oreText: PIXI.Text;
  private crystalIcon: PIXI.Graphics;
  private oreIcon: PIXI.Graphics;

  private timerText: PIXI.Text;

  private keyHintContainer: PIXI.Container;
  private tooltip: PIXI.Container;
  private tooltipText: PIXI.Text;

  private menuContainer: PIXI.Container;
  private menuParticles: PIXI.Container;

  private gameOverContainer: PIXI.Container;
  private victoryContainer: PIXI.Container;

  private resultTimeText: PIXI.Text;
  private resultCrystalText: PIXI.Text;
  private resultOreText: PIXI.Text;
  private resultDeathText: PIXI.Text;
  private victoryTimeText: PIXI.Text;
  private victoryCrystalText: PIXI.Text;
  private victoryOreText: PIXI.Text;
  private victoryDeathText: PIXI.Text;

  private virtualJoystick: PIXI.Container;
  private joystickKnob: PIXI.Graphics;
  private joystickActive: boolean = false;
  private joystickStart: { x: number; y: number } = { x: 0, y: 0 };
  private joystickDirection: { x: number; y: number } = { x: 0, y: 0 };

  public onRestart: (() => void) | null = null;
  public onStart: (() => void) | null = null;
  public onJoystickMove: ((dx: number, dy: number) => void) | null = null;
  public onJoystickEnd: (() => void) | null = null;

  private isMobile: boolean = false;

  constructor(app: PIXI.Application) {
    this.app = app;

    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.uiContainer);

    this.healthBarBg = new PIXI.Graphics();
    this.healthBar = new PIXI.Graphics();
    this.healthText = new PIXI.Text('HP: 10/10', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0xff6666,
      fontWeight: 'bold'
    });

    this.oxygenBarBg = new PIXI.Graphics();
    this.oxygenBar = new PIXI.Graphics();
    this.oxygenText = new PIXI.Text('O2: 100', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0x66aaff,
      fontWeight: 'bold'
    });

    this.crystalIcon = new PIXI.Graphics();
    this.crystalText = new PIXI.Text('0', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0x00ffff,
      fontWeight: 'bold'
    });

    this.oreIcon = new PIXI.Graphics();
    this.oreText = new PIXI.Text('0', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0xffaa00,
      fontWeight: 'bold'
    });

    this.timerText = new PIXI.Text('00:00', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold'
    });

    this.keyHintContainer = new PIXI.Container();
    this.tooltip = new PIXI.Container();
    this.tooltipText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 12,
      fill: 0xffffff
    });

    this.menuContainer = new PIXI.Container();
    this.menuParticles = new PIXI.Container();

    this.gameOverContainer = new PIXI.Container();
    this.victoryContainer = new PIXI.Container();

    this.resultTimeText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: 0xffffff
    });
    this.resultCrystalText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0x00ffff
    });
    this.resultOreText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0xffaa00
    });
    this.resultDeathText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0xff6666
    });

    this.victoryTimeText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: 0xffffff
    });
    this.victoryCrystalText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0x00ffff
    });
    this.victoryOreText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0xffaa00
    });
    this.victoryDeathText = new PIXI.Text('', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0xff6666
    });

    this.virtualJoystick = new PIXI.Container();
    this.joystickKnob = new PIXI.Graphics();

    this.setupUI();
    this.setupMenu();
    this.setupGameOver();
    this.setupVictory();
    this.setupVirtualJoystick();

    this.checkMobile();
    this.resize();
  }

  private setupUI(): void {
    this.uiContainer.addChild(this.healthBarBg);
    this.uiContainer.addChild(this.healthBar);
    this.uiContainer.addChild(this.healthText);

    this.uiContainer.addChild(this.oxygenBarBg);
    this.uiContainer.addChild(this.oxygenBar);
    this.uiContainer.addChild(this.oxygenText);

    this.uiContainer.addChild(this.crystalIcon);
    this.uiContainer.addChild(this.crystalText);
    this.uiContainer.addChild(this.oreIcon);
    this.uiContainer.addChild(this.oreText);

    this.uiContainer.addChild(this.timerText);

    this.uiContainer.addChild(this.keyHintContainer);
    this.setupKeyHints();

    this.uiContainer.addChild(this.tooltip);
    this.tooltip.visible = false;

    const tooltipBg = new PIXI.Graphics();
    tooltipBg.beginFill(0x000000, 0.8);
    tooltipBg.drawRoundedRect(0, 0, 120, 30, 4);
    tooltipBg.endFill();
    this.tooltip.addChild(tooltipBg);
    this.tooltip.addChild(this.tooltipText);
    this.tooltipText.x = 8;
    this.tooltipText.y = 6;
  }

  private setupKeyHints(): void {
    const keys = ['W', 'A', 'S', 'D'];
    const positions = [
      { x: 30, y: 0 },
      { x: 0, y: 22 },
      { x: 30, y: 22 },
      { x: 60, y: 22 }
    ];

    for (let i = 0; i < keys.length; i++) {
      const keyBg = new PIXI.Graphics();
      keyBg.beginFill(0x2a2a3e, 0.9);
      keyBg.lineStyle(1, 0x4a4a6e);
      keyBg.drawRoundedRect(positions[i].x, positions[i].y, 24, 20, 3);
      keyBg.endFill();

      const keyText = new PIXI.Text(keys[i], {
        fontFamily: 'Courier New',
        fontSize: 12,
        fill: 0xaabbcc,
        fontWeight: 'bold'
      });
      keyText.x = positions[i].x + 7;
      keyText.y = positions[i].y + 3;

      this.keyHintContainer.addChild(keyBg);
      this.keyHintContainer.addChild(keyText);
    }

    this.keyHintContainer.interactive = true;
    this.keyHintContainer.on('pointerover', () => {
      this.showTooltip('WASD 移动');
    });
    this.keyHintContainer.on('pointerout', () => {
      this.hideTooltip();
    });
  }

  private showTooltip(text: string): void {
    this.tooltipText.text = text;
    const bg = this.tooltip.getChildAt(0) as PIXI.Graphics;
    bg.clear();
    bg.beginFill(0x000000, 0.8);
    bg.drawRoundedRect(0, 0, this.tooltipText.width + 16, this.tooltipText.height + 12, 4);
    bg.endFill();
    this.tooltip.visible = true;
  }

  private hideTooltip(): void {
    this.tooltip.visible = false;
  }

  private setupMenu(): void {
    this.uiContainer.addChild(this.menuContainer);
    this.menuContainer.addChild(this.menuParticles);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a12);
    bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.endFill();
    this.menuContainer.addChild(bg);

    const title = new PIXI.Text('洞穴探险', {
      fontFamily: 'Courier New',
      fontSize: 48,
      fill: 0x44aacc,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 2
    });
    title.anchor.set(0.5);
    title.x = this.app.screen.width / 2;
    title.y = this.app.screen.height / 3;
    this.menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Cave Exploration', {
      fontFamily: 'Courier New',
      fontSize: 18,
      fill: 0x667788
    });
    subtitle.anchor.set(0.5);
    subtitle.x = this.app.screen.width / 2;
    subtitle.y = title.y + 50;
    this.menuContainer.addChild(subtitle);

    const startBtn = new PIXI.Container();
    startBtn.interactive = true;
    startBtn.cursor = 'pointer';

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x2a4a6a);
    btnBg.lineStyle(2, 0x44aacc);
    btnBg.drawRoundedRect(0, 0, 160, 50, 8);
    btnBg.endFill();
    startBtn.addChild(btnBg);

    const btnText = new PIXI.Text('开始游戏', {
      fontFamily: 'Courier New',
      fontSize: 20,
      fill: 0xaaddff,
      fontWeight: 'bold'
    });
    btnText.anchor.set(0.5);
    btnText.x = 80;
    btnText.y = 25;
    startBtn.addChild(btnText);

    startBtn.x = this.app.screen.width / 2 - 80;
    startBtn.y = this.app.screen.height / 2;

    startBtn.on('pointerover', () => {
      btnBg.clear();
      btnBg.beginFill(0x3a6a8a);
      btnBg.lineStyle(2, 0x66ccff);
      btnBg.drawRoundedRect(0, 0, 160, 50, 8);
      btnBg.endFill();
      btnText.style.fill = 0xccffff;
    });

    startBtn.on('pointerout', () => {
      btnBg.clear();
      btnBg.beginFill(0x2a4a6a);
      btnBg.lineStyle(2, 0x44aacc);
      btnBg.drawRoundedRect(0, 0, 160, 50, 8);
      btnBg.endFill();
      btnText.style.fill = 0xaaddff;
    });

    startBtn.on('pointerdown', () => {
      startBtn.scale.set(0.95);
    });

    startBtn.on('pointerup', () => {
      startBtn.scale.set(1);
      if (this.onStart) {
        this.onStart();
      }
    });

    startBtn.on('pointerupoutside', () => {
      startBtn.scale.set(1);
    });

    this.menuContainer.addChild(startBtn);

    const hintText = new PIXI.Text('WASD 移动 · 采集资源 · 寻找出口', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0x556677
    });
    hintText.anchor.set(0.5);
    hintText.x = this.app.screen.width / 2;
    hintText.y = this.app.screen.height - 80;
    this.menuContainer.addChild(hintText);
  }

  private setupGameOver(): void {
    this.uiContainer.addChild(this.gameOverContainer);
    this.gameOverContainer.visible = false;

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.endFill();
    this.gameOverContainer.addChild(overlay);

    const card = new PIXI.Container();
    const cardBg = new PIXI.Graphics();
    cardBg.beginFill(0x1a1a2e);
    cardBg.lineStyle(2, 0xff4444);
    cardBg.drawRoundedRect(0, 0, 300, 220, 12);
    cardBg.endFill();
    card.addChild(cardBg);

    const title = new PIXI.Text('游戏结束', {
      fontFamily: 'Courier New',
      fontSize: 28,
      fill: 0xff6666,
      fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.x = 150;
    title.y = 35;
    card.addChild(title);

    this.resultTimeText.anchor.set(0.5);
    this.resultTimeText.x = 150;
    this.resultTimeText.y = 75;
    card.addChild(this.resultTimeText);

    this.resultCrystalText.anchor.set(0.5);
    this.resultCrystalText.x = 150;
    this.resultCrystalText.y = 105;
    card.addChild(this.resultCrystalText);

    this.resultOreText.anchor.set(0.5);
    this.resultOreText.x = 150;
    this.resultOreText.y = 130;
    card.addChild(this.resultOreText);

    this.resultDeathText.anchor.set(0.5);
    this.resultDeathText.x = 150;
    this.resultDeathText.y = 155;
    card.addChild(this.resultDeathText);

    const restartBtn = new PIXI.Container();
    restartBtn.interactive = true;
    restartBtn.cursor = 'pointer';

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x662222);
    btnBg.lineStyle(2, 0xff6666);
    btnBg.drawRoundedRect(0, 0, 120, 36, 6);
    btnBg.endFill();
    restartBtn.addChild(btnBg);

    const btnText = new PIXI.Text('再来一局', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: 0xffaaaa,
      fontWeight: 'bold'
    });
    btnText.anchor.set(0.5);
    btnText.x = 60;
    btnText.y = 18;
    restartBtn.addChild(btnText);

    restartBtn.x = 90;
    restartBtn.y = 175;

    restartBtn.on('pointerover', () => {
      btnBg.clear();
      btnBg.beginFill(0x883333);
      btnBg.lineStyle(2, 0xff8888);
      btnBg.drawRoundedRect(0, 0, 120, 36, 6);
      btnBg.endFill();
    });

    restartBtn.on('pointerout', () => {
      btnBg.clear();
      btnBg.beginFill(0x662222);
      btnBg.lineStyle(2, 0xff6666);
      btnBg.drawRoundedRect(0, 0, 120, 36, 6);
      btnBg.endFill();
    });

    restartBtn.on('pointerdown', () => {
      restartBtn.scale.set(0.95);
    });

    restartBtn.on('pointerup', () => {
      restartBtn.scale.set(1);
      if (this.onRestart) {
        this.onRestart();
      }
    });

    restartBtn.on('pointerupoutside', () => {
      restartBtn.scale.set(1);
    });

    card.addChild(restartBtn);

    card.x = this.app.screen.width / 2 - 150;
    card.y = -300;
    card.name = 'card';

    this.gameOverContainer.addChild(card);
  }

  private setupVictory(): void {
    this.uiContainer.addChild(this.victoryContainer);
    this.victoryContainer.visible = false;

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.endFill();
    this.victoryContainer.addChild(overlay);

    const card = new PIXI.Container();
    const cardBg = new PIXI.Graphics();
    cardBg.beginFill(0x1a2a1e);
    cardBg.lineStyle(2, 0x44ff88);
    cardBg.drawRoundedRect(0, 0, 300, 230, 12);
    cardBg.endFill();
    card.addChild(cardBg);

    const title = new PIXI.Text('胜利！', {
      fontFamily: 'Courier New',
      fontSize: 32,
      fill: 0x66ff88,
      fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.x = 150;
    title.y = 35;
    card.addChild(title);

    const subtitle = new PIXI.Text('你找到了出口', {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: 0x88ccaa
    });
    subtitle.anchor.set(0.5);
    subtitle.x = 150;
    subtitle.y = 60;
    card.addChild(subtitle);

    this.victoryTimeText.anchor.set(0.5);
    this.victoryTimeText.x = 150;
    this.victoryTimeText.y = 95;
    card.addChild(this.victoryTimeText);

    this.victoryCrystalText.anchor.set(0.5);
    this.victoryCrystalText.x = 150;
    this.victoryCrystalText.y = 125;
    card.addChild(this.victoryCrystalText);

    this.victoryOreText.anchor.set(0.5);
    this.victoryOreText.x = 150;
    this.victoryOreText.y = 150;
    card.addChild(this.victoryOreText);

    this.victoryDeathText.anchor.set(0.5);
    this.victoryDeathText.x = 150;
    this.victoryDeathText.y = 175;
    card.addChild(this.victoryDeathText);

    const restartBtn = new PIXI.Container();
    restartBtn.interactive = true;
    restartBtn.cursor = 'pointer';

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x226633);
    btnBg.lineStyle(2, 0x66ff88);
    btnBg.drawRoundedRect(0, 0, 120, 36, 6);
    btnBg.endFill();
    restartBtn.addChild(btnBg);

    const btnText = new PIXI.Text('再来一局', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: 0xaaffbb,
      fontWeight: 'bold'
    });
    btnText.anchor.set(0.5);
    btnText.x = 60;
    btnText.y = 18;
    restartBtn.addChild(btnText);

    restartBtn.x = 90;
    restartBtn.y = 190;

    restartBtn.on('pointerover', () => {
      btnBg.clear();
      btnBg.beginFill(0x338844);
      btnBg.lineStyle(2, 0x88ffaa);
      btnBg.drawRoundedRect(0, 0, 120, 36, 6);
      btnBg.endFill();
    });

    restartBtn.on('pointerout', () => {
      btnBg.clear();
      btnBg.beginFill(0x226633);
      btnBg.lineStyle(2, 0x66ff88);
      btnBg.drawRoundedRect(0, 0, 120, 36, 6);
      btnBg.endFill();
    });

    restartBtn.on('pointerdown', () => {
      restartBtn.scale.set(0.95);
    });

    restartBtn.on('pointerup', () => {
      restartBtn.scale.set(1);
      if (this.onRestart) {
        this.onRestart();
      }
    });

    restartBtn.on('pointerupoutside', () => {
      restartBtn.scale.set(1);
    });

    card.addChild(restartBtn);

    card.x = this.app.screen.width / 2 - 150;
    card.y = -300;
    card.name = 'card';

    this.victoryContainer.addChild(card);
  }

  private setupVirtualJoystick(): void {
    this.uiContainer.addChild(this.virtualJoystick);
    this.virtualJoystick.visible = false;

    const base = new PIXI.Graphics();
    base.beginFill(0x2a2a3e, 0.5);
    base.lineStyle(2, 0x4a4a6e, 0.5);
    base.drawCircle(0, 0, 50);
    base.endFill();
    this.virtualJoystick.addChild(base);

    this.joystickKnob.beginFill(0x4a6a8a, 0.8);
    this.joystickKnob.lineStyle(2, 0x6a8aaa);
    this.joystickKnob.drawCircle(0, 0, 20);
    this.joystickKnob.endFill();
    this.virtualJoystick.addChild(this.joystickKnob);

    this.virtualJoystick.interactive = true;

    this.virtualJoystick.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      this.joystickActive = true;
      const pos = e.global;
      this.joystickStart = { x: pos.x, y: pos.y };
      this.virtualJoystick.x = pos.x;
      this.virtualJoystick.y = pos.y;
      this.joystickKnob.x = 0;
      this.joystickKnob.y = 0;
    });

    this.virtualJoystick.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (!this.joystickActive) return;

      const pos = e.global;
      let dx = pos.x - this.joystickStart.x;
      let dy = pos.y - this.joystickStart.y;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 30;

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      this.joystickKnob.x = dx;
      this.joystickKnob.y = dy;

      const normDx = dx / maxDist;
      const normDy = dy / maxDist;

      this.joystickDirection = { x: normDx, y: normDy };

      if (this.onJoystickMove) {
        this.onJoystickMove(normDx, normDy);
      }
    });

    this.virtualJoystick.on('pointerup', () => {
      this.joystickActive = false;
      this.joystickKnob.x = 0;
      this.joystickKnob.y = 0;
      this.joystickDirection = { x: 0, y: 0 };
      if (this.onJoystickEnd) {
        this.onJoystickEnd();
      }
    });

    this.virtualJoystick.on('pointerupoutside', () => {
      this.joystickActive = false;
      this.joystickKnob.x = 0;
      this.joystickKnob.y = 0;
      this.joystickDirection = { x: 0, y: 0 };
      if (this.onJoystickEnd) {
        this.onJoystickEnd();
      }
    });
  }

  updateState(state: GameState): void {
    this.healthText.text = `HP: ${state.health}/${state.maxHealth}`;
    this.healthBar.clear();
    this.healthBar.beginFill(0xff4444);
    this.healthBar.drawRect(0, 0, (state.health / state.maxHealth) * 150, 16);
    this.healthBar.endFill();

    this.oxygenText.text = `O2: ${Math.floor(state.oxygen)}`;
    this.oxygenBar.clear();
    this.oxygenBar.beginFill(0x4488ff);
    this.oxygenBar.drawRect(0, 0, (state.oxygen / state.maxOxygen) * 150, 16);
    this.oxygenBar.endFill();

    this.crystalText.text = state.crystals.toString();
    this.oreText.text = state.ores.toString();

    const totalSeconds = Math.floor(state.time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.timerText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  showMenu(): void {
    this.menuContainer.visible = true;
    this.gameOverContainer.visible = false;
    this.victoryContainer.visible = false;
  }

  hideMenu(): void {
    this.menuContainer.visible = false;
  }

  showGameOver(state: GameState): void {
    this.gameOverContainer.visible = true;

    const totalSeconds = Math.floor(state.time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    this.resultTimeText.text = `耗时: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.resultCrystalText.text = `水晶: ${state.crystals}`;
    this.resultOreText.text = `矿石: ${state.ores}`;
    this.resultDeathText.text = `死亡: ${state.deaths} 次`;

    const card = this.gameOverContainer.getChildByName('card') as PIXI.Container;
    if (card) {
      card.y = -300;
      card.alpha = 0;
    }
  }

  showVictory(state: GameState): void {
    this.victoryContainer.visible = true;

    const totalSeconds = Math.floor(state.time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    this.victoryTimeText.text = `耗时: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.victoryCrystalText.text = `水晶: ${state.crystals}`;
    this.victoryOreText.text = `矿石: ${state.ores}`;
    this.victoryDeathText.text = `死亡: ${state.deaths} 次`;

    const card = this.victoryContainer.getChildByName('card') as PIXI.Container;
    if (card) {
      card.y = -300;
      card.alpha = 0;
    }
  }

  update(deltaTime: number): void {
    const gameOverCard = this.gameOverContainer.getChildByName('card') as PIXI.Container;
    if (this.gameOverContainer.visible && gameOverCard) {
      const targetY = this.app.screen.height / 2 - 110;
      gameOverCard.y += (targetY - gameOverCard.y) * 0.1;
      gameOverCard.alpha = Math.min(1, gameOverCard.alpha + deltaTime * 3);
    }

    const victoryCard = this.victoryContainer.getChildByName('card') as PIXI.Container;
    if (this.victoryContainer.visible && victoryCard) {
      const targetY = this.app.screen.height / 2 - 115;
      victoryCard.y += (targetY - victoryCard.y) * 0.1;
      victoryCard.alpha = Math.min(1, victoryCard.alpha + deltaTime * 3);
    }
  }

  updateMenuParticles(particles: Array<{ x: number; y: number; life: number; maxLife: number; size: number; color: number }>): void {
    while (this.menuParticles.children.length > 0) {
      this.menuParticles.removeChildAt(0);
    }

    for (const p of particles) {
      const sprite = new PIXI.Graphics();
      sprite.beginFill(p.color, (p.life / p.maxLife) * 0.3);
      sprite.drawRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      sprite.endFill();
      this.menuParticles.addChild(sprite);
    }
  }

  private checkMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }

  resize(): void {
    this.checkMobile();

    this.healthBarBg.clear();
    this.healthBarBg.beginFill(0x1a1a2e, 0.9);
    this.healthBarBg.lineStyle(1, 0x444466);
    this.healthBarBg.drawRoundedRect(0, 0, 150, 16, 3);
    this.healthBarBg.endFill();

    this.healthBarBg.x = 16;
    this.healthBarBg.y = 16;
    this.healthBar.x = 16;
    this.healthBar.y = 16;
    this.healthText.x = 20;
    this.healthText.y = 17;

    this.oxygenBarBg.clear();
    this.oxygenBarBg.beginFill(0x1a1a2e, 0.9);
    this.oxygenBarBg.lineStyle(1, 0x444466);
    this.oxygenBarBg.drawRoundedRect(0, 0, 150, 16, 3);
    this.oxygenBarBg.endFill();

    this.oxygenBarBg.x = 16;
    this.oxygenBarBg.y = 42;
    this.oxygenBar.x = 16;
    this.oxygenBar.y = 42;
    this.oxygenText.x = 20;
    this.oxygenText.y = 43;

    this.crystalIcon.clear();
    this.crystalIcon.beginFill(0x00ffff);
    this.crystalIcon.drawPolygon([8, 0, 16, 8, 8, 16, 0, 8]);
    this.crystalIcon.endFill();
    this.crystalIcon.x = 16;
    this.crystalIcon.y = 70;

    this.crystalText.x = 40;
    this.crystalText.y = 72;

    this.oreIcon.clear();
    this.oreIcon.beginFill(0xffaa00);
    this.oreIcon.drawRect(2, 4, 12, 8);
    this.oreIcon.endFill();
    this.oreIcon.x = 80;
    this.oreIcon.y = 70;

    this.oreText.x = 100;
    this.oreText.y = 72;

    this.timerText.x = this.app.screen.width - 16;
    this.timerText.y = 16;
    this.timerText.anchor.x = 1;

    this.keyHintContainer.x = this.app.screen.width - 100;
    this.keyHintContainer.y = 50;

    this.tooltip.x = this.app.screen.width - 140;
    this.tooltip.y = 100;

    if (this.isMobile) {
      this.virtualJoystick.visible = true;
      this.virtualJoystick.x = 80;
      this.virtualJoystick.y = this.app.screen.height - 100;
      this.keyHintContainer.visible = false;
    } else {
      this.virtualJoystick.visible = false;
      this.keyHintContainer.visible = true;
    }
  }

  getJoystickDirection(): { x: number; y: number } {
    return this.joystickDirection;
  }

  isJoystickActive(): boolean {
    return this.joystickActive;
  }
}
