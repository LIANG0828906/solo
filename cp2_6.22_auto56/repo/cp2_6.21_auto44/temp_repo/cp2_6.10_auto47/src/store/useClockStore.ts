import { create } from 'zustand';

export const MONTHS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
];

export const SHICHEN = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
];

export interface ClockState {
  waterLevel: number;
  arrowOffset: number;
  month: number;
  dayRatio: number;
  nightRatio: number;
  isCalibrating: boolean;
  isSuccess: boolean;
  currentKe: number;
  currentShichen: string;
  scaleRingRotation: number;
  isAnimating: boolean;

  setWaterLevel: (level: number) => void;
  setArrowOffset: (offset: number) => void;
  setMonth: (month: number) => void;
  setCalibrating: (calibrating: boolean) => void;
  setSuccess: (success: boolean) => void;
  calibrate: (delta: number) => void;
  reset: () => void;
  calculateDayNightRatio: (month: number) => { day: number; night: number };
}

const DEFAULT_WATER_LEVEL = 1 / 3;
const DEFAULT_MONTH = 2;

const calculateDayNightRatio = (month: number) => {
  const monthIndex = month;
  const summerSolstice = 5;
  const winterSolstice = 11;
  
  let distanceToSummer = Math.abs(monthIndex - summerSolstice);
  distanceToSummer = Math.min(distanceToSummer, 12 - distanceToSummer);
  
  let distanceToWinter = Math.abs(monthIndex - winterSolstice);
  distanceToWinter = Math.min(distanceToWinter, 12 - distanceToWinter);
  
  const maxVariation = 10;
  const summerEffect = (6 - distanceToSummer) / 6 * maxVariation;
  const winterEffect = (6 - distanceToWinter) / 6 * maxVariation;
  
  let dayRatio = 50 + summerEffect - winterEffect;
  dayRatio = Math.max(40, Math.min(60, dayRatio));
  
  return {
    day: Math.round(dayRatio),
    night: Math.round(100 - dayRatio)
  };
};

const getShichenAndKe = (waterLevel: number, dayRatio: number) => {
  const totalKe = (waterLevel - 1/6) / (5/6 - 1/6) * 100;
  const clampedKe = Math.max(0, Math.min(99.99, totalKe));
  
  const dayKe = dayRatio;
  const nightKe = 100 - dayRatio;
  
  let shichenIndex: number;
  let keInShichen: number;
  
  if (clampedKe < dayKe) {
    const dayProgress = clampedKe / dayKe;
    shichenIndex = Math.floor(dayProgress * 6) + 6;
    keInShichen = (dayProgress * 6 - Math.floor(dayProgress * 6)) * (dayKe / 6);
  } else {
    const nightProgress = (clampedKe - dayKe) / nightKe;
    shichenIndex = Math.floor(nightProgress * 6);
    keInShichen = (nightProgress * 6 - Math.floor(nightProgress * 6)) * (nightKe / 6);
  }
  
  shichenIndex = shichenIndex % 12;
  
  return {
    ke: clampedKe,
    shichen: SHICHEN[shichenIndex],
    keInShichen
  };
};

export const useClockStore = create<ClockState>((set, get) => {
  const initialRatio = calculateDayNightRatio(DEFAULT_MONTH);
  const initialTime = getShichenAndKe(DEFAULT_WATER_LEVEL, initialRatio.day);
  
  return {
    waterLevel: DEFAULT_WATER_LEVEL,
    arrowOffset: 0,
    month: DEFAULT_MONTH,
    dayRatio: initialRatio.day,
    nightRatio: initialRatio.night,
    isCalibrating: false,
    isSuccess: false,
    currentKe: initialTime.ke,
    currentShichen: initialTime.shichen,
    scaleRingRotation: 0,
    isAnimating: false,

    setWaterLevel: (level: number) => {
      const clampedLevel = Math.max(1/6, Math.min(5/6, level));
      const { dayRatio } = get();
      const timeInfo = getShichenAndKe(clampedLevel, dayRatio);
      set({
        waterLevel: clampedLevel,
        currentKe: timeInfo.ke,
        currentShichen: timeInfo.shichen
      });
    },

    setArrowOffset: (offset: number) => {
      set({ arrowOffset: offset });
    },

    setMonth: (month: number) => {
      const clampedMonth = Math.max(0, Math.min(11, month));
      const ratio = calculateDayNightRatio(clampedMonth);
      const { waterLevel } = get();
      const timeInfo = getShichenAndKe(waterLevel, ratio.day);
      
      const rotation = (ratio.day - 50) / 20 * 180;
      
      set({
        month: clampedMonth,
        dayRatio: ratio.day,
        nightRatio: ratio.night,
        currentKe: timeInfo.ke,
        currentShichen: timeInfo.shichen,
        scaleRingRotation: rotation
      });
    },

    setCalibrating: (calibrating: boolean) => {
      set({ isCalibrating: calibrating });
    },

    setSuccess: (success: boolean) => {
      set({ isSuccess: success });
    },

    calibrate: (delta: number) => {
      const { waterLevel, arrowOffset, dayRatio } = get();
      const newOffset = arrowOffset + delta;
      const effectiveLevel = waterLevel + newOffset * 0.01;
      const timeInfo = getShichenAndKe(effectiveLevel, dayRatio);
      
      set({
        arrowOffset: newOffset,
        currentKe: timeInfo.ke,
        currentShichen: timeInfo.shichen
      });
    },

    reset: () => {
      set({ isAnimating: true });
      
      const startLevel = get().waterLevel;
      const startOffset = get().arrowOffset;
      const startMonth = get().month;
      const endLevel = DEFAULT_WATER_LEVEL;
      const endOffset = 0;
      const endMonth = DEFAULT_MONTH;
      const duration = 3000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentLevel = startLevel + (endLevel - startLevel) * easeProgress;
        const currentOffset = startOffset + (endOffset - startOffset) * easeProgress;
        const currentMonth = Math.round(startMonth + (endMonth - startMonth) * easeProgress);
        
        const ratio = calculateDayNightRatio(currentMonth);
        const timeInfo = getShichenAndKe(currentLevel, ratio.day);
        const rotation = (ratio.day - 50) / 20 * 180;
        
        set({
          waterLevel: currentLevel,
          arrowOffset: currentOffset,
          month: currentMonth,
          dayRatio: ratio.day,
          nightRatio: ratio.night,
          currentKe: timeInfo.ke,
          currentShichen: timeInfo.shichen,
          scaleRingRotation: rotation
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          set({ isAnimating: false });
        }
      };
      
      requestAnimationFrame(animate);
    },

    calculateDayNightRatio
  };
});
