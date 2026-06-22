import { HeroConfig, ATTACK_INTERVAL, BOARD_COLS, BOARD_ROWS } from './config';

export type Team = 'player' | 'enemy';

export interface Position {
  row: number;
  col: number;
}

export interface Effect {
  type: 'hit' | 'skill' | 'fire' | 'heal' | 'lightning' | 'shield';
  startTime: number;
  duration: number;
  target?: Hero;
}

export class Hero {
  id: string;
  config: HeroConfig;
  team: Team;
  position: Position;
  currentHp: number;
  maxHp: number;
  attack: number;
  baseAttack: number;
  lastAttackTime: number = 0;
  lastSkillTime: number = 0;
  isAlive: boolean = true;
  effects: Effect[] = [];
  target: Hero | null = null;
  attackBuff: number = 0;
  buffEndTime: number = 0;
  placeAnimationProgress: number = 0;
  isPlacing: boolean = false;

  constructor(config: HeroConfig, team: Team, position: Position) {
    this.id = `${team}_${config.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = config;
    this.team = team;
    this.position = { ...position };
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.baseAttack = config.attack;
    this.attack = config.attack;
  }

  getDistance(other: Hero): number {
    const rowDiff = Math.abs(this.position.row - other.position.row);
    const colDiff = Math.abs(this.position.col - other.position.col);
    return rowDiff + colDiff;
  }

  findTarget(enemies: Hero[]): Hero | null {
    if (enemies.length === 0) return null;

    const aliveEnemies = enemies.filter(e => e.isAlive);
    if (aliveEnemies.length === 0) return null;

    const sameRowEnemies = aliveEnemies.filter(e => e.position.row === this.position.row);
    const candidates = sameRowEnemies.length > 0 ? sameRowEnemies : aliveEnemies;

    let nearest: Hero | null = null;
    let minDistance = Infinity;

    for (const enemy of candidates) {
      const dist = this.getDistance(enemy);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  canAttack(currentTime: number): boolean {
    if (!this.isAlive) return false;
    return currentTime - this.lastAttackTime >= ATTACK_INTERVAL;
  }

  canUseSkill(currentTime: number): boolean {
    if (!this.isAlive) return false;
    return currentTime - this.lastSkillTime >= this.config.skill.cooldown;
  }

  updateBuff(currentTime: number): void {
    if (this.buffEndTime > 0 && currentTime > this.buffEndTime) {
      this.attackBuff = 0;
      this.buffEndTime = 0;
      this.attack = this.baseAttack;
    }
  }

  performAttack(target: Hero, currentTime: number): number {
    this.lastAttackTime = currentTime;
    this.target = target;
    
    const damage = this.attack + this.attackBuff;
    target.takeDamage(damage);
    
    this.addEffect('hit', currentTime, 200, target);
    
    if (this.config.skill.effect === 'fire' && this.config.race === 'undead' && this.config.class === 'warrior') {
      this.currentHp = Math.min(this.maxHp, this.currentHp + Math.floor(damage * 0.3));
    }
    
    return damage;
  }

  useSkill(currentTime: number, allies: Hero[], enemies: Hero[]): { damage: number; targets: Hero[] } {
    this.lastSkillTime = currentTime;
    const skill = this.config.skill;
    let targets: Hero[] = [];
    let totalDamage = 0;

    if (skill.type === 'buff') {
      if (skill.effect === 'heal') {
        const healTargets = allies.filter(a => a.isAlive && a.currentHp < a.maxHp);
        const sorted = healTargets.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
        if (sorted.length > 0) {
          const target = sorted[0];
          target.currentHp = Math.min(target.maxHp, target.currentHp + skill.damage);
          target.addEffect('heal', currentTime, 500);
          targets.push(target);
        }
      } else if (skill.effect === 'shield') {
        this.attackBuff = Math.floor(this.baseAttack * 0.5);
        this.attack = this.baseAttack + this.attackBuff;
        this.buffEndTime = currentTime + 5000;
        this.addEffect('shield', currentTime, 800);
        targets.push(this);
      }
    } else {
      const aliveEnemies = enemies.filter(e => e.isAlive);
      if (skill.type === 'aoe') {
        for (const enemy of aliveEnemies) {
          if (this.getDistance(enemy) <= skill.range) {
            enemy.takeDamage(skill.damage);
            enemy.addEffect(skill.effect, currentTime, 600);
            targets.push(enemy);
            totalDamage += skill.damage;
          }
        }
        this.addEffect('skill', currentTime, 400);
      } else {
        const target = this.findTarget(enemies);
        if (target) {
          target.takeDamage(skill.damage);
          target.addEffect(skill.effect, currentTime, 600);
          targets.push(target);
          totalDamage = skill.damage;
          this.addEffect('skill', currentTime, 400);
          
          if (this.config.skill.effect === 'fire' && this.config.race === 'undead' && this.config.class === 'warrior') {
            this.currentHp = Math.min(this.maxHp, this.currentHp + Math.floor(skill.damage * 0.5));
          }
        }
      }
    }

    return { damage: totalDamage, targets };
  }

  takeDamage(damage: number): void {
    this.currentHp = Math.max(0, this.currentHp - damage);
    if (this.currentHp <= 0) {
      this.isAlive = false;
    }
  }

  addEffect(type: Effect['type'], currentTime: number, duration: number, target?: Hero): void {
    this.effects.push({
      type,
      startTime: currentTime,
      duration,
      target
    });
  }

  updateEffects(currentTime: number): void {
    this.effects = this.effects.filter(e => currentTime - e.startTime < e.duration);
  }

  isHitFlashing(currentTime: number): boolean {
    return this.effects.some(e => e.type === 'hit' && currentTime - e.startTime < 150);
  }

  isUsingSkill(_currentTime: number): boolean {
    return this.effects.some(e => e.type === 'skill');
  }

  hasFireEffect(_currentTime: number): boolean {
    return this.effects.some(e => e.type === 'fire');
  }

  hasLightningEffect(_currentTime: number): boolean {
    return this.effects.some(e => e.type === 'lightning');
  }

  hasHealEffect(_currentTime: number): boolean {
    return this.effects.some(e => e.type === 'heal');
  }

  hasShieldEffect(_currentTime: number): boolean {
    return this.effects.some(e => e.type === 'shield');
  }

  startPlaceAnimation(): void {
    this.isPlacing = true;
    this.placeAnimationProgress = 0;
  }

  updatePlaceAnimation(deltaTime: number): boolean {
    if (!this.isPlacing) return false;
    this.placeAnimationProgress += deltaTime / 300;
    if (this.placeAnimationProgress >= 1) {
      this.placeAnimationProgress = 1;
      this.isPlacing = false;
      return true;
    }
    return false;
  }

  isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < BOARD_ROWS && pos.col >= 0 && pos.col < BOARD_COLS;
  }
}
