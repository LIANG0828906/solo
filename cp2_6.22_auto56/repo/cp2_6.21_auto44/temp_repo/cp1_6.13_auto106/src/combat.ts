import {
  CombatState, Monster, Player, CombatTurn, CombatResult,
  BossFightState, Position, CONFIG, Particle
} from './types';
import { Player } from './player';
import { clamp, distance } from './utils';

export class CombatSystem {
  private state: CombatState;
  private bossState: BossFightState;

  constructor() {
    this.state = {
      active: false,
      playerId: 0,
      monster: null,
      turn: 'PLAYER',
      result: 'ONGOING',
      playerAttackAnimation: 0,
      monsterAttackAnimation: 0,
      damageText: '',
      damageTextTimer: 0,
      turnTimer: 0
    };

    this.bossState = {
      active: false,
      safeZoneRadius: CONFIG.SAFE_ZONE_INITIAL_RADIUS,
      safeZoneMaxRadius: CONFIG.SAFE_ZONE_INITIAL_RADIUS,
      safeZoneCenter: { x: 0, y: 0 },
      shrinkTimer: 0,
      damageTimer: 0,
      player1AttackCooldown: 0,
      player2AttackCooldown: 0
    };
  }

  getCombatState(): Readonly<CombatState> {
    return this.state;
  }

  getBossState(): Readonly<BossFightState> {
    return this.bossState;
  }

  startCombat(playerId: number, monster: Monster): void {
    this.state.active = true;
    this.state.playerId = playerId;
    this.state.monster = { ...monster };
    this.state.turn = 'PLAYER';
    this.state.result = 'ONGOING';
    this.state.playerAttackAnimation = 0;
    this.state.monsterAttackAnimation = 0;
    this.state.damageText = '';
    this.state.damageTextTimer = 0;
    this.state.turnTimer = 0.5;
  }

  endCombat(): void {
    this.state.active = false;
    this.state.monster = null;
    this.state.playerAttackAnimation = 0;
    this.state.monsterAttackAnimation = 0;
    this.state.damageText = '';
    this.state.damageTextTimer = 0;
  }

  playerAttack(player: Player): CombatResult {
    if (!this.state.active || !this.state.monster || this.state.turn !== 'PLAYER') {
      return this.state.result;
    }

    const playerAtk = player.getAttack();
    const monsterDef = this.state.monster.defense;
    const damage = Math.max(1, playerAtk - monsterDef);

    this.state.monster.hp -= damage;
    this.state.playerAttackAnimation = 1;
    this.state.damageText = `-${damage}`;
    this.state.damageTextTimer = 1;

    if (this.state.monster.hp <= 0) {
      this.state.monster.hp = 0;
      this.state.result = 'PLAYER_WIN';
      return 'PLAYER_WIN';
    }

    this.state.turn = 'MONSTER';
    this.state.turnTimer = 0.8;
    return 'ONGOING';
  }

  monsterAttack(player: Player): CombatResult {
    if (!this.state.active || !this.state.monster || this.state.turn !== 'MONSTER') {
      return this.state.result;
    }

    const monsterAtk = this.state.monster.attack;
    const playerDef = player.getDefense();
    const damage = Math.max(1, monsterAtk - playerDef);

    player.takeDamage(damage);
    this.state.monsterAttackAnimation = 1;
    this.state.damageText = `-${damage}`;
    this.state.damageTextTimer = 1;

    if (player.isDead()) {
      this.state.result = 'PLAYER_LOSE';
      return 'PLAYER_LOSE';
    }

    this.state.turn = 'PLAYER';
    this.state.turnTimer = 0.5;
    return 'ONGOING';
  }

  update(deltaTime: number, player: Player): CombatResult {
    if (!this.state.active) return this.state.result;

    if (this.state.playerAttackAnimation > 0) {
      this.state.playerAttackAnimation = Math.max(0, this.state.playerAttackAnimation - deltaTime * 3);
    }
    if (this.state.monsterAttackAnimation > 0) {
      this.state.monsterAttackAnimation = Math.max(0, this.state.monsterAttackAnimation - deltaTime * 3);
    }

    if (this.state.damageTextTimer > 0) {
      this.state.damageTextTimer -= deltaTime;
    }

    if (this.state.turnTimer > 0) {
      this.state.turnTimer -= deltaTime;
      if (this.state.turnTimer <= 0) {
        this.state.turnTimer = 0;
      }
    }

    return this.state.result;
  }

  canPlayerAct(): boolean {
    return this.state.active &&
      this.state.turn === 'PLAYER' &&
      this.state.turnTimer <= 0 &&
      this.state.result === 'ONGOING';
  }

  getMonster(): Monster | null {
    return this.state.monster;
  }

  startBossFight(center: Position): void {
    this.bossState.active = true;
    this.bossState.safeZoneRadius = CONFIG.SAFE_ZONE_INITIAL_RADIUS;
    this.bossState.safeZoneMaxRadius = CONFIG.SAFE_ZONE_INITIAL_RADIUS;
    this.bossState.safeZoneCenter = { ...center };
    this.bossState.shrinkTimer = CONFIG.SAFE_ZONE_SHRINK_INTERVAL;
    this.bossState.damageTimer = 0;
    this.bossState.player1AttackCooldown = 0;
    this.bossState.player2AttackCooldown = 0;
  }

  endBossFight(): void {
    this.bossState.active = false;
  }

  playerDuelAttack(attacker: Player, defender: Player): number {
    const attackerId = attacker.getId();

    if (attackerId === 1 && this.bossState.player1AttackCooldown > 0) {
      return 0;
    }
    if (attackerId === 2 && this.bossState.player2AttackCooldown > 0) {
      return 0;
    }

    const atk = attacker.getAttack();
    const def = defender.getDefense();
    const damage = Math.max(1, atk - def + 2);

    defender.takeDamage(damage);
    attacker.setAttackAnimation(1);

    if (attackerId === 1) {
      this.bossState.player1AttackCooldown = 0.3;
    } else {
      this.bossState.player2AttackCooldown = 0.3;
    }

    return damage;
  }

  updateBossFight(deltaTime: number, player1: Player, player2: Player): { p1Damage: number; p2Damage: number } {
    if (!this.bossState.active) {
      return { p1Damage: 0, p2Damage: 0 };
    }

    if (this.bossState.player1AttackCooldown > 0) {
      this.bossState.player1AttackCooldown -= deltaTime;
    }
    if (this.bossState.player2AttackCooldown > 0) {
      this.bossState.player2AttackCooldown -= deltaTime;
    }

    this.bossState.shrinkTimer -= deltaTime;
    if (this.bossState.shrinkTimer <= 0) {
      this.bossState.shrinkTimer = CONFIG.SAFE_ZONE_SHRINK_INTERVAL;
      this.bossState.safeZoneRadius = Math.max(
        50,
        this.bossState.safeZoneRadius - CONFIG.SAFE_ZONE_SHRINK_RATE
      );
    }

    this.bossState.damageTimer -= deltaTime;
    let p1Damage = 0;
    let p2Damage = 0;

    if (this.bossState.damageTimer <= 0) {
      this.bossState.damageTimer = 1;

      const p1Dist = this.distanceToSafeZoneEdge(player1.getRenderPosition());
      const p2Dist = this.distanceToSafeZoneEdge(player2.getRenderPosition());

      if (p1Dist > 0) {
        p1Damage = CONFIG.SAFE_ZONE_DAMAGE;
        player1.takeDamage(CONFIG.SAFE_ZONE_DAMAGE);
      }
      if (p2Dist > 0) {
        p2Damage = CONFIG.SAFE_ZONE_DAMAGE;
        player2.takeDamage(CONFIG.SAFE_ZONE_DAMAGE);
      }
    }

    return { p1Damage, p2Damage };
  }

  private distanceToSafeZoneEdge(pos: Position): number {
    const dx = pos.x - this.bossState.safeZoneCenter.x;
    const dy = pos.y - this.bossState.safeZoneCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, dist - this.bossState.safeZoneRadius);
  }

  isInSafeZone(pos: Position): boolean {
    const dist = distance(
      pos.x, pos.y,
      this.bossState.safeZoneCenter.x,
      this.bossState.safeZoneCenter.y
    );
    return dist <= this.bossState.safeZoneRadius;
  }

  getSafeZoneRadius(): number {
    return this.bossState.safeZoneRadius;
  }

  getSafeZoneCenter(): Position {
    return { ...this.bossState.safeZoneCenter };
  }

  canAttack(playerId: number): boolean {
    if (!this.bossState.active) return false;
    if (playerId === 1) {
      return this.bossState.player1AttackCooldown <= 0;
    } else {
      return this.bossState.player2AttackCooldown <= 0;
    }
  }

  setSafeZoneCenter(pos: Position): void {
    this.bossState.safeZoneCenter = { ...pos };
  }

  reset(): void {
    this.state = {
      active: false,
      playerId: 0,
      monster: null,
      turn: 'PLAYER',
      result: 'ONGOING',
      playerAttackAnimation: 0,
      monsterAttackAnimation: 0,
      damageText: '',
      damageTextTimer: 0,
      turnTimer: 0
    };

    this.bossState = {
      active: false,
      safeZoneRadius: CONFIG.SAFE_ZONE_INITIAL_RADIUS,
      safeZoneMaxRadius: CONFIG.SAFE_ZONE_INITIAL_RADIUS,
      safeZoneCenter: { x: 0, y: 0 },
      shrinkTimer: 0,
      damageTimer: 0,
      player1AttackCooldown: 0,
      player2AttackCooldown: 0
    };
  }
}
