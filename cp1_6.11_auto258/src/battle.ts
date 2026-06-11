import type { TeamState, Escort } from './team';
import { getTeamAverageStrength, getTeamAverageMorale, damageEscort, applyEffect } from './team';

export interface Enemy {
  name: string;
  health: number;
  maxHealth: number;
  strength: number;
  morale: number;
}

export interface BattleState {
  active: boolean;
  round: number;
  maxRounds: number;
  playerTurn: boolean;
  enemy: Enemy;
  log: string[];
  result: 'ongoing' | 'win' | 'lose' | 'retreat';
  effects: BattleEffect[];
}

export interface BattleEffect {
  type: 'critical' | 'dodge' | 'hit' | 'block';
  actor: 'player' | 'enemy';
  timestamp: number;
}

const ENEMY_TYPES: Omit<Enemy, 'health' | 'maxHealth'>[] = [
  { name: '山贼头目', strength: 55, morale: 60 },
  { name: '黑店掌柜', strength: 45, morale: 50 },
  { name: '剪径大王', strength: 65, morale: 70 },
  { name: '蒙面匪首', strength: 50, morale: 55 },
  { name: '山林恶汉', strength: 40, morale: 45 }
];

export function startBattle(team: TeamState): BattleState {
  const teamStrength = getTeamAverageStrength(team);
  const teamMorale = getTeamAverageMorale(team);
  
  const difficulty = Math.min(1 + team.progress / 200, 1.5);
  
  const enemyTemplate = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  const enemyHealth = Math.floor(80 + Math.random() * 40 * difficulty);
  
  const enemy: Enemy = {
    ...enemyTemplate,
    health: enemyHealth,
    maxHealth: enemyHealth,
    strength: Math.floor(enemyTemplate.strength * difficulty),
    morale: Math.floor(enemyTemplate.morale * difficulty)
  };
  
  const playerAdvantage = (teamStrength - enemy.strength) / 100;
  const playerTurn = playerAdvantage > 0 || Math.random() > 0.5;
  
  return {
    active: true,
    round: 1,
    maxRounds: 5,
    playerTurn,
    enemy,
    log: [`${enemy.name}挡住了去路！`, playerTurn ? '我方先出手！' : '敌人先手发难！'],
    result: 'ongoing',
    effects: []
  };
}

export function checkCritical(): boolean {
  return Math.random() < 0.15;
}

export function checkDodge(): boolean {
  return Math.random() < 0.12;
}

export function calculateDamage(
  attacker: { strength: number; morale: number },
  defender: { strength: number; morale: number }
): number {
  const baseDamage = 15;
  const strengthDiff = attacker.strength - defender.strength * 0.6;
  const moraleBonus = (attacker.morale - defender.morale) * 0.1;
  const randomFactor = Math.random() * 10 - 5;
  
  const damage = baseDamage + strengthDiff * 0.4 + moraleBonus + randomFactor;
  return Math.max(5, Math.floor(damage));
}

export function executeRound(
  battle: BattleState,
  team: TeamState,
  action: 'attack' | 'defend' | 'retreat'
): { battle: BattleState; team: TeamState } {
  let newBattle = { ...battle, effects: [] };
  let newTeam = { ...team };
  
  if (action === 'retreat') {
    newBattle.result = 'retreat';
    newBattle.active = false;
    newBattle.log.push('镖队选择撤退，损失了部分士气...');
    newTeam = applyEffect(newTeam, { stamina: -10, morale: -15 });
    return { battle: newBattle, team: newTeam };
  }
  
  const aliveEscorts = newTeam.escorts.filter(e => e.alive);
  if (aliveEscorts.length === 0) {
    newBattle.result = 'lose';
    newBattle.active = false;
    return { battle: newBattle, team: newTeam };
  }
  
  const mainEscort = aliveEscorts[Math.floor(Math.random() * aliveEscorts.length)];
  
  if (newBattle.playerTurn) {
    const playerStats = {
      strength: getTeamAverageStrength(newTeam),
      morale: getTeamAverageMorale(newTeam)
    };
    
    if (action === 'attack') {
      const isDodge = checkDodge();
      if (isDodge) {
        newBattle.effects.push({ type: 'dodge', actor: 'enemy', timestamp: Date.now() });
        newBattle.log.push(`${newBattle.enemy.name}侧身一闪，躲过了攻击！`);
      } else {
        let damage = calculateDamage(playerStats, newBattle.enemy);
        const isCritical = checkCritical();
        if (isCritical) {
          damage = Math.floor(damage * 1.8);
          newBattle.effects.push({ type: 'critical', actor: 'player', timestamp: Date.now() });
          newBattle.log.push(`【暴击】${mainEscort.name}奋力一击，造成${damage}点伤害！`);
        } else {
          newBattle.effects.push({ type: 'hit', actor: 'player', timestamp: Date.now() });
          newBattle.log.push(`${mainEscort.name}出手攻击，造成${damage}点伤害！`);
        }
        newBattle.enemy = { ...newBattle.enemy, health: newBattle.enemy.health - damage };
      }
    } else if (action === 'defend') {
      newBattle.effects.push({ type: 'block', actor: 'player', timestamp: Date.now() });
      newBattle.log.push(`${mainEscort.name}举盾防御，准备迎接敌人的攻击！`);
      newTeam = applyEffect(newTeam, { morale: +2 });
    }
    
    if (newBattle.enemy.health <= 0) {
      newBattle.result = 'win';
      newBattle.active = false;
      newBattle.log.push(`${newBattle.enemy.name}被击败了！`);
      newTeam = applyEffect(newTeam, { morale: +10 });
      newTeam.consecutiveLosses = 0;
      return { battle: newBattle, team: newTeam };
    }
  }
  
  if (newBattle.result === 'ongoing' && !newBattle.playerTurn) {
    const enemyStats = {
      strength: newBattle.enemy.strength,
      morale: newBattle.enemy.morale
    };
    
    const isDodge = checkDodge();
    if (isDodge) {
      newBattle.effects.push({ type: 'dodge', actor: 'player', timestamp: Date.now() });
      newBattle.log.push(`${mainEscort.name}灵巧地躲过了${newBattle.enemy.name}的攻击！`);
    } else {
      let damage = calculateDamage(enemyStats, { strength: getTeamAverageStrength(newTeam), morale: getTeamAverageMorale(newTeam) });
      
      if (action === 'defend' && newBattle.playerTurn) {
        damage = Math.floor(damage * 0.4);
        newBattle.effects.push({ type: 'block', actor: 'player', timestamp: Date.now() });
        newBattle.log.push(`${mainEscort.name}成功格挡，只受到${damage}点伤害！`);
      } else {
        const isCritical = checkCritical();
        if (isCritical) {
          damage = Math.floor(damage * 1.8);
          newBattle.effects.push({ type: 'critical', actor: 'enemy', timestamp: Date.now() });
          newBattle.log.push(`【暴击】${newBattle.enemy.name}凶狠一击，${mainEscort.name}受到${damage}点伤害！`);
        } else {
          newBattle.effects.push({ type: 'hit', actor: 'enemy', timestamp: Date.now() });
          newBattle.log.push(`${newBattle.enemy.name}发起攻击，${mainEscort.name}受到${damage}点伤害！`);
        }
      }
      
      newTeam = damageEscort(newTeam, mainEscort.id, damage);
    }
  }
  
  newBattle.round++;
  newBattle.playerTurn = !newBattle.playerTurn;
  
  if (newBattle.round > newBattle.maxRounds) {
    if (newBattle.enemy.health < newBattle.enemy.maxHealth * 0.5) {
      newBattle.result = 'win';
      newBattle.log.push('敌人见势不妙，狼狈逃窜！');
      newTeam = applyEffect(newTeam, { morale: +5 });
      newTeam.consecutiveLosses = 0;
    } else {
      newBattle.result = 'lose';
      newBattle.log.push('久战不下，镖队只得撤退...');
      newTeam = applyEffect(newTeam, { stamina: -20, morale: -15 });
      newTeam.consecutiveLosses++;
    }
    newBattle.active = false;
  }
  
  if (newTeam.isGameOver) {
    newBattle.result = 'lose';
    newBattle.active = false;
  }
  
  return { battle: newBattle, team: newTeam };
}
