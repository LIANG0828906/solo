import { SymbolType, MechanismDoor, PressurePlate, Position } from './GameCore';

export interface PuzzleHint {
  doorSymbol: SymbolType;
  platePosition: Position;
  message: string;
}

export class PuzzleModule {
  private doorPlateMap: Map<SymbolType, SymbolType> = new Map();

  constructor(doors: MechanismDoor[], plates: PressurePlate[]) {
    for (const door of doors) {
      for (const plate of plates) {
        if (plate.symbol === door.symbol) {
          this.doorPlateMap.set(door.symbol, plate.symbol);
          break;
        }
      }
    }
  }

  getHintForDoor(doorSymbol: SymbolType): PuzzleHint | null {
    const plateSymbol = this.doorPlateMap.get(doorSymbol);
    if (!plateSymbol) return null;

    const symbolNames: Record<SymbolType, string> = {
      [SymbolType.Diamond]: '菱形',
      [SymbolType.Hexagon]: '六边形',
      [SymbolType.Star]: '星形',
      [SymbolType.Wave]: '波浪形',
    };

    return {
      doorSymbol,
      platePosition: { row: -1, col: -1 },
      message: `${symbolNames[doorSymbol]}门需要踩下带有${symbolNames[plateSymbol]}标记的压力板`,
    };
  }

  canOpenDoor(doorSymbol: SymbolType, plate: PressurePlate): boolean {
    return plate.symbol === doorSymbol && plate.activated;
  }

  getUnsolvedHint(doors: MechanismDoor[], plates: PressurePlate[]): PuzzleHint | null {
    for (const door of doors) {
      if (!door.open) {
        const matchingPlate = plates.find(p => p.symbol === door.symbol && !p.activated);
        if (matchingPlate) {
          return this.getHintForDoor(door.symbol);
        } else if (plates.find(p => p.symbol === door.symbol && p.activated)) {
          continue;
        }
        return this.getHintForDoor(door.symbol);
      }
    }
    return null;
  }

  tryActivatePlate(plateSymbol: SymbolType, doors: MechanismDoor[], plates: PressurePlate[]): MechanismDoor | null {
    const plate = plates.find(p => p.symbol === plateSymbol);
    if (!plate) return null;

    plate.activated = true;

    const door = doors.find(d => d.symbol === plateSymbol && !d.open);
    if (door) {
      return door;
    }
    return null;
  }
}
