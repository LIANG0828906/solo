import { create } from 'zustand';
import type { NavigationStore } from '../types';
import {
  calculateActualHeading,
  calculateHeadingError,
  calculateFlagDeflection,
  generateWindChange,
  generateWaveChange,
  calculateShipMotion,
  normalizeAngle
} from '../utils/navigation';

const initialState = {
  rudderAngle: 0,
  windSpeed: 2,
  windDirection: 45,
  flagDeflection: 20,
  headingError: 0,
  idealHeading: 0,
  actualHeading: 0,
  sailingTime: 0,
  yawCount: 0,
  tokenCount: 0,
  stableDuration: 0,
  stormModeUnlocked: false,
  isStormMode: false,
  shipMotion: {
    rollX: 0,
    pitchY: 0,
    heaveZ: 0
  },
  waveParams: {
    direction: 0,
    amplitude: 1,
    period: 4
  },
  isShaking: false,
  isGameOver: false,
  totalTime: 0
};

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,

  setRudderAngle: (angle: number) => {
    const clamped = Math.max(-30, Math.min(30, angle));
    const stepped = Math.round(clamped / 2) * 2;
    set({ rudderAngle: stepped });
  },

  incrementRudderAngle: (delta: number) => {
    const { rudderAngle } = get();
    const clamped = Math.max(-30, Math.min(30, rudderAngle + delta));
    const stepped = Math.round(clamped / 2) * 2;
    set({ rudderAngle: stepped });
  },

  update: (timeDelta: number) => {
    const state = get();
    if (state.isGameOver) return;

    const newTotalTime = state.totalTime + timeDelta;
    const newSailingTime = state.sailingTime + timeDelta;

    const { windSpeed, windDirection } = generateWindChange(
      state.windSpeed,
      state.windDirection,
      timeDelta,
      state.isStormMode
    );

    const waveParams = generateWaveChange(
      state.waveParams,
      timeDelta,
      state.isStormMode
    );

    const shipMotion = calculateShipMotion(
      waveParams,
      newTotalTime,
      windSpeed
    );

    const actualHeading = calculateActualHeading(
      state.rudderAngle,
      windSpeed,
      windDirection,
      state.actualHeading,
      timeDelta
    );

    const headingError = calculateHeadingError(
      actualHeading,
      state.idealHeading
    );

    const flagDeflection = calculateFlagDeflection(
      windSpeed,
      windDirection,
      actualHeading
    );

    let stableDuration = state.stableDuration;
    let tokenCount = state.tokenCount;
    let stormModeUnlocked = state.stormModeUnlocked;

    if (Math.abs(headingError) < 5) {
      stableDuration += timeDelta;
      if (stableDuration >= 60) {
        tokenCount += 1;
        stableDuration = 0;
        if (tokenCount >= 3) {
          stormModeUnlocked = true;
        }
      }
    } else {
      stableDuration = 0;
    }

    let yawCount = state.yawCount;
    let isShaking = state.isShaking;

    if (Math.abs(headingError) > 15) {
      yawCount += 1;
      isShaking = true;
      setTimeout(() => set({ isShaking: false }), 200);
    }

    const isGameOver = yawCount >= 5;

    set({
      windSpeed,
      windDirection,
      waveParams,
      shipMotion,
      actualHeading: normalizeAngle(actualHeading),
      headingError,
      flagDeflection,
      sailingTime: newSailingTime,
      totalTime: newTotalTime,
      stableDuration,
      tokenCount,
      stormModeUnlocked,
      yawCount,
      isShaking,
      isGameOver
    });
  },

  resetGame: () => {
    set({
      ...initialState,
      tokenCount: get().tokenCount,
      stormModeUnlocked: get().stormModeUnlocked
    });
  },

  toggleStormMode: () => {
    const { stormModeUnlocked } = get();
    if (stormModeUnlocked) {
      set((state) => ({ isStormMode: !state.isStormMode }));
    }
  }
}));
