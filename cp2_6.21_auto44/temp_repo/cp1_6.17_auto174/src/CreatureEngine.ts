import { v4 as uuidv4 } from 'uuid';
import { eventBus } from './EventBus';
import { elementEngine } from './ElementEngine';
import type { Creature, Element } from './types';

const EVOLUTION_MAP: Record<string, { threshold: number; next: string; level: number }[]> = {
  lava_beast: [{ threshold: 5, next: 'lava_beast', level: 2 }, { threshold: 15, next: 'lava_beast', level: 3 }],
  water_spirit: [{ threshold: 5, next: 'water_spirit', level: 2 }, { threshold: 15, next: 'water_spirit', level: 3 }],
  earth_golem: [{ threshold: 5, next: 'earth_golem', level: 2 }, { threshold: 15, next: 'earth_golem', level: 3 }],
  air_phoenix: [{ threshold: 5, next: 'air_phoenix', level: 2 }, { threshold: 15, next: 'air_phoenix', level: 3 }],
  plant_elf: [{ threshold: 5, next: 'plant_elf', level: 2 }, { threshold: 15, next: 'plant_elf', level: 3 }],
  storm_dragon: [{ threshold: 5, next: 'storm_dragon', level: 2 }, { threshold: 15, next: 'storm_dragon', level: 3 }],
  ice_fox: [{ threshold: 5, next: 'ice_fox', level: 2 }, { threshold: 15, next: 'ice_fox', level: 3 }],
  crystal_bird: [{ threshold: 5, next: 'crystal_bird', level: 2 }, { threshold: 15, next: 'crystal_bird', level: 3 }],
};

const CREATURE_STATS: Record<string, { hp: number; attack: number; foodPreference: string; evolutionPath: string[]; color: string }> = {
  lava_beast: { hp: 100, attack: 20, foodPreference: 'fire', evolutionPath: ['幼兽', '成年', '兽王'], color: '#FF4500' },
  water_spirit: { hp: 80, attack: 12, foodPreference: 'water', evolutionPath: ['水滴', '溪流', '海神'], color: '#1E90FF' },
  earth_golem: { hp: 150, attack: 15, foodPreference: 'earth', evolutionPath: ['卵石', '岩柱', '泰坦'], color: '#8B4513' },
  air_phoenix: { hp: 70, attack: 25, foodPreference: 'air', evolutionPath: ['雏鸟', '翔者', '天凤'], color: '#DDA0DD' },
  plant_elf: { hp: 60, attack: 10, foodPreference: 'plant', evolutionPath: ['种子', '嫩芽', '灵木'], color: '#32CD32' },
  storm_dragon: { hp: 120, attack: 30, foodPreference: 'energy', evolutionPath: ['电蛇', '雷兽', '龙神'], color: '#9400D3' },
  ice_fox: { hp: 75, attack: 18, foodPreference: 'ice', evolutionPath: ['幼狐', '雪影', '霜王'], color: '#87CEEB' },
  crystal_bird: { hp: 65, attack: 22, foodPreference: 'crystal', evolutionPath: ['雀卵', '光羽', '晶凤'], color: '#9370DB' },
};

class CreatureEngine {
  private creatures: Map<string, Creature> = new Map();
  private feedCount: Map<string, number> = new Map();

  constructor() {
    eventBus.on('element_combined', (payload) => {
      if (payload.success && payload.element?.category === 'creature') {
        this.createCreature(payload.element);
      }
    });
  }

  getAllCreatures(): Creature[] {
    return Array.from(this.creatures.values());
  }

  getCreature(id: string): Creature | undefined {
    return this.creatures.get(id);
  }

  createCreature(element: Element): Creature {
    const stats = CREATURE_STATS[element.id];
    if (!stats) {
      throw new Error(`Unknown creature element: ${element.id}`);
    }

    const creature: Creature = {
      id: uuidv4(),
      name: element.name,
      level: 1,
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      foodPreference: stats.foodPreference,
      evolutionPath: stats.evolutionPath,
      elementId: element.id,
      color: stats.color,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 300,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      status: 'alive',
      age: 0,
      hunger: 0,
    };

    this.creatures.set(creature.id, creature);
    this.feedCount.set(creature.id, 0);

    eventBus.emit('creature_spawned', { creature });
    return creature;
  }

  feedCreature(creatureId: string, elementId: string): boolean {
    const creature = this.creatures.get(creatureId);
    if (!creature || creature.status !== 'alive') return false;

    if (creature.foodPreference === elementId) {
      creature.hp = Math.min(creature.maxHp, creature.hp + 15);
      creature.hunger = Math.max(0, creature.hunger - 30);
      const count = (this.feedCount.get(creatureId) || 0) + 1;
      this.feedCount.set(creatureId, count);

      this.checkEvolution(creature, count);
      return true;
    }
    return false;
  }

  private checkEvolution(creature: Creature, feedCount: number): void {
    const evolutions = EVOLUTION_MAP[creature.elementId];
    if (!evolutions) return;

    for (const evo of evolutions) {
      if (creature.level < evo.level && feedCount >= evo.threshold) {
        const fromLevel = creature.level;
        creature.level = evo.level;
        creature.maxHp = Math.floor(creature.maxHp * 1.4);
        creature.hp = creature.maxHp;
        creature.attack = Math.floor(creature.attack * 1.3);
        creature.status = 'alive';

        eventBus.emit('creature_evolved', { creature, fromLevel });
        break;
      }
    }
  }

  updateCreatureStatus(creatureId: string, patch: Partial<Creature>): void {
    const creature = this.creatures.get(creatureId);
    if (!creature) return;

    Object.assign(creature, patch);

    if (patch.status || patch.hp !== undefined) {
      eventBus.emit('creature_status', {
        creatureId,
        status: creature.status,
        hp: creature.hp,
      });
    }
  }

  removeCreature(creatureId: string): void {
    this.creatures.delete(creatureId);
    this.feedCount.delete(creatureId);
  }

  canCreateCreature(elementId: string): boolean {
    const el = elementEngine.getElement(elementId);
    return el?.category === 'creature';
  }
}

export const creatureEngine = new CreatureEngine();
export default creatureEngine;
