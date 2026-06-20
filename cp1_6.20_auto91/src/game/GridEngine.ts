export type ShipType = 'frigate' | 'cruiser' | 'battleship';
export type Side = 'player' | 'ai';
export type Phase = 'deploy' | 'battle' | 'ended';
export type SkillType = 'focusFire' | 'shieldRecharge' | 'spatialDistortion';
export type UpgradeType = 'atk' | 'armor';
export type EventType = 'stateUpdate' | 'damageDealt' | 'unitDestroyed' | 'victory' | 'skillActivated';

export interface GridCoords {
  row: number;
  col: number;
}

export interface ShipStats {
  hp: number;
  maxHp: number;
  atk: number;
  armor: number;
  speed: number;
  range: number;
}

export interface ShipConfig {
  type: ShipType;
  cost: number;
  width: number;
  height: number;
  baseStats: ShipStats;
}

export const SHIP_CONFIGS: Record<ShipType, ShipConfig> = {
  frigate: {
    type: 'frigate',
    cost: 50,
    width: 1,
    height: 1,
    baseStats: { hp: 80, maxHp: 80, atk: 20, armor: 5, speed: 10, range: 3 },
  },
  cruiser: {
    type: 'cruiser',
    cost: 100,
    width: 2,
    height: 1,
    baseStats: { hp: 150, maxHp: 150, atk: 35, armor: 10, speed: 6, range: 4 },
  },
  battleship: {
    type: 'battleship',
    cost: 150,
    width: 2,
    height: 2,
    baseStats: { hp: 250, maxHp: 250, atk: 60, armor: 20, speed: 3, range: 5 },
  },
};

export class Ship {
  public readonly id: string;
  public readonly type: ShipType;
  public readonly side: Side;
  public stats: ShipStats;
  public origin: GridCoords;
  public hasActed: boolean;
  public isUpgraded: boolean;
  public upgradeType: UpgradeType | null;
  public shieldBonus: number;
  public distortionActive: boolean;

  constructor(id: string, type: ShipType, side: Side, origin: GridCoords) {
    this.id = id;
    this.type = type;
    this.side = side;
    const cfg = SHIP_CONFIGS[type];
    this.stats = { ...cfg.baseStats };
    this.origin = { ...origin };
    this.hasActed = false;
    this.isUpgraded = false;
    this.upgradeType = null;
    this.shieldBonus = 0;
    this.distortionActive = false;
  }

  get width(): number {
    return SHIP_CONFIGS[this.type].width;
  }

  get height(): number {
    return SHIP_CONFIGS[this.type].height;
  }

  get cost(): number {
    return SHIP_CONFIGS[this.type].cost;
  }

  getOccupiedCells(): GridCoords[] {
    const cells: GridCoords[] = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        cells.push({ row: this.origin.row + r, col: this.origin.col + c });
      }
    }
    return cells;
  }

  getCenterCell(): GridCoords {
    return {
      row: this.origin.row + Math.floor(this.height / 2),
      col: this.origin.col + Math.floor(this.width / 2),
    };
  }

  applyUpgrade(type: UpgradeType): boolean {
    if (this.isUpgraded) return false;
    this.isUpgraded = true;
    this.upgradeType = type;
    if (type === 'atk') {
      this.stats.atk = Math.floor(this.stats.atk * 1.3);
    } else {
      this.stats.armor = Math.floor(this.stats.armor * 1.5);
    }
    return true;
  }

  takeDamage(damage: number): number {
    const effectiveArmor = this.stats.armor + this.shieldBonus;
    const actualDamage = Math.max(1, damage - effectiveArmor);
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
    return actualDamage;
  }

  isDestroyed(): boolean {
    return this.stats.hp <= 0;
  }

  resetTurn(): void {
    this.hasActed = false;
    this.shieldBonus = 0;
    this.distortionActive = false;
  }
}

export class GridCell {
  public readonly coords: GridCoords;
  public shipId: string | null;
  public isDeployZonePlayer: boolean;
  public isDeployZoneAI: boolean;

  constructor(coords: GridCoords) {
    this.coords = coords;
    this.shipId = null;
    this.isDeployZonePlayer = false;
    this.isDeployZoneAI = false;
  }

  isEmpty(): boolean {
    return this.shipId === null;
  }
}

type EventCallback = (data: unknown) => void;

export class GridEngine {
  public static readonly ROWS = 4;
  public static readonly COLS = 4;

  public grid: GridCell[][];
  public ships: Map<string, Ship>;
  public phase: Phase;
  public turn: number;
  public actionQueue: Ship[];
  public currentActorIndex: number;
  public winner: Side | null;
  public resources: Record<Side, number>;

  private listeners: Map<EventType, EventCallback[]>;
  private turnLog: string[];

  constructor() {
    this.grid = [];
    this.ships = new Map();
    this.phase = 'deploy';
    this.turn = 0;
    this.actionQueue = [];
    this.currentActorIndex = 0;
    this.winner = null;
    this.resources = { player: 400, ai: 400 };
    this.listeners = new Map();
    this.turnLog = [];
    this.initializeGrid();
  }

  private initializeGrid(): void {
    for (let r = 0; r < GridEngine.ROWS; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < GridEngine.COLS; c++) {
        const cell = new GridCell({ row: r, col: c });
        row.push(cell);
      }
      this.grid.push(row);
    }
    this.markDeployZones();
  }

  private markDeployZones(): void {
    for (let r = 0; r < GridEngine.ROWS; r++) {
      for (let c = 0; c < GridEngine.COLS; c++) {
        this.grid[r][c].isDeployZonePlayer = this.isInPlayerDeployZone({ row: r, col: c });
        this.grid[r][c].isDeployZoneAI = this.isInAIDeployZone({ row: r, col: c });
      }
    }
  }

  public isInPlayerDeployZone(coords: GridCoords): boolean {
    return coords.row >= 1 && coords.col >= 0 && coords.col <= 3;
  }

  public isInAIDeployZone(coords: GridCoords): boolean {
    return coords.row <= 2 && coords.col >= 0 && coords.col <= 3;
  }

  public getCell(coords: GridCoords): GridCell | null {
    if (coords.row < 0 || coords.row >= GridEngine.ROWS) return null;
    if (coords.col < 0 || coords.col >= GridEngine.COLS) return null;
    return this.grid[coords.row][coords.col];
  }

  public getShip(id: string): Ship | null {
    return this.ships.get(id) ?? null;
  }

  public getShipsBySide(side: Side): Ship[] {
    return Array.from(this.ships.values()).filter(s => s.side === side);
  }

  public on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: EventType, callback: EventCallback): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    const idx = cbs.indexOf(callback);
    if (idx >= 0) cbs.splice(idx, 1);
  }

  private emit(event: EventType, data: unknown): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    for (const cb of cbs) {
      try { cb(data); } catch { /* ignore */ }
    }
  }

  public getOccupiedCellsForShip(type: ShipType, origin: GridCoords): GridCoords[] {
    const cfg = SHIP_CONFIGS[type];
    const cells: GridCoords[] = [];
    for (let r = 0; r < cfg.height; r++) {
      for (let c = 0; c < cfg.width; c++) {
        cells.push({ row: origin.row + r, col: origin.col + c });
      }
    }
    return cells;
  }

  public canDeployAt(shipType: ShipType, gridCoords: GridCoords, side: Side): boolean {
    if (this.phase !== 'deploy') return false;
    const cfg = SHIP_CONFIGS[shipType];
    const cells = this.getOccupiedCellsForShip(shipType, gridCoords);
    const zoneCheck = side === 'player' ? this.isInPlayerDeployZone : this.isInAIDeployZone;
    for (const cell of cells) {
      const gridCell = this.getCell(cell);
      if (!gridCell) return false;
      if (!zoneCheck(cell)) return false;
      if (!gridCell.isEmpty()) return false;
    }
    if (gridCoords.row + cfg.height > GridEngine.ROWS) return false;
    if (gridCoords.col + cfg.width > GridEngine.COLS) return false;
    return this.resources[side] >= cfg.cost;
  }

  public deployShip(shipId: string, shipType: ShipType, gridCoords: GridCoords, side: Side): boolean {
    if (!this.canDeployAt(shipType, gridCoords, side)) return false;
    if (this.ships.has(shipId)) return false;
    const ship = new Ship(shipId, shipType, side, gridCoords);
    const cells = ship.getOccupiedCells();
    for (const cell of cells) {
      this.grid[cell.row][cell.col].shipId = shipId;
    }
    this.ships.set(shipId, ship);
    this.resources[side] -= SHIP_CONFIGS[shipType].cost;
    this.emit('stateUpdate', this.serialize());
    return true;
  }

  public removeShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;
    if (this.phase !== 'deploy') return false;
    const cells = ship.getOccupiedCells();
    for (const cell of cells) {
      const gridCell = this.grid[cell.row][cell.col];
      if (gridCell.shipId === shipId) {
        gridCell.shipId = null;
      }
    }
    this.resources[ship.side] += Math.floor(ship.cost * 0.8);
    this.ships.delete(shipId);
    this.emit('stateUpdate', this.serialize());
    return true;
  }

  public startBattle(): boolean {
    if (this.phase !== 'deploy') return false;
    if (this.getShipsBySide('player').length === 0) return false;
    if (this.getShipsBySide('ai').length === 0) return false;
    this.phase = 'battle';
    this.turn = 1;
    this.buildActionQueue();
    this.emit('stateUpdate', this.serialize());
    return true;
  }

  private buildActionQueue(): void {
    const allShips = Array.from(this.ships.values()).filter(s => !s.isDestroyed());
    allShips.forEach(s => s.resetTurn());
    allShips.sort((a, b) => {
      if (b.stats.speed !== a.stats.speed) return b.stats.speed - a.stats.speed;
      return a.id.localeCompare(b.id);
    });
    this.actionQueue = allShips;
    this.currentActorIndex = 0;
  }

  public static hexDistance(a: GridCoords, b: GridCoords): number {
    const ax = a.col - Math.floor(a.row / 2);
    const az = a.row;
    const ay = -ax - az;
    const bx = b.col - Math.floor(b.row / 2);
    const bz = b.row;
    const by = -bx - bz;
    return (Math.abs(ax - bx) + Math.abs(ay - by) + Math.abs(az - bz)) / 2;
  }

  public getDistanceBetweenShips(a: Ship, b: Ship): number {
    return GridEngine.hexDistance(a.getCenterCell(), b.getCenterCell());
  }

  public getEnemiesInRange(ship: Ship): Ship[] {
    const enemies = this.getShipsBySide(ship.side === 'player' ? 'ai' : 'player');
    return enemies.filter(e => {
      if (e.isDestroyed()) return false;
      return this.getDistanceBetweenShips(ship, e) <= ship.stats.range;
    });
  }

  public selectTarget(ship: Ship): Ship | null {
    const targets = this.getEnemiesInRange(ship);
    if (targets.length === 0) return null;
    targets.sort((a, b) => {
      if (a.stats.hp !== b.stats.hp) return a.stats.hp - b.stats.hp;
      return this.getDistanceBetweenShips(ship, a) - this.getDistanceBetweenShips(ship, b);
    });
    return targets[0];
  }

  public calculateDamage(attacker: Ship, defender: Ship): number {
    let baseDamage = attacker.stats.atk;
    if (attacker.distortionActive) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }
    return baseDamage;
  }

  public performAttack(attacker: Ship, defender: Ship): { damage: number; destroyed: boolean } | null {
    if (attacker.hasActed) return null;
    if (attacker.isDestroyed() || defender.isDestroyed()) return null;
    if (this.getDistanceBetweenShips(attacker, defender) > attacker.stats.range) return null;
    const rawDamage = this.calculateDamage(attacker, defender);
    const actualDamage = defender.takeDamage(rawDamage);
    attacker.hasActed = true;
    const destroyed = defender.isDestroyed();
    this.emit('damageDealt', {
      attackerId: attacker.id,
      defenderId: defender.id,
      rawDamage,
      actualDamage,
      defenderHp: defender.stats.hp,
    });
    this.turnLog.push(`${attacker.side} ${attacker.type} 攻击 ${defender.side} ${defender.type}，造成 ${actualDamage} 点伤害`);
    if (destroyed) {
      this.handleShipDestroyed(defender);
    }
    this.emit('stateUpdate', this.serialize());
    return { damage: actualDamage, destroyed };
  }

  private handleShipDestroyed(ship: Ship): void {
    const cells = ship.getOccupiedCells();
    for (const cell of cells) {
      const gridCell = this.grid[cell.row][cell.col];
      if (gridCell.shipId === ship.id) {
        gridCell.shipId = null;
      }
    }
    this.emit('unitDestroyed', { shipId: ship.id, side: ship.side, type: ship.type });
    this.turnLog.push(`${ship.side} ${ship.type} 被摧毁！`);
  }

  public activateSkill(ship: Ship, skillType: SkillType, targetShip?: Ship): boolean {
    if (ship.hasActed) return false;
    if (ship.isDestroyed()) return false;
    switch (skillType) {
      case 'focusFire': {
        if (!targetShip || targetShip.side === ship.side) return false;
        if (targetShip.isDestroyed()) return false;
        if (this.getDistanceBetweenShips(ship, targetShip) > ship.stats.range) return false;
        const originalAtk = ship.stats.atk;
        ship.stats.atk = Math.floor(originalAtk * 2);
        const result = this.performAttack(ship, targetShip);
        ship.stats.atk = originalAtk;
        if (result) {
          this.emit('skillActivated', { skillType, shipId: ship.id, targetId: targetShip.id });
          this.turnLog.push(`${ship.side} ${ship.type} 发动集火技能！`);
          return true;
        }
        return false;
      }
      case 'shieldRecharge': {
        const allies = this.getShipsBySide(ship.side).filter(a => !a.isDestroyed());
        if (allies.length === 0) return false;
        const shieldAmount = Math.floor(ship.stats.atk * 0.8);
        for (const ally of allies) {
          ally.shieldBonus += shieldAmount;
        }
        ship.hasActed = true;
        this.emit('skillActivated', { skillType, shipId: ship.id, shieldAmount });
        this.turnLog.push(`${ship.side} ${ship.type} 发动护盾回充，为友军提供 ${shieldAmount} 点护盾`);
        this.emit('stateUpdate', this.serialize());
        return true;
      }
      case 'spatialDistortion': {
        ship.distortionActive = true;
        ship.hasActed = true;
        this.emit('skillActivated', { skillType, shipId: ship.id });
        this.turnLog.push(`${ship.side} ${ship.type} 发动空间干扰，下次攻击伤害提升50%`);
        this.emit('stateUpdate', this.serialize());
        return true;
      }
      default:
        return false;
    }
  }

  public upgradeShip(shipId: string, upgradeType: UpgradeType): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;
    const cost = 50;
    if (this.resources[ship.side] < cost) return false;
    const success = ship.applyUpgrade(upgradeType);
    if (success) {
      this.resources[ship.side] -= cost;
      this.emit('stateUpdate', this.serialize());
    }
    return success;
  }

  public getCurrentActor(): Ship | null {
    if (this.phase !== 'battle') return null;
    if (this.currentActorIndex >= this.actionQueue.length) return null;
    return this.actionQueue[this.currentActorIndex];
  }

  public processCurrentActorAction(): void {
    const actor = this.getCurrentActor();
    if (!actor || actor.hasActed || actor.isDestroyed()) {
      this.advanceActor();
      return;
    }
    const target = this.selectTarget(actor);
    if (target) {
      this.performAttack(actor, target);
    } else {
      const allies = this.getShipsBySide(actor.side).filter(a => !a.isDestroyed());
      const lowHpAlly = allies.find(a => a.stats.hp < a.stats.maxHp * 0.5);
      if (lowHpAlly && allies.length > 1) {
        this.activateSkill(actor, 'shieldRecharge');
      } else {
        this.activateSkill(actor, 'spatialDistortion');
      }
    }
    this.advanceActor();
  }

  private advanceActor(): void {
    this.currentActorIndex++;
    if (this.currentActorIndex >= this.actionQueue.length) {
      this.endTurn();
    }
  }

  public processTurn(): void {
    if (this.phase !== 'battle') return;
    this.turnLog = [];
    this.buildActionQueue();
    while (this.currentActorIndex < this.actionQueue.length) {
      if (this.checkVictory()) {
        this.endGame();
        return;
      }
      this.processCurrentActorAction();
    }
    this.endTurn();
  }

  private endTurn(): void {
    if (this.checkVictory()) {
      this.endGame();
      return;
    }
    this.turn++;
    this.resources.player += 30;
    this.resources.ai += 30;
    this.buildActionQueue();
    this.emit('stateUpdate', this.serialize());
  }

  public checkVictory(): Side | null {
    const playerAlive = this.getShipsBySide('player').some(s => !s.isDestroyed());
    const aiAlive = this.getShipsBySide('ai').some(s => !s.isDestroyed());
    if (!playerAlive && !aiAlive) return null;
    if (!playerAlive) return 'ai';
    if (!aiAlive) return 'player';
    return null;
  }

  private endGame(): void {
    const winner = this.checkVictory();
    if (winner) {
      this.winner = winner;
      this.phase = 'ended';
      this.emit('victory', { winner });
      this.emit('stateUpdate', this.serialize());
    }
  }

  public getTurnLog(): string[] {
    return [...this.turnLog];
  }

  public serialize(): unknown {
    return {
      phase: this.phase,
      turn: this.turn,
      winner: this.winner,
      resources: { ...this.resources },
      ships: Array.from(this.ships.values()).map(s => ({
        id: s.id,
        type: s.type,
        side: s.side,
        origin: { ...s.origin },
        stats: { ...s.stats },
        hasActed: s.hasActed,
        isUpgraded: s.isUpgraded,
        upgradeType: s.upgradeType,
        shieldBonus: s.shieldBonus,
        distortionActive: s.distortionActive,
      })),
      grid: this.grid.map(row =>
        row.map(cell => ({
          coords: { ...cell.coords },
          shipId: cell.shipId,
          isDeployZonePlayer: cell.isDeployZonePlayer,
          isDeployZoneAI: cell.isDeployZoneAI,
        }))
      ),
      currentActorIndex: this.currentActorIndex,
      actionQueue: this.actionQueue.map(s => s.id),
    };
  }

  public reset(): void {
    this.grid = [];
    this.ships.clear();
    this.phase = 'deploy';
    this.turn = 0;
    this.actionQueue = [];
    this.currentActorIndex = 0;
    this.winner = null;
    this.resources = { player: 400, ai: 400 };
    this.turnLog = [];
    this.initializeGrid();
    this.emit('stateUpdate', this.serialize());
  }
}
