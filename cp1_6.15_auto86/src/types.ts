import * as THREE from 'three';

export type GameState = 'intro' | 'countdown' | 'racing' | 'finished';

export interface ShipState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  energy: number;
  speed: number;
  lap: number;
  progress: number;
  totalTime: number;
  lastLapTime: number;
  isStunned: boolean;
  stunTimer: number;
  outOfControl: boolean;
  outOfControlTimer: number;
}

export interface RaceRanking {
  name: string;
  lap: number;
  progress: number;
  totalTime: number;
  isPlayer: boolean;
  color: string;
}

export interface Obstacle {
  position: THREE.Vector3;
  boundingBox: THREE.Box3;
  mesh: THREE.Mesh;
}

export interface EnergyRing {
  position: THREE.Vector3;
  rotation: number;
  collected: boolean;
  mesh: THREE.Mesh;
  boundingBox: THREE.Box3;
}

export interface SteamCloud {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh;
}

export const CONFIG = {
  TRACK_WIDTH: 20,
  TRACK_SEGMENTS: 16,
  TRACK_PERIMETER: 600,
  HEIGHT_VARIATION: 5,
  CURVATURE_VARIATION: 0.2618,
  
  MAX_THRUST: 120,
  BRAKE_FORCE: 60,
  TURN_SPEED: 1.2,
  ROLL_SPEED: 1.8,
  FRICTION: 0.15,
  GRAVITY: 10,
  MAX_ALTITUDE: 20,
  INITIAL_ENERGY: 100,
  MAX_ENERGY: 100,
  
  BOUNCE_FORCE: 0.5,
  STUN_DURATION: 0.3,
  ENERGY_LOSS: 10,
  ENERGY_GAIN: 15,
  OUT_OF_CONTROL_DURATION: 2,
  
  TOTAL_LAPS: 3,
  COUNTDOWN_TIME: 3,
  INTRO_DURATION: 3,
  
  AI_COUNT: 3,
  AI_SPEED_MIN: 0.8,
  AI_SPEED_MAX: 1.1,
  AI_UPDATE_INTERVAL: 5,
  AI_AVOID_TIME: 1,
  AI_AVOID_ANGLE: 0.5,
  AI_AVOID_DURATION: 0.2,
  AI_OFFSET_MAX: 0.3,
  
  MAX_PARTICLES: 200,
  MAX_TRIANGLES: 20000,
  
  SHIP_LENGTH: 4,
  SHIP_WIDTH: 2,
  SHIP_HEIGHT: 1.5,
  
  COLORS: {
    PLAYER_BODY: 0x8B4513,
    PLAYER_ACCENT: 0xDAA520,
    TRACK_METAL: 0x4a4a4a,
    TRACK_RUST: 0x8B4513,
    FENCE_COPPER: 0xB87333,
    ENERGY_RING: 0x00ffff,
    STEAM_CLOUD: 0xaaaaaa,
    AI_COLORS: [0xff4444, 0x4444ff, 0x44ff44],
    ROCK_MIN: 0x6b4c3b,
    ROCK_MAX: 0x8b6f47,
  }
};

export class EventEmitter {
  private listeners: Map<string, Array<(data?: any) => void>> = new Map();

  on(event: string, callback: (data?: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  off(event: string, callback: (data?: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

export const eventEmitter = new EventEmitter();
