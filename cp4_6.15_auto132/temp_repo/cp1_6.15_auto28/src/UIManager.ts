import * as PIXI from 'pixi.js';
import { Order, DishInstance, GameState, LevelConfig, Particle, Ingredient, StepConfig } from './types';
import { COLORS, DISHES, LEVELS } from './config';
import { SoundManager } from './SoundManager';

type GameScreen = 'menu' | 'playing' | 'levelComplete' | 'gameOver';

export class UIManager {
  private app: PIXI.Application;
  private soundManager: SoundManager;
  private container: PIXI.Container;
  private screen: GameScreen = 'menu';

  private menuContainer: PIXI.Container;
  private gameContainer: PIXI.Container;
  private levelCompleteContainer: PIXI.Container;
  private gameOverContainer: PIXI.Container;

  private orderListContainer: PIXI.Container;
  private stationContainer: PIXI.Container;
  private satisfactionContainer: PIXI.Container;
  private stepIndicatorContainer: PIXI.Container;
  private particlesContainer: PIXI.Container;

  private particles: Particle[] = [];
  private orderViews: Map<string, PIXI.Container> = new Map();

  private currentStep: StepConfig | null = null;
  private currentStepElapsed: number = 0;
  private stepType: 'prep' | 'cook' | 'plate' = 'prep';

  private prepIngredients: Ingredient[] = [];
  private prepSelected: Set<string> = new Set();
  private prepTarget: Ingredient[] = [];

  private cookProgress: number = 0;
  private cookIsHolding: boolean = false;
  private cookPerfectZone: { start: number; end: number } = { start: 0, end: 0 };

  private plateItems: { ingredient: Ingredient; x: number; y: number; placed: boolean }[] = [];
  private plateTargetPositions: { x: number; y: number; ingredientId: string }[] = [];
  private draggingItem: { index: number; offsetX: number; offsetY: number } | null = null;

  private stepIndicatorItems: PIXI.Container[] = [];
  private breathePhase: number = 0;

  private scoreText: PIXI.Text | null = null;
  private comboText: PIXI.Text | null = null;
  private levelText: PIXI.Text | null = null;
  private satisfactionBar: PIXI.Graphics | null = null;
  private satisfactionFill: PIXI.Graphics | null = null;

  private shakeOffset: { x: number; y: number } = { x: 0, y: 0 };
  private shakeTime: number = 0;

  private highScores: number[] = [0, 0, 0];

  private stationWidth: number = 400;
  private stationHeight: number = 400;

  onStartGame: ((level: number) => void) | null = null;
  onStepComplete: ((quality: 'perfect' | 'good' | 'ok' | 'fail') => void) | null = null;
  onNextLevel: (() => void) | null = null;
  onRestart: (() => void) | null = null;
  onBackToMenu: (() => void) | null = null;

  constructor(app: PIXI.Application, soundManager: SoundManager) {
    this.app = app;
    this.soundManager = soundManager;
    this.container = new PIXI.Container();

    this.menuContainer = new PIXI.Container();
    this.gameContainer = new PIXI.Container();
    this.levelCompleteContainer = new PIXI.Container();
    this.gameOverContainer = new PIXI.Container();

    this.orderListContainer = new PIXI.Container();
    this.stationContainer = new PIXI.Container();
    this.satisfactionContainer = new PIXI.Container();
    this.stepIndicatorContainer = new PIXI.Container();
    this.particlesContainer = new PIXI.Container();

    this.setupInteractions();
    this.loadHighScores();
  }

  private loadHighScores(): void {
    try {
      const saved = localStorage.getItem('kitchen_rush_highscores');
      if (saved) {
        this.highScores = JSON.parse(saved);
      }
    } catch (e) {
      this.highScores = [0, 0, 0];
    }
  }

  private saveHighScores(): void {
    try {
      localStorage.setItem('kitchen_rush_highscores', JSON.stringify(this.highScores));
    } catch (e) {
      // ignore
    }
  }

  getContainer(): PIXI.Container {
    return this.container;
  }

  init(): void {
    this.createBackground();
    this.createMenuScreen();
    this.createGameScreen();
    this.createLevelCompleteScreen();
    this.createGameOverScreen();

    this.showScreen('menu');

    this.app.ticker.add(this.update.bind(this));
  }

  private setupInteractions(): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height);

    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
  }

  private onPointerDown(e: PIXI.FederatedPointerEvent): void {
    if (this.screen !== 'playing') return;

    const pos = e.global;

    if (this.stepType === 'prep') {
      this.handlePrepClick(pos);
    } else if (this.stepType === 'cook') {
      this.handleCookPointerDown(pos);
    } else if (this.stepType === 'plate') {
      this.handlePlatePointerDown(pos);
    }
  }

  private onPointerMove(e: PIXI.FederatedPointerEvent): void {
    if (this.screen !== 'playing') return;

    const pos = e.global;

    if (this.stepType === 'plate') {
      this.handlePlatePointerMove(pos);
    }
  }

  private onPointerUp(e: PIXI.FederatedPointerEvent): void {
    if (this.screen !== 'playing') return;

    const pos = e.global;

    if (this.stepType === 'cook') {
      this.handleCookPointerUp(pos);
    } else if (this.stepType === 'plate') {
      this.handlePlatePointerUp(pos);
    }
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.beginFill(COLORS.background);
    bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.endFill();
    this.container.addChild(bg);

    const gradient = new PIXI.Graphics();
    for (let i = 0; i < 20; i++) {
      const alpha = 0.02 + Math.random() * 0.03;
      const x = Math.random() * this.app.screen.width;
      const y = Math.random() * this.app.screen.height;
      const size = 50 + Math.random() * 150;
      gradient.beginFill(COLORS.accent, alpha);
      gradient.drawCircle(x, y, size);
      gradient.endFill();
    }
    this.container.addChild(gradient);
  }

  private createMenuScreen(): void {
    const title = new PIXI.Text('后厨狂潮', {
      fontFamily: 'Arial',
      fontSize: 72,
      fontWeight: 'bold',
      fill: COLORS.accentLight,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 4,
    });
    title.anchor.set(0.5);
    title.x = this.app.screen.width / 2;
    title.y = 120;
    this.menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Kitchen Rush', {
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0xffcc99,
    });
    subtitle.anchor.set(0.5);
    subtitle.x = this.app.screen.width / 2;
    subtitle.y = 190;
    this.menuContainer.addChild(subtitle);

    const levelsTitle = new PIXI.Text('选择关卡', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: COLORS.text,
    });
    levelsTitle.anchor.set(0.5);
    levelsTitle.x = this.app.screen.width / 2;
    levelsTitle.y = 280;
    this.menuContainer.addChild(levelsTitle);

    const cols = 3;
    const buttonWidth = 140;
    const buttonHeight = 100;
    const spacing = 30;
    const startX = this.app.screen.width / 2 - ((cols - 1) * (buttonWidth + spacing)) / 2;
    const startY = 340;

    LEVELS.forEach((level, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const btn = this.createLevelButton(level, buttonWidth, buttonHeight);
      btn.x = startX + col * (buttonWidth + spacing);
      btn.y = startY + row * (buttonHeight + spacing);

      btn.eventMode = 'dynamic';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => {
        this.soundManager.playClick();
        btn.scale.set(0.95);
      });
      btn.on('pointerup', () => {
        btn.scale.set(1);
        if (this.onStartGame) {
          this.onStartGame(level.level);
        }
      });
      btn.on('pointerover', () => {
        btn.scale.set(1.05);
      });
      btn.on('pointerout', () => {
        btn.scale.set(1);
      });

      this.menuContainer.addChild(btn);
    });

    const highScoresTitle = new PIXI.Text('最高记录', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: COLORS.text,
    });
    highScoresTitle.anchor.set(0.5);
    highScoresTitle.x = this.app.screen.width / 2;
    highScoresTitle.y = 580;
    this.menuContainer.addChild(highScoresTitle);

    for (let i = 0; i < 3; i++) {
      const scoreText = new PIXI.Text(`${i + 1}. ${this.highScores[i]}`, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: i === 0 ? COLORS.accentLight : COLORS.textDark,
      });
      scoreText.anchor.set(0.5);
      scoreText.x = this.app.screen.width / 2;
      scoreText.y = 620 + i * 32;
      this.menuContainer.addChild(scoreText);

      if (this.highScores[i] > 0) {
        const trophy = new PIXI.Text(i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉', {
          fontSize: 24,
        });
        trophy.anchor.set(1, 0.5);
        trophy.x = this.app.screen.width / 2 - 80;
        trophy.y = 620 + i * 32;
        this.menuContainer.addChild(trophy);
      }
    }

    const hint = new PIXI.Text('点击关卡开始游戏', {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: COLORS.textDark,
    });
    hint.anchor.set(0.5);
    hint.x = this.app.screen.width / 2;
    hint.y = this.app.screen.height - 60;
    this.menuContainer.addChild(hint);

    this.container.addChild(this.menuContainer);
  }

  private createLevelButton(level: LevelConfig, width: number, height: number): PIXI.Container {
    const container = new PIXI.Container();
    container.hitArea = new PIXI.Rectangle(0, 0, width, height);
    container.eventMode = 'dynamic';
    container.cursor = 'pointer';

    const bg = new PIXI.Graphics();
    bg.name = 'bg';
    bg.beginFill(0x3a2015);
    bg.lineStyle(3, COLORS.accent);
    bg.drawRoundedRect(0, 0, width, height, 12);
    bg.endFill();
    bg.eventMode = 'none';
    container.addChild(bg);

    const levelNum = new PIXI.Text(level.level.toString(), {
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: COLORS.accentLight,
    });
    levelNum.anchor.set(0.5, 0);
    levelNum.x = width / 2;
    levelNum.y = 10;
    levelNum.eventMode = 'none';
    container.addChild(levelNum);

    const levelName = new PIXI.Text(level.name, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: COLORS.text,
    });
    levelName.anchor.set(0.5, 0);
    levelName.x = width / 2;
    levelName.y = 55;
    levelName.eventMode = 'none';
    container.addChild(levelName);

    return container;
  }

  private createGameScreen(): void {
    const leftPanel = new PIXI.Graphics();
    leftPanel.beginFill(0x1a0f0a, 0.8);
    leftPanel.lineStyle(2, 0x4a2a1a);
    leftPanel.drawRect(20, 80, 280, this.app.screen.height - 100);
    leftPanel.endFill();
    this.gameContainer.addChild(leftPanel);

    const ordersTitle = new PIXI.Text('订单列表', {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: COLORS.text,
    });
    ordersTitle.x = 35;
    ordersTitle.y = 95;
    this.gameContainer.addChild(ordersTitle);

    this.orderListContainer.x = 30;
    this.orderListContainer.y = 140;
    this.gameContainer.addChild(this.orderListContainer);

    const centerPanel = new PIXI.Graphics();
    centerPanel.beginFill(0x1a0f0a, 0.6);
    centerPanel.lineStyle(2, 0x4a2a1a);
    centerPanel.drawRect(320, 80, this.app.screen.width - 640, this.app.screen.height - 100);
    centerPanel.endFill();
    this.gameContainer.addChild(centerPanel);

    this.stepIndicatorContainer.x = this.app.screen.width / 2 - 250;
    this.stepIndicatorContainer.y = 100;
    this.gameContainer.addChild(this.stepIndicatorContainer);

    this.stationContainer.x = this.app.screen.width / 2 - this.stationWidth / 2;
    this.stationContainer.y = 200;
    this.gameContainer.addChild(this.stationContainer);

    this.particlesContainer.x = 0;
    this.particlesContainer.y = 0;
    this.gameContainer.addChild(this.particlesContainer);

    const rightPanel = new PIXI.Graphics();
    rightPanel.beginFill(0x1a0f0a, 0.8);
    rightPanel.lineStyle(2, 0x4a2a1a);
    rightPanel.drawRect(this.app.screen.width - 300, 80, 280, this.app.screen.height - 100);
    rightPanel.endFill();
    this.gameContainer.addChild(rightPanel);

    this.scoreText = new PIXI.Text('分数: 0', {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fill: COLORS.accentLight,
    });
    this.scoreText.x = this.app.screen.width - 290;
    this.scoreText.y = 100;
    this.gameContainer.addChild(this.scoreText);

    this.comboText = new PIXI.Text('连击: 0', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: COLORS.warning,
    });
    this.comboText.x = this.app.screen.width - 290;
    this.comboText.y = 140;
    this.gameContainer.addChild(this.comboText);

    this.levelText = new PIXI.Text('关卡 1', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: COLORS.text,
    });
    this.levelText.x = this.app.screen.width - 290;
    this.levelText.y = 175;
    this.gameContainer.addChild(this.levelText);

    const satisfactionTitle = new PIXI.Text('顾客满意度', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: COLORS.text,
    });
    satisfactionTitle.x = this.app.screen.width - 290;
    satisfactionTitle.y = 230;
    this.gameContainer.addChild(satisfactionTitle);

    this.satisfactionContainer.x = this.app.screen.width - 290;
    this.satisfactionContainer.y = 260;
    this.gameContainer.addChild(this.satisfactionContainer);

    const barBg = new PIXI.Graphics();
    barBg.beginFill(0x333333);
    barBg.drawRoundedRect(0, 0, 260, 30, 6);
    barBg.endFill();
    this.satisfactionContainer.addChild(barBg);

    this.satisfactionFill = new PIXI.Graphics();
    this.satisfactionContainer.addChild(this.satisfactionFill);

    const backBtn = this.createButton('返回菜单', 120, 40);
    backBtn.x = this.app.screen.width - 290;
    backBtn.y = this.app.screen.height - 120;
    backBtn.eventMode = 'dynamic';
    backBtn.cursor = 'pointer';
    backBtn.on('pointerdown', () => backBtn.scale.set(0.95));
    backBtn.on('pointerup', () => {
      backBtn.scale.set(1);
      this.soundManager.playClick();
      if (this.onBackToMenu) this.onBackToMenu();
    });
    backBtn.on('pointerout', () => backBtn.scale.set(1));
    this.gameContainer.addChild(backBtn);

    this.container.addChild(this.gameContainer);
  }

  private createButton(text: string, width: number, height: number): PIXI.Container {
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.beginFill(COLORS.accent);
    bg.drawRoundedRect(0, 0, width, height, 8);
    bg.endFill();
    container.addChild(bg);

    const label = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: COLORS.text,
    });
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = height / 2;
    container.addChild(label);

    return container;
  }

  private createLevelCompleteScreen(): void {
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.85);
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.endFill();
    this.levelCompleteContainer.addChild(overlay);

    const title = new PIXI.Text('关卡完成!', {
      fontFamily: 'Arial',
      fontSize: 56,
      fontWeight: 'bold',
      fill: COLORS.accentLight,
    });
    title.anchor.set(0.5);
    title.x = this.app.screen.width / 2;
    title.y = 150;
    this.levelCompleteContainer.addChild(title);

    const stats = [
      { label: '总分', value: '0', y: 240, size: 48, color: COLORS.accentLight },
      { label: '完美率', value: '0%', y: 330, size: 28, color: COLORS.text },
      { label: '平均响应时间', value: '0ms', y: 380, size: 28, color: COLORS.text },
      { label: '最高连击', value: '0', y: 430, size: 28, color: COLORS.warning },
    ];

    stats.forEach((stat, i) => {
      const label = new PIXI.Text(stat.label, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: COLORS.textDark,
      });
      label.anchor.set(0.5, 0);
      label.x = this.app.screen.width / 2;
      label.y = stat.y - 30;
      this.levelCompleteContainer.addChild(label);

      const value = new PIXI.Text(stat.value, {
        fontFamily: 'Arial',
        fontSize: stat.size,
        fontWeight: 'bold',
        fill: stat.color,
      });
      value.anchor.set(0.5);
      value.x = this.app.screen.width / 2;
      value.y = stat.y + 10;
      value.name = `stat_${i}`;
      this.levelCompleteContainer.addChild(value);
    });

    const nextBtn = this.createButton('下一关', 150, 50);
    nextBtn.x = this.app.screen.width / 2 - 170;
    nextBtn.y = 520;
    nextBtn.eventMode = 'dynamic';
    nextBtn.cursor = 'pointer';
    nextBtn.on('pointerdown', () => nextBtn.scale.set(0.95));
    nextBtn.on('pointerup', () => {
      nextBtn.scale.set(1);
      this.soundManager.playClick();
      if (this.onNextLevel) this.onNextLevel();
    });
    nextBtn.on('pointerout', () => nextBtn.scale.set(1));
    nextBtn.name = 'nextBtn';
    this.levelCompleteContainer.addChild(nextBtn);

    const menuBtn = this.createButton('返回菜单', 150, 50);
    menuBtn.x = this.app.screen.width / 2 + 20;
    menuBtn.y = 520;
    menuBtn.eventMode = 'dynamic';
    menuBtn.cursor = 'pointer';
    menuBtn.on('pointerdown', () => menuBtn.scale.set(0.95));
    menuBtn.on('pointerup', () => {
      menuBtn.scale.set(1);
      this.soundManager.playClick();
      if (this.onBackToMenu) this.onBackToMenu();
    });
    menuBtn.on('pointerout', () => menuBtn.scale.set(1));
    this.levelCompleteContainer.addChild(menuBtn);

    this.container.addChild(this.levelCompleteContainer);
  }

  private createGameOverScreen(): void {
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.85);
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.endFill();
    this.gameOverContainer.addChild(overlay);

    const title = new PIXI.Text('游戏结束', {
      fontFamily: 'Arial',
      fontSize: 56,
      fontWeight: 'bold',
      fill: COLORS.danger,
    });
    title.anchor.set(0.5);
    title.x = this.app.screen.width / 2;
    title.y = 180;
    this.gameOverContainer.addChild(title);

    const subtitle = new PIXI.Text('顾客满意度归零了...', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: COLORS.textDark,
    });
    subtitle.anchor.set(0.5);
    subtitle.x = this.app.screen.width / 2;
    subtitle.y = 250;
    this.gameOverContainer.addChild(subtitle);

    const scoreLabel = new PIXI.Text('最终得分', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: COLORS.text,
    });
    scoreLabel.anchor.set(0.5);
    scoreLabel.x = this.app.screen.width / 2;
    scoreLabel.y = 330;
    this.gameOverContainer.addChild(scoreLabel);

    const finalScore = new PIXI.Text('0', {
      fontFamily: 'Arial',
      fontSize: 64,
      fontWeight: 'bold',
      fill: COLORS.accentLight,
    });
    finalScore.anchor.set(0.5);
    finalScore.x = this.app.screen.width / 2;
    finalScore.y = 400;
    finalScore.name = 'finalScore';
    this.gameOverContainer.addChild(finalScore);

    const retryBtn = this.createButton('重新开始', 150, 50);
    retryBtn.x = this.app.screen.width / 2 - 170;
    retryBtn.y = 500;
    retryBtn.eventMode = 'dynamic';
    retryBtn.cursor = 'pointer';
    retryBtn.on('pointerdown', () => retryBtn.scale.set(0.95));
    retryBtn.on('pointerup', () => {
      retryBtn.scale.set(1);
      this.soundManager.playClick();
      if (this.onRestart) this.onRestart();
    });
    retryBtn.on('pointerout', () => retryBtn.scale.set(1));
    this.gameOverContainer.addChild(retryBtn);

    const menuBtn = this.createButton('返回菜单', 150, 50);
    menuBtn.x = this.app.screen.width / 2 + 20;
    menuBtn.y = 500;
    menuBtn.eventMode = 'dynamic';
    menuBtn.cursor = 'pointer';
    menuBtn.on('pointerdown', () => menuBtn.scale.set(0.95));
    menuBtn.on('pointerup', () => {
      menuBtn.scale.set(1);
      this.soundManager.playClick();
      if (this.onBackToMenu) this.onBackToMenu();
    });
    menuBtn.on('pointerout', () => menuBtn.scale.set(1));
    this.gameOverContainer.addChild(menuBtn);

    this.container.addChild(this.gameOverContainer);
  }

  showScreen(screen: GameScreen): void {
    this.screen = screen;
    this.menuContainer.visible = screen === 'menu';
    this.gameContainer.visible = screen === 'playing';
    this.levelCompleteContainer.visible = screen === 'levelComplete';
    this.gameOverContainer.visible = screen === 'gameOver';
  }

  updateOrders(orders: Order[]): void {
    const visibleOrders = orders.filter(o => o.status === 'pending' || o.status === 'active' || o.status === 'failed');

    const orderHeight = 100;
    const spacing = 10;
    const maxVisible = 5;
    const startY = 0;

    const activeOrders = visibleOrders.slice(0, maxVisible);

    activeOrders.forEach((order, index) => {
      let view = this.orderViews.get(order.id);
      if (!view) {
        view = this.createOrderView(order);
        view.y = startY + index * (orderHeight + spacing) + 50;
        view.alpha = 0;
        this.orderListContainer.addChild(view);
        this.orderViews.set(order.id, view);
      }

      const targetY = startY + index * (orderHeight + spacing);
      view.y += (targetY - view.y) * 0.1;
      view.alpha += (1 - view.alpha) * 0.1;

      this.updateOrderView(view, order);
    });

    this.orderViews.forEach((view, id) => {
      if (!visibleOrders.find(o => o.id === id)) {
        view.alpha -= 0.05;
        if (view.alpha <= 0) {
          this.orderListContainer.removeChild(view);
          this.orderViews.delete(id);
        }
      }
    });
  }

  private createOrderView(order: Order): PIXI.Container {
    const container = new PIXI.Container();
    container.name = order.id;

    const width = 260;
    const height = 90;

    const bg = new PIXI.Graphics();
    bg.name = 'bg';
    container.addChild(bg);

    const dishNames = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: COLORS.text,
    });
    dishNames.name = 'dishNames';
    dishNames.x = 12;
    dishNames.y = 10;
    container.addChild(dishNames);

    const timeBarBg = new PIXI.Graphics();
    timeBarBg.name = 'timeBarBg';
    container.addChild(timeBarBg);

    const timeBar = new PIXI.Graphics();
    timeBar.name = 'timeBar';
    container.addChild(timeBar);

    const timeText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: COLORS.textDark,
    });
    timeText.name = 'timeText';
    timeText.x = 12;
    timeText.y = 65;
    container.addChild(timeText);

    return container;
  }

  private updateOrderView(container: PIXI.Container, order: Order): void {
    const width = 260;
    const height = 90;

    const bg = container.getChildByName('bg') as PIXI.Graphics;
    if (bg) {
      bg.clear();
      let borderColor = 0x4a2a1a;
      let fillColor = 0x2a1810;

      if (order.status === 'active') {
        borderColor = COLORS.warning;
        fillColor = 0x3a2510;
      } else if (order.status === 'failed') {
        borderColor = COLORS.danger;
        fillColor = 0x3a1515;
      }

      bg.beginFill(fillColor);
      bg.lineStyle(2, borderColor);
      bg.drawRoundedRect(0, 0, width, height, 8);
      bg.endFill();

      if (order.status === 'failed') {
        const flash = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        bg.beginFill(COLORS.danger, flash * 0.3);
        bg.drawRoundedRect(0, 0, width, height, 8);
        bg.endFill();
      }

      if (order.status === 'active') {
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        bg.lineStyle(3, COLORS.warning, pulse);
        bg.drawRoundedRect(0, 0, width, height, 8);
      }
    }

    const dishNames = container.getChildByName('dishNames') as PIXI.Text;
    if (dishNames) {
      const names = order.dishes.map(d => d.config.name).join('、');
      dishNames.text = names.substring(0, 12) + (names.length > 12 ? '...' : '');
      dishNames.style.fill = order.status === 'failed' ? COLORS.danger : COLORS.text;
    }

    const timeBarBg = container.getChildByName('timeBarBg') as PIXI.Graphics;
    if (timeBarBg) {
      timeBarBg.clear();
      timeBarBg.beginFill(0x333333);
      timeBarBg.drawRoundedRect(12, 50, width - 24, 10, 5);
      timeBarBg.endFill();
    }

    const timeBar = container.getChildByName('timeBar') as PIXI.Graphics;
    if (timeBar) {
      timeBar.clear();
      const progress = Math.max(0, order.timeRemaining / order.maxTime);
      const barWidth = (width - 24) * progress;

      let barColor = COLORS.success;
      if (progress < 0.3) barColor = COLORS.danger;
      else if (progress < 0.6) barColor = COLORS.warning;

      timeBar.beginFill(barColor);
      timeBar.drawRoundedRect(12, 50, barWidth, 10, 5);
      timeBar.endFill();
    }

    const timeText = container.getChildByName('timeText') as PIXI.Text;
    if (timeText) {
      const seconds = Math.max(0, Math.ceil(order.timeRemaining / 1000));
      timeText.text = `剩余: ${seconds}s`;
      timeText.style.fill = order.timeRemaining < order.maxTime * 0.3 ? COLORS.danger : COLORS.textDark;
    }
  }

  updateGameState(state: GameState, level: LevelConfig): void {
    if (this.scoreText) {
      this.scoreText.text = `分数: ${state.score}`;
    }
    if (this.comboText) {
      this.comboText.text = `连击: ${state.combo}`;
      if (state.combo >= 5) {
        this.comboText.style.fill = COLORS.accentLight;
        this.comboText.style.fontWeight = 'bold';
      } else {
        this.comboText.style.fill = COLORS.warning;
        this.comboText.style.fontWeight = 'normal';
      }
    }
    if (this.levelText) {
      this.levelText.text = `关卡 ${state.level} - ${level.name}`;
    }

    this.updateSatisfactionBar(state.satisfaction);
  }

  private updateSatisfactionBar(satisfaction: number): void {
    if (!this.satisfactionFill) return;

    this.satisfactionFill.clear();

    const width = 260 * (satisfaction / 100);
    let color = COLORS.success;
    if (satisfaction < 30) color = COLORS.danger;
    else if (satisfaction < 60) color = COLORS.warning;

    this.satisfactionFill.beginFill(color);
    this.satisfactionFill.drawRoundedRect(0, 0, Math.max(0, width), 30, 6);
    this.satisfactionFill.endFill();
  }

  setCurrentStep(step: StepConfig | null, dish: DishInstance | null): void {
    this.currentStep = step;
    this.currentStepElapsed = 0;

    if (step && dish) {
      this.stepType = step.type;
      this.updateStepIndicator(dish);
      this.setupStation(step, dish);
    } else {
      this.stepIndicatorContainer.removeChildren();
      this.stationContainer.removeChildren();
    }
  }

  private updateStepIndicator(dish: DishInstance): void {
    this.stepIndicatorContainer.removeChildren();
    this.stepIndicatorItems = [];

    const steps = dish.config.steps;
    const itemWidth = 120;
    const itemHeight = 50;
    const spacing = 20;
    const totalWidth = steps.length * itemWidth + (steps.length - 1) * spacing;
    const startX = (500 - totalWidth) / 2;

    steps.forEach((step, index) => {
      const item = new PIXI.Container();
      item.x = startX + index * (itemWidth + spacing);
      item.y = 0;

      const bg = new PIXI.Graphics();
      bg.name = 'bg';
      item.addChild(bg);

      const label = new PIXI.Text(step.name, {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: COLORS.text,
      });
      label.anchor.set(0.5);
      label.x = itemWidth / 2;
      label.y = itemHeight / 2;
      label.name = 'label';
      item.addChild(label);

      const indexText = new PIXI.Text((index + 1).toString(), {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: COLORS.textDark,
      });
      indexText.anchor.set(0.5);
      indexText.x = 20;
      indexText.y = itemHeight / 2;
      item.addChild(indexText);

      this.stepIndicatorItems.push(item);
      this.stepIndicatorContainer.addChild(item);
    });

    this.updateStepIndicatorStates(dish);
  }

  private updateStepIndicatorStates(dish: DishInstance): void {
    const steps = dish.config.steps;

    steps.forEach((step, index) => {
      const item = this.stepIndicatorItems[index];
      if (!item) return;

      const bg = item.getChildByName('bg') as PIXI.Graphics;
      const label = item.getChildByName('label') as PIXI.Text;

      if (!bg || !label) return;

      bg.clear();

      const itemWidth = 120;
      const itemHeight = 50;

      if (dish.stepsCompleted[index]) {
        bg.beginFill(0x1a5f1a);
        bg.lineStyle(2, COLORS.success);
        bg.drawRoundedRect(0, 0, itemWidth, itemHeight, 8);
        bg.endFill();
        label.style.fill = COLORS.success;
      } else if (index === dish.currentStepIndex) {
        bg.beginFill(0x3a2510);
        bg.lineStyle(3, COLORS.accent);
        bg.drawRoundedRect(0, 0, itemWidth, itemHeight, 8);
        bg.endFill();
        label.style.fill = COLORS.accentLight;
      } else if (index < dish.currentStepIndex) {
        bg.beginFill(0x1a3a1a);
        bg.lineStyle(2, 0x2a6a2a);
        bg.drawRoundedRect(0, 0, itemWidth, itemHeight, 8);
        bg.endFill();
        label.style.fill = 0x6a9a6a;
      } else {
        bg.beginFill(0x1a0f0a);
        bg.lineStyle(2, 0x3a2a1a);
        bg.drawRoundedRect(0, 0, itemWidth, itemHeight, 8);
        bg.endFill();
        label.style.fill = COLORS.textDark;
      }
    });
  }

  private setupStation(step: StepConfig, dish: DishInstance): void {
    this.stationContainer.removeChildren();

    const title = new PIXI.Text(`${dish.config.name} - ${step.name}`, {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fill: COLORS.text,
    });
    title.anchor.set(0.5, 0);
    title.x = this.stationWidth / 2;
    title.y = 0;
    this.stationContainer.addChild(title);

    if (step.type === 'prep') {
      this.setupPrepStation(dish);
    } else if (step.type === 'cook') {
      this.setupCookStation(step);
    } else if (step.type === 'plate') {
      this.setupPlateStation(dish);
    }
  }

  private setupPrepStation(dish: DishInstance): void {
    this.prepTarget = [...dish.config.ingredients];
    this.prepSelected = new Set();

    const hint = new PIXI.Text('点击选择正确的食材', {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: COLORS.textDark,
    });
    hint.anchor.set(0.5, 0);
    hint.x = this.stationWidth / 2;
    hint.y = 50;
    this.stationContainer.addChild(hint);

    const targetLabel = new PIXI.Text(`需要: ${this.prepTarget.map(i => i.icon + i.name).join(' ')}`, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: COLORS.warning,
    });
    targetLabel.anchor.set(0.5, 0);
    targetLabel.x = this.stationWidth / 2;
    targetLabel.y = 85;
    this.stationContainer.addChild(targetLabel);

    const allIngredients = this.shuffleArray([...dish.config.ingredients, ...this.getRandomIngredients(3)]);
    this.prepIngredients = allIngredients;

    const cols = 3;
    const itemSize = 80;
    const spacing = 20;
    const startX = (this.stationWidth - (cols * itemSize + (cols - 1) * spacing)) / 2;
    const startY = 140;

    allIngredients.forEach((ingredient, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const item = this.createIngredientItem(ingredient, itemSize);
      item.x = startX + col * (itemSize + spacing);
      item.y = startY + row * (itemSize + spacing);
      item.name = `ingredient_${index}`;
      item.eventMode = 'dynamic';
      item.cursor = 'pointer';

      this.stationContainer.addChild(item);
    });

    const selectedLabel = new PIXI.Text('已选: ', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: COLORS.text,
    });
    selectedLabel.anchor.set(0.5, 0);
    selectedLabel.x = this.stationWidth / 2;
    selectedLabel.y = 330;
    selectedLabel.name = 'selectedLabel';
    this.stationContainer.addChild(selectedLabel);
  }

  private getRandomIngredients(count: number): Ingredient[] {
    const { INGREDIENTS } = require('./config');
    const shuffled = [...INGREDIENTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private createIngredientItem(ingredient: Ingredient, size: number): PIXI.Container {
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x2a1810);
    bg.lineStyle(2, 0x4a2a1a);
    bg.drawRoundedRect(0, 0, size, size, 10);
    bg.endFill();
    bg.name = 'bg';
    container.addChild(bg);

    const icon = new PIXI.Text(ingredient.icon, {
      fontSize: 32,
    });
    icon.anchor.set(0.5, 0);
    icon.x = size / 2;
    icon.y = 8;
    container.addChild(icon);

    const name = new PIXI.Text(ingredient.name, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: COLORS.text,
    });
    name.anchor.set(0.5, 1);
    name.x = size / 2;
    name.y = size - 8;
    container.addChild(name);

    return container;
  }

  private handlePrepClick(pos: PIXI.Point): void {
    const localPos = this.stationContainer.toLocal(pos);

    for (let i = 0; i < this.prepIngredients.length; i++) {
      const item = this.stationContainer.getChildByName(`ingredient_${i}`) as PIXI.Container;
      if (!item) continue;

      const bounds = item.getBounds();
      if (localPos.x >= item.x && localPos.x <= item.x + 80 &&
          localPos.y >= item.y && localPos.y <= item.y + 80) {
        this.selectPrepIngredient(i, item);
        break;
      }
    }
  }

  private selectPrepIngredient(index: number, item: PIXI.Container): void {
    const ingredient = this.prepIngredients[index];
    if (!ingredient) return;

    this.soundManager.playClick();

    item.scale.set(0.95);
    setTimeout(() => item.scale.set(1), 100);

    if (this.prepSelected.has(ingredient.id)) {
      this.prepSelected.delete(ingredient.id);
      const bg = item.getChildByName('bg') as PIXI.Graphics;
      if (bg) {
        bg.clear();
        bg.beginFill(0x2a1810);
        bg.lineStyle(2, 0x4a2a1a);
        bg.drawRoundedRect(0, 0, 80, 80, 10);
        bg.endFill();
      }
    } else {
      this.prepSelected.add(ingredient.id);
      const bg = item.getChildByName('bg') as PIXI.Graphics;
      if (bg) {
        bg.clear();
        bg.beginFill(0x3a2a15);
        bg.lineStyle(3, COLORS.accent);
        bg.drawRoundedRect(0, 0, 80, 80, 10);
        bg.endFill();
      }
    }

    const selectedLabel = this.stationContainer.getChildByName('selectedLabel') as PIXI.Text;
    if (selectedLabel) {
      const selectedIcons = this.prepIngredients
        .filter(i => this.prepSelected.has(i.id))
        .map(i => i.icon)
        .join('');
      selectedLabel.text = `已选: ${selectedIcons || '无'}`;
    }

    if (this.prepSelected.size === this.prepTarget.length) {
      const allCorrect = this.prepTarget.every(t => this.prepSelected.has(t.id));
      if (allCorrect) {
        this.completeStep('perfect');
      }
    }
  }

  private setupCookStation(step: StepConfig): void {
    this.cookProgress = 0;
    this.cookIsHolding = false;

    const perfectStart = 0.6 + Math.random() * 0.2;
    const perfectWidth = step.perfectWindow / step.duration;
    this.cookPerfectZone = {
      start: perfectStart,
      end: Math.min(1, perfectStart + perfectWidth),
    };

    const hint = new PIXI.Text('长按控制火候，在绿色区域松开!', {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: COLORS.textDark,
    });
    hint.anchor.set(0.5, 0);
    hint.x = this.stationWidth / 2;
    hint.y = 50;
    this.stationContainer.addChild(hint);

    const barBg = new PIXI.Graphics();
    barBg.beginFill(0x333333);
    barBg.drawRoundedRect(50, 130, this.stationWidth - 100, 50, 10);
    barBg.endFill();
    barBg.name = 'barBg';
    this.stationContainer.addChild(barBg);

    const perfectZone = new PIXI.Graphics();
    perfectZone.name = 'perfectZone';
    this.stationContainer.addChild(perfectZone);

    const progress = new PIXI.Graphics();
    progress.name = 'cookProgress';
    this.stationContainer.addChild(progress);

    const indicator = new PIXI.Graphics();
    indicator.name = 'cookIndicator';
    this.stationContainer.addChild(indicator);

    const cookPot = new PIXI.Text('🍳', {
      fontSize: 64,
    });
    cookPot.anchor.set(0.5);
    cookPot.x = this.stationWidth / 2;
    cookPot.y = 260;
    cookPot.name = 'cookPot';
    this.stationContainer.addChild(cookPot);

    const pressHint = new PIXI.Text('按住进度条开始烹饪', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: COLORS.textDark,
    });
    pressHint.anchor.set(0.5, 0);
    pressHint.x = this.stationWidth / 2;
    pressHint.y = 320;
    pressHint.name = 'pressHint';
    this.stationContainer.addChild(pressHint);

    this.updateCookStation();
  }

  private updateCookStation(): void {
    const barX = 50;
    const barY = 130;
    const barWidth = this.stationWidth - 100;
    const barHeight = 50;

    const perfectZone = this.stationContainer.getChildByName('perfectZone') as PIXI.Graphics;
    if (perfectZone) {
      perfectZone.clear();
      perfectZone.beginFill(COLORS.success, 0.5);
      const px = barX + barWidth * this.cookPerfectZone.start;
      const pw = barWidth * (this.cookPerfectZone.end - this.cookPerfectZone.start);
      perfectZone.drawRoundedRect(px, barY, pw, barHeight, 5);
      perfectZone.endFill();
    }

    const progress = this.stationContainer.getChildByName('cookProgress') as PIXI.Graphics;
    if (progress) {
      progress.clear();
      progress.beginFill(COLORS.accent);
      const pw = barWidth * this.cookProgress;
      progress.drawRoundedRect(barX, barY, pw, barHeight, 10);
      progress.endFill();
    }

    const indicator = this.stationContainer.getChildByName('cookIndicator') as PIXI.Graphics;
    if (indicator) {
      indicator.clear();
      indicator.beginFill(COLORS.text);
      const ix = barX + barWidth * this.cookProgress;
      indicator.drawRect(ix - 3, barY - 5, 6, barHeight + 10);
      indicator.endFill();
    }

    const cookPot = this.stationContainer.getChildByName('cookPot') as PIXI.Text;
    if (cookPot && this.cookIsHolding) {
      cookPot.rotation = Math.sin(Date.now() / 100) * 0.1;
    }
  }

  private handleCookPointerDown(pos: PIXI.Point): void {
    const localPos = this.stationContainer.toLocal(pos);

    if (localPos.y >= 130 && localPos.y <= 180 &&
        localPos.x >= 50 && localPos.x <= this.stationWidth - 50) {
      this.cookIsHolding = true;
      const pressHint = this.stationContainer.getChildByName('pressHint') as PIXI.Text;
      if (pressHint) {
        pressHint.text = '松开完成烹炒!';
      }
    }
  }

  private handleCookPointerUp(pos: PIXI.Point): void {
    if (!this.cookIsHolding) return;

    this.cookIsHolding = false;

    const progress = this.cookProgress;
    const inPerfectZone = progress >= this.cookPerfectZone.start && progress <= this.cookPerfectZone.end;
    const inGoodZone = progress >= this.cookPerfectZone.start - 0.1 && progress <= this.cookPerfectZone.end + 0.1;

    if (inPerfectZone) {
      this.completeStep('perfect');
    } else if (inGoodZone) {
      this.completeStep('good');
    } else if (progress > 0.1 && progress < 0.95) {
      this.completeStep('ok');
    } else {
      this.completeStep('fail');
    }
  }

  private setupPlateStation(dish: DishInstance): void {
    this.plateItems = [];
    this.plateTargetPositions = [];
    this.draggingItem = null;

    const hint = new PIXI.Text('将食材拖放到盘子里!', {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: COLORS.textDark,
    });
    hint.anchor.set(0.5, 0);
    hint.x = this.stationWidth / 2;
    hint.y = 50;
    this.stationContainer.addChild(hint);

    const plate = new PIXI.Graphics();
    plate.beginFill(0xffffff);
    plate.lineStyle(4, 0xcccccc);
    plate.drawCircle(this.stationWidth / 2, 200, 100);
    plate.endFill();
    plate.name = 'plate';
    this.stationContainer.addChild(plate);

    const ingredients = [...dish.config.ingredients];
    const shuffled = this.shuffleArray(ingredients);

    shuffled.forEach((ingredient, index) => {
      const item = this.createPlateIngredient(ingredient, index);
      this.stationContainer.addChild(item);

      this.plateItems.push({
        ingredient,
        x: item.x,
        y: item.y,
        placed: false,
      });
    });

    const angleStep = (Math.PI * 2) / ingredients.length;
    ingredients.forEach((ingredient, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const radius = 60;
      this.plateTargetPositions.push({
        x: this.stationWidth / 2 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        ingredientId: ingredient.id,
      });
    });
  }

  private createPlateIngredient(ingredient: Ingredient, index: number): PIXI.Container {
    const container = new PIXI.Container();
    container.name = `plateItem_${index}`;

    const size = 60;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x2a1810);
    bg.lineStyle(2, 0x4a2a1a);
    bg.drawRoundedRect(0, 0, size, size, 10);
    bg.endFill();
    bg.name = 'bg';
    container.addChild(bg);

    const icon = new PIXI.Text(ingredient.icon, {
      fontSize: 28,
    });
    icon.anchor.set(0.5);
    icon.x = size / 2;
    icon.y = size / 2;
    container.addChild(icon);

    const total = 3;
    const spacing = 20;
    const startX = (this.stationWidth - (total * size + (total - 1) * spacing)) / 2;
    container.x = startX + (index % total) * (size + spacing);
    container.y = 330 + Math.floor(index / total) * (size + spacing);

    return container;
  }

  private handlePlatePointerDown(pos: PIXI.Point): void {
    const localPos = this.stationContainer.toLocal(pos);

    for (let i = this.plateItems.length - 1; i >= 0; i--) {
      const item = this.plateItems[i];
      if (item.placed) continue;

      const itemView = this.stationContainer.getChildByName(`plateItem_${i}`) as PIXI.Container;
      if (!itemView) continue;

      if (localPos.x >= item.x && localPos.x <= item.x + 60 &&
          localPos.y >= item.y && localPos.y <= item.y + 60) {
        this.draggingItem = {
          index: i,
          offsetX: localPos.x - item.x,
          offsetY: localPos.y - item.y,
        };
        this.stationContainer.setChildIndex(itemView, this.stationContainer.children.length - 1);
        break;
      }
    }
  }

  private handlePlatePointerMove(pos: PIXI.Point): void {
    if (!this.draggingItem) return;

    const localPos = this.stationContainer.toLocal(pos);
    const item = this.plateItems[this.draggingItem.index];
    const itemView = this.stationContainer.getChildByName(`plateItem_${this.draggingItem.index}`) as PIXI.Container;

    if (item && itemView) {
      item.x = localPos.x - this.draggingItem.offsetX;
      item.y = localPos.y - this.draggingItem.offsetY;
      itemView.x = item.x;
      itemView.y = item.y;
    }
  }

  private handlePlatePointerUp(pos: PIXI.Point): void {
    if (!this.draggingItem) return;

    const itemIndex = this.draggingItem.index;
    const item = this.plateItems[itemIndex];
    this.draggingItem = null;

    if (!item) return;

    const itemCenterX = item.x + 30;
    const itemCenterY = item.y + 30;

    const plateCenterX = this.stationWidth / 2;
    const plateCenterY = 200;
    const distToPlate = Math.sqrt(
      Math.pow(itemCenterX - plateCenterX, 2) +
      Math.pow(itemCenterY - plateCenterY, 2)
    );

    if (distToPlate < 100) {
      const target = this.plateTargetPositions.find(
        t => t.ingredientId === item.ingredient.id &&
             !this.plateItems.some((pi, idx) => pi.placed && pi.ingredient.id === t.ingredientId && idx !== itemIndex)
      );

      if (target) {
        item.x = target.x - 30;
        item.y = target.y - 30;
        item.placed = true;

        const itemView = this.stationContainer.getChildByName(`plateItem_${itemIndex}`) as PIXI.Container;
        if (itemView) {
          itemView.x = item.x;
          itemView.y = item.y;
          const bg = itemView.getChildByName('bg') as PIXI.Graphics;
          if (bg) {
            bg.clear();
            bg.beginFill(0x1a5f1a);
            bg.lineStyle(2, COLORS.success);
            bg.drawRoundedRect(0, 0, 60, 60, 10);
            bg.endFill();
          }
        }

        const allPlaced = this.plateItems.every(pi => pi.placed);
        if (allPlaced) {
          this.completeStep('perfect');
        }
      } else {
        const total = 3;
        const spacing = 20;
        const size = 60;
        const startX = (this.stationWidth - (total * size + (total - 1) * spacing)) / 2;
        item.x = startX + (itemIndex % total) * (size + spacing);
        item.y = 330 + Math.floor(itemIndex / total) * (size + spacing);

        const itemView = this.stationContainer.getChildByName(`plateItem_${itemIndex}`) as PIXI.Container;
        if (itemView) {
          itemView.x = item.x;
          itemView.y = item.y;
        }
      }
    } else {
      const total = 3;
      const spacing = 20;
      const size = 60;
      const startX = (this.stationWidth - (total * size + (total - 1) * spacing)) / 2;
      item.x = startX + (itemIndex % total) * (size + spacing);
      item.y = 330 + Math.floor(itemIndex / total) * (size + spacing);

      const itemView = this.stationContainer.getChildByName(`plateItem_${itemIndex}`) as PIXI.Container;
      if (itemView) {
        itemView.x = item.x;
        itemView.y = item.y;
      }
    }
  }

  private completeStep(quality: 'perfect' | 'good' | 'ok' | 'fail'): void {
    if (quality === 'perfect') {
      this.soundManager.playPerfect();
      this.spawnParticles(this.stationWidth / 2, 150, COLORS.accentLight, 30);
    } else if (quality === 'good') {
      this.soundManager.playSuccess();
      this.spawnParticles(this.stationWidth / 2, 150, COLORS.success, 20);
    } else if (quality === 'ok') {
      this.soundManager.playSuccess();
      this.spawnParticles(this.stationWidth / 2, 150, COLORS.warning, 15);
    } else {
      this.soundManager.playFail();
      this.triggerShake();
    }

    if (this.onStepComplete) {
      this.onStepComplete(quality);
    }
  }

  private spawnParticles(x: number, y: number, color: number, count: number): void {
    const globalX = this.stationContainer.x + x;
    const globalY = this.stationContainer.y + y;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: globalX,
        y: globalY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  private triggerShake(): void {
    this.shakeTime = 0.3;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  showLevelComplete(stats: { score: number; perfectRate: number; avgResponseTime: number; maxCombo: number }): void {
    this.showScreen('levelComplete');
    this.soundManager.playLevelUp();

    this.highScores.push(stats.score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 3);
    this.saveHighScores();

    const statValues = [
      stats.score.toString(),
      `${(stats.perfectRate * 100).toFixed(1)}%`,
      `${stats.avgResponseTime.toFixed(0)}ms`,
      stats.maxCombo.toString(),
    ];

    statValues.forEach((value, i) => {
      const stat = this.levelCompleteContainer.getChildByName(`stat_${i}`) as PIXI.Text;
      if (stat) {
        stat.text = value;
        stat.scale.set(0);
        setTimeout(() => {
          this.animateScale(stat, 1, 0.5);
        }, 300 + i * 200);
      }
    });
  }

  showGameOver(score: number): void {
    this.showScreen('gameOver');
    this.soundManager.playFail();

    const finalScore = this.gameOverContainer.getChildByName('finalScore') as PIXI.Text;
    if (finalScore) {
      finalScore.text = score.toString();
    }

    this.highScores.push(score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 3);
    this.saveHighScores();
  }

  private animateScale(target: PIXI.Text, targetScale: number, duration: number): void {
    const startTime = Date.now();
    const startScale = target.scale.x;

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      target.scale.set(startScale + (targetScale - startScale) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  update(delta: number): void {
    const deltaTime = delta * 16.67;

    this.breathePhase += deltaTime / 500;

    if (this.shakeTime > 0) {
      this.shakeTime -= deltaTime / 1000;
      const intensity = this.shakeTime * 10;
      this.shakeOffset.x = (Math.random() - 0.5) * intensity;
      this.shakeOffset.y = (Math.random() - 0.5) * intensity;
    } else {
      this.shakeOffset.x *= 0.9;
      this.shakeOffset.y *= 0.9;
    }

    this.gameContainer.x = this.shakeOffset.x;
    this.gameContainer.y = this.shakeOffset.y;

    this.updateParticles(deltaTime);

    if (this.screen === 'playing' && this.cookIsHolding && this.currentStep) {
      this.cookProgress += deltaTime / this.currentStep.duration;
      if (this.cookProgress >= 1) {
        this.cookProgress = 1;
        this.cookIsHolding = false;
        this.completeStep('fail');
      }
      this.updateCookStation();
    }

    this.updateBreatheEffect();
  }

  private updateBreatheEffect(): void {
    if (this.stepIndicatorItems.length === 0) return;

    this.stepIndicatorItems.forEach((item, index) => {
      const bg = item.getChildByName('bg') as PIXI.Graphics;
      const label = item.getChildByName('label') as PIXI.Text;
      if (!bg || !label) return;
    });
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= deltaTime / 1000;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.renderParticles();
  }

  private renderParticles(): void {
    this.particlesContainer.removeChildren();

    this.particles.forEach(p => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(p.color, p.life / p.maxLife);
      graphics.drawCircle(p.x, p.y, p.size * (p.life / p.maxLife));
      graphics.endFill();
      this.particlesContainer.addChild(graphics);
    });
  }

  resize(): void {
    // Handle resize if needed
  }

  resetForNewGame(): void {
    this.particles = [];
    this.orderViews.clear();
    this.orderListContainer.removeChildren();
    this.particlesContainer.removeChildren();
  }
}