import { Level, Baffle, GAME_CONFIG, COLORS } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'gravity_maze_levels';

function createDefaultLevels(): Level[] {
  const walls: Baffle[] = [
    { id: 'wall-top', x: 0, y: 0, length: GAME_CONFIG.CANVAS_WIDTH, width: 20, orientation: 'horizontal', color: COLORS.WALL_STROKE, isWall: true },
    { id: 'wall-bottom', x: 0, y: GAME_CONFIG.CANVAS_HEIGHT - 20, length: GAME_CONFIG.CANVAS_WIDTH, width: 20, orientation: 'horizontal', color: COLORS.WALL_STROKE, isWall: true },
    { id: 'wall-left', x: 0, y: 0, length: GAME_CONFIG.CANVAS_HEIGHT, width: 20, orientation: 'vertical', color: COLORS.WALL_STROKE, isWall: true },
    { id: 'wall-right', x: GAME_CONFIG.CANVAS_WIDTH - 20, y: 0, length: GAME_CONFIG.CANVAS_HEIGHT, width: 20, orientation: 'vertical', color: COLORS.WALL_STROKE, isWall: true },
  ];

  const levels: Level[] = [
    {
      id: uuidv4(),
      name: '第1关',
      ballStart: { x: 100, y: 80 },
      hole: { x: 800, y: 520, radius: GAME_CONFIG.HOLE_RADIUS },
      walls: [...walls],
      baffles: [
        { id: uuidv4(), x: 200, y: 200, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
        { id: uuidv4(), x: 500, y: 350, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
      ],
    },
    {
      id: uuidv4(),
      name: '第2关',
      ballStart: { x: 450, y: 60 },
      hole: { x: 450, y: 540, radius: GAME_CONFIG.HOLE_RADIUS },
      walls: [
        ...walls,
        { id: 'wall-mid-h', x: 200, y: 300, length: 200, width: 15, orientation: 'horizontal', color: COLORS.WALL_STROKE, isWall: true },
      ],
      baffles: [
        { id: uuidv4(), x: 600, y: 250, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'vertical', color: COLORS.BAFFLE_VERTICAL },
      ],
    },
    {
      id: uuidv4(),
      name: '第3关',
      ballStart: { x: 60, y: 80 },
      hole: { x: 840, y: 80, radius: GAME_CONFIG.HOLE_RADIUS },
      walls: [...walls],
      baffles: [
        { id: uuidv4(), x: 150, y: 200, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
        { id: uuidv4(), x: 400, y: 400, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
        { id: uuidv4(), x: 700, y: 200, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
      ],
    },
    {
      id: uuidv4(),
      name: '第4关',
      ballStart: { x: 80, y: 60 },
      hole: { x: 820, y: 540, radius: GAME_CONFIG.HOLE_RADIUS },
      walls: [
        ...walls,
        { id: 'wall-obs1', x: 300, y: 150, length: 15, width: 200, orientation: 'vertical', color: COLORS.WALL_STROKE, isWall: true },
        { id: 'wall-obs2', x: 600, y: 250, length: 15, width: 250, orientation: 'vertical', color: COLORS.WALL_STROKE, isWall: true },
      ],
      baffles: [
        { id: uuidv4(), x: 150, y: 300, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
        { id: uuidv4(), x: 450, y: 450, length: GAME_CONFIG.BAFFLE_LENGTH, width: GAME_CONFIG.BAFFLE_WIDTH, orientation: 'horizontal', color: COLORS.BAFFLE_HORIZONTAL },
      ],
    },
    {
      id: uuidv4(),
      name: '第5关',
      ballStart: { x: 450, y: 50 },
      hole: { x: 450, y: 550, radius: GAME_CONFIG.HOLE_RADIUS },
      walls: [
        ...walls,
        { id: 'wall-pillar-l', x: 250, y: 200, length: 15, width: 200, orientation: 'vertical', color: COLORS.WALL_STROKE, isWall: true },
        { id: 'wall-pillar-r', x: 635, y: 200, length: 15, width: 200, orientation: 'vertical', color: COLORS.WALL_STROKE, isWall: true },
        { id: 'wall-platform', x: 350, y: 400, length: 200, width: 15, orientation: 'horizontal', color: COLORS.WALL_STROKE, isWall: true },
      ],
      baffles: [],
    },
  ];

  return levels;
}

export class LevelStore {
  private levels: Level[] = [];
  private currentLevelIndex: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.levels) && data.levels.length > 0) {
          this.levels = data.levels;
          this.currentLevelIndex = data.currentLevelIndex ?? 0;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load levels from localStorage:', e);
    }
    this.levels = createDefaultLevels();
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        levels: this.levels,
        currentLevelIndex: this.currentLevelIndex,
      }));
    } catch (e) {
      console.warn('Failed to save levels to localStorage:', e);
    }
  }

  getLevels(): Level[] {
    return this.levels;
  }

  getCurrentLevel(): Level {
    return this.levels[this.currentLevelIndex];
  }

  getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  setCurrentLevelIndex(index: number): void {
    if (index >= 0 && index < this.levels.length) {
      this.currentLevelIndex = index;
      this.saveToStorage();
    }
  }

  updateBaffles(baffles: Baffle[]): void {
    this.levels[this.currentLevelIndex].baffles = baffles;
    this.saveToStorage();
  }

  updateBestScore(time: number, bounces: number): void {
    const level = this.levels[this.currentLevelIndex];
    let updated = false;
    
    if (level.bestTime === undefined || time < level.bestTime) {
      level.bestTime = time;
      updated = true;
    }
    if (level.bestBounces === undefined || bounces < level.bestBounces) {
      level.bestBounces = bounces;
      updated = true;
    }
    
    if (updated) {
      this.saveToStorage();
    }
  }

  saveCurrentLevel(): void {
    this.saveToStorage();
  }

  resetLevel(): void {
    const defaultLevels = createDefaultLevels();
    const currentLevel = this.levels[this.currentLevelIndex];
    const defaultLevel = defaultLevels[this.currentLevelIndex];
    
    if (defaultLevel) {
      currentLevel.ballStart = { ...defaultLevel.ballStart };
      currentLevel.hole = { ...defaultLevel.hole };
      currentLevel.walls = defaultLevel.walls.map(w => ({ ...w, id: uuidv4() }));
      currentLevel.baffles = defaultLevel.baffles.map(b => ({ ...b, id: uuidv4() }));
      this.saveToStorage();
    }
  }

  goToNextLevel(): boolean {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  hasNextLevel(): boolean {
    return this.currentLevelIndex < this.levels.length - 1;
  }
}

export const levelStore = new LevelStore();
