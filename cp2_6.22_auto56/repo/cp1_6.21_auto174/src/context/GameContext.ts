import { createContext, useContext } from 'react';
import * as THREE from 'three';

export interface Fragment {
  id: number;
  x: number;
  z: number;
  type: string;
  collected: boolean;
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  effect: string;
  unlocked: boolean;
}

export interface SlotItem {
  type: string;
  fragmentId: number;
}

export interface GameState {
  characterPosition: THREE.Vector3;
  fragments: Fragment[];
  recipes: Recipe[];
  slots: (SlotItem | null)[];
  isNearAltar: boolean;
  isTeleporting: boolean;
  showCombineEffect: boolean;
  newRecipeName: string | null;
  collectedCount: number;
}

export interface GameContextType extends GameState {
  setCharacterPosition: (pos: THREE.Vector3) => void;
  collectFragment: (id: number) => void;
  addToSlot: (fragmentType: string, fragmentId: number) => boolean;
  removeFromSlot: (slotIndex: number) => void;
  clearSlots: () => void;
  checkCombination: () => Recipe | null;
  unlockRecipe: (recipeId: number) => void;
  setIsNearAltar: (near: boolean) => void;
  setIsTeleporting: (tp: boolean) => void;
  triggerCombineEffect: () => void;
  setNewRecipeName: (name: string | null) => void;
  loadInitialData: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export default GameContext;
