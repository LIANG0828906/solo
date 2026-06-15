export type QinzhenMaterial = 'jade' | 'bone' | 'wood' | 'copper';

export type StringType = 'taigu' | 'zhongqing' | 'xihe';

export interface Note {
  id: string;
  stringIndex: number;
  midi: number;
  frequency: number;
  timestamp: number;
  duration: number;
  velocity: number;
}

export interface Recording {
  id: string;
  userId: string;
  guqinId: string;
  name: string;
  notes: Note[];
  createdAt: string;
  duration: number;
}

export interface Guqin {
  id: string;
  userId: string;
  name: string;
  qinzhenMaterial: QinzhenMaterial;
  stringType: StringType;
  lacquerColor: string;
  tunings: number[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface ScaleValidationResult {
  valid: boolean;
  accuracy: number;
  details: {
    stringIndex: number;
    expected: number;
    actual: number;
    deviation: number;
  }[];
}
