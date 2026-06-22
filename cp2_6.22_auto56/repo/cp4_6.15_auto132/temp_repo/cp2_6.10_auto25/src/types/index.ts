export interface Medicine {
  id: string;
  name: string;
  description: string;
  color: string;
  nature: string;
  flavor: string;
  meridian: string;
  processing: '生' | '炙' | '煅';
}

export interface Dosage {
  liang: number;
  qian: number;
  fen: number;
  li: number;
  grams: number;
}

export interface PrescriptionItem {
  id: string;
  medicine: Medicine;
  dosage: Dosage;
  hasConflict: boolean;
  conflictInfo?: string;
  conflictType?: '十八反' | '十九畏';
}

export interface DecoctionParams {
  initialWater: number;
  mode: 'standard';
}

export interface Prescription {
  id: string;
  items: PrescriptionItem[];
  totalDosage: number;
  decoctionParams: DecoctionParams;
  createdAt: string;
  notes?: string;
  playbackData?: PlaybackFrame[];
}

export interface PlaybackFrame {
  time: number;
  waterLevel: number;
  soupColor: string;
  sedimentLevel: number;
  phase: '武火' | '文火' | '完成';
}

export interface CompatibilityConflict {
  medicineIds: string[];
  medicineNames: string[];
  type: '十八反' | '十九畏';
  description: string;
}

export interface CompatibilityCheckRequest {
  medicineIds: string[];
}

export interface CompatibilityCheckResponse {
  conflicts: CompatibilityConflict[];
}

export interface DecoctionState {
  isDecocting: boolean;
  currentPhase: 'idle' | '武火' | '文火' | '完成';
  currentTime: number;
  totalTime: number;
  waterLevel: number;
  initialWaterLevel: number;
  soupColor: string;
  sedimentLevel: number;
  playbackFrames: PlaybackFrame[];
}

export type DragSource = 'cabinet' | 'scale';

export interface AppState {
  medicines: Medicine[];
  prescriptionItems: PrescriptionItem[];
  currentWeighingMedicine: Medicine | null;
  currentDosage: Omit<Dosage, 'grams'>;
  decoctionState: DecoctionState;
  prescriptions: Prescription[];
  activeDrawer: string | null;
  isShaking: boolean;
  showHistory: boolean;
  selectedPrescription: Prescription | null;
  isPlaybackMode: boolean;
  playbackIndex: number;
}
