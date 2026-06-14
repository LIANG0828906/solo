export type PlantLocation = '阳台' | '客厅' | '厨房' | '卧室' | '书房' | '其他';

export interface Plant {
  id: string;
  name: string;
  purchaseDate: string;
  location: PlantLocation;
  photos: string[];
  createdAt: string;
  lastDiagnosisDate?: string;
}

export type SymptomType = '叶片发黄' | '枯萎' | '虫害' | '霉斑' | '生长缓慢' | '烂根';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface MatchedCause {
  name: string;
  probability: number;
  description: string;
  careMeasures: string[];
  severity: SeverityLevel;
}

export interface DiagnosisResult {
  id: string;
  symptomRecordId: string;
  plantId: string;
  causes: MatchedCause[];
  createdAt: string;
  confirmed: boolean;
}

export interface SymptomRecord {
  id: string;
  plantId: string;
  symptomTypes: SymptomType[];
  occurredDate: string;
  wateringLevel: number;
  fertilizingLevel: number;
  lightLevel: number;
  notes: string;
  createdAt: string;
}
