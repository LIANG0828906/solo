import { eventBus } from './EventBus';
import { recipeBook, Material, Recipe, CheckRecipeResult } from './RecipeBook';

export interface HistoryRecord {
  id: string;
  materials: string[];
  result: 'success' | 'failure';
  recipeName?: string;
  timestamp: number;
}

export interface DiscoveredRecipe {
  recipe: Recipe;
  count: number;
}

type GameState = 'idle' | 'adding' | 'igniting' | 'result';

class GameEngine {
  private cauldronMaterials: string[] = [];
  private usedMaterials: Set<string> = new Set();
  private history: HistoryRecord[] = [];
  private discoveredRecipes: Map<string, DiscoveredRecipe> = new Map();
  private energyLevel: number = 0;
  private gameState: GameState = 'idle';

  private materialsGrid: HTMLElement | null = null;
  private energyFill: HTMLElement | null = null;
  private resultText: HTMLElement | null = null;
  private historyList: HTMLElement | null = null;
  private recipesList: HTMLElement | null = null;
  private igniteBtn: HTMLElement | null = null;
  private resetBtn: HTMLElement | null = null;
  private cauldronWrapper: HTMLElement | null = null;

  private draggedMaterial: string | null = null;

  init(): void {
    this.cacheElements();
    this.bindEvents();
    this.renderMaterials();
    this.renderDiscoveredRecipes();
    this.updateEnergyBar();
  }

  private cacheElements(): void {
    this.materialsGrid = document.getElementById('materialsGrid');
    this.energyFill = document.getElementById('energyFill');
    this.resultText = document.getElementById('resultText');
    this.historyList = document.getElementById('historyList');
    this.recipesList = document.getElementById('recipesList');
    this.igniteBtn = document.getElementById('igniteBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.cauldronWrapper = document.querySelector('.cauldron-wrapper');
  }

  private bindEvents(): void {
    if (this.igniteBtn) {
      this.igniteBtn.addEventListener('click', () => this.handleIgnite());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.handleReset());
    }

    if (this.cauldronWrapper) {
      this.cauldronWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      this.cauldronWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        const materialId = this.draggedMaterial;
        if (materialId) {
          this.addMaterial(materialId);
          this.draggedMaterial = null;
        }
      });
    }

    eventBus.on('material:add', (materialId: string) => {
      this.addMaterial(materialId);
    });

    eventBus.on('reset', () => {
      this.resetCauldron();
    });
  }

  private renderMaterials(): void {
    if (!this.materialsGrid) return;

    this.materialsGrid.innerHTML = '';
    const materials = recipeBook.getMaterials();

    materials.forEach((material) => {
      const card = this.createMaterialCard(material);
      this.materialsGrid!.appendChild(card);
    });
  }

  private createMaterialCard(material: Material): HTMLElement {
    const card = document.createElement('div');
    card.className = 'material-card';
    card.dataset.materialId = material.id;
    card.draggable = true;

    if (this.usedMaterials.has(material.id)) {
      card.classList.add('disabled');
      card.draggable = false;
    }

    const emoji = document.createElement('div');
    emoji.className = 'material-emoji';
    emoji.textContent = material.emoji;

    const name = document.createElement('div');
    name.className = 'material-name';
    name.textContent = material.name;

    card.appendChild(emoji);
    card.appendChild(name);

    card.addEventListener('dragstart', (e) => {
      if (card.classList.contains('disabled')) {
        e.preventDefault();
        return;
      }
      this.draggedMaterial = material.id;
      card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
      this.draggedMaterial = null;
    });

    return card;
  }

  private addMaterial(materialId: string): void {
    if (this.gameState === 'igniting') return;
    if (this.usedMaterials.has(materialId)) return;
    if (this.cauldronMaterials.length >= 6) return;

    const material = recipeBook.getMaterialById(materialId);
    if (!material) return;

    this.cauldronMaterials.push(materialId);
    this.usedMaterials.add(materialId);
    this.gameState = 'adding';

    this.updateMaterialCard(materialId, true);

    eventBus.emit('particle:effect', 'material_add', { color: material.color });

    const baseEnergy = 10 + this.cauldronMaterials.length * 5;
    this.energyLevel = Math.min(100, this.energyLevel + baseEnergy);
    this.updateEnergyBar();

    setTimeout(() => {
      if (this.gameState === 'adding') {
        this.gameState = 'idle';
      }
    }, 300);
  }

  private updateMaterialCard(materialId: string, used: boolean): void {
    const cards = document.querySelectorAll('.material-card');
    cards.forEach((card) => {
      if (card instanceof HTMLElement && card.dataset.materialId === materialId) {
        if (used) {
          card.classList.add('disabled');
          card.draggable = false;
        } else {
          card.classList.remove('disabled');
          card.draggable = true;
        }
      }
    });
  }

  private handleIgnite(): void {
    if (this.gameState === 'igniting') return;
    if (this.cauldronMaterials.length < 2) {
      this.showResultText('至少需要2种材料！', 'failure');
      return;
    }

    this.gameState = 'igniting';

    if (this.igniteBtn) {
      this.igniteBtn.classList.add('pressed');
      setTimeout(() => {
        this.igniteBtn?.classList.remove('pressed');
      }, 600);
    }

    const result: CheckRecipeResult = recipeBook.checkRecipe(this.cauldronMaterials);

    setTimeout(() => {
      if (result.matched && result.recipe) {
        this.handleSuccess(result.recipe);
      } else {
        this.handleFailure();
      }
    }, 500);
  }

  private handleSuccess(recipe: Recipe): void {
    this.energyLevel = recipe.energyLevel;
    this.updateEnergyBar();

    eventBus.emit('particle:effect', 'fountain', {
      color: recipe.particleColor,
      duration: 2000,
    });

    this.showResultText(`成功！${recipe.name}`, 'success');

    this.addHistoryRecord(recipe.materials, 'success', recipe.name);

    this.discoverRecipe(recipe);

    setTimeout(() => {
      this.gameState = 'result';
    }, 2000);
  }

  private handleFailure(): void {
    const failureRecipe = recipeBook.getRandomFailureRecipe();
    this.energyLevel = failureRecipe.energyLevel;
    this.updateEnergyBar();

    eventBus.emit('particle:effect', 'decay', { duration: 1000 });

    this.showResultText('实验失败...', 'failure');

    this.addHistoryRecord(this.cauldronMaterials, 'failure');

    setTimeout(() => {
      this.gameState = 'result';
    }, 1000);
  }

  private showResultText(text: string, type: 'success' | 'failure'): void {
    if (!this.resultText) return;

    this.resultText.textContent = text;
    this.resultText.className = 'result-text';

    requestAnimationFrame(() => {
      this.resultText!.classList.add(type);
    });

    const duration = type === 'success' ? 3000 : 2000;
    setTimeout(() => {
      this.resultText!.classList.remove(type);
    }, duration);
  }

  private updateEnergyBar(): void {
    if (!this.energyFill) return;
    this.energyFill.style.width = `${this.energyLevel}%`;
  }

  private addHistoryRecord(
    materials: string[],
    result: 'success' | 'failure',
    recipeName?: string
  ): void {
    const record: HistoryRecord = {
      id: `history_${Date.now()}`,
      materials: [...materials],
      result,
      recipeName,
      timestamp: Date.now(),
    };

    this.history.unshift(record);
    if (this.history.length > 20) {
      this.history.pop();
    }

    this.renderHistory();
  }

  private renderHistory(): void {
    if (!this.historyList) return;

    this.historyList.innerHTML = '';

    this.history.forEach((record) => {
      const item = document.createElement('div');
      item.className = `history-item ${record.result}`;

      const materialsDiv = document.createElement('div');
      materialsDiv.className = 'history-materials';

      record.materials.forEach((matId) => {
        const material = recipeBook.getMaterialById(matId);
        if (material) {
          const span = document.createElement('span');
          span.className = 'history-material';
          span.textContent = material.emoji;
          materialsDiv.appendChild(span);
        }
      });

      const resultDiv = document.createElement('div');
      resultDiv.className = 'history-result';
      resultDiv.textContent = record.recipeName || (record.result === 'success' ? '成功' : '失败');

      item.appendChild(materialsDiv);
      item.appendChild(resultDiv);
      this.historyList!.appendChild(item);
    });
  }

  private discoverRecipe(recipe: Recipe): void {
    const existing = this.discoveredRecipes.get(recipe.id);
    if (existing) {
      existing.count++;
    } else {
      this.discoveredRecipes.set(recipe.id, { recipe, count: 1 });
    }
    this.renderDiscoveredRecipes();
  }

  private renderDiscoveredRecipes(): void {
    if (!this.recipesList) return;

    this.recipesList.innerHTML = '';

    if (this.discoveredRecipes.size === 0) {
      const emptyText = document.createElement('div');
      emptyText.style.color = '#666';
      emptyText.style.fontSize = '12px';
      emptyText.style.textAlign = 'center';
      emptyText.style.padding = '20px 0';
      emptyText.textContent = '尚未发现配方';
      this.recipesList.appendChild(emptyText);
      return;
    }

    this.discoveredRecipes.forEach((discovered) => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      const icon = document.createElement('div');
      icon.className = 'recipe-icon';
      icon.textContent = discovered.recipe.result === 'success' ? '🧪' : '💨';

      const info = document.createElement('div');
      info.className = 'recipe-info';

      const name = document.createElement('div');
      name.className = 'recipe-name';
      name.textContent = discovered.recipe.name;

      const count = document.createElement('div');
      count.className = 'recipe-count';
      count.textContent = `炼制次数: ${discovered.count}`;

      const tooltip = document.createElement('div');
      tooltip.className = 'recipe-tooltip';
      const materialEmojis = discovered.recipe.materials
        .map((id) => recipeBook.getMaterialById(id)?.emoji || '?')
        .join(' + ');
      tooltip.textContent = `配方: ${materialEmojis}`;

      info.appendChild(name);
      info.appendChild(count);
      card.appendChild(icon);
      card.appendChild(info);
      card.appendChild(tooltip);

      this.recipesList!.appendChild(card);
    });
  }

  private handleReset(): void {
    eventBus.emit('reset');
  }

  private resetCauldron(): void {
    this.cauldronMaterials = [];
    this.usedMaterials.clear();
    this.energyLevel = 0;
    this.gameState = 'idle';

    this.updateEnergyBar();

    const cards = document.querySelectorAll('.material-card');
    cards.forEach((card) => {
      if (card instanceof HTMLElement) {
        card.classList.remove('disabled');
        card.draggable = true;
      }
    });

    if (this.resultText) {
      this.resultText.className = 'result-text';
      this.resultText.textContent = '';
    }
  }

  getCauldronMaterials(): string[] {
    return [...this.cauldronMaterials];
  }

  getEnergyLevel(): number {
    return this.energyLevel;
  }

  getHistory(): HistoryRecord[] {
    return [...this.history];
  }

  getDiscoveredRecipes(): DiscoveredRecipe[] {
    return Array.from(this.discoveredRecipes.values());
  }
}

export const gameEngine = new GameEngine();
export default GameEngine;
