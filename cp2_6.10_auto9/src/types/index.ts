export interface LogEntry {
  timestamp: string;
  sailAngle: number;
  rudderAngle: number;
  ballastWeight: number;
  rollAngle: number;
  windSpeed: number;
  stabilityScore: number;
}

export interface ShipState {
  windLevel: number;
  windDirection: number;
  sailAngle: number;
  rudderAngle: number;
  ballastWeight: number;
  pitch: number;
  roll: number;
  speed: number;
  floodRate: number;
  stabilityScore: number;
  shipPosition: [number, number, number];
  shipRotation: [number, number, number];
  isStormActive: boolean;
  isLanternOn: boolean;
  cargoBoxSliding: boolean;
  cargoBoxPosition: number;
  waveHeight: number;
  logEntries: LogEntry[];
  lastLogTime: number;
  stormStartTime: number;
  bigWaveAvoided: boolean;
  shipCapsized: boolean;
  screenBrightness: number;
}

export interface StoreActions {
  setWindLevel: (level: number) => void;
  setWindDirection: (direction: number) => void;
  setSailAngle: (angle: number) => void;
  setRudderAngle: (angle: number) => void;
  setBallastWeight: (weight: number) => void;
  setPitch: (pitch: number) => void;
  setRoll: (roll: number) => void;
  setSpeed: (speed: number) => void;
  setFloodRate: (rate: number) => void;
  addStabilityScore: (delta: number) => void;
  toggleStorm: () => void;
  toggleLantern: () => void;
  setCargoBoxSliding: (sliding: boolean) => void;
  setCargoBoxPosition: (pos: number) => void;
  setShipPosition: (pos: [number, number, number]) => void;
  setShipRotation: (rot: [number, number, number]) => void;
  setWaveHeight: (height: number) => void;
  addLogEntry: (entry: LogEntry) => void;
  exportLogs: () => void;
  setStormStartTime: (time: number) => void;
  setBigWaveAvoided: (avoided: boolean) => void;
  setShipCapsized: (capsized: boolean) => void;
  setScreenBrightness: (brightness: number) => void;
  calculatePhysics: (deltaTime: number, elapsedTime: number) => void;
  autoRecordLog: (currentTime: number) => void;
}

export type Store = ShipState & StoreActions;

export const WIND_LEVELS = {
  0: { name: '无风', waveHeight: 0.3, waveFrequency: 0.3, rainCount: 0 },
  1: { name: '微风', waveHeight: 0.5, waveFrequency: 0.5, rainCount: 0 },
  2: { name: '和风', waveHeight: 0.8, waveFrequency: 0.7, rainCount: 200 },
  3: { name: '大风', waveHeight: 1.2, waveFrequency: 1.0, rainCount: 500 },
  4: { name: '暴风', waveHeight: 3.0, waveFrequency: 1.5, rainCount: 800 },
} as const;

export type WindLevel = keyof typeof WIND_LEVELS;
