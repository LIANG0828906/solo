export type Race = 'human' | 'elf' | 'orc';
export type UnitClass = 'warrior' | 'archer' | 'mage' | 'healer';
export type StrategyType = 
  | 'none'
  | 'attack_low_hp'
  | 'attack_closest'
  | 'attack_ranged'
  | 'defend_ally'
  | 'capture_point'
  | 'heal_ally';

export interface UnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  moveRange: number;
}

export interface UnitPosition {
  col: number;
  row: number;
}

type EventCallback = (...args: any[]) => void;

export class Unit {
  private id: string;
  private name: string;
  private race: Race;
  private unitClass: UnitClass;
  private stats: UnitStats;
  private currentHp: number;
  private position: UnitPosition;
  private pixelX: number = 0;
  private pixelY: number = 0;
  private targetPixelX: number = 0;
  private targetPixelY: number = 0;
  private strategies: StrategyType[] = [];
  private isAlive: boolean = true;
  private team: 'ally' | 'enemy';
  
  private killCount: number = 0;
  private damageDealt: number = 0;
  private consecutiveKills: number = 0;
  private maxConsecutiveKills: number = 0;
  private hitCount: number = 0;
  private moraleActive: boolean = false;
  private moraleTimer: number = 0;
  
  private effects: Set<string> = new Set();
  
  private eventHandlers: Map<string, EventCallback[]> = new Map();
  
  private attackFlashTimer: number = 0;
  private isMoving: boolean = false;
  private moveSpeed: number = 8;

  constructor(
    id: string,
    name: string,
    race: Race,
    unitClass: UnitClass,
    stats: UnitStats,
    position: UnitPosition,
    team: 'ally' | 'enemy' = 'ally'
  ) {
    this.id = id;
    this.name = name;
    this.race = race;
    this.unitClass = unitClass;
    this.stats = { ...stats };
    this.currentHp = stats.maxHp;
    this.position = { ...position };
    this.team = team;
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(callback);
      if (idx > -1) {
        handlers.splice(idx, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getRace(): Race {
    return this.race;
  }

  public getUnitClass(): UnitClass {
    return this.unitClass;
  }

  public getStats(): UnitStats {
    return { ...this.stats };
  }

  public getCurrentHp(): number {
    return this.currentHp;
  }

  public getMaxHp(): number {
    return this.stats.maxHp;
  }

  public getPosition(): UnitPosition {
    return { ...this.position };
  }

  public setPosition(col: number, row: number): void {
    this.position = { col, row };
  }

  public getPixelX(): number {
    return this.pixelX;
  }

  public getPixelY(): number {
    return this.pixelY;
  }

  public setPixelPosition(x: number, y: number): void {
    this.pixelX = x;
    this.pixelY = y;
  }

  public setTargetPixelPosition(x: number, y: number): void {
    this.targetPixelX = x;
    this.targetPixelY = y;
    this.isMoving = true;
  }

  public getIsMoving(): boolean {
    return this.isMoving;
  }

  public updateMovement(dt: number): void {
    if (!this.isMoving) return;

    const dx = this.targetPixelX - this.pixelX;
    const dy = this.targetPixelY - this.pixelY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.5) {
      this.pixelX = this.targetPixelX;
      this.pixelY = this.targetPixelY;
      this.isMoving = false;
      this.emit('moveComplete');
    } else {
      const moveDist = this.moveSpeed * this.stats.speed * dt;
      const ratio = Math.min(moveDist / dist, 1);
      this.pixelX += dx * ratio;
      this.pixelY += dy * ratio;
    }
  }

  public getStrategies(): StrategyType[] {
    return [...this.strategies];
  }

  public setStrategies(strategies: StrategyType[]): void {
    this.strategies = strategies.slice(0, 3);
    this.emit('strategyChange', this.strategies);
  }

  public getTeam(): 'ally' | 'enemy' {
    return this.team;
  }

  public setTeam(team: 'ally' | 'enemy'): void {
    this.team = team;
  }

  public getIsAlive(): boolean {
    return this.isAlive;
  }

  public getAttackFlashTimer(): number {
    return this.attackFlashTimer;
  }

  public updateAttackFlash(dt: number): void {
    if (this.attackFlashTimer > 0) {
      this.attackFlashTimer -= dt;
      if (this.attackFlashTimer < 0) this.attackFlashTimer = 0;
    }
  }

  public getMoraleActive(): boolean {
    return this.moraleActive;
  }

  public getMoraleTimer(): number {
    return this.moraleTimer;
  }

  public updateMorale(dt: number): void {
    if (this.moraleTimer > 0) {
      this.moraleTimer -= dt;
      if (this.moraleTimer <= 0) {
        this.moraleTimer = 0;
        this.moraleActive = false;
      }
    }
  }

  public moveToHex(col: number, row: number): void {
    this.position = { col, row };
    this.emit('move', { col, row });
  }

  public attackTarget(target: Unit): void {
    if (!this.isAlive || !target.getIsAlive()) return;

    let damage = this.stats.attack - target.getStats().defense;
    if (this.moraleActive) {
      damage = Math.floor(damage * 1.5);
    }
    damage = Math.max(damage, 1);

    target.takeDamage(damage, this);
    
    this.damageDealt += damage;
    this.hitCount++;
    
    if (this.hitCount % 5 === 0) {
      this.triggerMorale();
    }

    this.emit('attack', { target, damage });
  }

  public takeDamage(damage: number, attacker?: Unit): void {
    if (!this.isAlive) return;

    this.currentHp -= damage;
    this.attackFlashTimer = 0.2;
    
    this.emit('damage', { damage, attacker });

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isAlive = false;
      this.consecutiveKills = 0;
      
      if (attacker) {
        attacker.addKill();
      }
      
      this.emit('death', { attacker });
    }
  }

  public heal(amount: number, healer?: Unit): void {
    if (!this.isAlive) return;

    const healed = Math.min(amount, this.stats.maxHp - this.currentHp);
    this.currentHp += healed;
    
    this.emit('heal', { amount: healed, healer });
  }

  public addKill(): void {
    this.killCount++;
    this.consecutiveKills++;
    if (this.consecutiveKills > this.maxConsecutiveKills) {
      this.maxConsecutiveKills = this.consecutiveKills;
    }
  }

  public resetConsecutiveKills(): void {
    this.consecutiveKills = 0;
  }

  public getKillCount(): number {
    return this.killCount;
  }

  public getDamageDealt(): number {
    return this.damageDealt;
  }

  public getMaxConsecutiveKills(): number {
    return this.maxConsecutiveKills;
  }

  public triggerMorale(): void {
    this.moraleActive = true;
    this.moraleTimer = 2;
    this.emit('moraleTrigger');
  }

  public applyEffect(effectId: string): void {
    this.effects.add(effectId);
    this.emit('effectApplied', effectId);
  }

  public removeEffect(effectId: string): void {
    this.effects.delete(effectId);
    this.emit('effectRemoved', effectId);
  }

  public hasEffect(effectId: string): boolean {
    return this.effects.has(effectId);
  }

  public getEffects(): string[] {
    return Array.from(this.effects);
  }

  public getHitCount(): number {
    return this.hitCount;
  }

  public getRaceColor(): string {
    switch (this.race) {
      case 'human':
        return '#6B8E5A';
      case 'elf':
        return '#5A8A5A';
      case 'orc':
        return '#8B5A3A';
      default:
        return '#888888';
    }
  }

  public getMoveSpeed(): number {
    return this.moveSpeed;
  }
}
