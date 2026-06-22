import type { ShipMotion, WaveParams } from '../utils/navigation';

export interface NavigationState {
  rudderAngle: number;
  windSpeed: number;
  windDirection: number;
  flagDeflection: number;
  headingError: number;
  idealHeading: number;
  actualHeading: number;
  sailingTime: number;
  yawCount: number;
  tokenCount: number;
  stableDuration: number;
  stormModeUnlocked: boolean;
  isStormMode: boolean;
  shipMotion: ShipMotion;
  waveParams: WaveParams;
  isShaking: boolean;
  isGameOver: boolean;
  totalTime: number;
}

export interface NavigationStore extends NavigationState {
  setRudderAngle: (angle: number) => void;
  incrementRudderAngle: (delta: number) => void;
  update: (timeDelta: number) => void;
  resetGame: () => void;
  toggleStormMode: () => void;
}

export interface TrackPoint {
  x: number;
  y: number;
  heading: number;
  timestamp: number;
}
