import { create } from 'zustand';
import type { GameState, GardenFlower, Flower, WeatherEvent, WeeklyReport, Season, GrowthStage, StoredState } from '@/types';
import { DAILY_BOX_LIMIT, TOTAL_PLOTS, STORAGE_KEY, getCurrentSeason, getTodayString, generateInstanceId, GROWTH_STAGES, REPORT_INTERVAL_DAYS } from '@/utils/constants';
import { openBlindBox, generateReport, mockFlowers } from '@/utils/api';

interface GardenStore {
  gameState: GameState;
  reportHistory: WeeklyReport[];
  weatherEventHistory: WeatherEvent[];
  lastReportDate?: string;
  isOpeningBox: boolean;
  currentBoxResult: Flower | null;
  showBoxModal: boolean;
  isLoading: boolean;
  error: string | null;

  init: () => void;
  saveState: () => void;
  openBox: (season: Season) => Promise<void>;
  plantFlower: (flower: Flower, plotIndex: number) => void;
  updateGrowth: (instanceId: string, stage: GrowthStage, progress: number) => void;
  advanceGrowthStage: (instanceId: string) => void;
  checkWeatherTrigger: (newFlower: Flower) => WeatherEvent;
  setWeatherEvent: (event: WeatherEvent) => void;
  generateWeeklyReport: () => Promise<void>;
  checkDailyReset: () => void;
  checkReportGeneration: () => void;
  closeBoxModal: () => void;
  setIsOpeningBox: (value: boolean) => void;
  getAvailablePlot: () => number;
  removeFlower: (instanceId: string) => void;
}

const getInitialState = (): GameState => ({
  dailyBoxesUsed: 0,
  lastResetDate: getTodayString(),
  gardenPlots: new Array(TOTAL_PLOTS).fill(null),
  collectedFlowers: [],
  weatherEvent: null,
  currentSeason: getCurrentSeason(),
});

const loadState = (): StoredState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
};

export const useGardenStore = create<GardenStore>((set, get) => ({
  gameState: getInitialState(),
  reportHistory: [],
  weatherEventHistory: [],
  isOpeningBox: false,
  currentBoxResult: null,
  showBoxModal: false,
  isLoading: false,
  error: null,

  init: () => {
    const stored = loadState();
    if (stored) {
      set({
        gameState: stored.gameState,
        reportHistory: stored.reportHistory || [],
        lastReportDate: stored.lastReportDate,
        weatherEventHistory: stored.weatherEventHistory || [],
      });
    }
    get().checkDailyReset();
    get().checkReportGeneration();
  },

  saveState: () => {
    const { gameState, reportHistory, lastReportDate, weatherEventHistory } = get();
    const storedState: StoredState = {
      gameState,
      reportHistory,
      lastReportDate,
      weatherEventHistory,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
  },

  checkDailyReset: () => {
    const { gameState } = get();
    const today = getTodayString();
    if (gameState.lastResetDate !== today) {
      set((state) => ({
        gameState: {
          ...state.gameState,
          dailyBoxesUsed: 0,
          lastResetDate: today,
        },
      }));
      get().saveState();
    }
  },

  checkReportGeneration: () => {
    const { lastReportDate, gameState, generateWeeklyReport } = get();
    const today = new Date();

    if (!lastReportDate) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() % REPORT_INTERVAL_DAYS));
      set({ lastReportDate: weekStart.toISOString().split('T')[0] });
      get().saveState();
      return;
    }

    const lastReport = new Date(lastReportDate);
    const daysSince = Math.floor((today.getTime() - lastReport.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= REPORT_INTERVAL_DAYS && gameState.collectedFlowers.length > 0) {
      generateWeeklyReport();
    }
  },

  getAvailablePlot: (): number => {
    const { gardenPlots } = get().gameState;
    return gardenPlots.findIndex((plot) => plot === null);
  },

  openBox: async (season: Season) => {
    const { gameState, isOpeningBox, checkDailyReset, getAvailablePlot, plantFlower, checkWeatherTrigger, setWeatherEvent, saveState } = get();

    checkDailyReset();

    if (isOpeningBox) return;
    if (gameState.dailyBoxesUsed >= DAILY_BOX_LIMIT) {
      set({ error: '今日开盒次数已用完，请明天再来~' });
      return;
    }

    const availablePlot = getAvailablePlot();
    if (availablePlot === -1) {
      set({ error: '花园已满！请等待花卉结籽后清理地块。' });
      return;
    }

    set({ isOpeningBox: true, isLoading: true, error: null });

    try {
      let result;
      try {
        result = await openBlindBox(season, gameState);
      } catch (e) {
        const seasonFlowers = mockFlowers.filter((f) => f.season === season);
        const randomFlower = seasonFlowers[Math.floor(Math.random() * seasonFlowers.length)];
        result = {
          success: true,
          item: randomFlower,
          isNew: !gameState.collectedFlowers.some((f) => f.id === randomFlower.id),
          weatherTriggered: Math.random() > 0.7 ? (`${season}_rain` as WeatherEvent) : null,
          message: '获得一朵美丽的花！',
        };
      }

      set({
        currentBoxResult: result.item,
        showBoxModal: true,
      });

      set((state) => ({
        gameState: {
          ...state.gameState,
          dailyBoxesUsed: state.gameState.dailyBoxesUsed + 1,
        },
      }));

      if (result.isNew) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            collectedFlowers: [...state.gameState.collectedFlowers, result.item],
          },
        }));
      }

      plantFlower(result.item, availablePlot);

      const weatherEvent = checkWeatherTrigger(result.item);
      if (weatherEvent || result.weatherTriggered) {
        const finalWeather = weatherEvent || result.weatherTriggered;
        setWeatherEvent(finalWeather);
        set((state) => ({
          weatherEventHistory: [...state.weatherEventHistory, finalWeather],
        }));
      }

      saveState();
    } catch (e) {
      set({ error: '开盒失败，请重试' });
    } finally {
      set({ isLoading: false });
    }
  },

  plantFlower: (flower: Flower, plotIndex: number) => {
    const gardenFlower: GardenFlower = {
      ...flower,
      instanceId: generateInstanceId(),
      plantedAt: Date.now(),
      currentStage: 'seed',
      stageProgress: 0,
      plotIndex,
    };

    set((state) => {
      const newPlots = [...state.gameState.gardenPlots];
      newPlots[plotIndex] = gardenFlower;
      return {
        gameState: {
          ...state.gameState,
          gardenPlots: newPlots,
        },
      };
    });

    get().saveState();
  },

  updateGrowth: (instanceId: string, stage: GrowthStage, progress: number) => {
    set((state) => {
      const newPlots = state.gameState.gardenPlots.map((plot) => {
        if (plot && plot.instanceId === instanceId) {
          return { ...plot, currentStage: stage, stageProgress: progress };
        }
        return plot;
      });
      return {
        gameState: {
          ...state.gameState,
          gardenPlots: newPlots,
        },
      };
    });
  },

  advanceGrowthStage: (instanceId: string) => {
    const { gameState } = get();
    const flower = gameState.gardenPlots.find((p) => p && p.instanceId === instanceId);
    if (!flower) return;

    const currentIndex = GROWTH_STAGES.indexOf(flower.currentStage);
    if (currentIndex < GROWTH_STAGES.length - 1) {
      const nextStage = GROWTH_STAGES[currentIndex + 1];
      get().updateGrowth(instanceId, nextStage, 0);
    }
    get().saveState();
  },

  removeFlower: (instanceId: string) => {
    set((state) => {
      const newPlots = state.gameState.gardenPlots.map((plot) => {
        if (plot && plot.instanceId === instanceId) {
          return null;
        }
        return plot;
      });
      return {
        gameState: {
          ...state.gameState,
          gardenPlots: newPlots,
        },
      };
    });
    get().saveState();
  },

  checkWeatherTrigger: (newFlower: Flower): WeatherEvent => {
    const { gameState } = get();
    const sameSeasonCount = gameState.gardenPlots.filter(
      (p) => p && p.season === newFlower.season && p.currentStage === 'blooming'
    ).length;

    if (sameSeasonCount >= 3) {
      const weatherMap: Record<Season, WeatherEvent> = {
        spring: 'spring_rain',
        summer: 'summer_thunder',
        autumn: 'autumn_wind',
        winter: 'winter_snow',
      };
      return weatherMap[newFlower.season];
    }
    return null;
  },

  setWeatherEvent: (event: WeatherEvent) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        weatherEvent: event,
      },
    }));

    if (event) {
      setTimeout(() => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            weatherEvent: null,
          },
        }));
      }, 8000);
    }
  },

  generateWeeklyReport: async () => {
    const { gameState, weatherEventHistory, saveState } = get();
    const bloomingFlowers = gameState.gardenPlots.filter(
      (p) => p && p.currentStage !== 'seed'
    ) as GardenFlower[];

    if (bloomingFlowers.length === 0) return;

    set({ isLoading: true });

    try {
      let report;
      try {
        report = await generateReport(bloomingFlowers, weatherEventHistory);
      } catch (e) {
        const rarityDistribution = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
        const seasonDistribution = { spring: 0, summer: 0, autumn: 0, winter: 0 };
        bloomingFlowers.forEach((f) => {
          rarityDistribution[f.rarity]++;
          seasonDistribution[f.season]++;
        });
        report = {
          weekNumber: 1,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: getTodayString(),
          totalFlowers: bloomingFlowers.length,
          uniqueSpecies: new Set(bloomingFlowers.map((f) => f.id)).size,
          rarityDistribution,
          seasonDistribution,
          weatherEvents: weatherEventHistory.slice(-10),
          diversityScore: Math.min(100, Math.round((new Set(bloomingFlowers.map((f) => f.id)).size / 24) * 100)),
          bloomCount: bloomingFlowers.filter((f) => f.currentStage === 'blooming' || f.currentStage === 'seeding').length,
          topFlowers: bloomingFlowers.slice(0, 3),
          rating: 'B',
        };
      }

      set((state) => ({
        reportHistory: [...state.reportHistory, report],
        lastReportDate: getTodayString(),
        weatherEventHistory: [],
      }));

      saveState();
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  closeBoxModal: () => {
    set({ showBoxModal: false, currentBoxResult: null, isOpeningBox: false });
  },

  setIsOpeningBox: (value: boolean) => {
    set({ isOpeningBox: value });
  },
}));
