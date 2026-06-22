import { HexGrid, HexCell } from './hexGrid';
import { Unit, Race, UnitClass, StrategyType, UnitStats } from './unit';
import { BattleSystem, BattleStats } from './battleSystem';
import { Renderer } from './renderer';

interface UnitPreset {
  name: string;
  race: Race;
  unitClass: UnitClass;
  stats: UnitStats;
}

const unitPresets: UnitPreset[] = [
  {
    name: '人类剑士',
    race: 'human',
    unitClass: 'warrior',
    stats: { maxHp: 100, attack: 15, defense: 8, speed: 5, attackRange: 1, moveRange: 3 }
  },
  {
    name: '精灵弓箭手',
    race: 'elf',
    unitClass: 'archer',
    stats: { maxHp: 70, attack: 20, defense: 3, speed: 6, attackRange: 3, moveRange: 2 }
  },
  {
    name: '兽人战士',
    race: 'orc',
    unitClass: 'warrior',
    stats: { maxHp: 120, attack: 18, defense: 6, speed: 4, attackRange: 1, moveRange: 2 }
  },
  {
    name: '人类法师',
    race: 'human',
    unitClass: 'mage',
    stats: { maxHp: 60, attack: 25, defense: 2, speed: 4, attackRange: 2, moveRange: 2 }
  },
  {
    name: '精灵德鲁伊',
    race: 'elf',
    unitClass: 'healer',
    stats: { maxHp: 80, attack: 10, defense: 4, speed: 5, attackRange: 2, moveRange: 2 }
  },
  {
    name: '兽人萨满',
    race: 'orc',
    unitClass: 'healer',
    stats: { maxHp: 90, attack: 12, defense: 5, speed: 3, attackRange: 2, moveRange: 2 }
  }
];

class Game {
  private canvas: HTMLCanvasElement;
  private hexGrid: HexGrid;
  private battleSystem: BattleSystem;
  private renderer: Renderer;
  
  private selectedPresetIndex: number | null = null;
  private selectedUnit: Unit | null = null;
  private isBattleRunning: boolean = false;
  
  private lastTime: number = 0;
  private animationId: number = 0;
  private audioContext: AudioContext | null = null;
  
  private unitCounter: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    this.hexGrid = new HexGrid(60, 10, 8);
    this.battleSystem = new BattleSystem(this.hexGrid);
    this.renderer = new Renderer(this.canvas, this.hexGrid, this.battleSystem);
    
    this.initUnitCards();
    this.initEventListeners();
    this.spawnDefaultUnits();
    this.startGameLoop();
  }

  private initUnitCards(): void {
    const container = document.getElementById('unit-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    unitPresets.forEach((preset, index) => {
      const card = document.createElement('div');
      card.className = `unit-card ${preset.race}`;
      card.dataset.index = String(index);
      
      card.innerHTML = `
        <div class="unit-card-avatar"></div>
        <div class="unit-card-name">${preset.name}</div>
        <div class="unit-card-stats">
          HP:${preset.stats.maxHp} ATK:${preset.stats.attack}
        </div>
      `;
      
      card.addEventListener('click', () => {
        if (this.isBattleRunning) return;
        this.selectPreset(index);
      });
      
      container.appendChild(card);
    });
  }

  private selectPreset(index: number): void {
    this.selectedPresetIndex = index;
    this.selectedUnit = null;
    this.renderer.setSelectedUnit(null);
    this.hideStrategyPanel();
    
    document.querySelectorAll('.unit-card').forEach((card, i) => {
      card.classList.toggle('selected', i === index);
    });
  }

  private initEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.renderer.setHoveredHex(null);
      this.renderer.setPreviewUnit(null);
    });
    
    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.playClickSound();
        this.startBattle();
      });
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.playClickSound();
        this.resetGame();
      });
    }
    
    const reportClose = document.getElementById('report-close');
    if (reportClose) {
      reportClose.addEventListener('click', () => {
        this.playClickSound();
        this.hideBattleReport();
      });
    }
    
    for (let i = 1; i <= 3; i++) {
      const select = document.getElementById(`strategy-${i}`) as HTMLSelectElement;
      if (select) {
        select.addEventListener('change', () => this.onStrategyChange());
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hex = this.hexGrid.getHexAtPoint(x, y);
    this.renderer.setHoveredHex(hex);
    
    if (this.selectedPresetIndex !== null && hex && !this.isBattleRunning) {
      const preset = unitPresets[this.selectedPresetIndex];
      const center = this.hexGrid.getHexCenter(hex.col, hex.row);
      this.renderer.setPreviewUnit({
        race: preset.race,
        x: center.x,
        y: center.y
      });
    } else {
      this.renderer.setPreviewUnit(null);
    }
  }

  private onClick(e: MouseEvent): void {
    if (this.isBattleRunning) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hex = this.hexGrid.getHexAtPoint(x, y);
    if (!hex) return;
    
    const unitsAtHex = this.battleSystem.getUnitsAt(hex.col, hex.row);
    
    if (unitsAtHex.length > 0) {
      this.selectUnit(unitsAtHex[0]);
    } else if (this.selectedPresetIndex !== null) {
      this.placeUnit(hex.col, hex.row);
    } else {
      this.selectedUnit = null;
      this.renderer.setSelectedUnit(null);
      this.hideStrategyPanel();
    }
  }

  private selectUnit(unit: Unit): void {
    this.selectedUnit = unit;
    this.renderer.setSelectedUnit(unit);
    this.selectedPresetIndex = null;
    
    document.querySelectorAll('.unit-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    this.showStrategyPanel(unit);
  }

  private placeUnit(col: number, row: number): void {
    if (this.selectedPresetIndex === null) return;
    
    const preset = unitPresets[this.selectedPresetIndex];
    this.unitCounter++;
    
    const team = col < 5 ? 'ally' : 'enemy';
    
    const unit = new Unit(
      `unit-${this.unitCounter}`,
      preset.name,
      preset.race,
      preset.unitClass,
      { ...preset.stats },
      { col, row },
      team
    );
    
    const center = this.hexGrid.getHexCenter(col, row);
    unit.setPixelPosition(center.x, center.y);
    
    unit.setStrategies(['attack_closest', 'none', 'none']);
    
    this.battleSystem.addUnit(unit);
  }

  private showStrategyPanel(unit: Unit): void {
    const panel = document.getElementById('strategy-panel');
    if (!panel) return;
    
    panel.classList.remove('hidden');
    
    const strategies = unit.getStrategies();
    for (let i = 1; i <= 3; i++) {
      const select = document.getElementById(`strategy-${i}`) as HTMLSelectElement;
      if (select) {
        select.value = strategies[i - 1] || 'none';
      }
    }
  }

  private hideStrategyPanel(): void {
    const panel = document.getElementById('strategy-panel');
    if (panel) {
      panel.classList.add('hidden');
    }
  }

  private onStrategyChange(): void {
    if (!this.selectedUnit) return;
    
    const strategies: StrategyType[] = [];
    for (let i = 1; i <= 3; i++) {
      const select = document.getElementById(`strategy-${i}`) as HTMLSelectElement;
      if (select) {
        strategies.push(select.value as StrategyType);
      }
    }
    
    this.selectedUnit.setStrategies(strategies);
    
    const firstStrategy = strategies.find(s => s !== 'none');
    if (firstStrategy) {
      this.battleSystem.addStrategyIcon(
        this.selectedUnit.getId(),
        this.selectedUnit.getPixelX(),
        this.selectedUnit.getPixelY() - 30,
        firstStrategy
      );
    }
  }

  private spawnDefaultUnits(): void {
    const defaultSetups: { col: number; row: number; presetIndex: number; team: 'ally' | 'enemy' }[] = [
      { col: 1, row: 2, presetIndex: 0, team: 'ally' },
      { col: 1, row: 4, presetIndex: 1, team: 'ally' },
      { col: 0, row: 3, presetIndex: 3, team: 'ally' },
      { col: 2, row: 3, presetIndex: 4, team: 'ally' },
      
      { col: 8, row: 2, presetIndex: 2, team: 'enemy' },
      { col: 8, row: 4, presetIndex: 1, team: 'enemy' },
      { col: 9, row: 3, presetIndex: 3, team: 'enemy' },
      { col: 7, row: 3, presetIndex: 5, team: 'enemy' }
    ];
    
    for (const setup of defaultSetups) {
      const preset = unitPresets[setup.presetIndex];
      this.unitCounter++;
      
      const unit = new Unit(
        `unit-${this.unitCounter}`,
        preset.name,
        preset.race,
        preset.unitClass,
        { ...preset.stats },
        { col: setup.col, row: setup.row },
        setup.team
      );
      
      const center = this.hexGrid.getHexCenter(setup.col, setup.row);
      unit.setPixelPosition(center.x, center.y);
      
      unit.setStrategies(['attack_closest', 'none', 'none']);
      
      this.battleSystem.addUnit(unit);
    }
  }

  private startBattle(): void {
    if (this.isBattleRunning) return;
    
    const units = this.battleSystem.getUnits();
    const allyCount = units.filter(u => u.getTeam() === 'ally' && u.getIsAlive()).length;
    const enemyCount = units.filter(u => u.getTeam() === 'enemy' && u.getIsAlive()).length;
    
    if (allyCount === 0 || enemyCount === 0) {
      return;
    }
    
    this.isBattleRunning = true;
    this.selectedUnit = null;
    this.renderer.setSelectedUnit(null);
    this.hideStrategyPanel();
    
    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) {
      startBtn.style.display = 'none';
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.style.display = 'block';
    }
    
    this.battleSystem.startBattle();
  }

  private resetGame(): void {
    this.isBattleRunning = false;
    this.battleSystem.resetBattle();
    
    const allUnits = this.battleSystem.getUnits();
    for (const unit of allUnits) {
      this.battleSystem.removeUnit(unit.getId());
    }
    
    this.selectedPresetIndex = null;
    this.selectedUnit = null;
    this.renderer.setSelectedUnit(null);
    this.hideStrategyPanel();
    this.hideBattleReport();
    
    document.querySelectorAll('.unit-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) {
      startBtn.style.display = 'block';
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.style.display = 'none';
    }
    
    this.spawnDefaultUnits();
  }

  private showBattleReport(stats: BattleStats): void {
    const report = document.getElementById('battle-report');
    if (!report) return;
    
    report.classList.remove('hidden');
    
    const allyAliveEl = document.getElementById('report-ally-alive');
    const enemyAliveEl = document.getElementById('report-enemy-alive');
    const totalDamageEl = document.getElementById('report-total-damage');
    const killStreakEl = document.getElementById('report-kill-streak');
    const mvpNameEl = document.getElementById('report-mvp-name');
    const mvpStatsEl = document.getElementById('report-mvp-stats');
    
    if (allyAliveEl) allyAliveEl.textContent = String(stats.allySurvivors);
    if (enemyAliveEl) enemyAliveEl.textContent = String(stats.enemySurvivors);
    if (totalDamageEl) totalDamageEl.textContent = String(stats.totalDamage);
    if (killStreakEl) killStreakEl.textContent = String(stats.longestKillStreak);
    
    if (stats.mvpUnit) {
      if (mvpNameEl) mvpNameEl.textContent = stats.mvpUnit.getName();
      if (mvpStatsEl) {
        mvpStatsEl.textContent = `击杀: ${stats.mvpUnit.getKillCount()} | 伤害: ${stats.mvpUnit.getDamageDealt()}`;
      }
    } else {
      if (mvpNameEl) mvpNameEl.textContent = '-';
      if (mvpStatsEl) mvpStatsEl.textContent = '-';
    }
  }

  private hideBattleReport(): void {
    const report = document.getElementById('battle-report');
    if (report) {
      report.classList.add('hidden');
    }
  }

  private playClickSound(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }

  private startGameLoop(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    const frameStart = performance.now();
    
    this.update(deltaTime);
    this.renderer.render();
    
    const frameTime = performance.now() - frameStart;
    this.renderer.setFrameTime(frameTime);
    
    if (this.isBattleRunning && this.battleSystem.getBattleState() === 'finished') {
      this.isBattleRunning = false;
      const stats = this.battleSystem.getBattleStats();
      setTimeout(() => this.showBattleReport(stats), 500);
    }
    
    this.animationId = requestAnimationFrame(this.loop);
  }

  private update(dt: number): void {
    this.battleSystem.update(dt);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
