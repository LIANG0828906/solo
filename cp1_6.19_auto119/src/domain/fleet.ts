import type { Ship, ShipType, WeaponType, FormationType } from '../eventBus';

const SHIP_TYPES: ShipType[] = ['destroyer', 'cruiser', 'capital'];
const WEAPON_TYPES: WeaponType[] = ['laser', 'missile', 'railgun'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createShip(
  type: ShipType,
  x: number,
  y: number,
  weaponType?: WeaponType
): Ship {
  const healthMap: Record<ShipType, number> = {
    destroyer: 50,
    cruiser: 100,
    capital: 200,
  };
  return {
    id: generateId(),
    type,
    x,
    y,
    targetX: x,
    targetY: y,
    weaponType: weaponType ?? randomChoice(WEAPON_TYPES),
    health: healthMap[type],
    maxHealth: healthMap[type],
  };
}

export function generateRandomFleet(
  centerX: number,
  centerY: number,
  minCount: number = 6,
  maxCount: number = 10
): Ship[] {
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  const ships: Ship[] = [];

  for (let i = 0; i < count; i++) {
    const type = randomChoice(SHIP_TYPES);
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;
    ships.push(createShip(type, x, y));
  }

  return ships;
}

export function generateFormationPositions(
  formation: FormationType,
  shipCount: number,
  centerX: number,
  centerY: number,
  spacing: number = 50
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];

  switch (formation) {
    case 'wedge': {
      let row = 0;
      let placed = 0;
      while (placed < shipCount) {
        const shipsInRow = row + 1;
        const rowY = centerY - row * spacing;
        const startX = centerX - (shipsInRow - 1) * spacing / 2;
        for (let i = 0; i < shipsInRow && placed < shipCount; i++) {
          positions.push({ x: startX + i * spacing, y: rowY });
          placed++;
        }
        row++;
      }
      break;
    }
    case 'cylinder': {
      const radius = spacing * 1.5;
      for (let i = 0; i < shipCount; i++) {
        const angle = (i / shipCount) * Math.PI * 2 - Math.PI / 2;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }
      break;
    }
    case 'diamond': {
      const layers = Math.ceil(Math.sqrt(shipCount));
      let placed = 0;
      for (let layer = 0; layer < layers && placed < shipCount; layer++) {
        if (layer === 0) {
          positions.push({ x: centerX, y: centerY });
          placed++;
        } else {
          const points = [
            { x: centerX, y: centerY - layer * spacing },
            { x: centerX + layer * spacing, y: centerY },
            { x: centerX, y: centerY + layer * spacing },
            { x: centerX - layer * spacing, y: centerY },
          ];
          for (const p of points) {
            if (placed < shipCount) {
              positions.push(p);
              placed++;
            }
          }
        }
      }
      break;
    }
    case 'line': {
      const startX = centerX - ((shipCount - 1) * spacing) / 2;
      for (let i = 0; i < shipCount; i++) {
        positions.push({ x: startX + i * spacing, y: centerY });
      }
      break;
    }
  }

  return positions;
}

export function applyFormation(
  ships: Ship[],
  formation: FormationType,
  centerX: number,
  centerY: number
): Ship[] {
  const positions = generateFormationPositions(formation, ships.length, centerX, centerY);
  return ships.map((ship, index) => ({
    ...ship,
    targetX: positions[index].x,
    targetY: positions[index].y,
  }));
}
