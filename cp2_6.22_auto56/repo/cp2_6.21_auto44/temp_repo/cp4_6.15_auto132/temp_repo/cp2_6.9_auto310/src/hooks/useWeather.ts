import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 雨丝粒子接口
 */
export interface Raindrop {
  /** 唯一标识 */
  id: number;
  /** 水平位置 0-100% */
  x: number;
  /** 动画延迟 */
  delay: number;
  /** 下落时长 */
  duration: number;
}

/**
 * 难度模式
 */
export type DifficultyMode = 'easy' | 'normal' | 'hard';

/**
 * 天气配置接口
 */
export interface WeatherConfig {
  /** 降雨检查间隔（毫秒） */
  rainInterval: number;
  /** 降雨概率 0-1 */
  rainProbability: number;
  /** 每次降雨补充水量（桶数） */
  rainWaterAmount: number;
  /** 降雨持续时间（毫秒） */
  rainDuration: number;
}

/**
 * 难度配置映射
 */
const DIFFICULTY_CONFIGS: Record<DifficultyMode, WeatherConfig> = {
  easy: {
    rainInterval: 60000,
    rainProbability: 0.4,
    rainWaterAmount: 20,
    rainDuration: 10000,
  },
  normal: {
    rainInterval: 60000,
    rainProbability: 0.4,
    rainWaterAmount: 20,
    rainDuration: 10000,
  },
  hard: {
    rainInterval: 90000,
    rainProbability: 0.4,
    rainWaterAmount: 20,
    rainDuration: 10000,
  },
};

/**
 * 生成雨丝粒子数组
 * @param count 雨丝数量
 * @returns 雨丝粒子数组
 */
const generateRaindrops = (count: number): Raindrop[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: Date.now() + index,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 0.5 + Math.random() * 0.5,
  }));
};

/**
 * 天气管理 Hook
 * @param difficulty 难度模式
 * @param currentWater 当前水量
 * @param maxWater 最大水量
 * @returns 天气状态和控制方法
 */
export const useWeather = (
  difficulty: DifficultyMode,
  currentWater: number,
  maxWater: number
) => {
  /** 是否正在下雨 */
  const [isRaining, setIsRaining] = useState<boolean>(false);
  /** 雨丝粒子数组 */
  const [raindrops, setRaindrops] = useState<Raindrop[]>([]);
  /** 降雨开始时间 */
  const [rainStartTime, setRainStartTime] = useState<number>(0);

  /** 定时器引用 */
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** 降雨结束定时器引用 */
  const rainStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 降雨停止回调引用 */
  const stopRainCallbackRef = useRef<(() => void) | null>(null);

  /** 获取当前难度配置 */
  const config = DIFFICULTY_CONFIGS[difficulty];

  /**
   * 停止降雨
   */
  const stopRain = useCallback(() => {
    setIsRaining(false);
    setRaindrops([]);
    setRainStartTime(0);

    if (rainStopTimerRef.current) {
      clearTimeout(rainStopTimerRef.current);
      rainStopTimerRef.current = null;
    }
  }, []);

  // 将 stopRain 保存到 ref，以便在清理时访问
  stopRainCallbackRef.current = stopRain;

  /**
   * 触发降雨
   * @returns 实际补充的水量
   */
  const triggerRain = useCallback((): number => {
    if (isRaining) {
      return 0;
    }

    const actualWaterAmount = Math.min(config.rainWaterAmount, maxWater - currentWater);

    setIsRaining(true);
    setRaindrops(generateRaindrops(Math.floor(Math.random() * 21) + 30));
    setRainStartTime(Date.now());

    rainStopTimerRef.current = setTimeout(() => {
      stopRain();
    }, config.rainDuration);

    return actualWaterAmount;
  }, [config, currentWater, maxWater, isRaining, stopRain]);

  /**
   * 手动触发降雨
   * @returns 实际补充的水量
   */
  const manualRain = useCallback((): number => {
    if (rainStopTimerRef.current) {
      clearTimeout(rainStopTimerRef.current);
      rainStopTimerRef.current = null;
    }
    return triggerRain();
  }, [triggerRain]);

  /**
   * 重置天气状态
   */
  const resetWeather = useCallback(() => {
    stopRain();

    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
  }, [stopRain]);

  /**
   * 定时检查是否触发降雨
   */
  useEffect(() => {
    const checkRain = () => {
      if (!isRaining && Math.random() < config.rainProbability) {
        triggerRain();
      }
    };

    intervalTimerRef.current = setInterval(checkRain, config.rainInterval);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [config.rainInterval, config.rainProbability, isRaining, triggerRain]);

  /**
   * 组件卸载时清理所有定时器
   */
  useEffect(() => {
    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
      if (rainStopTimerRef.current) {
        clearTimeout(rainStopTimerRef.current);
        rainStopTimerRef.current = null;
      }
      if (stopRainCallbackRef.current) {
        stopRainCallbackRef.current();
      }
    };
  }, []);

  return {
    isRaining,
    raindrops,
    rainWaterAmount: config.rainWaterAmount,
    triggerRain: manualRain,
    stopRain,
    resetWeather,
  };
};
