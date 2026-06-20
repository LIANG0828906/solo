import { GameEvent, EventType, GridCell, GRID_SIZE, BuildingType } from '../types/gameTypes';

const EARTHQUAKE_DAMAGE = 3;
const POLLUTION_SPREAD = 3;
const ENVIRONMENT_PENALTY = 10;
const MONEY_PENALTY = 200;

const EVENT_TEMPLATES: Record<EventType, Omit<GameEvent, 'id' | 'timestamp'>> = {
  earthquake: {
    type: 'earthquake',
    name: '地震来袭',
    description: '地震摧毁了3座建筑，损失200金币！',
    isPositive: false,
    duration: 0
  },
  prosperity: {
    type: 'prosperity',
    name: '经济繁荣',
    description: '商业蓬勃发展！商业建筑收入翻倍，持续20秒。',
    isPositive: true,
    duration: 20000
  },
  pollution: {
    type: 'pollution',
    name: '污染扩散',
    description: '工业污染蔓延！3个区域变为工业用地，环境下降10点。',
    isPositive: false,
    duration: 0
  }
};

export const shouldTriggerEvent = (): boolean => {
  return Math.random() < 0.5;
};

export const getRandomEventType = (): EventType => {
  const types: EventType[] = ['earthquake', 'prosperity', 'pollution'];
  return types[Math.floor(Math.random() * types.length)];
};

export const createGameEvent = (type: EventType): GameEvent => {
  const template = EVENT_TEMPLATES[type];
  return {
    ...template,
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };
};

export const getRandomEmptyCell = (grid: GridCell[][]): { x: number; y: number } | null => {
  const emptyCells: { x: number; y: number }[] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].building === 'empty') {
        emptyCells.push({ x, y });
      }
    }
  }
  
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

export const getRandomBuildingCell = (grid: GridCell[][]): { x: number; y: number } | null => {
  const buildingCells: { x: number; y: number }[] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const building = grid[y][x].building;
      if (building !== 'empty' && building !== 'road') {
        buildingCells.push({ x, y });
      }
    }
  }
  
  if (buildingCells.length === 0) return null;
  return buildingCells[Math.floor(Math.random() * buildingCells.length)];
};

export const applyEarthquakeEffect = (
  grid: GridCell[][],
  damageCount: number = EARTHQUAKE_DAMAGE
): { newGrid: GridCell[][]; destroyedCount: number; affectedCells: string[] } => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const affectedCells: string[] = [];
  let destroyed = 0;
  
  for (let i = 0; i < damageCount; i++) {
    const cell = getRandomBuildingCell(newGrid);
    if (cell) {
      newGrid[cell.y][cell.x].building = 'empty';
      affectedCells.push(`${cell.x},${cell.y}`);
      destroyed++;
    }
  }
  
  return { newGrid, destroyedCount: destroyed, affectedCells };
};

export const applyPollutionEffect = (
  grid: GridCell[][],
  spreadCount: number = POLLUTION_SPREAD
): { newGrid: GridCell[][]; pollutedCount: number; affectedCells: string[] } => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const affectedCells: string[] = [];
  let polluted = 0;
  
  for (let i = 0; i < spreadCount; i++) {
    const cell = getRandomEmptyCell(newGrid);
    if (cell) {
      newGrid[cell.y][cell.x].building = 'industrial';
      affectedCells.push(`${cell.x},${cell.y}`);
      polluted++;
    }
  }
  
  return { newGrid, pollutedCount: polluted, affectedCells };
};

export const getEventMoneyDelta = (eventType: EventType): number => {
  switch (eventType) {
    case 'earthquake':
      return -MONEY_PENALTY;
    default:
      return 0;
  }
};

export const getEventEnvironmentDelta = (eventType: EventType): number => {
  switch (eventType) {
    case 'pollution':
      return -ENVIRONMENT_PENALTY;
    default:
      return 0;
  }
};

export const isEventExpired = (event: GameEvent): boolean => {
  if (!event.duration || event.duration === 0) return true;
  return Date.now() - event.timestamp > event.duration;
};

export const getActiveProsperityEvent = (events: GameEvent[]): GameEvent | undefined => {
  return events.find(e => e.type === 'prosperity' && !isEventExpired(e));
};

export const getEarthquakeNotification = (destroyedCount: number): GameEvent => {
  const event = createGameEvent('earthquake');
  event.description = `地震摧毁了${destroyedCount}座建筑，损失${MONEY_PENALTY}金币！`;
  return event;
};

export const getPollutionNotification = (pollutedCount: number): GameEvent => {
  const event = createGameEvent('pollution');
  event.description = `工业污染蔓延！${pollutedCount}个区域变为工业用地，环境下降${ENVIRONMENT_PENALTY}点。`;
  return event;
};
