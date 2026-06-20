import { v4 as uuidv4 } from 'uuid';
import type { Ship, GameEvent, CargoItem, EventLog, Planet } from './types';

export function createInitialShip(planetId: string): Ship {
  return {
    x: 0,
    y: 0,
    fuel: 100,
    maxFuel: 100,
    credits: 500,
    reputation: 50,
    cargoCapacity: 20,
    cargo: [],
    currentPlanetId: planetId,
  };
}

export function getCargoUsed(ship: Ship): number {
  return ship.cargo.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCargoFree(ship: Ship): number {
  return ship.cargoCapacity - getCargoUsed(ship);
}

export function canBuy(ship: Ship, quantity: number): boolean {
  return getCargoFree(ship) >= quantity;
}

export function canSell(ship: Ship, commodityId: string, quantity: number): boolean {
  const item = ship.cargo.find(c => c.commodityId === commodityId);
  return !!item && item.quantity >= quantity;
}

export function buyCommodity(ship: Ship, commodityId: string, name: string, price: number, quantity: number): Ship {
  const totalCost = price * quantity;
  if (ship.credits < totalCost || !canBuy(ship, quantity)) return ship;
  const newCargo = [...ship.cargo];
  const existing = newCargo.find(c => c.commodityId === commodityId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    newCargo.push({ commodityId, name, quantity });
  }
  return {
    ...ship,
    credits: ship.credits - totalCost,
    cargo: newCargo,
  };
}

export function sellCommodity(ship: Ship, commodityId: string, quantity: number, price: number): Ship {
  if (!canSell(ship, commodityId, quantity)) return ship;
  const newCargo = ship.cargo
    .map(c => {
      if (c.commodityId === commodityId) {
        return { ...c, quantity: c.quantity - quantity };
      }
      return c;
    })
    .filter(c => c.quantity > 0);
  return {
    ...ship,
    credits: ship.credits + price * quantity,
    cargo: newCargo,
  };
}

export function moveShip(ship: Ship, planet: Planet): Ship {
  if (ship.fuel < 1) return ship;
  return {
    ...ship,
    x: planet.x,
    y: planet.y,
    fuel: ship.fuel - 1,
    currentPlanetId: planet.id,
  };
}

export function upgradeCargo(ship: Ship): Ship | null {
  if (ship.credits < 500 || ship.reputation < 60) return null;
  return {
    ...ship,
    credits: ship.credits - 500,
    cargoCapacity: ship.cargoCapacity + 5,
  };
}

export function upgradeFuelTank(ship: Ship): Ship | null {
  if (ship.credits < 300 || ship.reputation < 60) return null;
  return {
    ...ship,
    credits: ship.credits - 300,
    maxFuel: ship.maxFuel + 20,
    fuel: Math.min(ship.fuel + 20, ship.maxFuel + 20),
  };
}

export function applyEventEffect(ship: Ship, effectType: string, effectValue: number): Ship {
  const newShip = { ...ship };
  switch (effectType) {
    case 'loseCargo': {
      const totalCargo = getCargoUsed(ship);
      const loseCount = Math.max(1, Math.floor(totalCargo * effectValue));
      let remaining = loseCount;
      const newCargo = ship.cargo.map(c => {
        if (remaining <= 0) return c;
        const lose = Math.min(c.quantity, remaining);
        remaining -= lose;
        return { ...c, quantity: c.quantity - lose };
      }).filter(c => c.quantity > 0);
      newShip.cargo = newCargo;
      break;
    }
    case 'loseFuel':
      newShip.fuel = Math.max(0, ship.fuel - effectValue);
      break;
    case 'loseCredits':
      newShip.credits = Math.max(0, ship.credits - effectValue);
      break;
    case 'gainCredits':
      newShip.credits = ship.credits + effectValue;
      break;
    case 'gainReputation':
      newShip.reputation = Math.min(100, ship.reputation + effectValue);
      break;
    case 'loseReputation':
      newShip.reputation = Math.max(0, ship.reputation - effectValue);
      break;
    case 'gainFuel':
      newShip.fuel = Math.min(ship.maxFuel, ship.fuel + effectValue);
      break;
  }
  return newShip;
}

export function processEventChoice(ship: Ship, event: GameEvent, optionIndex: number): { ship: Ship; log: EventLog } {
  const option = event.options[optionIndex];
  const newShip = applyEventEffect(ship, option.effectType, option.effectValue);
  const effectDesc = option.isPositive
    ? `${event.name}: ${option.text}`
    : `${event.name}: ${option.text}`;
  return {
    ship: newShip,
    log: {
      id: uuidv4(),
      message: effectDesc,
      isPositive: option.isPositive,
      timestamp: Date.now(),
    },
  };
}

export function updatePlanetTradeRefusal(planets: Planet[], reputation: number): Planet[] {
  return planets.map(p => ({
    ...p,
    refusesTrade: reputation < 30 && Math.random() < 0.5,
  }));
}
