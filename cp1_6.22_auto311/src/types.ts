export type ElementType = 'fire' | 'water' | 'earth' | 'air' | 'chaos' | 'spirit' | 'metal' | 'nature';

export interface Material {
  id: string;
  name: string;
  emoji: string;
  elementType: ElementType;
  discovered: boolean;
  discoveredAt?: number;
  synthesisCount: number;
}

export interface Recipe {
  id: string;
  input: [string, string];
  output: string;
  name: string;
  description: string;
  discoveredAt: number;
  isLocked: boolean;
  isNewDiscovery: boolean;
}

export interface ElementEffect {
  type: 'glow' | 'spark' | 'smoke' | 'flash';
  color: string;
  duration: number;
  intensity: number;
}

export interface AlchemySlot {
  index: number;
  materialId: string | null;
  position: { x: number; y: number };
  isGlowing: boolean;
}

export interface SynthesisResult {
  success: boolean;
  outputMaterial?: Material;
  recipeId?: string;
  effects: ElementEffect[];
  failReason?: string;
  isNewMaterial?: boolean;
}

export interface GameState {
  materials: Record<string, Material>;
  recipes: Record<string, Recipe>;
  allRecipeDefinitions: Array<{
    input: [string, string];
    output: string;
    name: string;
    description: string;
  }>;
  discoveredMaterialIds: string[];
  discoveredRecipeIds: string[];
  recipeHistory: string[];
  slots: AlchemySlot[];
  resultSlotMaterialId: string | null;
  isAnimating: boolean;
  failureRate: number;
  consecutiveSuccess: number;
  consecutiveFailure: number;
  hasPassionBuff: boolean;
  selectedGraphNodeId: string | null;
  synthesisMessage: { type: 'success' | 'failure'; text: string } | null;
  showFailureFlash: boolean;
  showBoardBreath: boolean;
}

export type GameAction =
  | { type: 'PLACE_MATERIAL'; slotIndex: number; materialId: string }
  | { type: 'REMOVE_MATERIAL'; slotIndex: number }
  | { type: 'CLEAR_ALL_SLOTS' }
  | { type: 'START_SYNTHESIS_ANIMATION' }
  | { type: 'COMPLETE_SYNTHESIS'; result: SynthesisResult }
  | { type: 'FAIL_SYNTHESIS'; reason: string }
  | { type: 'CLEAR_SYNTHESIS_MESSAGE' }
  | { type: 'HIDE_FAILURE_FLASH' }
  | { type: 'STOP_BOARD_BREATH' }
  | { type: 'TOGGLE_RECIPE_LOCK'; recipeId: string }
  | { type: 'SELECT_GRAPH_NODE'; materialId: string | null }
  | { type: 'CLEAR_RESULT_SLOT' };
