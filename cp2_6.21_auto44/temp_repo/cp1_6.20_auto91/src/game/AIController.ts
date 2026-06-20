export type ShipType = 'battleship' | 'cruiser' | 'frigate';

export type SkillId = 'focusFire' | 'shieldRecharge' | 'spatialDistortion';

export type PlayerSide = 'player' | 'ai';

export interface Position {
  row: number;
  col: number;
}

export interface Skill {
  id: SkillId;
  name: string;
  cooldown: number;
  currentCooldown: number;
}

export interface ShipStats {
  maxHP: number;
  attack: number;
  armor: number;
  range: number;
  speed: number;
  shield: number;
  maxShield: number;
}

export interface Unit {
  id: string;
  type: ShipType;
  side: PlayerSide;
  position: Position;
  hp: number;
  stats: ShipStats;
  skills: Skill[];
  upgraded: {
    offense: boolean;
    defense: boolean;
  };
  isAlive: boolean;
}

export interface FleetComposition {
  battleship: number;
  cruiser: number;
  frigate: number;
}

export interface Tactics {
  focusLowHP: boolean;
  skillUsage: 'aggressive' | 'defensive' | 'balanced';
}

export interface ResourceAllocation {
  offense: number;
  defense: number;
}

export interface AIConfig {
  id: string;
  name: string;
  description: string;
  displayName: string;
  avatar: string;
  fleetComposition: FleetComposition;
  tactics: Tactics;
  resourceAllocation: ResourceAllocation;
  generatedAt: string;
}

export interface AIAction {
  type: 'attack' | 'skill';
  targetId?: string;
  skillId?: SkillId;
}

export interface ShipCost {
  battleship: number;
  cruiser: number;
  frigate: number;
}

export interface UpgradeCost {
  offense: number;
  defense: number;
}

export interface GridCell {
  row: number;
  col: number;
  unitId: string | null;
  isDeployable: boolean;
  side: PlayerSide | null;
}

export interface GridEngine {
  grid: GridCell[][];
  units: Map<string, Unit>;
  rows: number;
  cols: number;
  getUnitById(id: string): Unit | undefined;
  getUnitsBySide(side: PlayerSide): Unit[];
  getDistance(pos1: Position, pos2: Position): number;
  getCell(row: number, col: number): GridCell | undefined;
  isCellOccupied(row: number, col: number): boolean;
  isInRange(attacker: Unit, target: Unit): boolean;
  deployUnit(unit: Omit<Unit, 'id' | 'isAlive'>): string;
  removeUnit(id: string): void;
  getAIDeployArea(): GridCell[];
}

export interface DeployResources {
  total: number;
  remaining: number;
  shipCosts: ShipCost;
  upgradeCosts: UpgradeCost;
}

const SHIP_COSTS: ShipCost = {
  battleship: 100,
  cruiser: 75,
  frigate: 50,
};

const UPGRADE_COSTS: UpgradeCost = {
  offense: 30,
  defense: 30,
};

const BASE_SHIP_STATS: Record<ShipType, ShipStats> = {
  battleship: {
    maxHP: 200,
    attack: 40,
    armor: 15,
    range: 3,
    speed: 1,
    shield: 50,
    maxShield: 50,
  },
  cruiser: {
    maxHP: 150,
    attack: 25,
    armor: 10,
    range: 2,
    speed: 2,
    shield: 30,
    maxShield: 30,
  },
  frigate: {
    maxHP: 80,
    attack: 15,
    armor: 5,
    range: 2,
    speed: 3,
    shield: 15,
    maxShield: 15,
  },
};

const DEFAULT_SKILLS: Record<ShipType, Skill[]> = {
  battleship: [
    { id: 'focusFire', name: '集火', cooldown: 3, currentCooldown: 0 },
  ],
  cruiser: [
    { id: 'shieldRecharge', name: '护盾回充', cooldown: 3, currentCooldown: 0 },
  ],
  frigate: [
    { id: 'spatialDistortion', name: '空间干扰', cooldown: 4, currentCooldown: 0 },
  ],
};

const AI_API_BASE = 'http://localhost:3001';

export async function fetchAIConfig(): Promise<AIConfig> {
  try {
    const response = await fetch(`${AI_API_BASE}/api/ai-config`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as AIConfig;
  } catch (error) {
    console.warn('[AIController] Failed to fetch AI config from server, using fallback:', error);
    return getFallbackAIConfig();
  }
}

function getFallbackAIConfig(): AIConfig {
  const fallbackConfigs: Omit<AIConfig, 'displayName' | 'avatar' | 'generatedAt'>[] = [
    {
      id: 'aggressive',
      name: '激进型AI',
      description: '偏好战列舰，高伤害输出',
      fleetComposition: { battleship: 2, cruiser: 1, frigate: 1 },
      tactics: { focusLowHP: true, skillUsage: 'aggressive' },
      resourceAllocation: { offense: 0.7, defense: 0.3 },
    },
    {
      id: 'defensive',
      name: '防御型AI',
      description: '偏好巡洋舰，护盾优先',
      fleetComposition: { battleship: 1, cruiser: 2, frigate: 1 },
      tactics: { focusLowHP: false, skillUsage: 'defensive' },
      resourceAllocation: { offense: 0.4, defense: 0.6 },
    },
    {
      id: 'balanced',
      name: '均衡型AI',
      description: '混合舰队，灵活应变',
      fleetComposition: { battleship: 1, cruiser: 1, frigate: 2 },
      tactics: { focusLowHP: true, skillUsage: 'balanced' },
      resourceAllocation: { offense: 0.5, defense: 0.5 },
    },
  ];

  const aiNames = [
    '星云猎手', '虚空掠夺者', '深空守望者', '星尘指挥官',
    '暗影舰队司令', '银河终结者', '量子先锋', '虫洞漫游者',
    '脉冲战略家', '等离子将军', '曲率领主', '暗物质执政官',
  ];

  const aiAvatars = ['🚀', '👾', '🛸', '🌌', '⭐', '💫', '🌠', '☄️', '🛰️', '🌙', '🪐', '🌍'];

  const randomConfig = fallbackConfigs[Math.floor(Math.random() * fallbackConfigs.length)];
  const randomName = aiNames[Math.floor(Math.random() * aiNames.length)];
  const randomAvatar = aiAvatars[Math.floor(Math.random() * aiAvatars.length)];

  return {
    ...randomConfig,
    displayName: randomName,
    avatar: randomAvatar,
    generatedAt: new Date().toISOString(),
  };
}

export function deployFleet(
  engine: GridEngine,
  resources: DeployResources,
  aiConfig: AIConfig
): void {
  const { fleetComposition, resourceAllocation } = aiConfig;
  const { offense: offenseRatio, defense: defenseRatio } = resourceAllocation;

  const deployArea = engine.getAIDeployArea();
  const availableCells = deployArea.filter((cell) => !engine.isCellOccupied(cell.row, cell.col));

  const totalShips = fleetComposition.battleship + fleetComposition.cruiser + fleetComposition.frigate;
  const totalShipCost =
    fleetComposition.battleship * SHIP_COSTS.battleship +
    fleetComposition.cruiser * SHIP_COSTS.cruiser +
    fleetComposition.frigate * SHIP_COSTS.frigate;

  const remainingAfterShips = Math.max(0, resources.total - totalShipCost);
  const offenseBudget = Math.floor(remainingAfterShips * offenseRatio);
  const defenseBudget = Math.floor(remainingAfterShips * defenseRatio);

  let offenseUpgradesLeft = Math.floor(offenseBudget / UPGRADE_COSTS.offense);
  let defenseUpgradesLeft = Math.floor(defenseBudget / UPGRADE_COSTS.defense);

  const selectedPositions = selectDeploymentPositions(availableCells, totalShips);
  let positionIndex = 0;

  const shipOrder: ShipType[] = [
    ...Array(fleetComposition.battleship).fill('battleship' as ShipType),
    ...Array(fleetComposition.cruiser).fill('cruiser' as ShipType),
    ...Array(fleetComposition.frigate).fill('frigate' as ShipType),
  ];

  shuffleArray(shipOrder);

  for (const shipType of shipOrder) {
    if (positionIndex >= selectedPositions.length) break;

    const position = selectedPositions[positionIndex++];
    const baseStats = { ...BASE_SHIP_STATS[shipType] };
    const skills = DEFAULT_SKILLS[shipType].map((s) => ({ ...s }));

    let upgraded = { offense: false, defense: false };

    if (offenseUpgradesLeft > 0) {
      baseStats.attack = Math.floor(baseStats.attack * 1.3);
      upgraded.offense = true;
      offenseUpgradesLeft--;
    }

    if (defenseUpgradesLeft > 0) {
      baseStats.armor = Math.floor(baseStats.armor * 1.3);
      baseStats.maxShield = Math.floor(baseStats.maxShield * 1.3);
      baseStats.shield = baseStats.maxShield;
      upgraded.defense = true;
      defenseUpgradesLeft--;
    }

    engine.deployUnit({
      type: shipType,
      side: 'ai',
      position,
      hp: baseStats.maxHP,
      stats: baseStats,
      skills,
      upgraded,
    });
  }
}

function selectDeploymentPositions(cells: GridCell[], count: number): Position[] {
  if (cells.length === 0) return [];

  const sortedCells = [...cells].sort((a, b) => {
    const centerA = distanceToCenter(a);
    const centerB = distanceToCenter(b);
    return centerA - centerB;
  });

  const selected: Position[] = [];
  const usedPositions = new Set<string>();

  for (const cell of sortedCells) {
    if (selected.length >= count) break;

    const key = `${cell.row},${cell.col}`;
    if (usedPositions.has(key)) continue;

    const hasAdjacentSelected = selected.some((pos) => {
      const rowDist = Math.abs(pos.row - cell.row);
      const colDist = Math.abs(pos.col - cell.col);
      return rowDist <= 1 && colDist <= 1 && !(rowDist === 0 && colDist === 0);
    });

    if (selected.length === 0 || !hasAdjacentSelected || Math.random() < 0.3) {
      selected.push({ row: cell.row, col: cell.col });
      usedPositions.add(key);
    }
  }

  while (selected.length < count && sortedCells.length > selected.length) {
    for (const cell of sortedCells) {
      if (selected.length >= count) break;
      const key = `${cell.row},${cell.col}`;
      if (!usedPositions.has(key)) {
        selected.push({ row: cell.row, col: cell.col });
        usedPositions.add(key);
      }
    }
  }

  return selected;
}

function distanceToCenter(cell: GridCell): number {
  const centerRow = 1;
  const centerCol = 4;
  return Math.abs(cell.row - centerRow) + Math.abs(cell.col - centerCol);
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function decideAction(
  engine: GridEngine,
  aiUnit: Unit,
  enemyUnits: Unit[]
): AIAction {
  if (!aiUnit.isAlive) {
    return { type: 'attack' };
  }

  const aliveEnemies = enemyUnits.filter((u) => u.isAlive);
  if (aliveEnemies.length === 0) {
    return { type: 'attack' };
  }

  const skillDecision = tryUseSkill(engine, aiUnit, aliveEnemies);
  if (skillDecision) {
    return skillDecision;
  }

  const target = selectAttackTarget(engine, aiUnit, aliveEnemies);
  if (target) {
    return { type: 'attack', targetId: target.id };
  }

  return { type: 'attack' };
}

function selectAttackTarget(
  engine: GridEngine,
  aiUnit: Unit,
  enemies: Unit[]
): Unit | undefined {
  const inRangeEnemies = enemies.filter((e) => engine.isInRange(aiUnit, e));

  if (inRangeEnemies.length === 0) {
    const sortedByDistance = [...enemies].sort((a, b) => {
      const distA = engine.getDistance(aiUnit.position, a.position);
      const distB = engine.getDistance(aiUnit.position, b.position);
      return distA - distB;
    });
    return sortedByDistance[0];
  }

  const config: { focusLowHP: boolean } = { focusLowHP: true };

  if (config.focusLowHP) {
    const lowHPEnemies = inRangeEnemies.filter((e) => {
      const hpPercent = e.hp / e.stats.maxHP;
      return hpPercent < 0.5;
    });

    if (lowHPEnemies.length > 0) {
      lowHPEnemies.sort((a, b) => {
        const hpPercentA = a.hp / a.stats.maxHP;
        const hpPercentB = b.hp / b.stats.maxHP;
        return hpPercentA - hpPercentB;
      });
      return lowHPEnemies[0];
    }
  }

  inRangeEnemies.sort((a, b) => {
    const distA = engine.getDistance(aiUnit.position, a.position);
    const distB = engine.getDistance(aiUnit.position, b.position);
    if (distA !== distB) return distA - distB;
    return a.hp - b.hp;
  });

  return inRangeEnemies[0];
}

function tryUseSkill(
  engine: GridEngine,
  aiUnit: Unit,
  enemies: Unit[]
): AIAction | null {
  const availableSkills = aiUnit.skills.filter((s) => s.currentCooldown === 0);
  if (availableSkills.length === 0) {
    return null;
  }

  const alliedUnits = engine.getUnitsBySide('ai').filter((u) => u.isAlive);

  for (const skill of availableSkills) {
    switch (skill.id) {
      case 'focusFire': {
        const hasLowHPEnemy = enemies.some((e) => e.hp / e.stats.maxHP < 0.5);
        if (hasLowHPEnemy && Math.random() < 0.6) {
          const lowHPEnemies = enemies
            .filter((e) => e.hp / e.stats.maxHP < 0.5)
            .sort((a, b) => a.hp - b.hp);
          return {
            type: 'skill',
            skillId: 'focusFire',
            targetId: lowHPEnemies[0]?.id,
          };
        }
        break;
      }

      case 'shieldRecharge': {
        const hasLowHPAlly = alliedUnits.some((u) => u.hp / u.stats.maxHP < 0.3);
        if (hasLowHPAlly && Math.random() < 0.8) {
          const lowHPAllies = alliedUnits
            .filter((u) => u.hp / u.stats.maxHP < 0.3)
            .sort((a, b) => a.hp - b.hp);
          return {
            type: 'skill',
            skillId: 'shieldRecharge',
            targetId: lowHPAllies[0]?.id,
          };
        }
        break;
      }

      case 'spatialDistortion': {
        const isEnemyDense = checkEnemyDensity(engine, enemies, aiUnit.position);
        if (isEnemyDense && Math.random() < 0.4) {
          return {
            type: 'skill',
            skillId: 'spatialDistortion',
          };
        }
        break;
      }
    }
  }

  return null;
}

function checkEnemyDensity(
  engine: GridEngine,
  enemies: Unit[],
  referencePosition: Position
): boolean {
  if (enemies.length < 2) return false;

  let closePairs = 0;
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const dist = engine.getDistance(enemies[i].position, enemies[j].position);
      if (dist <= 2) {
        closePairs++;
      }
    }
  }

  const threshold = Math.floor(enemies.length / 2);
  return closePairs >= Math.max(1, threshold);
}

export function getShipCosts(): ShipCost {
  return { ...SHIP_COSTS };
}

export function getUpgradeCosts(): UpgradeCost {
  return { ...UPGRADE_COSTS };
}

export function getBaseShipStats(shipType: ShipType): ShipStats {
  return { ...BASE_SHIP_STATS[shipType] };
}

export function getDefaultSkills(shipType: ShipType): Skill[] {
  return DEFAULT_SKILLS[shipType].map((s) => ({ ...s }));
}
