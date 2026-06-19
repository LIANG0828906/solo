import { create } from 'zustand';
import { Season, PlantType } from '../utils/colorPalette';

interface PlantGrowthParams {
  openness: number;
  leafColorBlend: number;
  fruitScale: number;
  leafFallAmount: number;
}

interface SeasonStore {
  currentSeason: Season;
  transitionProgress: number;
  plantParams: Record<PlantType, PlantGrowthParams>;
  setSeason: (season: Season) => void;
  updateTransitionProgress: (progress: number) => void;
}

const defaultPlantParams: Record<PlantType, PlantGrowthParams> = {
  [PlantType.CHERRY_BLOSSOM]: {
    openness: 1.0,
    leafColorBlend: 0,
    fruitScale: 0.3,
    leafFallAmount: 0
  },
  [PlantType.GINKGO]: {
    openness: 0.2,
    leafColorBlend: 0,
    fruitScale: 0.2,
    leafFallAmount: 0
  },
  [PlantType.SUNFLOWER]: {
    openness: 0.3,
    leafColorBlend: 0,
    fruitScale: 0.1,
    leafFallAmount: 0
  },
  [PlantType.MAPLE]: {
    openness: 0.4,
    leafColorBlend: 0,
    fruitScale: 0.2,
    leafFallAmount: 0
  }
};

const calculatePlantParams = (season: Season): Record<PlantType, PlantGrowthParams> => {
  switch (season) {
    case Season.SPRING:
      return {
        [PlantType.CHERRY_BLOSSOM]: {
          openness: 1.0,
          leafColorBlend: 0,
          fruitScale: 0.3,
          leafFallAmount: 0
        },
        [PlantType.GINKGO]: {
          openness: 0.2,
          leafColorBlend: 0,
          fruitScale: 0.2,
          leafFallAmount: 0
        },
        [PlantType.SUNFLOWER]: {
          openness: 0.3,
          leafColorBlend: 0,
          fruitScale: 0.1,
          leafFallAmount: 0
        },
        [PlantType.MAPLE]: {
          openness: 0.4,
          leafColorBlend: 0,
          fruitScale: 0.2,
          leafFallAmount: 0
        }
      };
    case Season.SUMMER:
      return {
        [PlantType.CHERRY_BLOSSOM]: {
          openness: 0.1,
          leafColorBlend: 0.5,
          fruitScale: 0.6,
          leafFallAmount: 0
        },
        [PlantType.GINKGO]: {
          openness: 0.3,
          leafColorBlend: 0.5,
          fruitScale: 0.5,
          leafFallAmount: 0
        },
        [PlantType.SUNFLOWER]: {
          openness: 1.0,
          leafColorBlend: 0.5,
          fruitScale: 0.4,
          leafFallAmount: 0
        },
        [PlantType.MAPLE]: {
          openness: 0.5,
          leafColorBlend: 0.5,
          fruitScale: 0.5,
          leafFallAmount: 0
        }
      };
    case Season.AUTUMN:
      return {
        [PlantType.CHERRY_BLOSSOM]: {
          openness: 0,
          leafColorBlend: 1,
          fruitScale: 1.0,
          leafFallAmount: 0.7
        },
        [PlantType.GINKGO]: {
          openness: 0.1,
          leafColorBlend: 1,
          fruitScale: 0.8,
          leafFallAmount: 0.5
        },
        [PlantType.SUNFLOWER]: {
          openness: 0.4,
          leafColorBlend: 1,
          fruitScale: 1.0,
          leafFallAmount: 0.3
        },
        [PlantType.MAPLE]: {
          openness: 0.1,
          leafColorBlend: 1,
          fruitScale: 0.9,
          leafFallAmount: 0.4
        }
      };
    case Season.WINTER:
      return {
        [PlantType.CHERRY_BLOSSOM]: {
          openness: 0,
          leafColorBlend: 1,
          fruitScale: 0.2,
          leafFallAmount: 1.0
        },
        [PlantType.GINKGO]: {
          openness: 0,
          leafColorBlend: 1,
          fruitScale: 0.3,
          leafFallAmount: 1.0
        },
        [PlantType.SUNFLOWER]: {
          openness: 0,
          leafColorBlend: 1,
          fruitScale: 0.1,
          leafFallAmount: 1.0
        },
        [PlantType.MAPLE]: {
          openness: 0,
          leafColorBlend: 1,
          fruitScale: 0.2,
          leafFallAmount: 1.0
        }
      };
  }
};

export const useSeasonStore = create<SeasonStore>((set) => ({
  currentSeason: Season.SPRING,
  transitionProgress: 1,
  plantParams: defaultPlantParams,
  setSeason: (season: Season) => {
    const newParams = calculatePlantParams(season);
    set({
      currentSeason: season,
      transitionProgress: 0,
      plantParams: newParams
    });
  },
  updateTransitionProgress: (progress: number) => {
    set({ transitionProgress: Math.min(progress, 1) });
  }
}));
