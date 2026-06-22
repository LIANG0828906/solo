export interface Ship {
  id: number;
  angle: number;
  radius: number;
  speed: number;
  lastMineTime: number;
}

export interface Asteroid {
  level: number;
  capacity: number;
  oreCount: number;
  mineralSpots: MineralSpot[];
}

export interface MineralSpot {
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  twinklePhase: number;
}

export interface GameState {
  coins: number;
  laserLevel: number;
  shipCount: number;
  asteroidLevel: number;
  asteroid: Asteroid;
  ships: Ship[];
  asteroidTransition: boolean;
  transitionText: string;
  transitionAlpha: number;
  asteroidBreaking: boolean;
  breakProgress: number;
}

const LASER_MAX_LEVEL = 10;
const SHIP_MAX_LEVEL = 8;
const ASTEROID_MAX_LEVEL = 10;
const BASE_CAPACITY = 1000;

export function getLaserCost(level: number): number {
  return Math.floor(100 * Math.pow(level, 2));
}

export function getShipCost(level: number): number {
  return Math.floor(200 * Math.pow(level, 2));
}

export function getAsteroidCost(level: number): number {
  return Math.floor(500 * Math.pow(level, 2));
}

function generateMineralSpots(asteroidRadius: number, count: number): MineralSpot[] {
  const spots: MineralSpot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = asteroidRadius * (0.3 + Math.random() * 0.5);
    spots.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      angle,
      distance,
      size: 3 + Math.random() * 4,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  return spots;
}

export function createAsteroid(level: number): Asteroid {
  const capacity = BASE_CAPACITY * Math.pow(2, level - 1);
  const spotCount = 3 + Math.floor(Math.random() * 3);
  return {
    level,
    capacity,
    oreCount: 0,
    mineralSpots: generateMineralSpots(80, spotCount),
  };
}

export function createShip(id: number): Ship {
  return {
    id,
    angle: Math.random() * Math.PI * 2,
    radius: 80 + Math.random() * 40,
    speed: (0.8 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1),
    lastMineTime: 0,
  };
}

export function createInitialState(): GameState {
  return {
    coins: 0,
    laserLevel: 1,
    shipCount: 0,
    asteroidLevel: 1,
    asteroid: createAsteroid(1),
    ships: [],
    asteroidTransition: false,
    transitionText: '',
    transitionAlpha: 0,
    asteroidBreaking: false,
    breakProgress: 0,
  };
}

export function upgradeLaser(state: GameState): GameState {
  if (state.laserLevel >= LASER_MAX_LEVEL) return state;
  const cost = getLaserCost(state.laserLevel);
  if (state.coins < cost) return state;
  return {
    ...state,
    coins: state.coins - cost,
    laserLevel: state.laserLevel + 1,
  };
}

export function upgradeShip(state: GameState): GameState {
  if (state.shipCount >= SHIP_MAX_LEVEL) return state;
  const cost = getShipCost(state.shipCount);
  if (state.coins < cost) return state;
  const newShip = createShip(state.shipCount);
  return {
    ...state,
    coins: state.coins - cost,
    shipCount: state.shipCount + 1,
    ships: [...state.ships, newShip],
  };
}

export function upgradeAsteroid(state: GameState): GameState {
  if (state.asteroidLevel >= ASTEROID_MAX_LEVEL) return state;
  const cost = getAsteroidCost(state.asteroidLevel);
  if (state.coins < cost) return state;
  const nextLevel = state.asteroidLevel + 1;
  return {
    ...state,
    coins: state.coins - cost,
    asteroidLevel: nextLevel,
    asteroid: createAsteroid(nextLevel),
  };
}

export function clickMine(state: GameState): GameState {
  if (state.asteroid.oreCount >= state.asteroid.capacity) return state;
  const oreGained = state.laserLevel;
  const newOreCount = Math.min(state.asteroid.oreCount + oreGained, state.asteroid.capacity);
  const actualGained = newOreCount - state.asteroid.oreCount;
  return {
    ...state,
    coins: state.coins + actualGained,
    asteroid: {
      ...state.asteroid,
      oreCount: newOreCount,
    },
  };
}

export function autoMine(state: GameState, deltaTime: number, currentTime: number): GameState {
  if (state.ships.length === 0) return state;
  if (state.asteroid.oreCount >= state.asteroid.capacity) return state;

  let totalOre = 0;
  const updatedShips = state.ships.map((ship) => {
    if (currentTime - ship.lastMineTime >= 1000) {
      totalOre += 1;
      return { ...ship, lastMineTime: currentTime };
    }
    return ship;
  });

  if (totalOre === 0) return state;

  const newOreCount = Math.min(state.asteroid.oreCount + totalOre, state.asteroid.capacity);
  const actualGained = newOreCount - state.asteroid.oreCount;

  return {
    ...state,
    coins: state.coins + actualGained,
    ships: updatedShips,
    asteroid: {
      ...state.asteroid,
      oreCount: newOreCount,
    },
  };
}

export function updateShips(state: GameState, deltaTime: number): GameState {
  const updatedShips = state.ships.map((ship) => ({
    ...ship,
    angle: ship.angle + ship.speed * deltaTime * 0.001,
  }));
  return { ...state, ships: updatedShips };
}

export function checkAsteroidFull(state: GameState): GameState {
  if (state.asteroid.oreCount >= state.asteroid.capacity && !state.asteroidBreaking && !state.asteroidTransition) {
    return { ...state, asteroidBreaking: true, breakProgress: 0 };
  }
  return state;
}

export { LASER_MAX_LEVEL, SHIP_MAX_LEVEL, ASTEROID_MAX_LEVEL };
