import { v4 as uuidv4 } from 'uuid';
import { eventBus } from './EventBus';
import type { Element, Recipe } from './types';

const BASE_ELEMENTS: Element[] = [
  { id: 'fire', name: '火', symbol: '🔥', colorStart: '#FF4500', colorEnd: '#FF8C00', category: 'basic' },
  { id: 'water', name: '水', symbol: '💧', colorStart: '#1E90FF', colorEnd: '#00CED1', category: 'basic' },
  { id: 'earth', name: '土', symbol: '🪨', colorStart: '#8B4513', colorEnd: '#D2691E', category: 'basic' },
  { id: 'air', name: '气', symbol: '💨', colorStart: '#E0E0E0', colorEnd: '#FFFFFF', category: 'basic' },
];

const COMPOUND_ELEMENTS: Record<string, Element> = {
  steam: { id: 'steam', name: '蒸汽', symbol: '♨️', colorStart: '#B0C4DE', colorEnd: '#FFFFFF', category: 'compound' },
  lava: { id: 'lava', name: '岩浆', symbol: '🌋', colorStart: '#FF2400', colorEnd: '#FF6600', category: 'compound' },
  mud: { id: 'mud', name: '泥土', symbol: '🟤', colorStart: '#654321', colorEnd: '#8B7355', category: 'compound' },
  dust: { id: 'dust', name: '尘埃', symbol: '🌫️', colorStart: '#C2B280', colorEnd: '#F5DEB3', category: 'compound' },
  energy: { id: 'energy', name: '能量', symbol: '⚡', colorStart: '#FFD700', colorEnd: '#FFFF00', category: 'compound' },
  ice: { id: 'ice', name: '冰', symbol: '❄️', colorStart: '#87CEEB', colorEnd: '#E0FFFF', category: 'compound' },
  plant: { id: 'plant', name: '植物', symbol: '🌿', colorStart: '#228B22', colorEnd: '#32CD32', category: 'compound' },
  storm: { id: 'storm', name: '风暴', symbol: '🌪️', colorStart: '#4B0082', colorEnd: '#8A2BE2', category: 'compound' },
  crystal: { id: 'crystal', name: '水晶', symbol: '💎', colorStart: '#E6E6FA', colorEnd: '#9370DB', category: 'compound' },
  metal: { id: 'metal', name: '金属', symbol: '⚙️', colorStart: '#708090', colorEnd: '#C0C0C0', category: 'compound' },
};

const CREATURE_ELEMENTS: Record<string, Element> = {
  lava_beast: { id: 'lava_beast', name: '熔岩巨兽', symbol: '🦎', colorStart: '#FF2400', colorEnd: '#FF8C00', category: 'creature' },
  water_spirit: { id: 'water_spirit', name: '水灵', symbol: '🐟', colorStart: '#1E90FF', colorEnd: '#00CED1', category: 'creature' },
  earth_golem: { id: 'earth_golem', name: '土傀儡', symbol: '🗿', colorStart: '#8B4513', colorEnd: '#A0522D', category: 'creature' },
  air_phoenix: { id: 'air_phoenix', name: '气凤', symbol: '🦅', colorStart: '#E6E6FA', colorEnd: '#DDA0DD', category: 'creature' },
  plant_elf: { id: 'plant_elf', name: '植灵', symbol: '🌱', colorStart: '#228B22', colorEnd: '#7CFC00', category: 'creature' },
  storm_dragon: { id: 'storm_dragon', name: '雷龙', symbol: '🐉', colorStart: '#4B0082', colorEnd: '#9400D3', category: 'creature' },
  ice_fox: { id: 'ice_fox', name: '冰狐', symbol: '🦊', colorStart: '#87CEEB', colorEnd: '#E0FFFF', category: 'creature' },
  crystal_bird: { id: 'crystal_bird', name: '晶雀', symbol: '🐦', colorStart: '#E6E6FA', colorEnd: '#9370DB', category: 'creature' },
};

const RECIPES: Recipe[] = [
  { id: uuidv4(), input1: 'fire', input2: 'water', output: 'steam', outputIsCreature: false, description: '火与水相遇，化作蒸腾的蒸汽', discovered: false },
  { id: uuidv4(), input1: 'fire', input2: 'earth', output: 'lava', outputIsCreature: false, description: '火焰熔化大地，岩浆奔涌而出', discovered: false },
  { id: uuidv4(), input1: 'water', input2: 'earth', output: 'mud', outputIsCreature: false, description: '水浸润土壤，肥沃的泥土形成', discovered: false },
  { id: uuidv4(), input1: 'earth', input2: 'air', output: 'dust', outputIsCreature: false, description: '风吹大地，尘埃漫天飞舞', discovered: false },
  { id: uuidv4(), input1: 'fire', input2: 'air', output: 'energy', outputIsCreature: false, description: '火与风交织，纯粹能量诞生', discovered: false },
  { id: uuidv4(), input1: 'water', input2: 'air', output: 'ice', outputIsCreature: false, description: '寒风掠过水面，凝结成晶莹的冰', discovered: false },
  { id: uuidv4(), input1: 'mud', input2: 'energy', output: 'plant', outputIsCreature: false, description: '能量注入泥土，生命破土而出', discovered: false },
  { id: uuidv4(), input1: 'energy', input2: 'air', output: 'storm', outputIsCreature: false, description: '狂暴能量与大气碰撞，风暴来袭', discovered: false },
  { id: uuidv4(), input1: 'ice', input2: 'earth', output: 'crystal', outputIsCreature: false, description: '寒冰与大地深处孕育出璀璨水晶', discovered: false },
  { id: uuidv4(), input1: 'lava', input2: 'air', output: 'metal', outputIsCreature: false, description: '岩浆经风冷却，坚硬金属炼成', discovered: false },
  { id: uuidv4(), input1: 'lava', input2: 'energy', output: 'lava_beast', outputIsCreature: true, description: '岩浆中诞生的炽热巨兽', discovered: false },
  { id: uuidv4(), input1: 'water', input2: 'plant', output: 'water_spirit', outputIsCreature: true, description: '水中孕育的灵动精灵', discovered: false },
  { id: uuidv4(), input1: 'mud', input2: 'plant', output: 'earth_golem', outputIsCreature: true, description: '泥土塑成的沉默守卫', discovered: false },
  { id: uuidv4(), input1: 'air', input2: 'energy', output: 'air_phoenix', outputIsCreature: true, description: '御风而行的神凤', discovered: false },
  { id: uuidv4(), input1: 'plant', input2: 'energy', output: 'plant_elf', outputIsCreature: true, description: '植物精华凝聚的小精灵', discovered: false },
  { id: uuidv4(), input1: 'storm', input2: 'energy', output: 'storm_dragon', outputIsCreature: true, description: '风暴与能量化身的巨龙', discovered: false },
  { id: uuidv4(), input1: 'ice', input2: 'plant', output: 'ice_fox', outputIsCreature: true, description: '冰雪中幻化的灵狐', discovered: false },
  { id: uuidv4(), input1: 'crystal', input2: 'air', output: 'crystal_bird', outputIsCreature: true, description: '水晶般闪耀的飞鸟', discovered: false },
];

class ElementEngine {
  private elements: Map<string, Element> = new Map();
  private recipes: Recipe[] = [];
  private discoveredRecipes: Set<string> = new Set();

  constructor() {
    BASE_ELEMENTS.forEach((el) => this.elements.set(el.id, el));
    Object.values(COMPOUND_ELEMENTS).forEach((el) => this.elements.set(el.id, el));
    Object.values(CREATURE_ELEMENTS).forEach((el) => this.elements.set(el.id, el));
    this.recipes = [...RECIPES];
  }

  getBaseElements(): Element[] {
    return BASE_ELEMENTS;
  }

  getAllElements(): Element[] {
    return Array.from(this.elements.values());
  }

  getElement(id: string): Element | undefined {
    return this.elements.get(id);
  }

  getRecipes(): Recipe[] {
    return this.recipes.map((r) => ({ ...r, discovered: this.discoveredRecipes.has(r.id) }));
  }

  getDiscoveredRecipes(): Recipe[] {
    return this.getRecipes().filter((r) => r.discovered);
  }

  combine(e1: string, e2: string): Element | null {
    const recipe = this.recipes.find(
      (r) => (r.input1 === e1 && r.input2 === e2) || (r.input1 === e2 && r.input2 === e1)
    );

    if (!recipe) {
      eventBus.emit('element_combined', { success: false, inputs: [e1, e2] });
      return null;
    }

    const outputElement = this.elements.get(recipe.output);
    if (!outputElement) {
      eventBus.emit('element_combined', { success: false, inputs: [e1, e2] });
      return null;
    }

    this.discoveredRecipes.add(recipe.id);
    this.elements.set(outputElement.id, outputElement);

    eventBus.emit('element_combined', {
      success: true,
      element: outputElement,
      inputs: [e1, e2],
    });

    return outputElement;
  }
}

export const elementEngine = new ElementEngine();
export default elementEngine;
