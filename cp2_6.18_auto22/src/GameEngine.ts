import { SimpleEventEmitter, LevelConfig, PlacedBlock, BlockPosition } from './types';

const GRID_SIZE = 10;
const MAX_HEIGHT = 5;
const LOOP_DURATION = 60;

export class GameEngine extends SimpleEventEmitter {
  private grid: number[][][] = [];
  private initialGrid: number[][][] = [];
  private blueprint: number[][][] = [];
  private currentLevelId = 1;
  private levels: LevelConfig[] = [];
  private loopTime = LOOP_DURATION;
  private loopTimerId: number | null = null;
  private loopResetting = false;
  private playerPos: BlockPosition = { x: 0, y: 0, z: 0 };
  private audioContext: AudioContext | null = null;
  private gridUpdatePending = false;
  private lastGridUpdateTime = 0;
  private readonly GRID_UPDATE_THROTTLE = 50;

  constructor() {
    super();
    this.initLevels();
    this.initAudio();
  }

  private initLevels(): void {
    this.levels = [
      {
        id: 1,
        name: '初入门庭',
        description: '平坦地面，终点在5x5处，需搭3级台阶',
        startPos: { x: 0, y: 1, z: 0 },
        endPos: { x: 5, y: 1, z: 5 },
        terrain: this.createFlatTerrain(),
        obstacles: [],
        hint: '从起点(0,0)到终点(5,5)，用方块堆3级台阶上到终点。'
      },
      {
        id: 2,
        name: '跨越阻隔',
        description: '3个高2单位的柱子阻挡，需搭桥跨越',
        startPos: { x: 0, y: 1, z: 4 },
        endPos: { x: 9, y: 1, z: 4 },
        terrain: this.createFlatTerrain(),
        obstacles: [
          { x: 3, y: 1, z: 4 }, { x: 3, y: 2, z: 4 },
          { x: 5, y: 1, z: 4 }, { x: 5, y: 2, z: 4 },
          { x: 7, y: 1, z: 4 }, { x: 7, y: 2, z: 4 }
        ],
        hint: '柱子高2格，从上方搭桥过去。'
      },
      {
        id: 3,
        name: '深渊之桥',
        description: '地面有3x3深坑，需搭建完整的路径',
        startPos: { x: 0, y: 1, z: 4 },
        endPos: { x: 9, y: 1, z: 4 },
        terrain: this.createPitTerrain(),
        obstacles: [],
        hint: '中间3x3区域是深坑，需要用方块填满或搭桥跨越。'
      },
      {
        id: 4,
        name: '高台挑战',
        description: '终点在高4单位的平台上，下方有移动障碍',
        startPos: { x: 0, y: 1, z: 0 },
        endPos: { x: 8, y: 5, z: 8 },
        terrain: this.createHighPlatformTerrain(),
        obstacles: [],
        movingObstacles: [
          { x: 4, z: 4, minY: 1, maxY: 3 },
          { x: 6, z: 6, minY: 1, maxY: 4 }
        ],
        hint: '终点在高台，沿途的移动障碍方块会上下移动，注意时机。'
      },
      {
        id: 5,
        name: '随机试炼',
        description: '随机障碍和地形，通关条件为抵达随机标记终点',
        startPos: { x: 0, y: 1, z: 0 },
        endPos: { x: 9, y: 1, z: 9 },
        terrain: this.createRandomTerrain(),
        obstacles: this.createRandomObstacles(),
        hint: '关卡随机生成，自由探索到达终点。'
      }
    ];
  }

  private createFlatTerrain(): number[][] {
    const t: number[][] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      t[x] = [];
      for (let z = 0; z < GRID_SIZE; z++) {
        t[x][z] = 0;
      }
    }
    return t;
  }

  private createPitTerrain(): number[][] {
    const t = this.createFlatTerrain();
    for (let x = 3; x <= 5; x++) {
      for (let z = 3; z <= 5; z++) {
        t[x][z] = -1;
      }
    }
    return t;
  }

  private createHighPlatformTerrain(): number[][] {
    const t = this.createFlatTerrain();
    for (let x = 7; x <= 9; x++) {
      for (let z = 7; z <= 9; z++) {
        t[x][z] = 4;
      }
    }
    return t;
  }

  private createRandomTerrain(): number[][] {
    const t = this.createFlatTerrain();
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const z = Math.floor(Math.random() * GRID_SIZE);
      if ((x === 0 && z === 0) || (x === 9 && z === 9)) continue;
      t[x][z] = Math.floor(Math.random() * 3);
    }
    return t;
  }

  private createRandomObstacles(): BlockPosition[] {
    const obstacles: BlockPosition[] = [];
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const z = Math.floor(Math.random() * GRID_SIZE);
      if ((x === 0 && z === 0) || (x === 9 && z === 9)) continue;
      const h = 1 + Math.floor(Math.random() * 2);
      for (let y = 1; y <= h; y++) {
        obstacles.push({ x, y, z });
      }
    }
    return obstacles;
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private playSound(frequency: number, type: OscillatorType, duration: number): void {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  private buildGridFromLevel(level: LevelConfig): number[][][] {
    const g: number[][][] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      g[x] = [];
      for (let z = 0; z < GRID_SIZE; z++) {
        g[x][z] = [];
        const base = Math.max(0, level.terrain[x][z]);
        for (let y = 0; y <= MAX_HEIGHT; y++) {
          if (y <= base) {
            g[x][z][y] = 1;
          } else {
            g[x][z][y] = 0;
          }
        }
      }
    }
    level.obstacles.forEach((obs) => {
      if (this.validPos(obs.x, obs.y, obs.z)) {
        g[obs.x][obs.z][obs.y] = 2;
      }
    });
    return g;
  }

  private validPos(x: number, y: number, z: number): boolean {
    return x >= 0 && x < GRID_SIZE && z >= 0 && z < GRID_SIZE && y >= 0 && y <= MAX_HEIGHT;
  }

  startLevel(levelId: number): void {
    const level = this.levels.find((l) => l.id === levelId);
    if (!level) return;
    this.currentLevelId = levelId;
    this.stopLoopTimer();
    this.initialGrid = this.buildGridFromLevel(level);
    this.grid = JSON.parse(JSON.stringify(this.initialGrid));
    this.blueprint = this.createEmptyGrid();
    this.playerPos = { ...level.startPos };
    this.loopTime = LOOP_DURATION;
    this.loopResetting = false;
    this.throttledGridEmit();
    this.emit('level:start', { level, grid: this.cloneGrid(this.grid) });
    this.emit('loop:tick', { time: this.loopTime, total: LOOP_DURATION });
    this.startLoopTimer();
  }

  private createEmptyGrid(): number[][][] {
    const g: number[][][] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      g[x] = [];
      for (let z = 0; z < GRID_SIZE; z++) {
        g[x][z] = [];
        for (let y = 0; y <= MAX_HEIGHT; y++) {
          g[x][z][y] = 0;
        }
      }
    }
    return g;
  }

  private cloneGrid(g: number[][][]): number[][][] {
    return JSON.parse(JSON.stringify(g));
  }

  private startLoopTimer(): void {
    this.stopLoopTimer();
    let lastTick = performance.now();
    const tick = () => {
      const now = performance.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;
      if (!this.loopResetting) {
        this.loopTime -= delta;
        if (this.loopTime <= 0) {
          this.loopTime = 0;
          this.emit('loop:tick', { time: this.loopTime, total: LOOP_DURATION });
          this.resetLoop();
          return;
        }
        this.emit('loop:tick', { time: this.loopTime, total: LOOP_DURATION });
      }
      this.loopTimerId = window.setTimeout(tick, 50);
    };
    this.loopTimerId = window.setTimeout(tick, 50);
  }

  private stopLoopTimer(): void {
    if (this.loopTimerId !== null) {
      clearTimeout(this.loopTimerId);
      this.loopTimerId = null;
    }
  }

  private recordBlueprint(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        for (let y = 0; y <= MAX_HEIGHT; y++) {
          const initial = this.initialGrid[x][z][y];
          const current = this.grid[x][z][y];
          if (current === 1 && initial === 0) {
            this.blueprint[x][z][y] = 1;
          } else if (current === 0 && initial >= 1) {
            this.blueprint[x][z][y] = -1;
          }
        }
      }
    }
    this.emit('blueprint:updated', { blueprint: this.cloneGrid(this.blueprint) });
  }

  private resetLoop(): void {
    if (this.loopResetting) return;
    this.loopResetting = true;
    this.recordBlueprint();
    this.emit('loop:reset', { blueprint: this.cloneGrid(this.blueprint) });
    setTimeout(() => {
      this.grid = JSON.parse(JSON.stringify(this.initialGrid));
      const level = this.getCurrentLevel();
      if (level) this.playerPos = { ...level.startPos };
      this.loopTime = LOOP_DURATION;
      this.loopResetting = false;
      this.throttledGridEmit();
      this.emit('loop:tick', { time: this.loopTime, total: LOOP_DURATION });
    }, 1000);
  }

  private throttledGridEmit(): void {
    const now = performance.now();
    if (this.gridUpdatePending) return;
    if (now - this.lastGridUpdateTime < this.GRID_UPDATE_THROTTLE) {
      this.gridUpdatePending = true;
      setTimeout(() => {
        this.gridUpdatePending = false;
        this.lastGridUpdateTime = performance.now();
        this.emit('state:changed', { grid: this.cloneGrid(this.grid) });
      }, this.GRID_UPDATE_THROTTLE - (now - this.lastGridUpdateTime));
    } else {
      this.lastGridUpdateTime = now;
      this.emit('state:changed', { grid: this.cloneGrid(this.grid) });
    }
  }

  placeBlock(x: number, z: number): { success: boolean; pos?: BlockPosition } {
    if (!this.validPos(x, 0, z)) return { success: false };
    const level = this.getCurrentLevel();
    if (level && level.terrain[x][z] < 0) return { success: false };
    let topY = 0;
    for (let y = MAX_HEIGHT; y >= 0; y--) {
      if (this.grid[x][z][y] > 0) {
        topY = y;
        break;
      }
    }
    const placeY = topY + 1;
    if (placeY > MAX_HEIGHT) return { success: false };
    if (this.initialGrid[x][z][placeY] >= 1) return { success: false };
    this.grid[x][z][placeY] = 1;
    this.playSound(200, 'sine', 0.1);
    this.throttledGridEmit();
    this.emit('block:placed', { x, y: placeY, z });
    return { success: true, pos: { x, y: placeY, z } };
  }

  removeBlock(x: number, z: number): { success: boolean; pos?: BlockPosition } {
    if (!this.validPos(x, 0, z)) return { success: false };
    let topY = 0;
    for (let y = MAX_HEIGHT; y >= 0; y--) {
      if (this.grid[x][z][y] > 0) {
        topY = y;
        break;
      }
    }
    if (topY <= 0) return { success: false };
    if (this.initialGrid[x][z][topY] >= 1) return { success: false };
    this.grid[x][z][topY] = 0;
    this.playSound(150, 'triangle', 0.1);
    this.throttledGridEmit();
    this.emit('block:removed', { x, y: topY, z });
    return { success: true, pos: { x, y: topY, z } };
  }

  movePlayer(x: number, z: number): boolean {
    if (!this.validPos(x, 0, z)) return false;
    const level = this.getCurrentLevel();
    if (level && level.terrain[x][z] < 0) return false;
    let topY = 0;
    for (let y = MAX_HEIGHT; y >= 0; y--) {
      if (this.grid[x][z][y] > 0) {
        topY = y;
        break;
      }
    }
    this.playerPos = { x, y: topY + 1, z };
    if (level && this.playerPos.x === level.endPos.x && this.playerPos.z === level.endPos.z && Math.abs(this.playerPos.y - level.endPos.y) <= 1) {
      this.completeLevel();
    }
    return true;
  }

  private completeLevel(): void {
    this.stopLoopTimer();
    const level = this.getCurrentLevel();
    this.emit('level:complete', { level, endPos: level?.endPos });
  }

  nextLevel(): void {
    if (this.currentLevelId < this.levels.length) {
      this.startLevel(this.currentLevelId + 1);
    }
  }

  getCurrentLevel(): LevelConfig | undefined {
    return this.levels.find((l) => l.id === this.currentLevelId);
  }

  getLevels(): LevelConfig[] {
    return this.levels;
  }

  getCurrentLevelId(): number {
    return this.currentLevelId;
  }

  getBlueprint(): number[][][] {
    return this.cloneGrid(this.blueprint);
  }

  getGrid(): number[][][] {
    return this.cloneGrid(this.grid);
  }

  getPlayerPos(): BlockPosition {
    return { ...this.playerPos };
  }

  getLoopTime(): number {
    return this.loopTime;
  }

  getGridSize(): number {
    return GRID_SIZE;
  }

  getMaxHeight(): number {
    return MAX_HEIGHT;
  }

  getLoopDuration(): number {
    return LOOP_DURATION;
  }

  isResetting(): boolean {
    return this.loopResetting;
  }

  destroy(): void {
    this.stopLoopTimer();
  }
}
