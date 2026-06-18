import { create } from 'zustand';
import {
  GameState,
  GameAction,
  LevelMap,
  PlayerState,
  ShadowClone,
  ShadowRect,
  Block,
  MovingPlatform,
  Particle,
  Vec2,
} from './types';

const defaultPlayer: PlayerState = {
  pos: { x: 100, y: 400 },
  vel: { x: 0, y: 0 },
  radius: 12,
  facingRight: true,
  isGrounded: false,
  isAlive: true,
};

const initialState: GameState = {
  player: { ...defaultPlayer },
  shadows: [],
  level: null,
  progress: {
    currentLevel: 1,
    completedLevels: [],
    isPlaying: false,
    isPaused: false,
  },
  stats: {
    startTime: 0,
    shadowPlacements: 0,
  },
  camera: { x: 0, y: 0 },
  gamePhase: 'menu',
  transitionAlpha: 0,
  nextLevel: 1,
  particles: [],
};

export type GameStore = GameState & {
  dispatch: (action: GameAction) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  dispatch: (action: GameAction) => {
    switch (action.type) {
      case 'SET_PHASE':
        set({ gamePhase: action.phase });
        break;
      case 'SET_LEVEL':
        set((s) => ({
          level: action.level,
          player: {
            ...defaultPlayer,
            pos: { ...action.level.playerStart },
          },
          shadows: [],
          camera: { x: 0, y: 0 },
          stats: { startTime: Date.now(), shadowPlacements: 0 },
          progress: { ...s.progress, currentLevel: action.level.id, isPlaying: true },
        }));
        break;
      case 'UPDATE_PLAYER':
        set((s) => ({
          player: { ...s.player, ...action.player },
        }));
        break;
      case 'ADD_SHADOW':
        set((s) => ({
          shadows: [...s.shadows, action.shadow],
        }));
        break;
      case 'REMOVE_SHADOW':
        set((s) => ({
          shadows: s.shadows.filter((sh) => sh.id !== action.id),
        }));
        break;
      case 'CLEAR_SHADOWS':
        set({ shadows: [] });
        break;
      case 'UPDATE_SHADOW_RECT':
        set((s) => ({
          shadows: s.shadows.map((sh) =>
            sh.id === action.id ? { ...sh, shadowRect: action.shadowRect } : sh
          ),
        }));
        break;
      case 'UPDATE_BLOCK':
        set((s) => {
          if (!s.level) return s;
          return {
            level: {
              ...s.level,
              blocks: s.level.blocks.map((b) =>
                b.id === action.id ? { ...b, ...action.data } : b
              ),
            },
          };
        });
        break;
      case 'UPDATE_PLATE':
        set((s) => {
          if (!s.level) return s;
          return {
            level: {
              ...s.level,
              pressurePlates: s.level.pressurePlates.map((p) =>
                p.id === action.id ? { ...p, activated: action.activated } : p
              ),
            },
          };
        });
        break;
      case 'UPDATE_MOVING_PLATFORM':
        set((s) => {
          if (!s.level) return s;
          return {
            level: {
              ...s.level,
              movingPlatforms: s.level.movingPlatforms.map((mp) =>
                mp.id === action.id ? { ...mp, ...action.data } : mp
              ),
            },
          };
        });
        break;
      case 'UPDATE_DOOR':
        set((s) => {
          if (!s.level) return s;
          return {
            level: {
              ...s.level,
              doors: s.level.doors.map((d) =>
                d.id === action.id ? { ...d, open: action.open } : d
              ),
            },
          };
        });
        break;
      case 'SET_CAMERA':
        set({ camera: action.camera });
        break;
      case 'COMPLETE_LEVEL':
        set((s) => ({
          progress: {
            ...s.progress,
            completedLevels: s.progress.completedLevels.includes(action.levelId)
              ? s.progress.completedLevels
              : [...s.progress.completedLevels, action.levelId],
          },
        }));
        break;
      case 'SET_TRANSITION':
        set({ transitionAlpha: action.alpha, nextLevel: action.nextLevel });
        break;
      case 'RESET_LEVEL':
        set((s) => {
          if (!s.level) return s;
          return {
            player: {
              ...defaultPlayer,
              pos: { ...s.level.playerStart },
            },
            shadows: [],
            stats: { startTime: Date.now(), shadowPlacements: 0 },
          };
        });
        break;
      case 'INCREMENT_SHADOW_PLACEMENTS':
        set((s) => ({
          stats: {
            ...s.stats,
            shadowPlacements: s.stats.shadowPlacements + 1,
          },
        }));
        break;
      case 'SET_PARTICLES':
        set({ particles: action.particles });
        break;
      case 'KILL_PLAYER':
        set((s) => ({
          player: { ...s.player, isAlive: false },
          gamePhase: 'gameOver',
        }));
        break;
    }
  },
}));
