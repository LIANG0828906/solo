import { Fragment, Recipe, SlotItem } from '../context/GameContext';

export class RunesModule {
  private fragments: Fragment[] = [];
  private recipes: Recipe[] = [];
  private slots: (SlotItem | null)[] = [null, null, null];
  private onStateChange: () => void;

  constructor(onStateChange: () => void) {
    this.onStateChange = onStateChange;
  }

  async loadFragments(): Promise<Fragment[]> {
    try {
      const response = await fetch('/api/fragments');
      this.fragments = await response.json();
    } catch (error) {
      console.error('Failed to load fragments:', error);
      this.fragments = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        x: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 30,
        type: ['fire', 'water', 'earth', 'wind', 'light'][Math.floor(Math.random() * 5)],
        collected: false,
      }));
    }
    this.onStateChange();
    return this.fragments;
  }

  async loadRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch('/api/recipes');
      this.recipes = await response.json();
    } catch (error) {
      console.error('Failed to load recipes:', error);
      this.recipes = [
        { id: 1, name: '炎之符文', ingredients: ['fire', 'fire', 'light'], effect: '召唤火焰之力', unlocked: true },
        { id: 2, name: '潮汐符文', ingredients: ['water', 'water', 'wind'], effect: '操控水流', unlocked: false },
        { id: 3, name: '大地符文', ingredients: ['earth', 'earth', 'fire'], effect: '坚固护盾', unlocked: false },
        { id: 4, name: '风暴符文', ingredients: ['wind', 'wind', 'light'], effect: '疾风之力', unlocked: false },
        { id: 5, name: '圣光符文', ingredients: ['light', 'light', 'fire'], effect: '神圣光芒', unlocked: false },
      ];
    }
    this.onStateChange();
    return this.recipes;
  }

  getFragments(): Fragment[] {
    return [...this.fragments];
  }

  getRecipes(): Recipe[] {
    return [...this.recipes];
  }

  getSlots(): (SlotItem | null)[] {
    return [...this.slots];
  }

  getCollectedCount(): number {
    return this.fragments.filter(f => f.collected).length;
  }

  getCollectedFragments(): Fragment[] {
    return this.fragments.filter(f => f.collected);
  }

  collectFragment(id: number): boolean {
    const fragment = this.fragments.find(f => f.id === id);
    if (!fragment || fragment.collected) return false;
    
    fragment.collected = true;
    this.onStateChange();
    return true;
  }

  addToSlot(fragmentType: string, fragmentId: number): boolean {
    const emptySlotIndex = this.slots.findIndex(s => s === null);
    if (emptySlotIndex === -1) return false;
    
    this.slots[emptySlotIndex] = { type: fragmentType, fragmentId };
    this.onStateChange();
    return true;
  }

  removeFromSlot(slotIndex: number): SlotItem | null {
    if (slotIndex < 0 || slotIndex >= 3) return null;
    
    const item = this.slots[slotIndex];
    this.slots[slotIndex] = null;
    this.onStateChange();
    return item;
  }

  clearSlots(): void {
    this.slots = [null, null, null];
    this.onStateChange();
  }

  checkCombination(): Recipe | null {
    if (this.slots.some(s => s === null)) return null;
    
    const slotTypes = this.slots.map(s => s!.type).sort();
    
    for (const recipe of this.recipes) {
      const recipeTypes = [...recipe.ingredients].sort();
      if (slotTypes.length === recipeTypes.length && 
          slotTypes.every((t, i) => t === recipeTypes[i])) {
        return recipe;
      }
    }
    return null;
  }

  unlockRecipe(recipeId: number): boolean {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe || recipe.unlocked) return false;
    
    recipe.unlocked = true;
    this.onStateChange();
    return true;
  }

  performCombination(): { success: boolean; recipe?: Recipe; isNew?: boolean } {
    const recipe = this.checkCombination();
    if (!recipe) {
      this.clearSlots();
      return { success: false };
    }
    
    const wasUnlocked = recipe.unlocked;
    if (!wasUnlocked) {
      this.unlockRecipe(recipe.id);
    }
    
    this.clearSlots();
    
    return { 
      success: true, 
      recipe, 
      isNew: !wasUnlocked 
    };
  }

  getFragmentById(id: number): Fragment | undefined {
    return this.fragments.find(f => f.id === id);
  }

  getAvailableFragmentsByType(type: string): Fragment[] {
    return this.fragments.filter(f => f.collected && f.type === type);
  }
}
