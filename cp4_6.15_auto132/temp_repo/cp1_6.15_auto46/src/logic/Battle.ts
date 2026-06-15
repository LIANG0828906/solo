import { AssembledMech, BattleMech, BattleLogEntry, BattleResult, PartStats } from '../types';
import { BASE_HP, MAX_ROUNDS } from '../data/parts';

export class BattleLogic {
  static generateEnemyStats(playerStats: PartStats): PartStats {
    const variance = () => 0.75 + Math.random() * 0.5;
    return {
      attack: Math.round(playerStats.attack * variance()),
      defense: Math.round(playerStats.defense * variance()),
      speed: Math.round(playerStats.speed * variance()),
      energy: Math.round(playerStats.energy * variance())
    };
  }

  static createBattleMech(name: string, stats: PartStats): BattleMech {
    const hp = BASE_HP + stats.defense * 3;
    return {
      name,
      stats: { ...stats },
      hp,
      maxHp: hp
    };
  }

  static calculateDamage(attacker: BattleMech, defender: BattleMech): number {
    const baseDamage = attacker.stats.attack * 2 + Math.random() * attacker.stats.attack * 0.5;
    const reduction = defender.stats.defense * 1.5;
    const speedBonus = 1 + Math.max(0, (attacker.stats.speed - defender.stats.speed) * 0.01);
    const energyBonus = 1 + Math.max(0, attacker.stats.energy) * 0.005;
    const damage = Math.max(5, Math.round((baseDamage - reduction) * speedBonus * energyBonus));
    return damage;
  }

  static simulateBattle(playerMech: AssembledMech): BattleResult {
    const enemyStats = this.generateEnemyStats(playerMech.totalStats);
    const player = this.createBattleMech('玩家战甲', playerMech.totalStats);
    const enemy = this.createBattleMech('变异巨兽', enemyStats);
    const logs: BattleLogEntry[] = [];

    const playerFirst = player.stats.speed >= enemy.stats.speed;
    let round = 0;
    let winner: 'player' | 'enemy' | 'draw' = 'draw';

    for (round = 1; round <= MAX_ROUNDS; round++) {
      const first = playerFirst ? player : enemy;
      const second = playerFirst ? enemy : player;
      const firstIsPlayer = playerFirst;

      const firstDamage = this.calculateDamage(first, second);
      second.hp = Math.max(0, second.hp - firstDamage);
      logs.push({
        round,
        attacker: firstIsPlayer ? 'player' : 'enemy',
        action: firstIsPlayer ? '我方攻击' : '敌方攻击',
        damage: firstDamage,
        defenderHp: second.hp
      });

      if (second.hp <= 0) {
        winner = firstIsPlayer ? 'player' : 'enemy';
        break;
      }

      const secondDamage = this.calculateDamage(second, first);
      first.hp = Math.max(0, first.hp - secondDamage);
      logs.push({
        round,
        attacker: firstIsPlayer ? 'enemy' : 'player',
        action: firstIsPlayer ? '敌方反击' : '我方反击',
        damage: secondDamage,
        defenderHp: first.hp
      });

      if (first.hp <= 0) {
        winner = firstIsPlayer ? 'enemy' : 'player';
        break;
      }
    }

    if (round > MAX_ROUNDS) {
      round = MAX_ROUNDS;
      if (player.hp > enemy.hp) winner = 'player';
      else if (enemy.hp > player.hp) winner = 'enemy';
      else winner = 'draw';
    }

    return {
      playerMech: player,
      enemyMech: enemy,
      logs,
      winner,
      rounds: round,
      timestamp: Date.now()
    };
  }
}
