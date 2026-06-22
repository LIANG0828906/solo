export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  type: 'damage' | 'defense' | 'heal';
  minValue: number;
  maxValue: number;
  defenseBonus?: number;
  defenseBonusDuration?: number;
}

export interface Hero {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  currentHp: number;
  baseDefense: number;
  currentDefense: number;
  defenseBonus: number;
  defenseBonusDuration: number;
  skills: Skill[];
}

export interface LogEntry {
  id: number;
  round: number;
  actor: string;
  action: string;
  damage?: number;
  heal?: number;
}

export interface AnimationState {
  type: 'pounce' | 'shield' | 'heal';
  from: 'player' | 'opponent';
  to: 'player' | 'opponent';
}

export type GameStatus = 'playing' | 'playerWin' | 'opponentWin' | 'draw';

export interface GameState {
  player: Hero;
  opponent: Hero;
  currentTurn: 'player' | 'opponent';
  round: number;
  maxRounds: number;
  gameStatus: GameStatus;
  battleLog: LogEntry[];
  animation: AnimationState | null;
  showTurnIndicator: boolean;
  logIdCounter: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'USE_SKILL'; skillId: string; actor: 'player' | 'opponent' }
  | { type: 'END_ANIMATION' }
  | { type: 'HIDE_TURN_INDICATOR' }
  | { type: 'RESET_GAME' }
  | { type: 'AI_TURN' };

const createSkills = (): Skill[] => [
  {
    id: 'pounce',
    name: '猛扑',
    description: '造成20-30点伤害',
    cooldown: 1,
    currentCooldown: 0,
    type: 'damage',
    minValue: 20,
    maxValue: 30,
  },
  {
    id: 'shield',
    name: '护盾',
    description: '提升防御15点，持续2回合',
    cooldown: 3,
    currentCooldown: 0,
    type: 'defense',
    minValue: 0,
    maxValue: 0,
    defenseBonus: 15,
    defenseBonusDuration: 2,
  },
  {
    id: 'heal',
    name: '治疗',
    description: '恢复20-30点生命值',
    cooldown: 3,
    currentCooldown: 0,
    type: 'heal',
    minValue: 20,
    maxValue: 30,
  },
];

const createPlayerHero = (): Hero => ({
  id: 'player',
  name: '橘猫勇士',
  emoji: '🐱',
  maxHp: 100,
  currentHp: 100,
  baseDefense: 10,
  currentDefense: 10,
  defenseBonus: 0,
  defenseBonusDuration: 0,
  skills: createSkills(),
});

const createOpponentHero = (): Hero => ({
  id: 'opponent',
  name: '黑猫战士',
  emoji: '🐈‍⬛',
  maxHp: 100,
  currentHp: 100,
  baseDefense: 10,
  currentDefense: 10,
  defenseBonus: 0,
  defenseBonusDuration: 0,
  skills: createSkills(),
});

export const initialState: GameState = {
  player: createPlayerHero(),
  opponent: createOpponentHero(),
  currentTurn: 'player',
  round: 1,
  maxRounds: 10,
  gameStatus: 'playing',
  battleLog: [],
  animation: null,
  showTurnIndicator: true,
  logIdCounter: 0,
};

const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const reduceCooldowns = (hero: Hero): Hero => {
  return {
    ...hero,
    skills: hero.skills.map((skill) => ({
      ...skill,
      currentCooldown: skill.currentCooldown > 0 ? skill.currentCooldown - 1 : 0,
    })),
  };
};

const updateDefenseBonus = (hero: Hero): Hero => {
  let newDefenseBonusDuration = hero.defenseBonusDuration;
  let newDefenseBonus = hero.defenseBonus;

  if (hero.defenseBonusDuration > 0) {
    newDefenseBonusDuration -= 1;
    if (newDefenseBonusDuration === 0) {
      newDefenseBonus = 0;
    }
  }

  return {
    ...hero,
    defenseBonus: newDefenseBonus,
    defenseBonusDuration: newDefenseBonusDuration,
    currentDefense: hero.baseDefense + newDefenseBonus,
  };
};

const calculateDamage = (baseDamage: number, attacker: Hero, defender: Hero): number => {
  const damage = baseDamage - defender.currentDefense;
  return Math.max(5, damage);
};

const checkGameEnd = (state: GameState): GameStatus => {
  if (state.player.currentHp <= 0) return 'opponentWin';
  if (state.opponent.currentHp <= 0) return 'playerWin';
  if (state.round > state.maxRounds) {
    if (state.player.currentHp > state.opponent.currentHp) return 'playerWin';
    if (state.player.currentHp < state.opponent.currentHp) return 'opponentWin';
    return 'draw';
  }
  return 'playing';
};

const applySkillEffect = (
  state: GameState,
  skillId: string,
  actor: 'player' | 'opponent'
): { newState: GameState; logEntry: LogEntry } => {
  const attacker = actor === 'player' ? state.player : state.opponent;
  const defender = actor === 'player' ? state.opponent : state.player;
  const skill = attacker.skills.find((s) => s.id === skillId)!;

  let newAttacker = { ...attacker };
  let newDefender = { ...defender };
  let logAction = '';
  let damage: number | undefined;
  let heal: number | undefined;

  newAttacker.skills = newAttacker.skills.map((s) =>
    s.id === skillId ? { ...s, currentCooldown: s.cooldown } : s
  );

  switch (skill.type) {
    case 'damage': {
      const baseDamage = randomInRange(skill.minValue, skill.maxValue);
      const finalDamage = calculateDamage(baseDamage, newAttacker, newDefender);
      newDefender.currentHp = Math.max(0, newDefender.currentHp - finalDamage);
      damage = finalDamage;
      logAction = `使用${skill.name}，造成${finalDamage}点伤害`;
      break;
    }
    case 'defense': {
      newAttacker.defenseBonus = skill.defenseBonus || 15;
      newAttacker.defenseBonusDuration = skill.defenseBonusDuration || 2;
      newAttacker.currentDefense = newAttacker.baseDefense + newAttacker.defenseBonus;
      logAction = `使用${skill.name}，防御提升${skill.defenseBonus}点`;
      break;
    }
    case 'heal': {
      const healAmount = randomInRange(skill.minValue, skill.maxValue);
      newAttacker.currentHp = Math.min(newAttacker.maxHp, newAttacker.currentHp + healAmount);
      heal = healAmount;
      logAction = `使用${skill.name}，恢复${healAmount}点生命值`;
      break;
    }
  }

  const newLogId = state.logIdCounter + 1;
  const logEntry: LogEntry = {
    id: newLogId,
    round: state.round,
    actor: newAttacker.name,
    action: logAction,
    damage,
    heal,
  };

  const newState: GameState = {
    ...state,
    player: actor === 'player' ? newAttacker : newDefender,
    opponent: actor === 'player' ? newDefender : newAttacker,
    battleLog: [...state.battleLog, logEntry],
    logIdCounter: newLogId,
  };

  return { newState, logEntry };
};

const getAnimationFromSkill = (
  skillId: string,
  actor: 'player' | 'opponent'
): AnimationState | null => {
  const skillType = skillId as 'pounce' | 'shield' | 'heal';
  if (!['pounce', 'shield', 'heal'].includes(skillType)) return null;
  return {
    type: skillType,
    from: actor,
    to: actor === 'player' ? 'opponent' : 'player',
  };
};

const aiChooseSkill = (hero: Hero): string => {
  const availableSkills = hero.skills.filter((s) => s.currentCooldown === 0);
  if (availableSkills.length === 0) {
    return hero.skills[0].id;
  }

  if (hero.currentHp < 30) {
    const healSkill = availableSkills.find((s) => s.type === 'heal');
    if (healSkill) return healSkill.id;
  }

  if (hero.defenseBonusDuration === 0) {
    const shieldSkill = availableSkills.find((s) => s.type === 'defense');
    if (shieldSkill && Math.random() > 0.5) return shieldSkill.id;
  }

  const damageSkills = availableSkills.filter((s) => s.type === 'damage');
  if (damageSkills.length > 0) {
    return damageSkills[Math.floor(Math.random() * damageSkills.length)].id;
  }

  return availableSkills[Math.floor(Math.random() * availableSkills.length)].id;
};

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...initialState,
        showTurnIndicator: true,
      };
    }

    case 'USE_SKILL': {
      if (state.gameStatus !== 'playing') return state;
      if (state.animation !== null) return state;
      if (state.currentTurn !== action.actor) return state;

      const actor = action.actor === 'player' ? state.player : state.opponent;
      const skill = actor.skills.find((s) => s.id === action.skillId);
      if (!skill || skill.currentCooldown > 0) return state;

      const animation = getAnimationFromSkill(action.skillId, action.actor);

      return {
        ...state,
        animation,
      };
    }

    case 'END_ANIMATION': {
      if (state.animation === null) return state;

      const skillType = state.animation.type;
      const actor = state.animation.from;

      const { newState: stateAfterSkill } = applySkillEffect(state, skillType, actor);

      const gameStatus = checkGameEnd(stateAfterSkill);

      if (gameStatus !== 'playing') {
        return {
          ...stateAfterSkill,
          gameStatus,
          animation: null,
        };
      }

      const nextTurn = actor === 'player' ? 'opponent' : 'player';
      const nextRound = nextTurn === 'player' ? state.round + 1 : state.round;

      let nextPlayer = stateAfterSkill.player;
      let nextOpponent = stateAfterSkill.opponent;

      if (nextTurn === 'player') {
        nextPlayer = reduceCooldowns(updateDefenseBonus(nextPlayer));
      } else {
        nextOpponent = reduceCooldowns(updateDefenseBonus(nextOpponent));
      }

      return {
        ...stateAfterSkill,
        player: nextPlayer,
        opponent: nextOpponent,
        currentTurn: nextTurn,
        round: nextRound,
        animation: null,
        showTurnIndicator: true,
      };
    }

    case 'HIDE_TURN_INDICATOR': {
      return {
        ...state,
        showTurnIndicator: false,
      };
    }

    case 'AI_TURN': {
      if (state.gameStatus !== 'playing') return state;
      if (state.animation !== null) return state;
      if (state.currentTurn !== 'opponent') return state;
      if (state.showTurnIndicator) return state;

      const skillId = aiChooseSkill(state.opponent);
      const animation = getAnimationFromSkill(skillId, 'opponent');

      return {
        ...state,
        animation,
      };
    }

    case 'RESET_GAME': {
      return {
        ...initialState,
        showTurnIndicator: true,
      };
    }

    default:
      return state;
  }
}
