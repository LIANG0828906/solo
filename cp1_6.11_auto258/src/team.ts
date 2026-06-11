export interface Escort {
  id: string;
  name: string;
  avatar: string;
  stamina: number;
  strength: number;
  morale: number;
  alive: boolean;
}

export interface TeamState {
  escorts: Escort[];
  cargoIntegrity: number;
  progress: number;
  elapsedTime: number;
  consecutiveLosses: number;
  isGameOver: boolean;
  isVictory: boolean;
}

export interface EventEffect {
  stamina?: number;
  strength?: number;
  morale?: number;
  cargo?: number;
  time?: number;
  triggerBattle?: boolean;
}

const ESCORT_NAMES = ['李大刀', '王铁臂', '张神箭', '赵飞燕', '刘金刚', '陈追风'];
const AVATAR_EMOJIS = ['🗡️', '🛡️', '🏹', '⚔️', '💪', '🌪️'];

export function createTeam(): TeamState {
  const escorts: Escort[] = ESCORT_NAMES.map((name, index) => ({
    id: `escort-${index}`,
    name,
    avatar: AVATAR_EMOJIS[index],
    stamina: 80 + Math.floor(Math.random() * 20),
    strength: 60 + Math.floor(Math.random() * 30),
    morale: 70 + Math.floor(Math.random() * 20),
    alive: true
  }));

  return {
    escorts,
    cargoIntegrity: 100,
    progress: 0,
    elapsedTime: 0,
    consecutiveLosses: 0,
    isGameOver: false,
    isVictory: false
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applyEffect(state: TeamState, effect: EventEffect): TeamState {
  const newState = { ...state };
  const aliveEscorts = newState.escorts.filter(e => e.alive);

  if (effect.stamina !== undefined) {
    aliveEscorts.forEach(escort => {
      escort.stamina = clamp(escort.stamina + effect.stamina!, 0, 100);
      if (escort.stamina <= 0) {
        escort.alive = false;
      }
    });
  }

  if (effect.strength !== undefined) {
    aliveEscorts.forEach(escort => {
      escort.strength = clamp(escort.strength + effect.strength!, 0, 100);
    });
  }

  if (effect.morale !== undefined) {
    aliveEscorts.forEach(escort => {
      escort.morale = clamp(escort.morale + effect.morale!, 0, 100);
    });
  }

  if (effect.cargo !== undefined) {
    newState.cargoIntegrity = clamp(newState.cargoIntegrity + effect.cargo, 0, 100);
  }

  if (effect.time !== undefined) {
    newState.elapsedTime += effect.time;
  }

  newState.escorts = newState.escorts.map(e => {
    const updated = aliveEscorts.find(ae => ae.id === e.id);
    return updated || e;
  });

  checkGameOver(newState);

  return newState;
}

export function checkGameOver(state: TeamState): boolean {
  const aliveCount = state.escorts.filter(e => e.alive).length;
  
  if (state.cargoIntegrity <= 50) {
    state.isGameOver = true;
    return true;
  }
  
  if (aliveCount === 0) {
    state.isGameOver = true;
    return true;
  }
  
  if (state.consecutiveLosses >= 3) {
    state.isGameOver = true;
    return true;
  }
  
  return false;
}

export function damageEscort(state: TeamState, escortId: string, damage: number): TeamState {
  const newState = { ...state };
  const escort = newState.escorts.find(e => e.id === escortId);
  
  if (escort && escort.alive) {
    escort.stamina = clamp(escort.stamina - damage, 0, 100);
    if (escort.stamina <= 0) {
      escort.alive = false;
    }
  }
  
  newState.escorts = [...newState.escorts];
  checkGameOver(newState);
  
  return newState;
}

export function advanceProgress(state: TeamState, amount: number): TeamState {
  const newState = { ...state };
  newState.progress = clamp(newState.progress + amount, 0, 100);
  newState.elapsedTime += 10;
  
  if (newState.progress >= 100) {
    newState.isVictory = true;
  }
  
  return newState;
}

export function getAliveEscorts(state: TeamState): Escort[] {
  return state.escorts.filter(e => e.alive);
}

export function getTeamAverageStrength(state: TeamState): number {
  const alive = getAliveEscorts(state);
  if (alive.length === 0) return 0;
  return alive.reduce((sum, e) => sum + e.strength, 0) / alive.length;
}

export function getTeamAverageMorale(state: TeamState): number {
  const alive = getAliveEscorts(state);
  if (alive.length === 0) return 0;
  return alive.reduce((sum, e) => sum + e.morale, 0) / alive.length;
}

export function calculateReward(state: TeamState): number {
  const baseReward = 100;
  const cargoBonus = state.cargoIntegrity * 0.5;
  const survivorBonus = getAliveEscorts(state).length * 20;
  const damagePenalty = Math.floor((100 - state.cargoIntegrity) / 10) * 5;
  
  return Math.max(0, baseReward + cargoBonus + survivorBonus - damagePenalty);
}

export const RANDOM_COMMENTS = [
  '一路风尘，护货有功！',
  '天有不测风云，人有旦夕祸福。',
  '江湖险恶，好在有惊无险。',
  '忠义两全，镖局之福！',
  '虽有损耗，终保大局。',
  '历经磨难，方显英雄本色。',
  '山高路远，情深义重。',
  '侠肝义胆，名扬四海！',
  '小心驶得万年船。',
  '留得青山在，不怕没柴烧。'
];

export function getRandomComment(): string {
  return RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
}
