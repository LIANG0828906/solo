import { create } from 'zustand';
import { Store, LogEntry, WIND_LEVELS, WindLevel } from '@/types';
import { calculatePhysics, formatTimestamp, formatLogTimestamp, clamp } from '@/utils/physics';

const initialState = {
  windLevel: 0,
  windDirection: 90,
  sailAngle: 45,
  rudderAngle: 0,
  ballastWeight: 500,
  pitch: 0,
  roll: 0,
  speed: 0.5,
  floodRate: 0,
  stabilityScore: 50,
  shipPosition: [0, 0, 0] as [number, number, number],
  shipRotation: [0, 0, 0] as [number, number, number],
  isStormActive: false,
  isLanternOn: true,
  cargoBoxSliding: false,
  cargoBoxPosition: -0.75,
  waveHeight: 0.3,
  logEntries: [] as LogEntry[],
  lastLogTime: 0,
  stormStartTime: 0,
  bigWaveAvoided: false,
  shipCapsized: false,
  screenBrightness: 1,
};

export const useStore = create<Store>((set, get) => ({
  ...initialState,

  setWindLevel: (level: number) => set({ windLevel: clamp(level, 0, 4) }),
  setWindDirection: (direction: number) => set({ windDirection: ((direction % 360) + 360) % 360 }),
  setSailAngle: (angle: number) => set({ sailAngle: clamp(angle, 0, 90) }),
  setRudderAngle: (angle: number) => set({ rudderAngle: clamp(angle, -45, 45) }),
  setBallastWeight: (weight: number) => set({ ballastWeight: clamp(weight, 200, 800) }),
  setPitch: (pitch: number) => set({ pitch: clamp(pitch, -20, 20) }),
  setRoll: (roll: number) => set({ roll: clamp(roll, -30, 30) }),
  setSpeed: (speed: number) => set({ speed: clamp(speed, 0.2, 2.0) }),
  setFloodRate: (rate: number) => set({ floodRate: clamp(rate, 0, 100) }),
  addStabilityScore: (delta: number) =>
    set((state) => ({
      stabilityScore: clamp(state.stabilityScore + delta, 0, 100),
    })),

  toggleStorm: () =>
    set((state) => ({
      isStormActive: !state.isStormActive,
      stormStartTime: !state.isStormActive ? Date.now() : 0,
      windLevel: !state.isStormActive ? 0 : 0,
    })),

  toggleLantern: () =>
    set((state) => ({
      isLanternOn: !state.isLanternOn,
      screenBrightness: !state.isLanternOn ? 0.5 : 1,
    })),

  setCargoBoxSliding: (sliding: boolean) => set({ cargoBoxSliding: sliding }),
  setCargoBoxPosition: (pos: number) => set({ cargoBoxPosition: clamp(pos, -0.75, 0.75) }),
  setShipPosition: (pos: [number, number, number]) => set({ shipPosition: pos }),
  setShipRotation: (rot: [number, number, number]) => set({ shipRotation: rot }),
  setWaveHeight: (height: number) => set({ waveHeight: height }),
  setStormStartTime: (time: number) => set({ stormStartTime: time }),
  setBigWaveAvoided: (avoided: boolean) => set({ bigWaveAvoided: avoided }),
  setShipCapsized: (capsized: boolean) => set({ shipCapsized: capsized }),
  setScreenBrightness: (brightness: number) => set({ screenBrightness: brightness }),

  addLogEntry: (entry: LogEntry) =>
    set((state) => ({
      logEntries: [...state.logEntries, entry],
    })),

  exportLogs: () => {
    const state = get();
    const timestamp = formatTimestamp(new Date());
    const filename = `航海日志_${timestamp}.json`;
    const data = JSON.stringify(state.logEntries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  calculatePhysics: (deltaTime: number, elapsedTime: number) => {
    const state = get();

    if (state.isStormActive && state.stormStartTime > 0) {
      const stormElapsed = (Date.now() - state.stormStartTime) / 1000;
      const targetWindLevel = Math.min(4, Math.floor(stormElapsed / 5));
      if (targetWindLevel !== state.windLevel) {
        set({ windLevel: targetWindLevel });
      }

      const windDirChange = Math.sin(elapsedTime * 0.1) * 5;
      set({ windDirection: 90 + windDirChange });
    }

    const physicsResult = calculatePhysics(
      {
        windLevel: state.windLevel,
        windDirection: state.windDirection,
        sailAngle: state.sailAngle,
        rudderAngle: state.rudderAngle,
        ballastWeight: state.ballastWeight,
        elapsedTime,
      },
      state.roll,
      state.pitch
    );

    set({
      roll: physicsResult.roll,
      pitch: physicsResult.pitch,
      speed: physicsResult.speed,
      floodRate: physicsResult.floodRate,
      waveHeight: physicsResult.waveHeight,
    });

    const windConfig = WIND_LEVELS[state.windLevel as WindLevel] || WIND_LEVELS[0];
    const isBigWave = physicsResult.waveHeight > windConfig.waveHeight * 0.8;
    const wasDanger = Math.abs(state.roll) > 25;
    const nowSafe = Math.abs(physicsResult.roll) <= 15;

    if (isBigWave && wasDanger && nowSafe && !state.bigWaveAvoided) {
      set((s) => ({
        bigWaveAvoided: true,
        stabilityScore: clamp(s.stabilityScore + 5, 0, 100),
      }));
    } else if (!isBigWave) {
      set({ bigWaveAvoided: false });
    }

    if (Math.abs(physicsResult.roll) >= 29 && !state.shipCapsized) {
      set((s) => ({
        shipCapsized: true,
        stabilityScore: clamp(s.stabilityScore - 15, 0, 100),
      }));
      setTimeout(() => set({ shipCapsized: false }), 3000);
    }

    if (Math.abs(physicsResult.roll) > 25 && !state.cargoBoxSliding) {
      set({ cargoBoxSliding: true });
    } else if (Math.abs(physicsResult.roll) <= 20 && state.cargoBoxSliding) {
      set({ cargoBoxSliding: false });
    }

    if (state.cargoBoxSliding) {
      const slideDirection = physicsResult.roll > 0 ? 1 : -1;
      const newCargoPos = state.cargoBoxPosition + slideDirection * deltaTime * 2;
      const clampedPos = clamp(newCargoPos, -0.75, 0.75);
      set({ cargoBoxPosition: clampedPos });

      if (Math.abs(clampedPos) >= 0.75 && Math.abs(state.cargoBoxPosition) < 0.75) {
        set((s) => ({
          floodRate: clamp(s.floodRate * 1.2, 0, 100),
        }));
      }
    }

    if (Math.abs(physicsResult.pitch) > 15 && state.isLanternOn) {
      if (Math.random() < 0.01) {
        set({
          isLanternOn: false,
          screenBrightness: 0.5,
        });
      }
    }
  },

  autoRecordLog: (currentTime: number) => {
    const state = get();
    if (currentTime - state.lastLogTime >= 30000) {
      const entry: LogEntry = {
        timestamp: formatLogTimestamp(new Date()),
        sailAngle: state.sailAngle,
        rudderAngle: state.rudderAngle,
        ballastWeight: state.ballastWeight,
        rollAngle: Math.round(state.roll * 10) / 10,
        windSpeed: state.windLevel,
        stabilityScore: state.stabilityScore,
      };
      set({
        logEntries: [...state.logEntries, entry],
        lastLogTime: currentTime,
      });
    }
  },
}));
