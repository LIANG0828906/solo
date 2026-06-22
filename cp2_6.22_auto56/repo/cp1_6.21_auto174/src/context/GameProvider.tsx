import { useState, useCallback, ReactNode, useContext } from 'react';
import * as THREE from 'three';
import GameContext, { Fragment, Recipe, GameContextType } from './GameContext';

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [characterPosition, setCharacterPosition] = useState(new THREE.Vector3(0, 0, 5));
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [slots, setSlots] = useState<(any | null)[]>([null, null, null]);
  const [isNearAltar, setIsNearAltar] = useState(false);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [showCombineEffect, setShowCombineEffect] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState<string | null>(null);

  const collectedCount = fragments.filter(f => f.collected).length;

  const loadInitialData = useCallback(async () => {
    try {
      const [fragRes, recipeRes, charRes] = await Promise.all([
        fetch('/api/fragments'),
        fetch('/api/recipes'),
        fetch('/api/character'),
      ]);
      const fragData = await fragRes.json();
      const recipeData = await recipeRes.json();
      const charData = await charRes.json();
      
      setFragments(fragData);
      setRecipes(recipeData);
      setCharacterPosition(new THREE.Vector3(charData.position.x, charData.position.y, charData.position.z));
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, []);

  const collectFragment = useCallback((id: number) => {
    setFragments(prev => prev.map(f => f.id === id ? { ...f, collected: true } : f));
  }, []);

  const addToSlot = useCallback((fragmentType: string, fragmentId: number): boolean => {
    let added = false;
    setSlots(prev => {
      const emptySlotIndex = prev.findIndex(s => s === null);
      if (emptySlotIndex === -1) return prev;
      added = true;
      const newSlots = [...prev];
      newSlots[emptySlotIndex] = { type: fragmentType, fragmentId };
      return newSlots;
    });
    return added;
  }, []);

  const removeFromSlot = useCallback((slotIndex: number) => {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = null;
      return newSlots;
    });
  }, []);

  const clearSlots = useCallback(() => {
    setSlots([null, null, null]);
  }, []);

  const checkCombination = useCallback((): Recipe | null => {
    if (slots.some(s => s === null)) return null;
    
    const slotTypes = slots.map(s => s!.type).sort();
    
    for (const recipe of recipes) {
      const recipeTypes = [...recipe.ingredients].sort();
      if (slotTypes.length === recipeTypes.length && 
          slotTypes.every((t, i) => t === recipeTypes[i])) {
        return recipe;
      }
    }
    return null;
  }, [slots, recipes]);

  const unlockRecipe = useCallback((recipeId: number) => {
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, unlocked: true } : r));
  }, []);

  const triggerCombineEffect = useCallback(() => {
    setShowCombineEffect(true);
    setTimeout(() => setShowCombineEffect(false), 1500);
  }, []);

  const value: GameContextType = {
    characterPosition,
    fragments,
    recipes,
    slots,
    isNearAltar,
    isTeleporting,
    showCombineEffect,
    newRecipeName,
    collectedCount,
    setCharacterPosition,
    collectFragment,
    addToSlot,
    removeFromSlot,
    clearSlots,
    checkCombination,
    unlockRecipe,
    setIsNearAltar,
    setIsTeleporting,
    triggerCombineEffect,
    setNewRecipeName,
    loadInitialData,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
