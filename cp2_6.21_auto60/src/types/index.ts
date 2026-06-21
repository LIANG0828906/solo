export interface FoodItem {
  id: number;
  name: string;
  nameEn: string;
  pinyin: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
  category: string;
}

export interface FoodRecord {
  id: number;
  foodId: number;
  foodName: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalFiber: number;
  totalSodium: number;
  records: FoodRecord[];
}

export interface DiagnosisAdvice {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'protein' | 'fat' | 'carbs' | 'fiber' | 'sodium' | 'calories';
  alternatives: FoodItem[];
}

export interface AnalysisResponse {
  period: string;
  avgCalories: number;
  advices: DiagnosisAdvice[];
  macroRatio: { protein: number; fat: number; carbs: number };
}

export interface HistoryResponse {
  startDate: string;
  endDate: string;
  data: DailySummary[];
}

export interface MacroRatio {
  protein: number;
  fat: number;
  carbs: number;
}

export interface RadarDataItem {
  label: string;
  current: number;
  recommended: number;
  percentage: number;
}

export interface RecommendedIntake {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
}
