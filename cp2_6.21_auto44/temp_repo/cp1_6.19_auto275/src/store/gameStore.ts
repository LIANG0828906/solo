import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AnimationType =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'sleep'
  | 'feed'
  | 'play'
  | 'clean'
  | 'train';

export type Direction = 'left' | 'right';

export interface Stats {
  mood: number;
  hunger: number;
  cleanliness: number;
  energy: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface AnimationState {
  type: AnimationType;
  frame: number;
  direction: Direction;
  rotation: number;
  animationTimer: number;
  actionTimer: number;
}

export interface SpriteState {
  name: string;
  level: number;
  experience: number;
  stats: Stats;
  position: Position;
  animation: AnimationState;
  lastUpdate: number;
  lastPositionUpdate: number;
  showSadBubble: boolean;
  bubbleTimer: number;
}

export interface GameActions {
  initSprite: (name?: string) => void;
  feed: () => void;
  play: () => void;
  clean: () => void;
  train: () => void;
  updateStats: () => void;
  updateAnimation: (deltaTime: number) => void;
  updatePosition: () => void;
  checkLevelUp: () => void;
  checkSadBubble: () => void;
  resetSprite: () => void;
}

export type GameStore = SpriteState & GameActions;

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const SPRITE_SIZE = 16;
const PIXEL_SCALE = 6;
const SPRITE_DISPLAY_SIZE = SPRITE_SIZE * PIXEL_SCALE;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const randomBetween = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const getInitialState = (name: string = '小像素'): SpriteState => ({
  name,
  level: 1,
  experience: 0,
  stats: {
    mood: 80,
    hunger: 70,
    cleanliness: 90,
    energy: 60,
  },
  position: {
    x: (CANVAS_WIDTH - SPRITE_DISPLAY_SIZE) / 2,
    y: (CANVAS_HEIGHT - SPRITE_DISPLAY_SIZE) / 2,
  },
  animation: {
    type: 'idle',
    frame: 0,
    direction: 'right',
    rotation: 0,
    animationTimer: 0,
    actionTimer: 0,
  },
  lastUpdate: Date.now(),
  lastPositionUpdate: Date.now(),
  showSadBubble: false,
  bubbleTimer: 0,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      initSprite: (name?: string) => {
        set(getInitialState(name));
      },

      feed: () => {
        const state = get();
        if (state.animation.actionTimer > 0) return;

        set({
          stats: {
            ...state.stats,
            hunger: clamp(state.stats.hunger + 20, 0, 100),
            mood: clamp(state.stats.mood + 5, 0, 100),
          },
          animation: {
            ...state.animation,
            type: 'feed',
            frame: 0,
            actionTimer: 2000,
          },
        });
      },

      play: () => {
        const state = get();
        if (state.animation.actionTimer > 0) return;

        set({
          stats: {
            ...state.stats,
            hunger: clamp(state.stats.hunger - 10, 0, 100),
            mood: clamp(state.stats.mood + 15, 0, 100),
            energy: clamp(state.stats.energy - 5, 0, 100),
          },
          animation: {
            ...state.animation,
            type: 'play',
            frame: 0,
            actionTimer: 2000,
          },
        });
      },

      clean: () => {
        const state = get();
        if (state.animation.actionTimer > 0) return;

        set({
          stats: {
            ...state.stats,
            cleanliness: clamp(state.stats.cleanliness + 25, 0, 100),
            mood: clamp(state.stats.mood + 5, 0, 100),
          },
          animation: {
            ...state.animation,
            type: 'clean',
            frame: 0,
            actionTimer: 2000,
          },
        });
      },

      train: () => {
        const state = get();
        if (state.animation.actionTimer > 0) return;

        const newExperience = state.experience + 1;

        set({
          stats: {
            ...state.stats,
            energy: clamp(state.stats.energy + 5, 0, 100),
            hunger: clamp(state.stats.hunger - 3, 0, 100),
          },
          experience: newExperience,
          animation: {
            ...state.animation,
            type: 'train',
            frame: 0,
            actionTimer: 2000,
          },
        });

        get().checkLevelUp();
      },

      updateStats: () => {
        const state = get();
        const now = Date.now();
        const deltaMs = now - state.lastUpdate;

        if (deltaMs >= 1000) {
          const moodDecay = randomBetween(0.1, 0.3);
          const hungerDecay = randomBetween(0.15, 0.3);
          const cleanlinessDecay = randomBetween(0.1, 0.25);
          const energyDecay = randomBetween(0.1, 0.2);

          set({
            stats: {
              mood: clamp(state.stats.mood - moodDecay, 0, 100),
              hunger: clamp(state.stats.hunger - hungerDecay, 0, 100),
              cleanliness: clamp(state.stats.cleanliness - cleanlinessDecay, 0, 100),
              energy: clamp(state.stats.energy - energyDecay, 0, 100),
            },
            lastUpdate: now,
          });

          get().checkSadBubble();
        }
      },

      updateAnimation: (deltaTime: number) => {
        const state = get();
        let { type, frame, rotation, animationTimer, actionTimer } = state.animation;

        animationTimer += deltaTime;
        if (actionTimer > 0) {
          actionTimer -= deltaTime;
        }

        const frameDuration = 200;
        if (animationTimer >= frameDuration) {
          animationTimer = 0;
          frame = (frame + 1) % 4;
        }

        if (actionTimer <= 0 && type !== 'idle' && type !== 'walk' && type !== 'sleep') {
          type = 'idle';
          actionTimer = 0;
        }

        let targetRotation = 0;
        if (type === 'jump' || type === 'play') {
          const jumpProgress = (2000 - actionTimer) / 300;
          if (jumpProgress < 1) {
            targetRotation = Math.sin(jumpProgress * Math.PI) * 5;
          }
        }

        rotation += (targetRotation - rotation) * 0.2;

        set({
          animation: {
            ...state.animation,
            type,
            frame,
            rotation,
            animationTimer,
            actionTimer,
          },
        });
      },

      updatePosition: () => {
        const state = get();
        const now = Date.now();

        if (now - state.lastPositionUpdate < 1000) return;

        const { stats, position, animation } = state;

        if (animation.actionTimer > 0) {
          set({ lastPositionUpdate: now });
          return;
        }

        const minStat = Math.min(stats.mood, stats.hunger, stats.cleanliness, stats.energy);
        let newType: AnimationType = animation.type;
        let newDirection: Direction = animation.direction;

        if (minStat <= 0) {
          newType = 'sleep';
        } else if (minStat <= 20) {
          newType = 'idle';
        } else {
          const shouldMove = Math.random() > 0.4;
          if (shouldMove) {
            newType = 'walk';
            newDirection = Math.random() > 0.5 ? 'left' : 'right';
          } else {
            newType = Math.random() > 0.7 ? 'jump' : 'idle';
          }
        }

        let newX = position.x;
        let newY = position.y;

        if (newType === 'walk') {
          const moveSpeed = 15;
          if (newDirection === 'left') {
            newX = Math.max(10, position.x - moveSpeed);
          } else {
            newX = Math.min(CANVAS_WIDTH - SPRITE_DISPLAY_SIZE - 10, position.x + moveSpeed);
          }
        }

        if (newType === 'jump') {
          newY = position.y - 20;
          setTimeout(() => {
            set((s) => ({
              position: { ...s.position, y: position.y },
            }));
          }, 300);
        }

        set({
          position: { x: newX, y: newY },
          animation: {
            ...animation,
            type: newType,
            direction: newDirection,
          },
          lastPositionUpdate: now,
        });
      },

      checkLevelUp: () => {
        const state = get();
        if (state.experience >= 20) {
          set({
            level: state.level + 1,
            experience: 0,
            stats: {
              mood: clamp(state.stats.mood + 10, 0, 100),
              hunger: clamp(state.stats.hunger + 10, 0, 100),
              cleanliness: clamp(state.stats.cleanliness + 10, 0, 100),
              energy: clamp(state.stats.energy + 10, 0, 100),
            },
          });
        }
      },

      checkSadBubble: () => {
        const state = get();
        const { stats } = state;
        const minStat = Math.min(stats.mood, stats.hunger, stats.cleanliness, stats.energy);

        if (minStat <= 20) {
          set({
            showSadBubble: true,
            bubbleTimer: 2000,
          });
        } else if (state.showSadBubble) {
          const newBubbleTimer = state.bubbleTimer - 1000;
          if (newBubbleTimer <= 0) {
            set({
              showSadBubble: false,
              bubbleTimer: 0,
            });
          } else {
            set({ bubbleTimer: newBubbleTimer });
          }
        }
      },

      resetSprite: () => {
        set(getInitialState());
      },
    }),
    {
      name: 'pixel-pet-storage',
      partialize: (state) => ({
        name: state.name,
        level: state.level,
        experience: state.experience,
        stats: state.stats,
      }),
    }
  )
);
