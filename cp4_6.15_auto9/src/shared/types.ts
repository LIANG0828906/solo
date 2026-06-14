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
  plantName: string;
  diseaseName: string;
  status: DiagnosisStatus;
  confidence: number;
  symptoms: string;
  suggestions: CareSuggestion[];
  createdAt: string;
}

export interface AppState {
  records: DiagnosisRecord[];
  currentRecord: DiagnosisRecord | null;
  isDiagnosing: boolean;
  currentImage: string | null;
}

export type AppAction =
  | { type: 'SET_CURRENT_IMAGE'; payload: string | null }
  | { type: 'START_DIAGNOSIS' }
  | { type: 'SET_DIAGNOSIS_RESULT'; payload: DiagnosisRecord }
  | { type: 'CLEAR_CURRENT' }
  | { type: 'ADD_RECORD'; payload: DiagnosisRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SET_CURRENT_RECORD'; payload: DiagnosisRecord | null }
  | { type: 'LOAD_RECORDS'; payload: DiagnosisRecord[] };

export type Page = 'home' | 'history' | 'detail';
