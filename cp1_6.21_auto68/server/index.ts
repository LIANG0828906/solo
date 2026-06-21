import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

export type CropType = 'carrot' | 'tomato' | 'pumpkin';
export type GrowthStage = 'seed' | 'sprout' | 'mature';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy';
export type EventType = 'pest' | 'drought' | 'blessing';

export interface CropConfig {
  name: string;
  seedPrice: number;
  harvestReward: number;
  growthTime: number;
  color: string;
  icon: string;
}

export interface PlotData {
  id: number;
  crop: CropType | null;
  stage: GrowthStage;
  growthProgress: number;
  plantedAt: number | null;
  hasPest: boolean;
  pestStartTime: number | null;
  growthPaused: boolean;
  pauseStartTime: number | null;
  yieldMultiplier: number;
  plantingAnimation: boolean;
}

export interface GameState {
  gold: number;
  plots: PlotData[];
  weather: WeatherType;
  weatherStartTime: number;
  gameStartTime: number;
  stats: {
    totalPlanted: number;
    totalHarvestGold: number;
    totalEvents: number;
  };
}

export const CROP_CONFIGS: Record<CropType, CropConfig> = {
  carrot: {
    name: '胡萝卜',
    seedPrice: 2,
    harvestReward: 4,
    growthTime: 30,
    color: '#ff7043',
    icon: '🥕',
  },
  tomato: {
    name: '番茄',
    seedPrice: 3,
    harvestReward: 7,
    growthTime: 45,
    color: '#e53935',
    icon: '🍅',
  },
  pumpkin: {
    name: '南瓜',
    seedPrice: 5,
    harvestReward: 12,
    growthTime: 60,
    color: '#fb8c00',
    icon: '🎃',
  },
};

const GRID_SIZE = 6;

function createInitialState(): GameState {
  const plots: PlotData[] = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    plots.push({
      id: i,
      crop: null,
      stage: 'seed',
      growthProgress: 0,
      plantedAt: null,
      hasPest: false,
      pestStartTime: null,
      growthPaused: false,
      pauseStartTime: null,
      yieldMultiplier: 1,
      plantingAnimation: false,
    });
  }
  return {
    gold: 10,
    plots,
    weather: 'sunny',
    weatherStartTime: Date.now(),
    gameStartTime: Date.now(),
    stats: {
      totalPlanted: 0,
      totalHarvestGold: 0,
      totalEvents: 0,
    },
  };
}

let gameState: GameState = createInitialState();

function updateGrowth(): void {
  const now = Date.now();
  const { plots, weather } = gameState;

  plots.forEach((plot) => {
    if (!plot.crop || plot.stage === 'mature') return;

    if (plot.growthPaused) {
      if (plot.pauseStartTime && now - plot.pauseStartTime > 5000) {
        plot.growthPaused = false;
        plot.pauseStartTime = null;
      }
      return;
    }

    if (plot.hasPest) {
      return;
    }

    if (weather === 'rainy') {
      return;
    }

    const config = CROP_CONFIGS[plot.crop];
    if (plot.plantedAt) {
      const elapsed = (now - plot.plantedAt) / 1000;
      const stageTime = config.growthTime / 3;
      const progress = (elapsed % stageTime) / stageTime;
      const currentStageIndex = Math.min(2, Math.floor(elapsed / stageTime));

      plot.growthProgress = progress;

      if (currentStageIndex === 0) {
        plot.stage = 'seed';
      } else if (currentStageIndex === 1) {
        plot.stage = 'sprout';
      } else if (currentStageIndex >= 2) {
        plot.stage = 'mature';
        plot.growthProgress = 1;
      }
    }
  });
}

function updatePestState(): void {
  const now = Date.now();
  const { plots } = gameState;

  plots.forEach((plot) => {
    if (plot.hasPest && plot.pestStartTime) {
      if (now - plot.pestStartTime > 15000) {
        plot.hasPest = false;
        plot.pestStartTime = null;
        plot.yieldMultiplier = 0.5;
      }
    }
  });
}

function updateWeather(): void {
  const now = Date.now();
  const { weatherStartTime } = gameState;

  if (now - weatherStartTime > 120000) {
    const weathers: WeatherType[] = ['sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'rainy'];
    const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
    gameState.weather = newWeather;
    gameState.weatherStartTime = now;

    if (newWeather === 'rainy') {
      gameState.plots.forEach((plot) => {
        if (plot.crop && plot.stage !== 'mature') {
          plot.growthPaused = true;
          plot.pauseStartTime = now;
        }
      });
    }
  }
}

setInterval(() => {
  updateGrowth();
  updatePestState();
  updateWeather();
}, 1000);

setInterval(() => {
  if (Math.random() < 0.3) {
    triggerRandomEvent();
  }
}, 60000);

function triggerRandomEvent(): void {
  const events: EventType[] = ['pest', 'drought', 'blessing'];
  const event = events[Math.floor(Math.random() * events.length)];
  applyEvent(event);
}

function applyEvent(eventType: EventType): void {
  const now = Date.now();
  gameState.stats.totalEvents++;

  switch (eventType) {
    case 'pest': {
      const plantedPlots = gameState.plots.filter((p) => p.crop && p.stage !== 'mature' && !p.hasPest);
      const count = Math.min(Math.floor(Math.random() * 3) + 1, plantedPlots.length);
      const shuffled = plantedPlots.sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        shuffled[i].hasPest = true;
        shuffled[i].pestStartTime = now;
      }
      break;
    }
    case 'drought': {
      gameState.plots.forEach((plot) => {
        if (plot.crop && plot.stage !== 'mature') {
          plot.growthPaused = true;
          plot.pauseStartTime = now;
        }
      });
      break;
    }
    case 'blessing': {
      gameState.plots.forEach((plot) => {
        if (plot.crop && plot.stage !== 'mature' && plot.plantedAt) {
          plot.plantedAt -= 10000;
        }
      });
      break;
    }
  }
}

app.get('/api/farm', (_req, res) => {
  updateGrowth();
  res.json({
    gold: gameState.gold,
    plots: gameState.plots,
    weather: gameState.weather,
    stats: gameState.stats,
    gameTime: Math.floor((Date.now() - gameState.gameStartTime) / 1000),
  });
});

app.post('/api/farm/plant', (req, res) => {
  const { plotId, cropType }: { plotId: number; cropType: CropType } = req.body;
  const plot = gameState.plots[plotId];

  if (!plot || plot.crop) {
    return res.status(400).json({ error: '无法在此地块种植' });
  }

  const config = CROP_CONFIGS[cropType];
  if (!config) {
    return res.status(400).json({ error: '无效的作物类型' });
  }

  if (gameState.gold < config.seedPrice) {
    return res.status(400).json({ error: '金币不足' });
  }

  gameState.gold -= config.seedPrice;
  plot.crop = cropType;
  plot.stage = 'seed';
  plot.growthProgress = 0;
  plot.plantedAt = Date.now();
  plot.hasPest = false;
  plot.pestStartTime = null;
  plot.growthPaused = false;
  plot.pauseStartTime = null;
  plot.yieldMultiplier = 1;
  plot.plantingAnimation = true;
  gameState.stats.totalPlanted++;

  setTimeout(() => {
    plot.plantingAnimation = false;
  }, 500);

  res.json({ success: true, gold: gameState.gold, plot });
});

app.post('/api/farm/harvest', (req, res) => {
  const { plotId }: { plotId: number } = req.body;
  const plot = gameState.plots[plotId];

  if (!plot || !plot.crop || plot.stage !== 'mature') {
    return res.status(400).json({ error: '该作物尚未成熟' });
  }

  const config = CROP_CONFIGS[plot.crop];
  const reward = Math.floor(config.harvestReward * plot.yieldMultiplier);
  gameState.gold += reward;
  gameState.stats.totalHarvestGold += reward;

  plot.crop = null;
  plot.stage = 'seed';
  plot.growthProgress = 0;
  plot.plantedAt = null;
  plot.hasPest = false;
  plot.pestStartTime = null;
  plot.growthPaused = false;
  plot.pauseStartTime = null;
  plot.yieldMultiplier = 1;

  res.json({ success: true, gold: gameState.gold, reward, plot });
});

app.post('/api/farm/kill-pest', (req, res) => {
  const { plotId }: { plotId: number } = req.body;
  const plot = gameState.plots[plotId];

  if (!plot || !plot.hasPest) {
    return res.status(400).json({ error: '该地块没有虫害' });
  }

  if (gameState.gold < 1) {
    return res.status(400).json({ error: '金币不足' });
  }

  gameState.gold -= 1;
  plot.hasPest = false;
  plot.pestStartTime = null;

  res.json({ success: true, gold: gameState.gold, plot });
});

app.post('/api/events/trigger', (req, res) => {
  const { eventType }: { eventType?: EventType } = req.body;
  if (eventType) {
    applyEvent(eventType);
  } else {
    triggerRandomEvent();
  }
  res.json({ success: true, plots: gameState.plots, weather: gameState.weather });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
