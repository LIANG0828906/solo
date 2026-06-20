export type ShipStatus = 'normal' | 'warping' | 'disturbed';

export interface Ship {
  id: string;
  type: 'lead' | 'escort';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  homeX: number;
  homeY: number;
  homeAngleOffset: number;
  status: ShipStatus;
  disturbedUntil: number;
  disturbedDx: number;
  disturbedDy: number;
  returningStart: number;
  returningDuration: number;
  returningFromX: number;
  returningFromY: number;
}

export interface LogEntry {
  timestamp: number;
  message: string;
  opacity: number;
  id: number;
}

export interface Nebula {
  x: number;
  y: number;
  radius: number;
}

export interface Wormhole {
  x: number;
  y: number;
  rotation: number;
}

export interface GravityWave {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
  nebulaIndex: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinklePhase: number;
  twinklePeriod: number;
}

export type { DataState };

class DataState {
  private static instance: DataState;
  private ships: Ship[] = [];
  private logs: LogEntry[] = [];
  private nebulas: Nebula[] = [];
  private wormholes: Wormhole[] = [];
  private gravityWaves: GravityWave[] = [];
  private stars: Star[] = [];
  private guideX: number = 0;
  private guideY: number = 0;
  private logCounter: number = 0;
  private lastUpdate: number = 0;

  private constructor() {}

  static getInstance(): DataState {
    if (!DataState.instance) {
      DataState.instance = new DataState();
    }
    return DataState.instance;
  }

  initStars(count: number, width: number, height: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random(),
        baseOpacity: 0.3 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinklePeriod: 2 + Math.random() * 3
      });
    }
  }

  getStars(): Star[] {
    return this.stars;
  }

  setShips(ships: Ship[]): void {
    this.ships = ships;
  }

  getShips(): Ship[] {
    return this.ships;
  }

  getLeadShip(): Ship | undefined {
    return this.ships.find(s => s.type === 'lead');
  }

  getEscortShips(): Ship[] {
    return this.ships.filter(s => s.type === 'escort');
  }

  updateShipPosition(id: string, x: number, y: number): void {
    const ship = this.ships.find(s => s.id === id);
    if (ship) {
      ship.x = x;
      ship.y = y;
    }
  }

  updateShipStatus(id: string, status: ShipStatus): void {
    const ship = this.ships.find(s => s.id === id);
    if (ship) {
      ship.status = status;
    }
  }

  setAllShipsStatus(status: ShipStatus): void {
    this.ships.forEach(s => s.status = status);
  }

  setNebulas(nebulas: Nebula[]): void {
    this.nebulas = nebulas;
  }

  getNebulas(): Nebula[] {
    return this.nebulas;
  }

  setWormholes(wormholes: Wormhole[]): void {
    this.wormholes = wormholes;
  }

  getWormholes(): Wormhole[] {
    return this.wormholes;
  }

  addGravityWave(wave: GravityWave): void {
    this.gravityWaves.push(wave);
  }

  getGravityWaves(): GravityWave[] {
    return this.gravityWaves;
  }

  removeGravityWave(index: number): void {
    this.gravityWaves.splice(index, 1);
  }

  setGuidePosition(x: number, y: number): void {
    this.guideX = x;
    this.guideY = y;
  }

  getGuidePosition(): { x: number; y: number } {
    return { x: this.guideX, y: this.guideY };
  }

  addLog(message: string): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      message,
      opacity: 0,
      id: ++this.logCounter
    };
    this.logs.unshift(entry);
    if (this.logs.length > 20) {
      this.logs.pop();
    }
    const start = performance.now();
    const fadeIn = () => {
      const elapsed = performance.now() - start;
      if (elapsed < 200) {
        entry.opacity = elapsed / 200;
        requestAnimationFrame(fadeIn);
      } else {
        entry.opacity = 1;
      }
    };
    requestAnimationFrame(fadeIn);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getLastUpdate(): number {
    return this.lastUpdate;
  }

  setLastUpdate(time: number): void {
    this.lastUpdate = time;
  }

  getFormationIntegrity(): number {
    const escorts = this.getEscortShips();
    if (escorts.length === 0) return 100;
    let totalOffset = 0;
    const now = performance.now();
    escorts.forEach(ship => {
      if (ship.status === 'disturbed' && ship.disturbedUntil > now) {
        totalOffset += 0;
      } else {
        const dx = ship.x - ship.homeX;
        const dy = ship.y - ship.homeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        totalOffset += dist;
      }
    });
    const avgOffset = totalOffset / escorts.length;
    const integrity = Math.max(0, 100 - (avgOffset / 15) * 100);
    return Math.round(integrity);
  }

  getFleetCenter(): { x: number; y: number } {
    if (this.ships.length === 0) return { x: 0, y: 0 };
    let sumX = 0;
    let sumY = 0;
    this.ships.forEach(s => {
      sumX += s.x;
      sumY += s.y;
    });
    return { x: sumX / this.ships.length, y: sumY / this.ships.length };
  }
}

export const dataState = DataState.getInstance();
