export interface Character {
  id: string;
  name: string;
  avatar: string;
  hunger: number;
  health: number;
  equipment: number;
  items: Item[];
  isDead: boolean;
  griefTurns: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  quantity: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'move' | 'combat' | 'collect' | 'event' | 'system';
  message: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  timeLimit: number;
}

export interface EventOption {
  id: string;
  text: string;
  effect: EventEffect;
}

export interface EventEffect {
  hungerChange?: number;
  healthChange?: number;
  equipmentChange?: number;
  message: string;
  logType: 'move' | 'combat' | 'collect' | 'event' | 'system';
}

export interface GameState {
  characters: Character[];
  position: { x: number; y: number };
  logs: LogEntry[];
  currentEvent: GameEvent | null;
  isEventActive: boolean;
  eventStartTime: number | null;
  turnCount: number;
}

const MAP_SIZE = 5;

const initialCharacters: Character[] = [
  {
    id: 'char1',
    name: '猎人·艾伦',
    avatar: '🏹',
    hunger: 80,
    health: 100,
    equipment: 90,
    items: [
      { id: 'item1', name: '斧头', icon: '🪓', quantity: 1 },
      { id: 'item2', name: '水壶', icon: '🫗', quantity: 1 },
    ],
    isDead: false,
    griefTurns: 0,
  },
  {
    id: 'char2',
    name: '医生·莉娜',
    avatar: '💊',
    hunger: 75,
    health: 95,
    equipment: 85,
    items: [
      { id: 'item3', name: '急救包', icon: '🩹', quantity: 2 },
      { id: 'item4', name: '草药', icon: '🌿', quantity: 3 },
    ],
    isDead: false,
    griefTurns: 0,
  },
  {
    id: 'char3',
    name: '侦察兵·马可',
    avatar: '🔭',
    hunger: 85,
    health: 90,
    equipment: 70,
    items: [
      { id: 'item5', name: '望远镜', icon: '🔭', quantity: 1 },
      { id: 'item6', name: '绳索', icon: '🪢', quantity: 1 },
    ],
    isDead: false,
    griefTurns: 0,
  },
  {
    id: 'char4',
    name: '工匠·托尔',
    avatar: '🔨',
    hunger: 70,
    health: 100,
    equipment: 95,
    items: [
      { id: 'item7', name: '锤子', icon: '🔨', quantity: 1 },
      { id: 'item8', name: '打火石', icon: '🪨', quantity: 2 },
    ],
    isDead: false,
    griefTurns: 0,
  },
];

const randomEvents: Omit<GameEvent, 'id' | 'timeLimit'>[] = [
  {
    title: '发现野果堆',
    description: '你们在灌木丛中发现了一片野果堆，看起来可以食用。',
    options: [
      {
        id: 'opt1',
        text: '分享资源（每人+15饥饿）',
        effect: { hungerChange: 15, message: '发现野果堆，选择分享资源，全体恢复15点饥饿值', logType: 'collect' },
      },
      {
        id: 'opt2',
        text: '全部采集带走（每人+25饥饿，但消耗装备）',
        effect: { hungerChange: 25, equipmentChange: -5, message: '发现野果堆，选择全部采集，全体恢复25点饥饿值，装备损耗5点', logType: 'collect' },
      },
      {
        id: 'opt3',
        text: '谨慎观察（少量补充，无风险）',
        effect: { hungerChange: 8, message: '发现野果堆，选择谨慎观察，全体恢复8点饥饿值', logType: 'collect' },
      },
    ],
  },
  {
    title: '遭遇恶劣天气',
    description: '乌云密布，暴风雨即将来临，你们必须做出选择。',
    options: [
      {
        id: 'opt1',
        text: '加速赶路（每人-10健康，快速通过）',
        effect: { healthChange: -10, message: '遭遇风暴，选择加速赶路，全体损失10点健康值', logType: 'event' },
      },
      {
        id: 'opt2',
        text: '原地扎营（每人-5饥饿，安全度过）',
        effect: { hungerChange: -5, message: '遭遇风暴，选择原地扎营，全体损失5点饥饿值', logType: 'event' },
      },
      {
        id: 'opt3',
        text: '寻找庇护所（消耗装备，减少损失）',
        effect: { healthChange: -3, equipmentChange: -8, message: '遭遇风暴，选择寻找庇护所，全体损失3点健康值，装备损耗8点', logType: 'event' },
      },
    ],
  },
  {
    title: '发现废弃营地',
    description: '前方有一个废弃的营地，看起来还有一些遗留物资。',
    options: [
      {
        id: 'opt1',
        text: '仔细搜索（可能有好东西）',
        effect: { hungerChange: 10, equipmentChange: 10, healthChange: 5, message: '发现废弃营地，仔细搜索获得补给，全体恢复饥饿、健康和装备各若干', logType: 'collect' },
      },
      {
        id: 'opt2',
        text: '快速搜刮（有风险但收益快）',
        effect: { hungerChange: 20, healthChange: -5, message: '发现废弃营地，快速搜刮获得食物但意外受伤，全体+20饥饿，-5健康', logType: 'event' },
      },
      {
        id: 'opt3',
        text: '直接离开（不冒险）',
        effect: { message: '发现废弃营地，选择直接离开，继续前进', logType: 'move' },
      },
    ],
  },
  {
    title: '野兽袭击',
    description: '一群野狼从树林中冲出，向你们扑来！',
    options: [
      {
        id: 'opt1',
        text: '正面战斗（装备损耗大，但有收获）',
        effect: { healthChange: -15, equipmentChange: -15, hungerChange: 20, message: '遭遇野兽袭击，正面战斗获胜，全体-15健康，-15装备，+20饥饿（获得兽肉）', logType: 'combat' },
      },
      {
        id: 'opt2',
        text: '点火驱赶（消耗物资，但安全）',
        effect: { equipmentChange: -5, hungerChange: -5, message: '遭遇野兽袭击，点火驱赶成功，全体-5装备，-5饥饿', logType: 'event' },
      },
      {
        id: 'opt3',
        text: '快速逃跑（损失小但有概率受伤）',
        effect: { healthChange: -8, hungerChange: -3, message: '遭遇野兽袭击，逃跑时有人受伤，全体-8健康，-3饥饿', logType: 'combat' },
      },
    ],
  },
  {
    title: '清澈溪流',
    description: '你们发现了一条清澈的小溪，可以在这里补水休息。',
    options: [
      {
        id: 'opt1',
        text: '充分休息（恢复健康）',
        effect: { healthChange: 15, hungerChange: -5, message: '发现清澈溪流，充分休息恢复健康，全体+15健康，-5饥饿', logType: 'collect' },
      },
      {
        id: 'opt2',
        text: '快速补水继续赶路',
        effect: { hungerChange: 5, message: '发现清澈溪流，快速补水，全体+5饥饿值', logType: 'collect' },
      },
      {
        id: 'opt3',
        text: '清洗装备（恢复耐久）',
        effect: { equipmentChange: 10, hungerChange: -3, message: '发现清澈溪流，清洗装备恢复耐久，全体+10装备，-3饥饿', logType: 'event' },
      },
    ],
  },
];

export function createInitialState(): GameState {
  return {
    characters: JSON.parse(JSON.stringify(initialCharacters)),
    position: { x: 2, y: 2 },
    logs: [
      {
        id: 'log-init',
        timestamp: Date.now(),
        type: 'system',
        message: '游戏开始！你们的队伍从地图中心出发，目标是生存下去。',
      },
    ],
    currentEvent: null,
    isEventActive: false,
    eventStartTime: null,
    turnCount: 0,
  };
}

export function canMoveTo(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return false;
  const { position } = state;
  const dx = Math.abs(x - position.x);
  const dy = Math.abs(y - position.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function moveTeam(state: GameState, x: number, y: number): { state: GameState; eventTriggered: boolean } {
  if (!canMoveTo(state, x, y)) {
    return { state, eventTriggered: false };
  }

  const newState: GameState = JSON.parse(JSON.stringify(state));
  newState.position = { x, y };
  newState.turnCount += 1;

  const aliveChars = newState.characters.filter(c => !c.isDead);

  const hasGrief = aliveChars.some(c => c.griefTurns > 0);
  let hungerCost = 5;
  if (hasGrief) {
    hungerCost = Math.floor(hungerCost * 1.5);
  }

  aliveChars.forEach(char => {
    char.hunger = Math.max(0, char.hunger - hungerCost);
    const equipLoss = Math.floor(Math.random() * 4) + 2;
    char.equipment = Math.max(0, char.equipment - equipLoss);

    if (char.hunger <= 0 || char.health <= 0) {
      char.isDead = true;
      char.hunger = 0;
      char.health = 0;
    }

    if (char.griefTurns > 0) {
      char.griefTurns -= 1;
    }
  });

  const newlyDead = newState.characters.filter(c => c.isDead && !state.characters.find(sc => sc.id === c.id)?.isDead);
  if (newlyDead.length > 0) {
    aliveChars.forEach(char => {
      if (!char.isDead) {
        char.griefTurns = 3;
      }
    });
    newlyDead.forEach(deadChar => {
      addLog(newState, 'system', `${deadChar.name} 不幸牺牲了...其他队员沉浸在悲痛中。`);
    });
  }

  addLog(newState, 'move', `移动至(${x + 1},${y + 1}) - 消耗${hungerCost}点饥饿值`);

  const eventChance = Math.random();
  if (eventChance < 0.2) {
    const event = generateRandomEvent();
    newState.currentEvent = event;
    newState.isEventActive = true;
    newState.eventStartTime = Date.now();
    return { state: newState, eventTriggered: true };
  }

  return { state: newState, eventTriggered: false };
}

export function generateRandomEvent(): GameEvent {
  const eventTemplate = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  return {
    ...eventTemplate,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timeLimit: 15000,
  };
}

export function applyEventOption(state: GameState, optionId: string): GameState {
  if (!state.currentEvent) return state;

  const option = state.currentEvent.options.find(o => o.id === optionId);
  if (!option) return state;

  const newState: GameState = JSON.parse(JSON.stringify(state));
  const effect = option.effect;
  const aliveChars = newState.characters.filter(c => !c.isDead);

  aliveChars.forEach(char => {
    if (effect.hungerChange !== undefined) {
      char.hunger = Math.min(100, Math.max(0, char.hunger + effect.hungerChange));
    }
    if (effect.healthChange !== undefined) {
      char.health = Math.min(100, Math.max(0, char.health + effect.healthChange));
    }
    if (effect.equipmentChange !== undefined) {
      char.equipment = Math.min(100, Math.max(0, char.equipment + effect.equipmentChange));
    }

    if (char.hunger <= 0 || char.health <= 0) {
      char.isDead = true;
      char.hunger = 0;
      char.health = 0;
    }
  });

  const newlyDead = newState.characters.filter(c => c.isDead && !state.characters.find(sc => sc.id === c.id)?.isDead);
  if (newlyDead.length > 0) {
    aliveChars.forEach(char => {
      if (!char.isDead) {
        char.griefTurns = 3;
      }
    });
  }

  addLog(newState, effect.logType, effect.message);

  newState.currentEvent = null;
  newState.isEventActive = false;
  newState.eventStartTime = null;

  return newState;
}

export function handleEventTimeout(state: GameState): GameState {
  if (!state.isEventActive) return state;

  const newState: GameState = JSON.parse(JSON.stringify(state));
  const options = newState.currentEvent?.options;

  if (options && options.length > 0) {
    const lastOption = options[options.length - 1];
    const aliveChars = newState.characters.filter(c => !c.isDead);
    const effect = lastOption.effect;

    aliveChars.forEach(char => {
      if (effect.hungerChange !== undefined) {
        char.hunger = Math.min(100, Math.max(0, char.hunger + effect.hungerChange));
      }
      if (effect.healthChange !== undefined) {
        char.health = Math.min(100, Math.max(0, char.health + effect.healthChange));
      }
      if (effect.equipmentChange !== undefined) {
        char.equipment = Math.min(100, Math.max(0, char.equipment + effect.equipmentChange));
      }

      if (char.hunger <= 0 || char.health <= 0) {
        char.isDead = true;
        char.hunger = 0;
        char.health = 0;
      }
    });

    addLog(newState, 'system', `事件超时：${newState.currentEvent?.title} - 默认选择了"${lastOption.text}"`);
  }

  newState.currentEvent = null;
  newState.isEventActive = false;
  newState.eventStartTime = null;

  return newState;
}

function addLog(state: GameState, type: LogEntry['type'], message: string) {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    message,
  };
  state.logs.unshift(entry);
  if (state.logs.length > 50) {
    state.logs = state.logs.slice(0, 50);
  }
}

export function getEquipmentStatus(equipment: number): 'normal' | 'warning' | 'broken' {
  if (equipment <= 10) return 'broken';
  if (equipment <= 30) return 'warning';
  return 'normal';
}
