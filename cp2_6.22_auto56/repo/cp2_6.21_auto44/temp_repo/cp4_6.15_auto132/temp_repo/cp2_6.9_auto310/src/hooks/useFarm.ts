import { useState, useCallback } from 'react';

/**
 * 地块类型
 * paddy: 水田
 * dry: 旱田
 * vegetable: 菜畦
 */
export type PlotType = 'paddy' | 'dry' | 'vegetable';

/**
 * 难度级别
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * 地块接口
 */
export interface Plot {
  /** 唯一标识 */
  id: string;
  /** 地块类型 */
  type: PlotType;
  /** 行索引 (0-5) */
  row: number;
  /** 列索引 (0-5) */
  col: number;
  /** 需水量 */
  waterNeeded: number;
  /** 已灌溉量 */
  waterReceived: number;
  /** 生长等级 (0-100) */
  growthLevel: number;
}

/**
 * 农田状态接口
 */
export interface FarmState {
  /** 6x6 地块二维数组 */
  plots: Plot[][];
  /** 总进度百分比 (0-100) */
  totalProgress: number;
  /** 是否可以收获 */
  isHarvest: boolean;
}

/**
 * 地块需水量基准值
 */
const BASE_WATER_NEEDED: Record<PlotType, number> = {
  paddy: 10,
  dry: 5,
  vegetable: 3,
};

/**
 * 难度系数映射
 */
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.5,
  normal: 1,
  hard: 1.5,
};

/**
 * 随机获取地块类型
 */
const getRandomPlotType = (): PlotType => {
  const types: PlotType[] = ['paddy', 'dry', 'vegetable'];
  return types[Math.floor(Math.random() * types.length)];
};

/**
 * 生成单个地块
 */
const createPlot = (row: number, col: number, difficulty: Difficulty): Plot => {
  const type = getRandomPlotType();
  const baseWater = BASE_WATER_NEEDED[type];
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty];
  const waterNeeded = Math.ceil(baseWater * multiplier);

  return {
    id: `${row}-${col}`,
    type,
    row,
    col,
    waterNeeded,
    waterReceived: 0,
    growthLevel: 0,
  };
};

/**
 * 生成 6x6 农田网格
 */
const createPlots = (difficulty: Difficulty): Plot[][] => {
  const plots: Plot[][] = [];
  for (let row = 0; row < 6; row++) {
    plots[row] = [];
    for (let col = 0; col < 6; col++) {
      plots[row][col] = createPlot(row, col, difficulty);
    }
  }
  return plots;
};

/**
 * 计算总进度
 */
const calculateTotalProgress = (plots: Plot[][]): number => {
  let totalNeeded = 0;
  let totalReceived = 0;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      totalNeeded += plots[row][col].waterNeeded;
      totalReceived += plots[row][col].waterReceived;
    }
  }

  return totalNeeded > 0 ? Math.min(100, (totalReceived / totalNeeded) * 100) : 0;
};

/**
 * 检查是否所有地块都已完成灌溉
 */
const checkAllPlotsComplete = (plots: Plot[][]): boolean => {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (plots[row][col].waterReceived < plots[row][col].waterNeeded) {
        return false;
      }
    }
  }
  return true;
};

/**
 * 农田管理 Hook
 * @param initialDifficulty 初始难度
 */
export const useFarm = (initialDifficulty: Difficulty = 'normal') => {
  const [state, setState] = useState<FarmState>(() => {
    const plots = createPlots(initialDifficulty);
    return {
      plots,
      totalProgress: calculateTotalProgress(plots),
      isHarvest: false,
    };
  });

  /**
   * 灌溉指定地块
   * @param row 行索引
   * @param col 列索引
   */
  const irrigatePlot = useCallback((row: number, col: number) => {
    setState((prev) => {
      const newPlots = prev.plots.map((r) => r.map((plot) => ({ ...plot })));
      const targetPlot = newPlots[row][col];

      if (targetPlot.waterReceived < targetPlot.waterNeeded) {
        targetPlot.waterReceived += 1;
        targetPlot.growthLevel = Math.min(
          100,
          (targetPlot.waterReceived / targetPlot.waterNeeded) * 100
        );
      }

      const totalProgress = calculateTotalProgress(newPlots);
      const isHarvest = checkAllPlotsComplete(newPlots);

      return {
        ...prev,
        plots: newPlots,
        totalProgress,
        isHarvest,
      };
    });
  }, []);

  /**
   * 重置农田状态
   * @param difficulty 新的难度级别
   */
  const resetFarm = useCallback((difficulty: Difficulty) => {
    const plots = createPlots(difficulty);
    setState({
      plots,
      totalProgress: calculateTotalProgress(plots),
      isHarvest: false,
    });
  }, []);

  /**
   * 检查是否可以收获
   * @returns 是否可以收获
   */
  const checkHarvest = useCallback((): boolean => {
    setState((prev) => {
      const isHarvest = checkAllPlotsComplete(prev.plots);
      return {
        ...prev,
        isHarvest,
      };
    });
    return checkAllPlotsComplete(state.plots);
  }, [state.plots]);

  return {
    state,
    actions: {
      irrigatePlot,
      resetFarm,
      checkHarvest,
    },
  };
};
