export type OreType = 'iron' | 'copper' | 'crystal';
export type DroneStatus = 'idle' | 'flying' | 'mining' | 'returning' | 'crashed';

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  diameter: number;
  oreType: OreType;
  oreReserve: number;
  maxReserve: number;
  rotationAngle: number;
  rotationSpeed: number;
}

export interface Drone {
  id: string;
  number: number;
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  fuel: number;
  maxFuel: number;
  status: DroneStatus;
  currentAsteroidId: string | null;
  cargoType: OreType | null;
  cargoAmount: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

export interface CrashEffect {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  phase: number;
  period: number;
}

export interface Inventory {
  iron: number;
  copper: number;
  crystal: number;
}

export interface GameState {
  asteroids: Asteroid[];
  drones: Drone[];
  inventory: Inventory;
  money: number;
  timeRemaining: number;
  totalTime: number;
  isGameOver: boolean;
  floatingTexts: FloatingText[];
  crashEffects: CrashEffect[];
  stars: Star[];
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const BASE_X = 40;
export const BASE_Y = CANVAS_HEIGHT - 40;
export const GAME_DURATION = 120;
export const DRONE_COUNT = 3;
export const DRONE_SPEED = 80;
export const DRONE_MAX_FUEL = 100;
export const FUEL_PER_PIXEL = 0.01;
export const MINING_RATE = 5;
export const FUEL_THRESHOLD = 10;
export const ASTEROID_MIN_COUNT = 20;
export const ASTEROID_MAX_COUNT = 30;
export const ASTEROID_MIN_DIAMETER = 25;
export const ASTEROID_MAX_DIAMETER = 45;
export const ASTEROID_MIN_RESERVE = 80;
export const ASTEROID_MAX_RESERVE = 150;
export const ASTEROID_ROTATION_PERIOD = 1.5;
export const BOUNDARY_MARGIN = 30;
export const DRONE_RADIUS = 6;

export const ORE_PRICES: Record<OreType, number> = {
  iron: 1,
  copper: 2,
  crystal: 5,
};

export const ORE_COLORS: Record<OreType, string> = {
  iron: '#A0522D',
  copper: '#CD7F32',
  crystal: '#7FFFD4',
};

export const ORE_NAMES: Record<OreType, string> = {
  iron: '铁',
  copper: '铜',
  crystal: '水晶',
};

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(random(min, max + 1));
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: random(0, CANVAS_WIDTH),
      y: random(0, CANVAS_HEIGHT),
      size: random(1, 2),
      baseOpacity: random(0.5, 1),
      phase: random(0, Math.PI * 2),
      period: random(2, 4),
    });
  }
  return stars;
}

function generateAsteroids(): Asteroid[] {
  const asteroids: Asteroid[] = [];
  const count = randomInt(ASTEROID_MIN_COUNT, ASTEROID_MAX_COUNT);
  const oreTypes: OreType[] = ['iron', 'copper', 'crystal'];
  let attempts = 0;
  const maxAttempts = count * 50;

  while (asteroids.length < count && attempts < maxAttempts) {
    attempts++;
    const diameter = random(ASTEROID_MIN_DIAMETER, ASTEROID_MAX_DIAMETER);
    const radius = diameter / 2;
    const x = random(BOUNDARY_MARGIN + radius + 50, CANVAS_WIDTH - BOUNDARY_MARGIN - radius);
    const y = random(BOUNDARY_MARGIN + radius + 60, CANVAS_HEIGHT - BOUNDARY_MARGIN - radius - 50);

    let overlaps = false;
    for (const other of asteroids) {
      const dx = x - other.x;
      const dy = y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius + other.diameter / 2 + 5) {
        overlaps = true;
        break;
      }
    }

    const dxBase = x - BASE_X;
    const dyBase = y - BASE_Y;
    if (Math.sqrt(dxBase * dxBase + dyBase * dyBase) < 60 + radius) {
      overlaps = true;
    }

    if (!overlaps) {
      const reserve = randomInt(ASTEROID_MIN_RESERVE, ASTEROID_MAX_RESERVE);
      asteroids.push({
        id: generateId(),
        x,
        y,
        diameter,
        oreType: oreTypes[randomInt(0, 2)],
        oreReserve: reserve,
        maxReserve: reserve,
        rotationAngle: random(0, Math.PI * 2),
        rotationSpeed: (Math.PI * 2) / ASTEROID_ROTATION_PERIOD,
      });
    }
  }

  return asteroids;
}

function generateDrones(): Drone[] {
  const drones: Drone[] = [];
  for (let i = 0; i < DRONE_COUNT; i++) {
    drones.push({
      id: generateId(),
      number: i + 1,
      x: BASE_X + (i - 1) * 20,
      y: BASE_Y + (i - 1) * 12,
      targetX: null,
      targetY: null,
      fuel: DRONE_MAX_FUEL,
      maxFuel: DRONE_MAX_FUEL,
      status: 'idle',
      currentAsteroidId: null,
      cargoType: null,
      cargoAmount: 0,
    });
  }
  return drones;
}

export function createInitialState(): GameState {
  return {
    asteroids: generateAsteroids(),
    drones: generateDrones(),
    inventory: { iron: 0, copper: 0, crystal: 0 },
    money: 0,
    timeRemaining: GAME_DURATION,
    totalTime: GAME_DURATION,
    isGameOver: false,
    floatingTexts: [],
    crashEffects: [],
    stars: generateStars(),
  };
}

export type GameAction =
  | { type: 'DISPATCH_DRONES'; x: number; y: number }
  | { type: 'RECALL_DRONE'; droneId: string }
  | { type: 'TICK_LOGIC' }
  | { type: 'TICK_RENDER'; delta: number; time: number }
  | { type: 'RESET' };

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DISPATCH_DRONES': {
      const idleDrones = state.drones.filter((d) => d.status === 'idle');
      if (idleDrones.length === 0) return state;
      const drone = idleDrones[0];
      const updatedDrones = state.drones.map((d) =>
        d.id === drone.id
          ? { ...d, targetX: action.x, targetY: action.y, status: 'flying' as DroneStatus }
          : d
      );
      return { ...state, drones: updatedDrones };
    }

    case 'RECALL_DRONE': {
      const updatedDrones = state.drones.map((d) => {
        if (d.id !== action.droneId || d.status === 'idle' || d.status === 'crashed') return d;
        return {
          ...d,
          status: 'returning' as DroneStatus,
          targetX: BASE_X,
          targetY: BASE_Y,
          currentAsteroidId: null,
        };
      });
      return { ...state, drones: updatedDrones };
    }

    case 'RESET': {
      return createInitialState();
    }

    case 'TICK_RENDER': {
      const { delta, time } = action;
      const updatedAsteroids = state.asteroids.map((a) => ({
        ...a,
        rotationAngle: a.rotationAngle + a.rotationSpeed * delta,
      }));
      const now = Date.now();
      const floatingTexts = state.floatingTexts.filter((t) => now - t.createdAt < 1000);
      const crashEffects = state.crashEffects.filter((c) => now - c.createdAt < 300);
      return {
        ...state,
        asteroids: updatedAsteroids,
        floatingTexts,
        crashEffects,
      };
    }

    case 'TICK_LOGIC': {
      if (state.isGameOver) return state;

      let timeRemaining = state.timeRemaining - 1;
      let inventory = { ...state.inventory };
      let money = state.money;
      let floatingTexts = [...state.floatingTexts];
      let crashEffects = [...state.crashEffects];
      let asteroids = state.asteroids.map((a) => ({ ...a }));
      let drones = state.drones.map((d) => ({ ...d }));
      const now = Date.now();

      for (let i = 0; i < drones.length; i++) {
        const drone = drones[i];
        if (drone.status === 'crashed' || drone.status === 'idle') continue;

        if (drone.status === 'mining') {
          const asteroid = asteroids.find((a) => a.id === drone.currentAsteroidId);
          if (!asteroid || asteroid.oreReserve <= 0) {
            drone.status = 'returning';
            drone.targetX = BASE_X;
            drone.targetY = BASE_Y;
            drone.currentAsteroidId = null;
            continue;
          }
          if (drone.fuel <= FUEL_THRESHOLD) {
            drone.status = 'returning';
            drone.targetX = BASE_X;
            drone.targetY = BASE_Y;
            drone.currentAsteroidId = null;
            continue;
          }
          const mineAmount = Math.min(MINING_RATE, asteroid.oreReserve);
          asteroid.oreReserve -= mineAmount;
          drone.cargoAmount += mineAmount;
          drone.cargoType = asteroid.oreType;
          drone.fuel = Math.max(0, drone.fuel - mineAmount * 0.1);
          floatingTexts.push({
            id: generateId(),
            x: asteroid.x + random(-10, 10),
            y: asteroid.y - asteroid.diameter / 2,
            text: `+${mineAmount}`,
            createdAt: now,
          });
          if (asteroid.oreReserve <= 0) {
            drone.status = 'returning';
            drone.targetX = BASE_X;
            drone.targetY = BASE_Y;
            drone.currentAsteroidId = null;
          }
          continue;
        }

        if (drone.status === 'flying' || drone.status === 'returning') {
          if (drone.targetX === null || drone.targetY === null) continue;

          const dx = drone.targetX - drone.x;
          const dy = drone.targetY - drone.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let moveDist = DRONE_SPEED;
          let reachedTarget = false;

          if (dist <= moveDist) {
            moveDist = dist;
            reachedTarget = true;
          }

          const fuelCost = moveDist * FUEL_PER_PIXEL;
          if (drone.fuel < fuelCost && drone.status !== 'returning') {
            const actualDist = drone.fuel / FUEL_PER_PIXEL;
            const ratio = actualDist / dist;
            drone.x += dx * ratio;
            drone.y += dy * ratio;
            drone.fuel = 0;
            drone.status = 'crashed';
            drone.targetX = null;
            drone.targetY = null;
            drone.currentAsteroidId = null;
            drone.cargoAmount = 0;
            drone.cargoType = null;
            crashEffects.push({
              id: generateId(),
              x: drone.x,
              y: drone.y,
              createdAt: now,
            });
            continue;
          }

          drone.fuel = Math.max(0, drone.fuel - fuelCost);
          const ratio = moveDist / dist;
          drone.x += dx * ratio;
          drone.y += dy * ratio;

          let crashed = false;
          for (const asteroid of asteroids) {
            const adx = drone.x - asteroid.x;
            const ady = drone.y - asteroid.y;
            const adist = Math.sqrt(adx * adx + ady * ady);
            if (adist < DRONE_RADIUS + asteroid.diameter / 2 && asteroid.id !== drone.currentAsteroidId) {
              crashed = true;
              break;
            }
          }

          if (crashed && drone.status !== 'returning' && drone.currentAsteroidId === null) {
            drone.status = 'crashed';
            drone.targetX = null;
            drone.targetY = null;
            drone.currentAsteroidId = null;
            drone.cargoAmount = 0;
            drone.cargoType = null;
            crashEffects.push({
              id: generateId(),
              x: drone.x,
              y: drone.y,
              createdAt: now,
            });
            continue;
          }

          if (drone.fuel <= 0 && drone.status !== 'returning') {
            drone.status = 'crashed';
            drone.targetX = null;
            drone.targetY = null;
            drone.currentAsteroidId = null;
            drone.cargoAmount = 0;
            drone.cargoType = null;
            crashEffects.push({
              id: generateId(),
              x: drone.x,
              y: drone.y,
              createdAt: now,
            });
            continue;
          }

          if (reachedTarget) {
            if (drone.status === 'returning') {
              if (drone.cargoType && drone.cargoAmount > 0) {
                inventory[drone.cargoType] += drone.cargoAmount;
                money += drone.cargoAmount * ORE_PRICES[drone.cargoType];
              }
              drone.status = 'idle';
              drone.targetX = null;
              drone.targetY = null;
              drone.fuel = DRONE_MAX_FUEL;
              drone.cargoAmount = 0;
              drone.cargoType = null;
              drone.x = BASE_X;
              drone.y = BASE_Y;
            } else if (drone.status === 'flying') {
              let closest: Asteroid | null = null;
              let closestDist = Infinity;
              for (const asteroid of asteroids) {
                if (asteroid.oreReserve <= 0) continue;
                const adx = asteroid.x - drone.x;
                const ady = asteroid.y - drone.y;
                const adist = Math.sqrt(adx * adx + ady * ady);
                if (adist < closestDist) {
                  closestDist = adist;
                  closest = asteroid;
                }
              }

              if (closest) {
                drone.status = 'mining';
                drone.currentAsteroidId = closest.id;
                drone.targetX = closest.x;
                drone.targetY = closest.y;
                drone.x = closest.x;
                drone.y = closest.y;
              } else {
                drone.status = 'returning';
                drone.targetX = BASE_X;
                drone.targetY = BASE_Y;
              }
            }
          }

          if (drone.status === 'flying' && drone.fuel <= FUEL_THRESHOLD) {
            const distToBase = Math.sqrt(
              Math.pow(BASE_X - drone.x, 2) + Math.pow(BASE_Y - drone.y, 2)
            );
            const fuelNeeded = distToBase * FUEL_PER_PIXEL;
            if (drone.fuel <= fuelNeeded + 1) {
              drone.status = 'returning';
              drone.targetX = BASE_X;
              drone.targetY = BASE_Y;
              drone.currentAsteroidId = null;
            }
          }
        }
      }

      let isGameOver: boolean = state.isGameOver;
      if (timeRemaining <= 0) {
        isGameOver = true;
        timeRemaining = 0;
      }

      return {
        ...state,
        asteroids,
        drones,
        inventory,
        money,
        timeRemaining,
        isGameOver,
        floatingTexts,
        crashEffects,
      };
    }

    default:
      return state;
  }
}

export function calculateFinalMoney(state: GameState): number {
  return state.money;
}
