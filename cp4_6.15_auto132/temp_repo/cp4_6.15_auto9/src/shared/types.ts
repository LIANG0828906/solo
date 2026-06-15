export type DiagnosisStatus = 'healthy' | 'diseased' | 'nutrient_deficiency';

export interface CareSuggestion {
  id: string;
  title: string;
  description: string;
  icon: 'sun' | 'droplets' | 'leaf' | 'fertilizer' | 'temperature' | 'wind';
}

export interface DiagnosisRecord {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  plantName: string;
  diseaseName: string;
  status: DiagnosisStatus;
  confidence: number;
  symptoms: string;
  suggestions: CareSuggestion[];
  createdAt: string;
}

export interface ImageFeatures {
  avgGreen: number;
  avgRed: number;
  avgBlue: number;
  brightness: number;
  contrast: number;
  greenRatio: number;
  yellowTendency: number;
  brownSpotRatio: number;
}

export interface AppState {
  records: DiagnosisRecord[];
  deletingIds: Set<string>;
  currentRecord: DiagnosisRecord | null;
  isDiagnosing: boolean;
  currentImage: string | null;
  currentThumbnail: string | null;
  imageFeatures: ImageFeatures | null;
}

export type AppAction =
  | { type: 'SET_CURRENT_IMAGE'; payload: { image: string; thumbnail: string } }
  | { type: 'SET_IMAGE_FEATURES'; payload: ImageFeatures }
  | { type: 'START_DIAGNOSIS' }
  | { type: 'SET_DIAGNOSIS_RESULT'; payload: DiagnosisRecord }
  | { type: 'CLEAR_CURRENT' }
  | { type: 'ADD_RECORD'; payload: DiagnosisRecord }
  | { type: 'MARK_DELETING'; payload: string }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SET_CURRENT_RECORD'; payload: DiagnosisRecord | null }
  | { type: 'LOAD_RECORDS'; payload: DiagnosisRecord[] };

export type Page = 'home' | 'history' | 'detail';
