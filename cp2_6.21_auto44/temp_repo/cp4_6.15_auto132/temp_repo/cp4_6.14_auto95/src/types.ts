export type FieldType = 'string' | 'number' | 'email' | 'date' | 'address';

export interface StringConstraints {
  maxLength?: number;
  pattern?: string;
}

export interface NumberConstraints {
  min?: number;
  max?: number;
}

export interface DateConstraints {
  startDate?: string;
  endDate?: string;
}

export interface AddressConstraints {
  city?: string;
}

export type FieldConstraints =
  | StringConstraints
  | NumberConstraints
  | DateConstraints
  | AddressConstraints;

export interface FieldRule {
  id: string;
  fieldName: string;
  type: FieldType;
  constraints: FieldConstraints;
  sortIndex: number;
}

export interface Preset {
  id: string;
  name: string;
  rules: FieldRule[];
  createdAt: string;
}

export type DataRow = Record<string, string | number>;

export const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  string: '#3b82f6',
  number: '#22c55e',
  email: '#a855f7',
  date: '#f97316',
  address: '#64748b',
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: '文本',
  number: '数字',
  email: '邮箱',
  date: '日期',
  address: '地址',
};

export const FIELD_TYPE_DEFAULT_NAMES: Record<FieldType, string> = {
  string: '文本字段',
  number: '数字字段',
  email: '邮箱地址',
  date: '日期',
  address: '地址',
};
