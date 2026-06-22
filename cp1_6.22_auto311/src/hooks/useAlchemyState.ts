import { useReducer, useCallback, useMemo } from 'react';
import type { GameState, GameAction, AlchemySlot } from '../types';
import { buildInitialGameState, createDiscoveredRecipe } from '../data/initialRecipes';
import { markGlowingSlots } from '../utils/geometryUtils';
import { AlchemyEngine } from '../alchemyEngine';

const MAX_HISTORY = 20;
const BASE_FAILURE_RATE = 0.2;
const PASSION_FAILURE_RATE = 0.1;

function updateMaterialsWithResult(
  materials: GameState['materials'],
  outputTemplateId: string,
  newInstance: { id: string; discoveredAt: number }
): GameState['materials'] {
  const template = materials[outputTemplateId];
  if (!template) return materials;

  const next = { ...materials };
  next[outputTemplateId] = {
    ...template,
    discovered: true,
    discoveredAt: template.discoveredAt || newInstance.discoveredAt,
    synthesisCount: template.synthesisCount + 1,
  };
  return next;
}

function pruneHistory(
  history: string[],
  recipes: GameState['recipes']
): string[] {
  if (history.length <= MAX_HISTORY) return history;
  const result = [...history];
  while (result.length > MAX_HISTORY) {
    let removedIdx = -1;
    for (let i = result.length - 1; i >= 0; i--) {
      const recipeId = result[i];
      const rec = recipes[recipeId];
      if (rec && !rec.isLocked) {
        removedIdx = i;
        break;
      }
    }
    if (removedIdx === -1) break;
    result.splice(removedIdx, 1);
  }
  return result;
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_MATERIAL': {
      const newSlots = state.slots.map((s) =>
        s.index === action.slotIndex ? { ...s, materialId: action.materialId } : s
      );
      return {
        ...state,
        slots: markGlowingSlots(newSlots),
      };
    }
    case 'REMOVE_MATERIAL': {
      const newSlots = state.slots.map((s) =>
        s.index === action.slotIndex ? { ...s, materialId: null } : s
      );
      return {
        ...state,
        slots: markGlowingSlots(newSlots),
      };
    }
    case 'CLEAR_ALL_SLOTS': {
      return {
        ...state,
        slots: state.slots.map((s) => ({ ...s, materialId: null, isGlowing: false })),
      };
    }
    case 'START_SYNTHESIS_ANIMATION': {
      return {
        ...state,
        isAnimating: true,
        showBoardBreath: true,
        synthesisMessage: null,
      };
    }
    case 'COMPLETE_SYNTHESIS': {
      const { result } = action;
      if (!result.success || !result.outputMaterial) return state;
      const outputTemplateId = result.outputMaterial.id;
      const def = state.allRecipeDefinitions.find(
        (d) =>
          (d.input[0] === state.slots[0].materialId && d.input[1] === state.slots[1].materialId) ||
          (d.input[1] === state.slots[0].materialId && d.input[0] === state.slots[1].materialId)
      );
      const actualDef =
        def ||
        state.allRecipeDefinitions.find((d) => d.output === outputTemplateId);

      const recipe = actualDef
        ? createDiscoveredRecipe(actualDef, !!result.isNewMaterial)
        : null;

      const nextMaterials = updateMaterialsWithResult(
        state.materials,
        outputTemplateId,
        { id: result.outputMaterial.id, discoveredAt: Date.now() }
      );

      let nextDiscoveredMaterials = state.discoveredMaterialIds;
      if (result.isNewMaterial && !nextDiscoveredMaterials.includes(outputTemplateId)) {
        nextDiscoveredMaterials = [...nextDiscoveredMaterials, outputTemplateId];
      }

      let nextRecipes = state.recipes;
      let nextRecipeHistory = state.recipeHistory;
      let nextDiscoveredRecipes = state.discoveredRecipeIds;
      if (recipe) {
        nextRecipes = { ...state.recipes, [recipe.id]: recipe };
        nextRecipeHistory = pruneHistory([recipe.id, ...state.recipeHistory], nextRecipes);
        if (!nextDiscoveredRecipes.includes(recipe.id)) {
          nextDiscoveredRecipes = [...nextDiscoveredRecipes, recipe.id];
        }
      }

      const newSuccess = state.consecutiveSuccess + 1;
      const hasPassionBuff = newSuccess >= 3;
      const nextFailureRate = hasPassionBuff ? PASSION_FAILURE_RATE : state.failureRate;

      return {
        ...state,
        isAnimating: false,
        showBoardBreath: false,
        materials: nextMaterials,
        recipes: nextRecipes,
        discoveredMaterialIds: nextDiscoveredMaterials,
        discoveredRecipeIds: nextDiscoveredRecipes,
        recipeHistory: nextRecipeHistory,
        resultSlotMaterialId: outputTemplateId,
        consecutiveSuccess: newSuccess,
        consecutiveFailure: 0,
        hasPassionBuff,
        failureRate: nextFailureRate,
        synthesisMessage: {
          type: 'success',
          text: result.isNewMaterial
            ? `🎉 新发现：${result.outputMaterial.name}！`
            : `合成成功：${result.outputMaterial.name}`,
        },
      };
    }
    case 'FAIL_SYNTHESIS': {
      const newFail = state.consecutiveFailure + 1;
      const resetRate = newFail >= 2;
      return {
        ...state,
        isAnimating: false,
        showBoardBreath: false,
        showFailureFlash: true,
        consecutiveFailure: newFail,
        consecutiveSuccess: 0,
        failureRate: resetRate ? BASE_FAILURE_RATE : state.failureRate,
        hasPassionBuff: resetRate ? false : state.hasPassionBuff,
        synthesisMessage: {
          type: 'failure',
          text: action.reason,
        },
      };
    }
    case 'CLEAR_SYNTHESIS_MESSAGE': {
      return { ...state, synthesisMessage: null };
    }
    case 'HIDE_FAILURE_FLASH': {
      return { ...state, showFailureFlash: false };
    }
    case 'STOP_BOARD_BREATH': {
      return { ...state, showBoardBreath: false };
    }
    case 'TOGGLE_RECIPE_LOCK': {
      const recipe = state.recipes[action.recipeId];
      if (!recipe) return state;
      return {
        ...state,
        recipes: {
          ...state.recipes,
          [action.recipeId]: { ...recipe, isLocked: !recipe.isLocked },
        },
      };
    }
    case 'SELECT_GRAPH_NODE': {
      return { ...state, selectedGraphNodeId: action.materialId };
    }
    case 'CLEAR_RESULT_SLOT': {
      return { ...state, resultSlotMaterialId: null };
    }
    default:
      return state;
  }
}

export function useAlchemyState() {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialGameState);

  const engine = useMemo(() => new AlchemyEngine(state.allRecipeDefinitions), [state.allRecipeDefinitions]);

  const placeMaterial = useCallback((slotIndex: number, materialId: string) => {
    dispatch({ type: 'PLACE_MATERIAL', slotIndex, materialId });
  }, []);

  const removeMaterial = useCallback((slotIndex: number) => {
    dispatch({ type: 'REMOVE_MATERIAL', slotIndex });
  }, []);

  const clearAllSlots = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_SLOTS' });
  }, []);

  const triggerSynthesis = useCallback(
    (slotA: number, slotB: number) => {
      if (state.isAnimating) return;
      const slots = state.slots as AlchemySlot[];
      const mA = slots[slotA].materialId;
      const mB = slots[slotB].materialId;
      if (!mA || !mB) return;

      dispatch({ type: 'START_SYNTHESIS_ANIMATION' });

      setTimeout(() => {
        const matA = state.materials[mA];
        const matB = state.materials[mB];
        if (!matA || !matB) return;

        const result = engine.synthesize([matA, matB], state.materials, state.failureRate);
        if (result.success) {
          dispatch({ type: 'COMPLETE_SYNTHESIS', result });
        } else {
          dispatch({ type: 'FAIL_SYNTHESIS', reason: result.failReason || '混合失败' });
          setTimeout(() => dispatch({ type: 'HIDE_FAILURE_FLASH' }), 250);
        }
      }, 500);
    },
    [state.isAnimating, state.slots, state.materials, state.failureRate, engine]
  );

  const clearSynthesisMessage = useCallback(() => {
    dispatch({ type: 'CLEAR_SYNTHESIS_MESSAGE' });
  }, []);

  const toggleRecipeLock = useCallback((recipeId: string) => {
    dispatch({ type: 'TOGGLE_RECIPE_LOCK', recipeId });
  }, []);

  const selectGraphNode = useCallback((materialId: string | null) => {
    dispatch({ type: 'SELECT_GRAPH_NODE', materialId });
  }, []);

  const clearResultSlot = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULT_SLOT' });
  }, []);

  return {
    state,
    engine,
    placeMaterial,
    removeMaterial,
    clearAllSlots,
    triggerSynthesis,
    clearSynthesisMessage,
    toggleRecipeLock,
    selectGraphNode,
    clearResultSlot,
  };
}
