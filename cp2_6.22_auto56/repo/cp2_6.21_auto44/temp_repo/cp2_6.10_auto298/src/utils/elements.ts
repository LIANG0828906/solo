export enum ElementType {
  FIRE = 'fire',
  WATER = 'water',
  EARTH = 'earth',
  WIND = 'wind'
}

export enum Player {
  PLAYER1 = 1,
  PLAYER2 = 2
}

export interface ElementConfig {
  name: string;
  baseAttack: number;
  baseHp: number;
  color: number;
  glowColor: number;
  icon: string;
  strongAgainst: ElementType;
  weakAgainst: ElementType;
}

export const ELEMENT_CONFIG: Record<ElementType, ElementConfig> = {
  [ElementType.FIRE]: {
    name: '火',
    baseAttack: 30,
    baseHp: 100,
    color: 0xff0040,
    glowColor: 0xff0040,
    icon: '🔥',
    strongAgainst: ElementType.WIND,
    weakAgainst: ElementType.WATER
  },
  [ElementType.WATER]: {
    name: '水',
    baseAttack: 25,
    baseHp: 120,
    color: 0x00d4ff,
    glowColor: 0x00d4ff,
    icon: '💧',
    strongAgainst: ElementType.FIRE,
    weakAgainst: ElementType.EARTH
  },
  [ElementType.EARTH]: {
    name: '土',
    baseAttack: 35,
    baseHp: 150,
    color: 0xffaa00,
    glowColor: 0xffaa00,
    icon: '🪨',
    strongAgainst: ElementType.WATER,
    weakAgainst: ElementType.WIND
  },
  [ElementType.WIND]: {
    name: '风',
    baseAttack: 20,
    baseHp: 80,
    color: 0x00ffaa,
    glowColor: 0x00ffaa,
    icon: '🌪️',
    strongAgainst: ElementType.EARTH,
    weakAgainst: ElementType.FIRE
  }
};

export class Piece {
  id: string;
  element: ElementType;
  player: Player;
  hp: number;
  maxHp: number;
  attack: number;
  gridX: number;
  gridY: number;
  hasMoved: boolean;
  hasActed: boolean;

  constructor(element: ElementType, player: Player, gridX: number, gridY: number) {
    this.id = `${player}-${element}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.element = element;
    this.player = player;
    this.gridX = gridX;
    this.gridY = gridY;
    this.hasMoved = false;
    this.hasActed = false;

    const config = ELEMENT_CONFIG[element];
    this.maxHp = config.baseHp;
    this.hp = config.baseHp;
    this.attack = config.baseAttack;
  }

  takeDamage(damage: number, attackerElement: ElementType): { damage: number; isEffective: boolean } {
    const config = ELEMENT_CONFIG[this.element];
    const attackerConfig = ELEMENT_CONFIG[attackerElement];
    let finalDamage = damage;
    let isEffective = false;

    if (attackerConfig.strongAgainst === this.element) {
      finalDamage = Math.floor(damage * 2);
      isEffective = true;
    } else if (config.strongAgainst === attackerElement) {
      finalDamage = Math.floor(damage * 0.5);
      isEffective = false;
    }

    this.hp = Math.max(0, this.hp - finalDamage);
    return { damage: finalDamage, isEffective };
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  get config(): ElementConfig {
    return ELEMENT_CONFIG[this.element];
  }
}

export const getElementAdvantage = (attacker: ElementType, defender: ElementType): number => {
  const attackerConfig = ELEMENT_CONFIG[attacker];
  const defenderConfig = ELEMENT_CONFIG[defender];
  
  if (attackerConfig.strongAgainst === defender) return 2;
  if (defenderConfig.strongAgainst === attacker) return 0.5;
  return 1;
};

export const isAdjacent = (x1: number, y1: number, x2: number, y2: number): boolean => {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};
