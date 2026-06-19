import { create } from 'zustand';

const STORM_DURATION = 15;
const RECOVERY_DURATION = 5;

interface AuroraState {
  stormIntensity: number;
  isStormActive: boolean;
  isStormTriggered: boolean;
  speedMultiplier: number;
  pulseAmplitude: number;
  fps: number;
  stormTimer: number;
  recoveryTimer: number;
  triggerStorm: () => void;
  setSpeedMultiplier: (v: number) => void;
  setPulseAmplitude: (v: number) => void;
  setFps: (v: number) => void;
  updateTimers: (dt: number) => void;
  resetStormPulse: () => void;
}

export const useAuroraStore = create<AuroraState>((set, get) => ({
  stormIntensity: 0,
  isStormActive: false,
  isStormTriggered: false,
  speedMultiplier: 1,
  pulseAmplitude: 1,
  fps: 60,
  stormTimer: 0,
  recoveryTimer: 0,

  triggerStorm: () => {
    const s = get();
    if (s.isStormActive) return;
    set({
      isStormActive: true,
      isStormTriggered: true,
      stormTimer: STORM_DURATION,
      recoveryTimer: 0,
    });
  },

  resetStormPulse: () => set({ isStormTriggered: false }),

  setSpeedMultiplier: (v: number) => set({ speedMultiplier: v }),
  setPulseAmplitude: (v: number) => set({ pulseAmplitude: v }),
  setFps: (v: number) => set({ fps: v }),

  updateTimers: (dt: number) => {
    const s = get();
    if (!s.isStormActive && s.stormIntensity <= 0.001) return;

    let newStormTimer = s.stormTimer;
    let newRecoveryTimer = s.recoveryTimer;
    let newStormIntensity = s.stormIntensity;
    let newIsStormActive = s.isStormActive;

    if (s.isStormActive) {
      newStormTimer -= dt;
      if (newStormTimer <= 0) {
        newStormTimer = 0;
        newIsStormActive = false;
        newRecoveryTimer = RECOVERY_DURATION;
      }
      newStormIntensity = Math.min(1, newStormIntensity + dt * 2);
    } else if (newRecoveryTimer > 0) {
      newRecoveryTimer -= dt;
      if (newRecoveryTimer <= 0) {
        newRecoveryTimer = 0;
        newStormIntensity = 0;
      } else {
        newStormIntensity = Math.max(0, newRecoveryTimer / RECOVERY_DURATION);
      }
    }

    set({
      stormTimer: newStormTimer,
      recoveryTimer: newRecoveryTimer,
      stormIntensity: newStormIntensity,
      isStormActive: newIsStormActive,
    });
  },
}));
