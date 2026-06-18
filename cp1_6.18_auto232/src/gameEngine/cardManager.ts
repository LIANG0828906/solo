import { CardConfig, CardSkill, CARD_CONFIGS, SkillType } from '../config/cardConfig';

export interface CardPosition {
  row: number;
  col: number;
}

export interface CardEffect {
  type: SkillType;
  value: number;
  remainingTurns?: number;
}

export interface BattleCard {
  id: string;
  instanceId: string;
  configId: string;
  currentAttack: number;
  currentHealth: number;
  maxHealth: number;
  position: CardPosition;
  owner: 'player' | 'enemy';
  shield: number;
  hasActed: boolean;
  effects: CardEffect[];
}

export interface SkillResult {
  affectedUnits: BattleCard[];
  value: number;
}

const MAX_HAND_SIZE = 7;
let instanceCounter = 0;

function generateInstanceId(): string {
  instanceCounter += 1;
  return `card_${Date.now()}_${instanceCounter}`;
}

export class DeckManager {
  private deck: BattleCard[] = [];
  private hand: BattleCard[] = [];
  private discard: BattleCard[] = [];

  constructor(configIds: string[]) {
    this.deck = configIds
      .filter((configId) => CARD_CONFIGS[configId])
      .map((configId) => this.createBattleCard(configId));
    this.shuffle();
  }

  private createBattleCard(configId: string): BattleCard {
    const config: CardConfig = CARD_CONFIGS[configId];
    return {
      id: config.id,
      instanceId: generateInstanceId(),
      configId,
      currentAttack: config.attack,
      currentHealth: config.health,
      maxHealth: config.health,
      position: { row: -1, col: -1 },
      owner: 'player',
      shield: 0,
      hasActed: false,
      effects: [],
    };
  }

  shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCards(count: number): BattleCard[] {
    const drawnCards: BattleCard[] = [];
    const availableSlots = MAX_HAND_SIZE - this.hand.length;

    if (availableSlots <= 0) {
      return drawnCards;
    }

    const actualCount = Math.min(count, availableSlots);

    for (let i = 0; i < actualCount; i += 1) {
      if (this.deck.length === 0) {
        if (this.discard.length === 0) {
          break;
        }
        this.deck = [...this.discard];
        this.discard = [];
        this.shuffle();
      }

      const card = this.deck.pop();
      if (card) {
        this.hand.push(card);
        drawnCards.push(card);
      }
    }

    return drawnCards;
  }

  discardCard(instanceId: string): BattleCard | null {
    const index = this.hand.findIndex((card) => card.instanceId === instanceId);
    if (index === -1) {
      return null;
    }

    const [removedCard] = this.hand.splice(index, 1);
    this.discard.push(removedCard);
    return removedCard;
  }

  getHandCards(): BattleCard[] {
    return [...this.hand];
  }

  getDeckCount(): number {
    return this.deck.length;
  }

  getDiscardCount(): number {
    return this.discard.length;
  }
}

function getNeighbors(position: CardPosition): CardPosition[] {
  const { row, col } = position;
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
    { row: row - 1, col: col - 1 },
    { row: row - 1, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col: col + 1 },
  ];
}

export function executeCardSkill(
  caster: BattleCard,
  skill: CardSkill,
  allUnits: BattleCard[]
): SkillResult {
  const affectedUnits: BattleCard[] = [];
  const neighbors = getNeighbors(caster.position);
  let totalValue = 0;

  switch (skill.type) {
    case 'aoe': {
      const enemyUnits = allUnits.filter(
        (unit) =>
          unit.owner !== caster.owner &&
          unit.currentHealth > 0 &&
          neighbors.some(
            (pos) => pos.row === unit.position.row && pos.col === unit.position.col
          )
      );

      for (const enemy of enemyUnits) {
        let damage = skill.skillValue;
        if (enemy.shield > 0) {
          const shieldAbsorb = Math.min(enemy.shield, damage);
          enemy.shield -= shieldAbsorb;
          damage -= shieldAbsorb;
        }
        enemy.currentHealth = Math.max(0, enemy.currentHealth - damage);
        totalValue += skill.skillValue;
        affectedUnits.push(enemy);
      }
      break;
    }

    case 'heal': {
      const friendlyUnits = allUnits.filter(
        (unit) =>
          unit.owner === caster.owner &&
          unit.currentHealth > 0 &&
          unit.currentHealth < unit.maxHealth &&
          (unit.instanceId === caster.instanceId ||
            neighbors.some(
              (pos) => pos.row === unit.position.row && pos.col === unit.position.col
            ))
      );

      for (const friend of friendlyUnits) {
        const healAmount = Math.min(skill.skillValue, friend.maxHealth - friend.currentHealth);
        friend.currentHealth += healAmount;
        totalValue += healAmount;
        affectedUnits.push(friend);
      }
      break;
    }

    case 'shield': {
      caster.shield += skill.skillValue;
      totalValue = skill.skillValue;
      affectedUnits.push(caster);
      break;
    }

    default:
      break;
  }

  return {
    affectedUnits,
    value: totalValue,
  };
}
