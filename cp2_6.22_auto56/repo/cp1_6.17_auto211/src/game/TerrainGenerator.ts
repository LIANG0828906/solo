import { useGameStore } from '../state/StateManager';
import type { TerrainData, TerrainCell, Cave } from '../types';
import { FractalNoise, randomRange } from '../utils/noise';

const GRID_SIZE = 19;
const CELL_SIZE = 42;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_HEIGHT = 30;
const MAX_HEIGHT = 120;
const MIN_CAVE_RADIUS = 40;
const MAX_CAVE_RADIUS = 60;

export class TerrainGenerator {
  private noise: FractalNoise;
  private frameCount: number = 0;

  constructor() {
    this.noise = new FractalNoise(Math.random() * 10000);
  }

  generate(noiseFrequencyMultiplier: number = 1): TerrainData {
    const grid: TerrainCell[][] = [];
    const baseFrequency = 0.08 * noiseFrequencyMultiplier;

    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const noiseVal = this.noise.fractalNoise(
          x * baseFrequency,
          y * baseFrequency,
          4,
          0.5,
          2.0
        );
        const normalizedNoise = (noiseVal + 1) / 2;
        const height = MIN_HEIGHT + normalizedNoise * (MAX_HEIGHT - MIN_HEIGHT);
        const isWall = normalizedNoise < 0.25 || normalizedNoise > 0.8;

        grid[y][x] = {
          height,
          isWall,
        };
      }
    }

    const caves: Cave[] = this.generateCaves();

    return {
      grid,
      gridSize: GRID_SIZE,
      cellSize: CELL_SIZE,
      caves,
      noiseFrequency: baseFrequency,
    };
  }

  private generateCaves(): Cave[] {
    const caves: Cave[] = [];
    const numCaves = 2 + Math.floor(Math.random() * 3);
    const edgeMargin = 60;

    for (let i = 0; i < numCaves; i++) {
      const edge = Math.floor(Math.random() * 4);
      let x: number, y: number;

      switch (edge) {
        case 0:
          x = randomRange(edgeMargin, CANVAS_WIDTH - edgeMargin);
          y = edgeMargin;
          break;
        case 1:
          x = CANVAS_WIDTH - edgeMargin;
          y = randomRange(edgeMargin, CANVAS_HEIGHT - edgeMargin);
          break;
        case 2:
          x = randomRange(edgeMargin, CANVAS_WIDTH - edgeMargin);
          y = CANVAS_HEIGHT - edgeMargin;
          break;
        default:
          x = edgeMargin;
          y = randomRange(edgeMargin, CANVAS_HEIGHT - edgeMargin);
      }

      caves.push({
        position: { x, y },
        radius: randomRange(MIN_CAVE_RADIUS, MAX_CAVE_RADIUS),
      });
    }

    return caves;
  }

  regenerateTerrain() {
    const store = useGameStore.getState();
    const difficultyLevel = store.game.difficultyLevel;
    const noiseFrequencyMultiplier = 1 + difficultyLevel * 0.2;
    const newTerrain = this.generate(noiseFrequencyMultiplier);
    store.setTerrain(newTerrain);
    this.noise = new FractalNoise(Math.random() * 10000);
  }

  update(deltaTime: number) {
    this.frameCount++;
    if (this.frameCount % 2 !== 0) return;

    const store = useGameStore.getState();
    const player = store.player;
    const terrain = store.terrain;

    if (!terrain) return;

    for (const cave of terrain.caves) {
      const dx = player.position.x - cave.position.x;
      const dy = player.position.y - cave.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < cave.radius * 0.3) {
        this.regenerateTerrain();
        store.setPlayerPosition({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
        store.emit('terrainChanged');
        break;
      }
    }
  }

  static getGridSize(): number {
    return GRID_SIZE;
  }

  static getCellSize(): number {
    return CELL_SIZE;
  }
}
