export interface Herb {
  id: string;
  name: string;
  nature: string;
  flavor: string;
  dosageRange: [number, number];
  color: string;
  drawerPosition: [number, number];
}

export interface PrescriptionItem {
  id: string;
  herbId: string;
  herbName: string;
  requiredDosage: number;
  currentWeight: number;
  status: 'unweighed' | 'pounding' | 'weighing' | 'completed';
}

export type Phase = 'selecting' | 'pounding' | 'weighing' | 'completed';

export interface AppState {
  currentPhase: Phase;
  selectedHerb: Herb | null;
  poundingCount: number;
  scaleWeight: number;
  prescription: PrescriptionItem[];
  isDragging: boolean;
  draggedObject: 'drawer' | 'herb' | null;
  draggedHerbId: string | null;
  showToast: boolean;
  toastMessage: string;
  pillAnimationActive: boolean;
}

export type AppAction =
  | { type: 'SELECT_HERB'; payload: Herb }
  | { type: 'DESELECT_HERB' }
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'INCREMENT_POUNDING' }
  | { type: 'RESET_POUNDING' }
  | { type: 'SET_SCALE_WEIGHT'; payload: number }
  | { type: 'START_DRAGGING'; payload: 'drawer' | 'herb'; herbId?: string }
  | { type: 'STOP_DRAGGING' }
  | { type: 'UPDATE_PRESCRIPTION_ITEM'; payload: { id: string; updates: Partial<PrescriptionItem> } }
  | { type: 'COMPLETE_PRESCRIPTION_ITEM'; payload: string }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'START_PILL_ANIMATION' }
  | { type: 'END_PILL_ANIMATION' }
  | { type: 'CHECK_ALL_COMPLETED' };
