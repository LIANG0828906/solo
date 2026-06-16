export type PlotType = 'grass' | 'tree' | 'water' | 'pavement' | 'building';

export interface BlockConfig {
  width: number;
  depth: number;
  gridSize: number;
}

export interface SimulationResult {
  avgTempChange: number;
  avgHumidityChange: number;
  avgWindChange: number;
  tempProfile: number[];
  humidityProfile: number[];
  windProfile: number[];
}

interface PlotEffect {
  temp: number;
  humidity: number;
  wind: number;
}

const PLOT_EFFECTS: Record<PlotType, PlotEffect> = {
  tree: { temp: -2.5, humidity: 4.0, wind: -0.35 },
  water: { temp: -1.5, humidity: 7.0, wind: 0.05 },
  grass: { temp: -0.8, humidity: 2.5, wind: -0.05 },
  pavement: { temp: 1.2, humidity: -1.5, wind: 0.02 },
  building: { temp: 2.0, humidity: -3.0, wind: -0.5 },
};

const PLOT_COSTS: Record<PlotType, number> = {
  tree: 500,
  water: 200,
  grass: 50,
  pavement: 0,
  building: 0,
};

export function getPlotCost(type: PlotType, areaSqm: number): number {
  if (type === 'tree') return PLOT_COSTS.tree;
  return PLOT_COSTS[type] * areaSqm;
}

export function getPlotTypeName(type: PlotType): string {
  const names: Record<PlotType, string> = {
    tree: '树木',
    water: '水体',
    grass: '草坪',
    pavement: '硬地',
    building: '建筑',
  };
  return names[type];
}

function gaussianWeight(distance: number, sigma: number): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
}

export function runSimulation(
  plots: PlotType[][],
  blockConfig: BlockConfig
): SimulationResult {
  const rows = plots.length;
  const cols = plots[0]?.length || 0;
  const cellWidth = blockConfig.width / cols;
  const cellDepth = blockConfig.depth / rows;
  const sigma = Math.max(cols, rows) * 0.25;

  const tempGrid: number[][] = [];
  const humidityGrid: number[][] = [];
  const windGrid: number[][] = [];

  for (let y = 0; y < rows; y++) {
    tempGrid[y] = [];
    humidityGrid[y] = [];
    windGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      let tempSum = 0;
      let humiditySum = 0;
      let windSum = 0;
      let weightSum = 0;

      for (let py = 0; py < rows; py++) {
        for (let px = 0; px < cols; px++) {
          const dx = (x - px) * cellWidth;
          const dy = (y - py) * cellDepth;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const weight = gaussianWeight(dist, sigma * cellWidth);
          const effect = PLOT_EFFECTS[plots[py][px]];

          tempSum += effect.temp * weight;
          humiditySum += effect.humidity * weight;
          windSum += effect.wind * weight;
          weightSum += weight;
        }
      }

      tempGrid[y][x] = tempSum / weightSum;
      humidityGrid[y][x] = humiditySum / weightSum;
      windGrid[y][x] = windSum / weightSum;
    }
  }

  const tempProfile: number[] = [];
  const humidityProfile: number[] = [];
  const windProfile: number[] = [];

  for (let x = 0; x < cols; x++) {
    let tempColSum = 0;
    let humidityColSum = 0;
    let windColSum = 0;
    for (let y = 0; y < rows; y++) {
      tempColSum += tempGrid[y][x];
      humidityColSum += humidityGrid[y][x];
      windColSum += windGrid[y][x];
    }
    tempProfile.push(Number((tempColSum / rows).toFixed(2)));
    humidityProfile.push(Number((humidityColSum / rows).toFixed(2)));
    windProfile.push(Number((windColSum / rows).toFixed(3)));
  }

  let totalTemp = 0;
  let totalHumidity = 0;
  let totalWind = 0;
  const totalCells = rows * cols;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      totalTemp += tempGrid[y][x];
      totalHumidity += humidityGrid[y][x];
      totalWind += windGrid[y][x];
    }
  }

  return {
    avgTempChange: Number((totalTemp / totalCells).toFixed(1)),
    avgHumidityChange: Number((totalHumidity / totalCells).toFixed(1)),
    avgWindChange: Number((totalWind / totalCells).toFixed(2)),
    tempProfile,
    humidityProfile,
    windProfile,
  };
}

export function generatePresetLayout(
  presetId: string,
  cols: number,
  rows: number
): PlotType[][] {
  const layout: PlotType[][] = [];

  for (let y = 0; y < rows; y++) {
    layout[y] = [];
    for (let x = 0; x < cols; x++) {
      layout[y][x] = 'pavement';
    }
  }

  switch (presetId) {
    case 'dense-forest': {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const rand = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const val = rand - Math.floor(rand);
          if (val < 0.7) {
            layout[y][x] = 'tree';
          } else if (val < 0.85) {
            layout[y][x] = 'grass';
          } else {
            layout[y][x] = 'pavement';
          }
        }
      }
      break;
    }
    case 'mixed-greenbelt': {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (y < rows * 0.3) {
            layout[y][x] = 'tree';
          } else if (y < rows * 0.5) {
            layout[y][x] = 'grass';
          } else if (y < rows * 0.7) {
            layout[y][x] = 'water';
          } else if (y < rows * 0.85) {
            layout[y][x] = 'grass';
          } else {
            layout[y][x] = 'tree';
          }
        }
      }
      for (let i = 0; i < Math.floor(cols / 4); i++) {
        const px = Math.floor((i + 0.5) * (cols / (cols / 4)));
        for (let y = 0; y < rows; y++) {
          if (px >= 0 && px < cols) {
            layout[y][px] = 'pavement';
          }
        }
      }
      break;
    }
    case 'eco-plaza': {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          layout[y][x] = 'pavement';
        }
      }
      const treePoolSize = Math.max(1, Math.floor(Math.min(cols, rows) / 6));
      const positions = [
        [0.15, 0.2],
        [0.85, 0.2],
        [0.15, 0.8],
        [0.85, 0.8],
        [0.5, 0.5],
      ];
      for (const [rx, ry] of positions) {
        const cx = Math.floor(rx * cols);
        const cy = Math.floor(ry * rows);
        for (let dy = -treePoolSize; dy <= treePoolSize; dy++) {
          for (let dx = -treePoolSize; dx <= treePoolSize; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              if (dx === 0 && dy === 0) {
                layout[ny][nx] = 'tree';
              } else if (Math.abs(dx) + Math.abs(dy) <= treePoolSize) {
                layout[ny][nx] = 'grass';
              }
            }
          }
        }
      }
      const waterX = Math.floor(cols * 0.3);
      const waterY = Math.floor(rows * 0.65);
      const waterW = Math.floor(cols * 0.15);
      const waterH = Math.floor(rows * 0.12);
      for (let dy = -waterH; dy <= waterH; dy++) {
        for (let dx = -waterW; dx <= waterW; dx++) {
          const nx = waterX + dx;
          const ny = waterY + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const dist = Math.sqrt(
              (dx / waterW) ** 2 + (dy / waterH) ** 2
            );
            if (dist <= 1) {
              layout[ny][nx] = 'water';
            }
          }
        }
      }
      break;
    }
  }

  return layout;
}
