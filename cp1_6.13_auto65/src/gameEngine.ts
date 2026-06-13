import { v4 as uuidv4 } from 'uuid';
import {
  IngredientType,
  IngredientState,
  INGREDIENT_CONFIGS,
  PlateIngredient,
  calculateMatchScore,
  getRandomIngredientType,
  Recipe
} from './recipeData';

export const STATE_TRANSITIONS: IngredientState[] = ['raw', 'half_cooked', 'cooked', 'burnt'];

export const STATE_THRESHOLDS: Record<IngredientState, number> = {
  raw: 0,
  half_cooked: 25,
  cooked: 50,
  burnt: 85
};

export const STATE_COLORS: Record<IngredientState, string> = {
  raw: '#FF4444',
  half_cooked: '#FFA500',
  cooked: '#8B4513',
  burnt: '#2C2C2C'
};

export interface IngredientSlot {
  slotId: string;
  position: 'left' | 'center' | 'right';
  ingredient: Ingredient | null;
}

export interface Ingredient {
  id: string;
  type: IngredientType;
  state: IngredientState;
  previousState: IngredientState;
  stateChangedAt: number;
  cookingProgress: number;
  location: 'slot' | 'stove' | 'plate';
  slotId?: string;
  cookStartTime?: number;
}

export interface Stove {
  ingredient: Ingredient | null;
}

export interface PlayerState {
  playerId: string;
  isOpponent: boolean;
  slots: IngredientSlot[];
  stove: Stove;
  plate: PlateIngredient[];
  score: number;
  progress: number;
  lastMatchedRecipe: Recipe | null;
  lastMatchPercentage: number;
  isReady: boolean;
}

export interface GameState {
  roomId: string | null;
  gameStarted: boolean;
  gameEnded: boolean;
  player: PlayerState;
  opponent: PlayerState;
  winner: string | null;
}

type Listener = (state: GameState) => void;
type StateChangeListener = (ingredientId: string, fromState: IngredientState, toState: IngredientState) => void;

class GameEngine {
  private state: GameState;
  private listeners: Set<Listener> = new Set();
  private stateChangeListeners: Set<StateChangeListener> = new Set();
  private cookingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private syncCallback: ((event: string, data: unknown) => void) | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      roomId: null,
      gameStarted: false,
      gameEnded: false,
      player: this.createPlayerState('local-player', false),
      opponent: this.createPlayerState('opponent', true),
      winner: null
    };
  }

  private createPlayerState(playerId: string, isOpponent: boolean): PlayerState {
    return {
      playerId,
      isOpponent,
      slots: [
        { slotId: `${playerId}-slot-left`, position: 'left', ingredient: this.createIngredient() },
        { slotId: `${playerId}-slot-center`, position: 'center', ingredient: this.createIngredient() },
        { slotId: `${playerId}-slot-right`, position: 'right', ingredient: this.createIngredient() }
      ],
      stove: { ingredient: null },
      plate: [],
      score: 0,
      progress: 0,
      lastMatchedRecipe: null,
      lastMatchPercentage: 0,
      isReady: false
    };
  }

  private createIngredient(): Ingredient {
    const type = getRandomIngredientType();
    return {
      id: uuidv4(),
      type,
      state: 'raw',
      previousState: 'raw',
      stateChangedAt: Date.now(),
      cookingProgress: 0,
      location: 'slot'
    };
  }

  setSyncCallback(callback: (event: string, data: unknown) => void): void {
    this.syncCallback = callback;
  }

  private emit(event: string, data: unknown): void {
    if (this.syncCallback) {
      this.syncCallback(event, data);
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  getState(): GameState {
    return { ...this.state };
  }

  private notify(): void {
    this.listeners.forEach(l => l(this.getState()));
  }

  private fireStateChange(ingredientId: string, from: IngredientState, to: IngredientState): void {
    this.stateChangeListeners.forEach(l => l(ingredientId, from, to));
  }

  transitionState(ingredient: Ingredient, newProgress: number): void {
    const newState = this.resolveState(newProgress);
    if (newState !== ingredient.state) {
      const from = ingredient.state;
      ingredient.previousState = from;
      ingredient.state = newState;
      ingredient.stateChangedAt = Date.now();
      this.fireStateChange(ingredient.id, from, newState);
    }
    ingredient.cookingProgress = newProgress;
  }

  private resolveState(progress: number): IngredientState {
    if (progress < STATE_THRESHOLDS.half_cooked) return 'raw';
    if (progress < STATE_THRESHOLDS.cooked) return 'half_cooked';
    if (progress < STATE_THRESHOLDS.burnt) return 'cooked';
    return 'burnt';
  }

  setRoomId(roomId: string): void {
    this.state.roomId = roomId;
    this.notify();
  }

  startGame(): void {
    this.state.gameStarted = true;
    this.state.gameEnded = false;
    this.state.winner = null;
    this.notify();
  }

  playerReady(playerId: string, isReady: boolean): void {
    const target = playerId === this.state.player.playerId ? this.state.player : this.state.opponent;
    target.isReady = isReady;
    this.notify();
  }

  pickIngredientFromSlot(ingredientId: string): Ingredient | null {
    const player = this.state.player;
    for (const slot of player.slots) {
      if (slot.ingredient && slot.ingredient.id === ingredientId) {
        const ingredient = slot.ingredient;
        slot.ingredient = null;
        ingredient.location = 'slot';
        ingredient.slotId = slot.slotId;
        this.notify();
        this.emit('ingredient:picked', { ingredientId, playerId: player.playerId });
        return ingredient;
      }
    }
    return null;
  }

  dropIngredientToStove(ingredientId: string): boolean {
    const player = this.state.player;
    let foundIngredient: Ingredient | null = null;
    let sourceSlotId: string | null = null;

    for (const slot of player.slots) {
      if (slot.ingredient && slot.ingredient.id === ingredientId) {
        foundIngredient = slot.ingredient;
        sourceSlotId = slot.slotId;
        slot.ingredient = null;
        break;
      }
    }

    if (!foundIngredient) return false;
    if (player.stove.ingredient) {
      for (const slot of player.slots) {
        if (slot.slotId === sourceSlotId) {
          slot.ingredient = foundIngredient;
          break;
        }
      }
      return false;
    }

    foundIngredient.location = 'stove';
    foundIngredient.cookingProgress = 0;
    foundIngredient.state = 'raw';
    foundIngredient.previousState = 'raw';
    foundIngredient.stateChangedAt = Date.now();
    foundIngredient.cookStartTime = Date.now();
    player.stove.ingredient = foundIngredient;

    this.startCookingTimer(foundIngredient.id, player.playerId);
    this.notify();
    this.emit('ingredient:toStove', { ingredientId, playerId: player.playerId, ingredient: foundIngredient });
    return true;
  }

  private startCookingTimer(ingredientId: string, playerId: string): void {
    if (this.cookingTimers.has(ingredientId)) return;

    const tickInterval = 100;
    const timer = setInterval(() => {
      const target = playerId === this.state.player.playerId ? this.state.player : this.state.opponent;
      if (!target.stove.ingredient || target.stove.ingredient.id !== ingredientId) {
        this.stopCookingTimer(ingredientId);
        return;
      }

      const ingredient = target.stove.ingredient;
      const config = INGREDIENT_CONFIGS[ingredient.type];
      const elapsed = Date.now() - (ingredient.cookStartTime || Date.now());
      const totalTime = config.cookTime * 2;
      const newProgress = Math.min(100, (elapsed / totalTime) * 100);

      this.transitionState(ingredient, newProgress);
      this.notify();
    }, tickInterval);

    this.cookingTimers.set(ingredientId, timer);
  }

  private stopCookingTimer(ingredientId: string): void {
    const timer = this.cookingTimers.get(ingredientId);
    if (timer) {
      clearInterval(timer);
      this.cookingTimers.delete(ingredientId);
    }
  }

  takeFromStoveToPlate(): boolean {
    const player = this.state.player;
    if (!player.stove.ingredient) return false;
    if (player.plate.length >= 5) return false;

    const ingredient = player.stove.ingredient;
    this.stopCookingTimer(ingredient.id);

    player.plate.push({
      ingredientId: ingredient.id,
      type: ingredient.type,
      state: ingredient.state
    });
    player.stove.ingredient = null;

    this.updateProgress(player);
    this.notify();
    this.emit('ingredient:toPlate', {
      ingredientId: ingredient.id,
      playerId: player.playerId,
      state: ingredient.state,
      type: ingredient.type
    });
    return true;
  }

  refillSlot(slotId: string): void {
    const player = this.state.player;
    const slot = player.slots.find(s => s.slotId === slotId);
    if (slot && !slot.ingredient) {
      slot.ingredient = this.createIngredient();
      this.notify();
      this.emit('slot:refill', { slotId, playerId: player.playerId, ingredient: slot.ingredient });
    }
  }

  submitPlate(): { score: number; matchedRecipe: Recipe | null; matchPercentage: number } {
    const player = this.state.player;
    const result = calculateMatchScore(player.plate);
    player.score += result.score;
    player.lastMatchedRecipe = result.matchedRecipe;
    player.lastMatchPercentage = result.matchPercentage;
    player.progress = Math.min(100, player.progress + result.matchPercentage * 0.5);
    player.plate = [];

    if (player.progress >= 100) {
      this.state.gameEnded = true;
      this.state.winner = player.playerId;
    }

    this.notify();
    this.emit('plate:submit', {
      playerId: player.playerId,
      score: result.score,
      matchedRecipeId: result.matchedRecipe?.id || null,
      matchPercentage: result.matchPercentage,
      totalScore: player.score,
      progress: player.progress
    });
    return result;
  }

  clearPlate(): void {
    const player = this.state.player;
    player.plate = [];
    this.notify();
  }

  private updateProgress(player: PlayerState): void {
    const cookedCount = player.plate.filter(p => p.state === 'cooked' || p.state === 'half_cooked').length;
    player.progress = Math.min(100, player.progress + cookedCount * 2);
  }

  applyOpponentAction(event: string, data: Record<string, unknown>): void {
    const opponent = this.state.opponent;

    switch (event) {
      case 'ingredient:toStove': {
        const ingredient = data.ingredient as Ingredient;
        if (ingredient) {
          const existingSlot = opponent.slots.find(s =>
            s.ingredient && s.ingredient.id === ingredient.id
          );
          if (existingSlot) existingSlot.ingredient = null;
          opponent.stove.ingredient = {
            ...ingredient,
            cookStartTime: Date.now(),
            previousState: ingredient.state,
            stateChangedAt: Date.now()
          };
          this.startCookingTimer(ingredient.id, opponent.playerId);
        }
        break;
      }
      case 'ingredient:toPlate': {
        if (opponent.plate.length < 5) {
          const ingredientId = data.ingredientId as string;
          if (opponent.stove.ingredient && opponent.stove.ingredient.id === ingredientId) {
            this.stopCookingTimer(ingredientId);
          }
          opponent.plate.push({
            ingredientId,
            type: data.type as IngredientType,
            state: data.state as IngredientState
          });
          opponent.stove.ingredient = null;
          this.updateProgress(opponent);
        }
        break;
      }
      case 'slot:refill': {
        const slotId = data.slotId as string;
        const ingredient = data.ingredient as Ingredient;
        const slot = opponent.slots.find(s => s.slotId === slotId);
        if (slot) {
          slot.ingredient = ingredient;
        }
        break;
      }
      case 'plate:submit': {
        opponent.score = data.totalScore as number;
        opponent.progress = data.progress as number;
        opponent.lastMatchPercentage = data.matchPercentage as number;
        opponent.plate = [];
        if (opponent.progress >= 100) {
          this.state.gameEnded = true;
          this.state.winner = opponent.playerId;
        }
        break;
      }
      case 'player:ready': {
        opponent.isReady = data.isReady as boolean;
        break;
      }
      case 'game:start': {
        this.state.gameStarted = true;
        break;
      }
    }
    this.notify();
  }

  reset(): void {
    this.cookingTimers.forEach(timer => clearInterval(timer));
    this.cookingTimers.clear();
    this.state = this.createInitialState();
    this.notify();
  }

  destroy(): void {
    this.cookingTimers.forEach(timer => clearInterval(timer));
    this.cookingTimers.clear();
    this.listeners.clear();
    this.stateChangeListeners.clear();
  }
}

export const gameEngine = new GameEngine();
export default gameEngine;
