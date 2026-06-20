import { GameState, Unit, Card, Recommendation, SimulationStep, AnalysisResult, ActionType } from './types';
import { v4 as uuidv4 } from 'uuid';

const MAX_DEPTH = 3;
const MAX_RECOMMENDATIONS = 3;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getPlayerUnits(board: (Unit | null)[][], owner: 'player' | 'enemy'): Unit[] {
  const units: Unit[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const unit = board[y][x];
      if (unit && unit.owner === owner) {
        units.push(unit);
      }
    }
  }
  return units;
}

function getEmptySlots(board: (Unit | null)[][], owner: 'player' | 'enemy'): { x: number; y: number }[] {
  const slots: { x: number; y: number }[] = [];
  const startY = owner === 'player' ? 4 : 0;
  const endY = owner === 'player' ? 8 : 4;
  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < 8; x++) {
      if (!board[y][x]) {
        slots.push({ x, y });
      }
    }
  }
  return slots;
}

function evaluateBoardValue(state: GameState, player: 'player' | 'enemy'): number {
  let score = 0;
  const p = player === 'player' ? state.player : state.enemy;
  const opponent = player === 'player' ? state.enemy : state.player;

  score += p.health * 2;
  score -= opponent.health * 2;

  const playerUnits = getPlayerUnits(state.board, player);
  const enemyUnits = getPlayerUnits(state.board, player === 'player' ? 'enemy' : 'player');

  for (const unit of playerUnits) {
    score += unit.attack * 1.5 + unit.health;
    if (unit.hasTaunt) score += 2;
    if (unit.canAttack) score += 1;
  }

  for (const unit of enemyUnits) {
    score -= unit.attack * 1.5 + unit.health;
  }

  score += p.mana * 0.5;

  if (opponent.health <= 0) score += 1000;
  if (p.health <= 0) score -= 1000;

  return score;
}

function calculateWinRate(boardValue: number): number {
  const base = 50;
  const scaled = boardValue * 2;
  const rate = base + scaled;
  return Math.max(5, Math.min(95, rate));
}

function applySpellEffect(
  state: GameState,
  card: Card,
  target?: { x: number; y: number } | 'hero_enemy' | 'hero_player'
): GameState {
  const newState = deepClone(state);
  const effect = card.spellEffect || '';

  if (effect.includes('damage')) {
    const match = effect.match(/damage_(\d+)/);
    if (match) {
      const damage = parseInt(match[1], 10);
      if (target === 'hero_enemy') {
        newState.enemy.health -= damage;
      } else if (target === 'hero_player') {
        newState.player.health -= damage;
      } else if (target) {
        const unit = newState.board[target.y][target.x];
        if (unit) {
          unit.health -= damage;
          if (unit.health <= 0) {
            newState.board[target.y][target.x] = null;
          }
        }
      }
    }
  }

  if (effect.includes('buff_attack')) {
    const match = effect.match(/buff_attack_(\d+)/);
    if (match && target && typeof target !== 'string') {
      const buff = parseInt(match[1], 10);
      const unit = newState.board[target.y][target.x];
      if (unit && unit.owner === 'player') {
        unit.attack += buff;
      }
    }
  }

  if (effect.includes('buff_health')) {
    const match = effect.match(/buff_health_(\d+)/);
    if (match && target && typeof target !== 'string') {
      const buff = parseInt(match[1], 10);
      const unit = newState.board[target.y][target.x];
      if (unit && unit.owner === 'player') {
        unit.health += buff;
        unit.maxHealth += buff;
      }
    }
  }

  if (effect.includes('heal')) {
    const match = effect.match(/heal_(\d+)/);
    if (match) {
      const heal = parseInt(match[1], 10);
      newState.player.health = Math.min(
        newState.player.maxHealth,
        newState.player.health + heal
      );
    }
  }

  return newState;
}

function playMinionCard(
  state: GameState,
  card: Card,
  position: { x: number; y: number }
): GameState {
  const newState = deepClone(state);
  const unit: Unit = {
    id: uuidv4(),
    cardId: card.id,
    name: card.name,
    attack: card.attack || 0,
    health: card.health || 0,
    maxHealth: card.maxHealth || card.health || 0,
    element: card.element || 'neutral',
    position,
    owner: 'player',
    canAttack: card.description.includes('突袭'),
    hasTaunt: card.description.includes('嘲讽')
  };
  newState.board[position.y][position.x] = unit;
  newState.player.mana -= card.cost;
  newState.player.hand = newState.player.hand.filter(c => c.id !== card.id);

  if (card.id.includes('fire_warlock')) {
    const enemyUnits = getPlayerUnits(newState.board, 'enemy');
    if (enemyUnits.length > 0) {
      const target = enemyUnits[0];
      target.health -= 1;
      if (target.health <= 0) {
        newState.board[target.position.y][target.position.x] = null;
      }
    }
  }

  if (card.id.includes('water_healer')) {
    newState.player.health = Math.min(newState.player.maxHealth, newState.player.health + 3);
  }

  return newState;
}

function performAttack(
  state: GameState,
  attacker: Unit,
  target: Unit | 'hero'
): GameState {
  const newState = deepClone(state);
  const attackerUnit = newState.board[attacker.position.y][attacker.position.x];
  if (!attackerUnit) return newState;

  if (target === 'hero') {
    newState.enemy.health -= attackerUnit.attack;
    attackerUnit.canAttack = false;
  } else {
    const targetUnit = newState.board[target.position.y][target.position.x];
    if (targetUnit) {
      targetUnit.health -= attackerUnit.attack;
      attackerUnit.health -= targetUnit.attack;
      attackerUnit.canAttack = false;

      if (targetUnit.health <= 0) {
        newState.board[target.position.y][target.position.x] = null;
      }
      if (attackerUnit.health <= 0) {
        newState.board[attackerUnit.position.y][attackerUnit.position.x] = null;
      }
    }
  }

  return newState;
}

function generateValidActions(state: GameState): { action: ActionType; card?: Card; position?: { x: number; y: number }; target?: any }[] {
  const actions: { action: ActionType; card?: Card; position?: { x: number; y: number }; target?: any }[] = [];

  for (const card of state.player.hand) {
    if (card.cost <= state.player.mana) {
      if (card.type === 'minion') {
        const slots = getEmptySlots(state.board, 'player');
        for (const slot of slots.slice(0, 3)) {
          actions.push({ action: 'play', card, position: slot });
        }
      } else if (card.type === 'spell') {
        const enemyUnits = getPlayerUnits(state.board, 'enemy');
        const playerUnits = getPlayerUnits(state.board, 'player');
        if (card.spellEffect?.includes('damage')) {
          for (const unit of enemyUnits.slice(0, 2)) {
            actions.push({ action: 'spell', card, target: { x: unit.position.x, y: unit.position.y } });
          }
          actions.push({ action: 'spell', card, target: 'hero_enemy' });
        }
        if (card.spellEffect?.includes('buff') && playerUnits.length > 0) {
          actions.push({ action: 'spell', card, target: { x: playerUnits[0].position.x, y: playerUnits[0].position.y } });
        }
      }
    }
  }

  const playerUnits = getPlayerUnits(state.board, 'player');
  const enemyUnits = getPlayerUnits(state.board, 'enemy');
  const hasTaunt = enemyUnits.some(u => u.hasTaunt);

  for (const unit of playerUnits) {
    if (unit.canAttack) {
      if (hasTaunt) {
        for (const enemy of enemyUnits.filter(u => u.hasTaunt)) {
          actions.push({ action: 'attack', target: { x: enemy.position.x, y: enemy.position.y } });
        }
      } else {
        for (const enemy of enemyUnits.slice(0, 3)) {
          actions.push({ action: 'attack', target: { x: enemy.position.x, y: enemy.position.y } });
        }
        if (enemyUnits.filter(u => u.hasTaunt).length === 0) {
          actions.push({ action: 'attack', target: 'hero' });
        }
      }
    }
  }

  if (state.player.heroPower && !state.player.heroPowerUsed && state.player.mana >= state.player.heroPower.cost) {
    actions.push({ action: 'hero_power', card: state.player.heroPower });
  }

  return actions;
}

interface DFSResult {
  score: number;
  steps: SimulationStep[];
  totalDamage: number;
  boardValue: number;
}

function dfs(
  state: GameState,
  depth: number,
  currentSteps: SimulationStep[],
  totalDamage: number,
  visited: Set<string>
): DFSResult {
  if (depth === 0 || state.gameOver) {
    const score = evaluateBoardValue(state, 'player');
    return {
      score,
      steps: currentSteps,
      totalDamage,
      boardValue: score
    };
  }

  const actions = generateValidActions(state);
  if (actions.length === 0) {
    const score = evaluateBoardValue(state, 'player');
    return {
      score,
      steps: currentSteps,
      totalDamage,
      boardValue: score
    };
  }

  let bestResult: DFSResult = {
    score: -Infinity,
    steps: [],
    totalDamage: 0,
    boardValue: 0
  };

  for (const act of actions.slice(0, 8)) {
    let newState = deepClone(state);
    let stepDamage = 0;
    let description = '';

    try {
      if (act.action === 'play' && act.card && act.position) {
        newState = playMinionCard(newState, act.card, act.position);
        description = `将${act.card.name}放置在(${act.position.x},${act.position.y})`;
      } else if (act.action === 'spell' && act.card) {
        newState = applySpellEffect(newState, act.card, act.target);
        newState.player.mana -= act.card.cost;
        newState.player.hand = newState.player.hand.filter(c => c.id !== act.card!.id);
        description = `施放${act.card.name}`;
        if (act.card.spellEffect?.includes('damage')) {
          const match = act.card.spellEffect.match(/damage_(\d+)/);
          if (match) stepDamage = parseInt(match[1], 10);
        }
      } else if (act.action === 'attack') {
        const playerUnits = getPlayerUnits(state.board, 'player');
        const attacker = playerUnits[0];
        if (attacker) {
          if (act.target === 'hero') {
            newState = performAttack(newState, attacker, 'hero');
            stepDamage = attacker.attack;
            description = `${attacker.name}攻击敌方英雄`;
          } else {
            const targetUnit = newState.board[act.target.y][act.target.x];
            if (targetUnit) {
              newState = performAttack(newState, attacker, targetUnit as Unit);
              stepDamage = attacker.attack;
              description = `${attacker.name}攻击${targetUnit.name}`;
            }
          }
        }
      } else if (act.action === 'hero_power' && act.card) {
        newState.player.heroPowerUsed = true;
        newState.player.mana -= act.card.cost;
        if (act.card.spellEffect?.includes('damage')) {
          newState.enemy.health -= 1;
          stepDamage = 1;
        } else if (act.card.spellEffect?.includes('heal')) {
          newState.player.health = Math.min(newState.player.maxHealth, newState.player.health + 2);
        }
        description = `使用英雄技能：${act.card.name}`;
      }

      const step: SimulationStep = {
        id: uuidv4(),
        action: act.action,
        description,
        card: act.card,
        targetPosition: typeof act.target === 'object' ? act.target : undefined,
        boardSnapshot: deepClone(newState.board),
        playerHealth: newState.player.health,
        enemyHealth: newState.enemy.health,
        playerMana: newState.player.mana
      };

      const result = dfs(newState, depth - 1, [...currentSteps, step], totalDamage + stepDamage, visited);

      if (result.score > bestResult.score) {
        bestResult = result;
      }
    } catch (e) {
      continue;
    }
  }

  return bestResult;
}

export function generateRecommendations(state: GameState): AnalysisResult {
  const startTime = Date.now();
  const recommendations: Recommendation[] = [];
  const visited = new Set<string>();

  const actions = generateValidActions(state);

  const actionResults: { action: any; result: DFSResult }[] = [];

  for (const act of actions.slice(0, 12)) {
    let newState = deepClone(state);
    let stepDamage = 0;
    let description = '';

    try {
      if (act.action === 'play' && act.card && act.position) {
        newState = playMinionCard(newState, act.card, act.position);
        description = `打出${act.card.name}到(${act.position.x},${act.position.y})`;
      } else if (act.action === 'spell' && act.card) {
        newState = applySpellEffect(newState, act.card, act.target);
        newState.player.mana -= act.card.cost;
        newState.player.hand = newState.player.hand.filter(c => c.id !== act.card!.id);
        description = `施放${act.card.name}`;
        if (act.card.spellEffect?.includes('damage')) {
          const match = act.card.spellEffect.match(/damage_(\d+)/);
          if (match) stepDamage = parseInt(match[1], 10);
        }
      } else if (act.action === 'attack') {
        const playerUnits = getPlayerUnits(state.board, 'player');
        const attacker = playerUnits.find(u => u.canAttack);
        if (attacker) {
          if (act.target === 'hero') {
            newState = performAttack(newState, attacker, 'hero');
            stepDamage = attacker.attack;
            description = `${attacker.name}攻击敌方英雄`;
          } else {
            const targetUnit = state.board[act.target.y][act.target.x];
            if (targetUnit) {
              newState = performAttack(newState, attacker, targetUnit as Unit);
              stepDamage = attacker.attack;
              description = `${attacker.name}攻击${targetUnit.name}`;
            }
          }
        }
      } else if (act.action === 'hero_power' && act.card) {
        newState.player.heroPowerUsed = true;
        newState.player.mana -= act.card.cost;
        if (act.card.spellEffect?.includes('damage')) {
          newState.enemy.health -= 1;
          stepDamage = 1;
        } else if (act.card.spellEffect?.includes('heal')) {
          newState.player.health = Math.min(newState.player.maxHealth, newState.player.health + 2);
        }
        description = `使用英雄技能：${act.card.name}`;
      }

      const step: SimulationStep = {
        id: uuidv4(),
        action: act.action,
        description,
        card: act.card,
        targetPosition: typeof act.target === 'object' ? act.target : undefined,
        boardSnapshot: deepClone(newState.board),
        playerHealth: newState.player.health,
        enemyHealth: newState.enemy.health,
        playerMana: newState.player.mana
      };

      const result = dfs(newState, MAX_DEPTH - 1, [step], stepDamage, visited);
      actionResults.push({ action: act, result });
    } catch (e) {
      continue;
    }
  }

  actionResults.sort((a, b) => b.result.score - a.result.score);

  const topResults = actionResults.slice(0, MAX_RECOMMENDATIONS);

  for (let i = 0; i < topResults.length; i++) {
    const { result } = topResults[i];
    recommendations.push({
      id: uuidv4(),
      rank: i + 1,
      winRate: calculateWinRate(result.score),
      description: result.steps[0]?.description || '推荐组合',
      steps: result.steps.slice(0, 5),
      totalDamage: result.totalDamage,
      boardValue: result.boardValue
    });
  }

  const analysisTime = Date.now() - startTime;

  return {
    turn: state.turn,
    recommendations,
    analysisTime,
    totalSimulations: actions.length * Math.pow(3, MAX_DEPTH)
  };
}
