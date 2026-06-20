import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GameState, GameActions, Direction, Player, Floor, Item, Enemy, Chest, Trap, Projectile, Particle } from '../types';
import { DIMENSIONS, GAME, ANIMATION, PHYSICS } from '../utils/constants';
import { LevelGenerator } from '../game/LevelGenerator';

const createInitialPlayer = (floors: Floor[]): Player => {
  const firstFloor = floors[0];
  const floorY = DIMENSIONS.CANVAS_MIN_HEIGHT - firstFloor.height;

  return {
    id: uuidv4(),
    x: 50,
    y: floorY + firstFloor.height - DIMENSIONS.PLAYER_SIZE - 4,
    width: DIMENSIONS.PLAYER_SIZE,
    height: DIMENSIONS.PLAYER_SIZE,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    gold: 0,
    experience: 0,
    experienceToNext: 100,
    level: 1,
    direction: 'right',
    isMoving: false,
    isAttacking: false,
    attackTimer: 0,
    bounceTimer: 0,
    bounceOffset: 0,
    invincible: false,
    invincibleTimer: 0,
    hurtFlash: false,
    hurtFlashTimer: 0,
  };
};

const createInitialFloors = (): Floor[] => {
  const generator = new LevelGenerator(
    DIMENSIONS.CANVAS_MIN_WIDTH,
    DIMENSIONS.CANVAS_MIN_HEIGHT
  );
  const floors: Floor[] = [];
  for (let i = 1; i <= GAME.TOTAL_FLOORS; i++) {
    floors.push(generator.generateFloor(i, GAME.TOTAL_FLOORS));
  }
  return floors;
};

const createInitialState = (): Omit<GameState, keyof GameActions> => {
  const floors = createInitialFloors();
  return {
    gameStatus: 'playing',
    player: createInitialPlayer(floors),
    currentFloor: 0,
    totalFloors: GAME.TOTAL_FLOORS,
    floors,
    timeRemaining: GAME.TIME_PER_FLOOR,
    isTimeWarning: false,
    warningAlpha: 0,
    inventory: [],
    projectiles: [],
    particles: [],
    keys: {},
  };
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...createInitialState(),

  movePlayer: (direction: Direction) => {
    set((state) => {
      if (state.gameStatus !== 'playing') return state;

      const { player, currentFloor, floors } = state;
      const floor = floors[currentFloor];
      const floorY = DIMENSIONS.CANVAS_MIN_HEIGHT - (currentFloor + 1) * floor.height;

      let newX = player.x;
      let newY = player.y;
      const speed = PHYSICS.PLAYER_SPEED;

      switch (direction) {
        case 'left':
          newX -= speed;
          break;
        case 'right':
          newX += speed;
          break;
        case 'up':
          newY -= speed;
          break;
        case 'down':
          newY += speed;
          break;
      }

      newX = Math.max(0, Math.min(newX, floor.width - player.width));
      newY = Math.max(
        floorY,
        Math.min(newY, floorY + floor.height - player.height - 4)
      );

      return {
        player: {
          ...player,
          x: newX,
          y: newY,
          direction,
          isMoving: true,
        },
      };
    });
  },

  attack: () => {
    set((state) => {
      if (state.gameStatus !== 'playing' || state.player.isAttacking) return state;

      return {
        player: {
          ...state.player,
          isAttacking: true,
          attackTimer: ANIMATION.ATTACK_DURATION,
        },
      };
    });
  },

  update: (deltaTime: number) => {
    set((state) => {
      if (state.gameStatus !== 'playing') return state;

      const { player, timeRemaining, keys } = state;

      let newAttackTimer = Math.max(0, player.attackTimer - deltaTime);
      const newIsAttacking = newAttackTimer > 0;

      let newTimeRemaining = Math.max(0, timeRemaining - deltaTime / 1000);
      const isTimeWarning = newTimeRemaining <= GAME.WARNING_TIME_THRESHOLD;

      let warningAlpha = state.warningAlpha;
      if (isTimeWarning) {
        warningAlpha = Math.min(
          1,
          warningAlpha + deltaTime / ANIMATION.WARNING_TRANSITION
        );
      }

      let newBounceTimer = (player.bounceTimer + deltaTime) % ANIMATION.BOUNCE_PERIOD;
      const bounceProgress = (Math.PI * 2 * newBounceTimer) / ANIMATION.BOUNCE_PERIOD;
      const newBounceOffset = player.isMoving
        ? Math.sin(bounceProgress) * ANIMATION.BOUNCE_AMPLITUDE
        : 0;

      let newInvincibleTimer = Math.max(0, player.invincibleTimer - deltaTime);
      const newInvincible = newInvincibleTimer > 0;

      let newHurtFlashTimer = Math.max(0, player.hurtFlashTimer - deltaTime);
      let newHurtFlash = player.hurtFlash;
      if (newHurtFlashTimer > 0) {
        const flashInterval = ANIMATION.HURT_FLASH_DURATION / ANIMATION.HURT_FLASH_COUNT;
        const flashCount = Math.floor(
          (ANIMATION.HURT_FLASH_DURATION - newHurtFlashTimer) / flashInterval
        );
        newHurtFlash = flashCount % 2 === 0;
      } else {
        newHurtFlash = false;
      }

      const isMoving = keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown'];

      return {
        player: {
          ...player,
          attackTimer: newAttackTimer,
          isAttacking: newIsAttacking,
          bounceTimer: newBounceTimer,
          bounceOffset: newBounceOffset,
          invincibleTimer: newInvincibleTimer,
          invincible: newInvincible,
          hurtFlashTimer: newHurtFlashTimer,
          hurtFlash: newHurtFlash,
          isMoving,
        },
        timeRemaining: newTimeRemaining,
        isTimeWarning,
        warningAlpha,
        gameStatus: newTimeRemaining <= 0 ? 'gameover' : state.gameStatus,
      };
    });
  },

  nextFloor: () => {
    set((state) => {
      const newFloor = state.currentFloor + 1;
      if (newFloor >= state.totalFloors) {
        return {
          ...state,
          gameStatus: 'victory',
        };
      }

      const floor = state.floors[newFloor];
      const floorY = DIMENSIONS.CANVAS_MIN_HEIGHT - (newFloor + 1) * floor.height;

      return {
        currentFloor: newFloor,
        timeRemaining: GAME.TIME_PER_FLOOR,
        isTimeWarning: false,
        warningAlpha: 0,
        player: {
          ...state.player,
          x: 50,
          y: floorY + floor.height - state.player.height - 4,
          direction: 'right',
          isMoving: false,
          invincible: true,
          invincibleTimer: GAME.INVINCIBLE_DURATION,
        },
      };
    });
  },

  restart: () => {
    const newFloors = createInitialFloors();
    set({
      ...createInitialState(),
      floors: newFloors,
      player: createInitialPlayer(newFloors),
    });
  },

  setKey: (key: string, pressed: boolean) => {
    set((state) => ({
      keys: {
        ...state.keys,
        [key]: pressed,
      },
    }));
  },

  addToInventory: (item: Item) => {
    set((state) => ({
      inventory: [...state.inventory, item],
    }));
  },

  addGold: (amount: number) => {
    set((state) => ({
      player: {
        ...state.player,
        gold: state.player.gold + amount,
      },
    }));
  },

  addExperience: (amount: number) => {
    set((state) => {
      let newExperience = state.player.experience + amount;
      let newLevel = state.player.level;
      let newExperienceToNext = state.player.experienceToNext;
      let newMaxHealth = state.player.maxHealth;
      let newHealth = state.player.health;
      let newAttack = state.player.attack;
      let newDefense = state.player.defense;

      while (newExperience >= newExperienceToNext) {
        newExperience -= newExperienceToNext;
        newLevel++;
        newExperienceToNext = Math.floor(newExperienceToNext * 1.5);
        newMaxHealth += 10;
        newHealth = newMaxHealth;
        newAttack += 2;
        newDefense += 1;
      }

      return {
        player: {
          ...state.player,
          experience: newExperience,
          level: newLevel,
          experienceToNext: newExperienceToNext,
          maxHealth: newMaxHealth,
          health: newHealth,
          attack: newAttack,
          defense: newDefense,
        },
      };
    });
  },

  damagePlayer: (amount: number) => {
    set((state) => {
      if (state.player.invincible) return state;

      const actualDamage = Math.max(1, amount - state.player.defense);
      const newHealth = Math.max(0, state.player.health - actualDamage);

      return {
        player: {
          ...state.player,
          health: newHealth,
          invincible: true,
          invincibleTimer: GAME.INVINCIBLE_DURATION,
          hurtFlash: true,
          hurtFlashTimer: ANIMATION.HURT_FLASH_DURATION,
        },
        gameStatus: newHealth <= 0 ? 'gameover' : state.gameStatus,
      };
    });
  },

  updateEnemies: (enemies: Enemy[]) => {
    set((state) => {
      const newFloors = [...state.floors];
      newFloors[state.currentFloor] = {
        ...newFloors[state.currentFloor],
        enemies,
      };
      return { floors: newFloors };
    });
  },

  updateChests: (chests: Chest[]) => {
    set((state) => {
      const newFloors = [...state.floors];
      newFloors[state.currentFloor] = {
        ...newFloors[state.currentFloor],
        chests,
      };
      return { floors: newFloors };
    });
  },

  updateTraps: (traps: Trap[]) => {
    set((state) => {
      const newFloors = [...state.floors];
      newFloors[state.currentFloor] = {
        ...newFloors[state.currentFloor],
        traps,
      };
      return { floors: newFloors };
    });
  },

  addProjectile: (projectile: Projectile) => {
    set((state) => ({
      projectiles: [...state.projectiles, projectile],
    }));
  },

  updateProjectiles: (projectiles: Projectile[]) => {
    set({ projectiles });
  },

  addParticles: (particles: Particle[]) => {
    set((state) => ({
      particles: [...state.particles, ...particles],
    }));
  },

  updateParticles: (particles: Particle[]) => {
    set({ particles });
  },
}));
