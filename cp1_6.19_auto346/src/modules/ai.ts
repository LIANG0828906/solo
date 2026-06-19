import { useBattlefieldStore, CommandType, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT } from '../store';

const AI_INTERVAL = 15000;
let aiTimer: number | null = null;
let lastCommandTime = 0;

export function startAISystem() {
  if (aiTimer !== null) return;
  lastCommandTime = Date.now();
  tickAI();
}

export function stopAISystem() {
  if (aiTimer !== null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
}

function tickAI() {
  const delay = AI_INTERVAL + (Math.random() - 0.5) * 3000;
  aiTimer = window.setTimeout(() => {
    generateAICommand();
    tickAI();
  }, delay);
}

function generateAICommand() {
  const state = useBattlefieldStore.getState();
  if (state.isReplaying) return;

  const redUnits = state.units.filter((u) => u.team === 'red' && u.state !== 'dead');
  const blueUnits = state.units.filter((u) => u.team === 'blue' && u.state !== 'dead');

  if (redUnits.length === 0 || blueUnits.length === 0) return;

  const aiTeam: 'red' | 'blue' = redUnits.length <= blueUnits.length ? 'red' : 'blue';
  const allyUnits = state.units.filter((u) => u.team === aiTeam && u.state !== 'dead');
  const enemyUnits = state.units.filter((u) => u.team !== aiTeam && u.state !== 'dead');

  if (allyUnits.length === 0 || enemyUnits.length === 0) return;

  const cmdTypes: CommandType[] = ['surround', 'disperse', 'formation'];
  const type = cmdTypes[Math.floor(Math.random() * cmdTypes.length)];

  let cx = 0, cy = 0;
  enemyUnits.forEach((u) => { cx += u.x; cy += u.y; });
  cx /= enemyUnits.length;
  cy /= enemyUnits.length;

  const unitIds = allyUnits.map((u) => u.id);
  const jitter = (Math.random() - 0.5) * 80;
  const target = {
    x: Math.max(50, Math.min(BATTLEFIELD_WIDTH - 50, cx + jitter)),
    y: Math.max(50, Math.min(BATTLEFIELD_HEIGHT - 50, cy + (Math.random() - 0.5) * 80)),
  };

  const params: { radius?: number; width?: number; arc?: boolean } = {};
  if (type === 'surround') params.radius = 100 + Math.random() * 60;
  if (type === 'disperse') params.radius = 80 + Math.random() * 60;
  if (type === 'formation') {
    params.width = 150 + Math.random() * 150;
    params.arc = Math.random() > 0.5;
  }

  lastCommandTime = Date.now();
  state.issueCommand(type, unitIds, target, params);
}

export function getLastAICommandTime() {
  return lastCommandTime;
}
