export type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface DimensionScores {
  uppercase: number;
  lowercase: number;
  numbers: number;
  specialChars: number;
  length: number;
}

export interface CharFrequency {
  char: string;
  count: number;
  percentage: number;
}

export interface CrackTimeEstimate {
  attackType: string;
  timeSeconds: number;
  formattedTime: string;
}

export interface PasswordResult {
  password: string;
  entropy: number;
  strengthLevel: StrengthLevel;
  strengthText: string;
  dimensionScores: DimensionScores;
  charFrequencies: CharFrequency[];
  crackTimes: CrackTimeEstimate[];
  calculatedAt: number;
}

export interface PasswordContextType {
  password: string;
  setPassword: (password: string) => void;
  result: PasswordResult | null;
  loadRandomCommonPassword: () => void;
}
