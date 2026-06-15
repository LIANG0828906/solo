import { create } from 'zustand';
import {
  MIN_FLOW_RATE,
  MAX_FLOW_RATE,
  MAX_ERROR_ANGLE,
  PIVOT_STEP_ANGLE,
  WATER_LEVEL_THRESHOLD,
  STATE_UPDATE_INTERVAL,
  TRANSMISSION_RATIO,
} from '@/utils/constants';

interface ClockState {
  flowRate: number;
  pivotAngle: number;
  errorAngle: number;
  ratio: number;
  waterLevel: number;
  revolutionCount: number;
  lastUpdateTime: number;
  isPivoting: boolean;
  pivotStartTime: number;
  startPivotAngle: number;
  targetPivotAngle: number;
  showSpark: boolean;
  sparkStartTime: number;
  setFlowRate: (rate: number) => void;
  tick: (currentTime: number) => void;
  reset: () => void;
}

export const useClockStore = create<ClockState>((set, get) => ({
  flowRate: 1.5,
  pivotAngle: 0,
  errorAngle: 0,
  ratio: TRANSMISSION_RATIO,
  waterLevel: 0,
  revolutionCount: 0,
  lastUpdateTime: 0,
  isPivoting: false,
  pivotStartTime: 0,
  startPivotAngle: 0,
  targetPivotAngle: 0,
  showSpark: false,
  sparkStartTime: 0,

  setFlowRate: (rate: number) => {
    set({
      flowRate: Math.max(MIN_FLOW_RATE, Math.min(MAX_FLOW_RATE, rate)),
    });
  },

  tick: (currentTime: number) => {
    const state = get();
    
    if (currentTime - state.lastUpdateTime < STATE_UPDATE_INTERVAL) {
      return;
    }

    const deltaTime = state.lastUpdateTime === 0 ? 0.016 : (currentTime - state.lastUpdateTime) / 1000;

    set({ lastUpdateTime: currentTime });

    if (state.isPivoting) {
      const pivotProgress = Math.min(1, (currentTime - state.pivotStartTime) / 200);
      const newAngle = state.startPivotAngle + (state.targetPivotAngle - state.startPivotAngle) * pivotProgress;
      
      const errorIncrement = state.flowRate * 0.001 * deltaTime * 60;
      const newErrorAngle = Math.min(MAX_ERROR_ANGLE, state.errorAngle + errorIncrement);

      if (pivotProgress >= 1) {
        const completedRevolutions = Math.floor(newAngle / 360);
        set({
          pivotAngle: newAngle % 360,
          revolutionCount: state.revolutionCount + completedRevolutions,
          isPivoting: false,
          errorAngle: newErrorAngle,
          showSpark: false,
        });
      } else {
        set({
          pivotAngle: newAngle,
          errorAngle: newErrorAngle,
        });
      }
      return;
    }

    const fillRate = state.flowRate * 15;
    let newWaterLevel = state.waterLevel + fillRate * deltaTime;

    if (newWaterLevel >= WATER_LEVEL_THRESHOLD) {
      const newTargetAngle = state.pivotAngle + PIVOT_STEP_ANGLE;
      set({
        waterLevel: 0,
        isPivoting: true,
        pivotStartTime: currentTime,
        startPivotAngle: state.pivotAngle,
        targetPivotAngle: newTargetAngle,
        showSpark: true,
        sparkStartTime: currentTime,
      });
    } else {
      const errorIncrement = state.flowRate * 0.001 * deltaTime * 60;
      const newErrorAngle = Math.min(MAX_ERROR_ANGLE, state.errorAngle + errorIncrement);

      let showSpark = state.showSpark;
      if (state.showSpark && currentTime - state.sparkStartTime > 200) {
        showSpark = false;
      }

      set({
        waterLevel: newWaterLevel,
        errorAngle: newErrorAngle,
        showSpark,
      });
    }
  },

  reset: () => {
    set({
      errorAngle: 0,
      pivotAngle: 0,
      waterLevel: 0,
      revolutionCount: 0,
      isPivoting: false,
      showSpark: false,
    });
  },
}));
