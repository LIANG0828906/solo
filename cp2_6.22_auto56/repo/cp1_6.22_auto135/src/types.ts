export type FieldType = 'string' | 'number' | 'email' | 'phone';

export type RuleType = 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'linked';

export interface Rule {
  id: string;
  type: RuleType;
  enabled: boolean;
  options: Record<string, any>;
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  rules: Rule[];
}

export interface ValidationResult {
  valid: boolean;
  ruleType?: RuleType;
  message: string;
}

export interface FieldContextType {
  fields: Field[];
  selectedFieldId: string | null;
  addField: (name: string, type: FieldType) => void;
  removeField: (id: string) => void;
  selectField: (id: string | null) => void;
  reorderFields: (startIndex: number, endIndex: number) => void;
  updateFieldRules: (fieldId: string, rules: Rule[]) => void;
}

export interface RuleContextType {
  currentField: Field | null;
  updateRule: (ruleId: string, updates: Partial<Rule>) => void;
}

export type PreviewMode = 'config' | 'preview';
