import { v4 as uuidv4 } from 'uuid';
import {
  useGameStore,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  GEAR_ROTATION_SPEED,
  PLATFORM_DURATION,
  ARM_SPEED,
  GEAR_WARNING_DISTANCE,
  LEVER_INTERACTION_RANGE,
  GEAR_WARNING_DURATION,
  Trap,
  Battery,
  SteamPlatform,
  Position,
} from '../store/gameStore';

export interface TrapCollisionResult {
  type: 'gear' | 'arm';
  direction?: number;
}

export class LevelEngine {
  constructor() {}

  private tileToPixel(tx: number, ty: number): Position {
    return { x: tx * TILE_SIZE, y: ty * TILE_SIZE };
  }

  private pixelToTile(px: number, py: number): Position {
    return { x: Math.floor(px / TILE_SIZE), y: Math.floor(py / TILE_SIZE) };
  }

  private createBaseMap(): number[][] {
    const map: number[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: number[] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
          row.push(1);
        } else if (y === MAP_HEIGHT - 2) {
          row.push(2);
        } else {
          row.push(0);
        }
      }
      map.push(row);
    }
    return map;
  }

  generateLevel(level: number): void {
    const map = this.createBaseMap();
    const traps: Trap[] = [];
    const batteries: Battery[] = [];
    const platforms: SteamPlatform[] = [];

    if (level === 1) {
      this.generateLevel1(map, traps, batteries);
    } else if (level === 2) {
      this.generateLevel2(map, traps, batteries, platforms);
    } else if (level === 3) {
      this.generateLevel3(map, traps, batteries, platforms);
    }

    const store = useGameStore.getState();
    store.setMap(map);
    store.setTraps(traps);
    store.setBatteries(batteries);
    store.setPlatforms(platforms);
    store.setCurrentLevel(level);
    store.setBatteryCount(0);
    store.setElevatorOpen(false);
  }

  private generateLevel1(
    map: number[][],
    traps: Trap[],
    batteries: Battery[]
  ): void {
    const floorY = MAP_HEIGHT - 2;

    map[floorY - 3][5] = 2;
    map[floorY - 3][6] = 2;
    map[floorY - 3][7] = 2;
    map[floorY - 5][10] = 2;
    map[floorY - 5][11] = 2;
    map[floorY - 5][12] = 2;
    map[floorY - 3][14] = 2;
    map[floorY - 3][15] = 2;
    map[floorY - 3][16] = 2;

    const gearPositions: Position[] = [
      { x: 4, y: floorY - 1 },
      { x: 9, y: floorY - 1 },
      { x: 13, y: floorY - 1 },
      { x: 17, y: floorY - 1 },
    ];

    gearPositions.forEach(pos => {
      const pixel = this.tileToPixel(pos.x, pos.y);
      traps.push({
        id: uuidv4(),
        type: 'gear',
        x: pixel.x + TILE_SIZE / 2,
        y: pixel.y + TILE_SIZE / 2,
        rotation: 0,
        active: true,
        timer: 0,
      });
    });

    const batteryPositions: Position[] = [
      { x: 6, y: floorY - 4 },
      { x: 11, y: floorY - 6 },
      { x: 15, y: floorY - 4 },
    ];

    batteryPositions.forEach(pos => {
      const pixel = this.tileToPixel(pos.x, pos.y);
      batteries.push({
        id: uuidv4(),
        x: pixel.x + TILE_SIZE / 2,
        y: pixel.y + TILE_SIZE / 2,
        collected: false,
      });
    });
  }

  private generateLevel2(
    map: number[][],
    traps: Trap[],
    batteries: Battery[],
    platforms: SteamPlatform[]
  ): void {
    const floorY = MAP_HEIGHT - 2;

    map[floorY - 3][4] = 2;
    map[floorY - 3][5] = 2;
    map[floorY - 5][9] = 2;
    map[floorY - 5][10] = 2;
    map[floorY - 3][15] = 2;
    map[floorY - 3][16] = 2;
    map[floorY - 6][12] = 2;
    map[floorY - 6][13] = 2;

    const gearPositions: Position[] = [
      { x: 7, y: floorY - 1 },
      { x: 11, y: floorY - 1 },
      { x: 14, y: floorY - 1 },
    ];

    gearPositions.forEach(pos => {
      const pixel = this.tileToPixel(pos.x, pos.y);
      traps.push({
        id: uuidv4(),
        type: 'gear',
        x: pixel.x + TILE_SIZE / 2,
        y: pixel.y + TILE_SIZE / 2,
        rotation: 0,
        active: true,
        timer: 0,
      });
    });

    const leverConfigs = [
      { leverX: 3, leverY: floorY - 1, platformX: 6, platformY: floorY - 2 },
      { leverX: 17, leverY: floorY - 1, platformX: 13, platformY: floorY - 4 },
    ];

    leverConfigs.forEach(config => {
      const leverPixel = this.tileToPixel(config.leverX, config.leverY);
      const platformPixel = this.tileToPixel(config.platformX, config.platformY);
      const leverId = uuidv4();
      const platformId = uuidv4();

      traps.push({
        id: leverId,
        type: 'lever',
        x: leverPixel.x + TILE_SIZE / 2,
        y: leverPixel.y + TILE_SIZE / 2,
        rotation: 0,
        active: false,
        timer: 0,
        platformId: platformId,
      });

      platforms.push({
        id: platformId,
        x: platformPixel.x,
        y: platformPixel.y,
        baseY: platformPixel.y,
        raised: false,
        timer: 0,
        leverId: leverId,
      });
    });

    const batteryPositions: Position[] = [
      { x: 5, y: floorY - 4 },
      { x: 10, y: floorY - 6 },
      { x: 13, y: floorY - 7 },
    ];

    batteryPositions.forEach(pos => {
      const pixel = this.tileToPixel(pos.x, pos.y);
      batteries.push({
        id: uuidv4(),
        x: pixel.x + TILE_SIZE / 2,
        y: pixel.y + TILE_SIZE / 2,
        collected: false,
      });
    });
  }

  private generateLevel3(
    map: number[][],
    traps: Trap[],
    batteries: Battery[],
    platforms: SteamPlatform[]
  ): void {
    const floorY = MAP_HEIGHT - 2;

    map[floorY - 3][3] = 2;
    map[floorY - 3][4] = 2;
    map[floorY - 3][5] = 2;
    map[floorY - 5][8] = 2;
    map[floorY - 5][9] = 2;
    map[floorY - 5][10] = 2;
    map[floorY - 7][14] = 2;
    map[floorY - 7][15] = 2;
    map[floorY - 4][16] = 2;
    map[floorY - 4][17] = 2;

    const gearPositions: Position[] = [
      { x: 6, y: floorY - 1 },
      { x: 10, y: floorY - 1 },
      { x: 12, y: floorY - 1 },
      { x: 8, y: floorY - 6 },
    ];

    gearPositions.forEach(pos => {
      const pixel = this.tileToPixel(pos.x, pos.y);
      traps.push({
        id: uuidv4(),
        type: 'gear',
        x: pixel.x + TILE_SIZE / 2,
        y: pixel.y + TILE_SIZE / 2,
        rotation: 0,
        active: true,
        timer: 0,
      });
    });

    const leverConfigs = [
      { leverX: 2, leverY: floorY - 1, platformX: 6, platformY: floorY - 4 },
    ];

    leverConfigs.forEach(config => {
      const leverPixel = this.tileToPixel(config.leverX, config.leverY);
      const platformPixel = this.tileToPixel(config.platformX, config.platformY);
      const leverId = uuidv4();
      const platformId = uuidv4();

      traps.push({
        id: leverId,
        type: 'lever',
        x: leverPixel.x + TILE_SIZE / 2,
        y: leverPixel.y + TILE_SIZE / 2,
        rotation: 0,
        active: false,
        timer: 0,
        platformId: platformId,
      });

      platforms.push({
        id: platformId,
        x: platformPixel.x,
        y: platformPixel.y,
        baseY: platformPixel.y,
        raised: false,
        timer: 0,
        leverId: leverId,
      });
    });

    const armPaths: Position[][] = [
      [
        this.tileToPixel(5, floorY - 5),
        this.tileToPixel(11, floorY - 5),
      ],
      [
        this.tileToPixel(13, floorY - 8),
        this.tileToPixel(17, floorY - 8),
      ],
    ];

    armPaths.forEach(path => {
      traps.push({
        id: uuidv4(),
        type: 'arm',
        x: path[0].x + TILE_SIZE / 2,
        y: path[0].y + TILE_SIZE / 2,
        rotation: 0,
        active: true,
        timer: 0,
        path: path.map(p => ({ x: p.x + TILE_SIZE / 2, y: p.y + TILE_SIZE / 2 })),
        pathIndex: 0,
        direction: 1,
      });
    });

    const batteryPositions: Position[] = [
      { x: 4, y: floorY - 4 },
      { x: 9, y: floorY - 6 },
      { x: 15, y: floorY - 8 },
    ];

    batteryPositions.forEach(pos => {
      const pixel = this.tileToPixel(pos.x, pos.y);
      batteries.push({
        id: uuidv4(),
        x: pixel.x + TILE_SIZE / 2,
        y: pixel.y + TILE_SIZE / 2,
        collected: false,
      });
    });
  }

  update(dt: number): void {
    const state = useGameStore.getState();

    const updatedTraps = state.traps.map(trap => {
      const newTrap = { ...trap };

      if (trap.type === 'gear' && trap.active) {
        newTrap.rotation = (trap.rotation + GEAR_ROTATION_SPEED * (dt / 16.67)) % (Math.PI * 2);
      }

      if (trap.type === 'lever' && trap.active) {
        newTrap.timer = Math.max(0, trap.timer - dt);
        if (newTrap.timer <= 0) {
          newTrap.active = false;
        }
      }

      if (trap.type === 'arm' && trap.active && trap.path && trap.path.length > 1) {
        const currentIndex = trap.pathIndex || 0;
        const currentTarget = trap.path[currentIndex % trap.path.length];
        const dx = currentTarget.x - trap.x;
        const dy = currentTarget.y - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ARM_SPEED * (dt / 16.67)) {
          newTrap.x = currentTarget.x;
          newTrap.y = currentTarget.y;
          const nextIndex = (currentIndex + 1) % trap.path.length;
          newTrap.pathIndex = nextIndex;
          const nextTarget = trap.path[nextIndex];
          newTrap.direction = nextTarget.x >= trap.x ? 1 : -1;
        } else {
          newTrap.x = trap.x + (dx / dist) * ARM_SPEED * (dt / 16.67);
          newTrap.y = trap.y + (dy / dist) * ARM_SPEED * (dt / 16.67);
          newTrap.direction = dx >= 0 ? 1 : -1;
        }
        newTrap.rotation = (trap.rotation + 0.05 * (dt / 16.67)) % (Math.PI * 2);
      }

      return newTrap;
    });

    const updatedPlatforms = state.platforms.map(platform => {
      const newPlatform = { ...platform };
      if (platform.raised) {
        newPlatform.timer = Math.max(0, platform.timer - dt);
        if (newPlatform.timer <= 0) {
          newPlatform.raised = false;
          newPlatform.y = platform.baseY;
        }
      }
      return newPlatform;
    });

    useGameStore.setState({ traps: updatedTraps, platforms: updatedPlatforms });

    state.updateParticles(dt);
    state.decrementGearWarning(dt);

    const playerX = state.playerX;
    const playerY = state.playerY;
    const playerCenterX = playerX + 15;
    const playerCenterY = playerY + 20;

    let nearGear = false;
    for (const trap of updatedTraps) {
      if (trap.type === 'gear') {
        const dx = trap.x - playerCenterX;
        const dy = trap.y - playerCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < GEAR_WARNING_DISTANCE) {
          nearGear = true;
          break;
        }
      }
    }

    if (nearGear && state.gearWarningPulse <= 0) {
      state.setGearWarningPulse(GEAR_WARNING_DURATION);
    }
  }

  checkWallCollision(x: number, y: number, w: number, h: number): boolean {
    const state = useGameStore.getState();
    const map = state.map;

    const leftTile = Math.floor(x / TILE_SIZE);
    const rightTile = Math.floor((x + w - 1) / TILE_SIZE);
    const topTile = Math.floor(y / TILE_SIZE);
    const bottomTile = Math.floor((y + h - 1) / TILE_SIZE);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH) {
          return true;
        }
        if (map[ty][tx] === 1 || map[ty][tx] === 2) {
          return true;
        }
      }
    }

    for (const platform of state.platforms) {
      if (platform.raised) {
        const px = platform.x;
        const py = platform.y;
        const pw = TILE_SIZE;
        const ph = TILE_SIZE / 2;
        if (x < px + pw && x + w > px && y < py + ph && y + h > py) {
          return true;
        }
      }
    }

    return false;
  }

  checkTrapCollision(
    px: number,
    py: number,
    pw: number,
    ph: number
  ): TrapCollisionResult | null {
    const state = useGameStore.getState();
    const playerCenterX = px + pw / 2;
    const playerCenterY = py + ph / 2;

    for (const trap of state.traps) {
      if (trap.type === 'gear') {
        const dx = trap.x - playerCenterX;
        const dy = trap.y - playerCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const gearRadius = TILE_SIZE / 2 - 4;
        if (dist < gearRadius) {
          return { type: 'gear' };
        }
      } else if (trap.type === 'arm') {
        const dx = trap.x - playerCenterX;
        const dy = trap.y - playerCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const armRadius = TILE_SIZE / 2 - 2;
        if (dist < armRadius) {
          return { type: 'arm', direction: (trap as any).direction || 1 };
        }
      }
    }

    return null;
  }

  checkBatteryCollection(
    px: number,
    py: number,
    pw: number,
    ph: number
  ): string | null {
    const state = useGameStore.getState();
    const playerCenterX = px + pw / 2;
    const playerCenterY = py + ph / 2;

    for (const battery of state.batteries) {
      if (battery.collected) continue;
      const dx = battery.x - playerCenterX;
      const dy = battery.y - playerCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < TILE_SIZE / 2) {
        return battery.id;
      }
    }

    return null;
  }

  checkLeverInteraction(
    px: number,
    py: number,
    pw: number,
    ph: number
  ): string | null {
    const state = useGameStore.getState();
    const playerCenterX = px + pw / 2;
    const playerCenterY = py + ph / 2;

    for (const trap of state.traps) {
      if (trap.type !== 'lever') continue;
      const dx = trap.x - playerCenterX;
      const dy = trap.y - playerCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < LEVER_INTERACTION_RANGE) {
        return trap.id;
      }
    }

    return null;
  }

  checkElevatorEntry(
    px: number,
    py: number,
    pw: number,
    ph: number
  ): boolean {
    const state = useGameStore.getState();
    if (!state.elevatorOpen || state.batteryCount < 3) return false;

    const elevatorTileX = 1;
    const elevatorTileY = 13;
    const elevatorX = elevatorTileX * TILE_SIZE;
    const elevatorY = elevatorTileY * TILE_SIZE;
    const elevatorW = TILE_SIZE;
    const elevatorH = TILE_SIZE * 2;

    return px < elevatorX + elevatorW && px + pw > elevatorX && py < elevatorY + elevatorH && py + ph > elevatorY;
  }

  spawnSteamParticles(leverX?: number, leverY?: number): void {
    const state = useGameStore.getState();
    const x = leverX ?? state.lastActivatedLeverX;
    const y = leverY ?? state.lastActivatedLeverY;
    const particleCount = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < particleCount; i++) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const vx = direction * (0.5 + Math.random() * 1.5);
      const vy = -1 - Math.random() * 1.5;
      const size = 6 + Math.random() * 8;

      state.addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y - 10,
        vx,
        vy,
        life: 1200,
        maxLife: 1200,
        type: 'steam',
        size,
        color: 'rgba(255,255,255,',
      });
    }
  }

  spawnGoldBurst(x?: number, y?: number): void {
    const state = useGameStore.getState();
    const bx = x ?? state.lastCollectedBatteryX;
    const by = y ?? state.lastCollectedBatteryY;
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 2 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 3 + Math.random() * 4;

      state.addParticle({
        x: bx,
        y: by,
        vx,
        vy,
        life: 300,
        maxLife: 300,
        type: 'spark',
        size,
        color: '#FFD700',
      });
    }
  }
}
