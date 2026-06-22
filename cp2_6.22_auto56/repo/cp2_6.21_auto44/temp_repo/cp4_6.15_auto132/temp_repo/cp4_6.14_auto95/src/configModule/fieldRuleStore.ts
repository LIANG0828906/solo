import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FieldRule, FieldType, FieldConstraints } from '../types';

interface FieldRuleStore {
  rules: FieldRule[];
  addRule: (type: FieldType) => void;
  removeRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<FieldRule>) => void;
  reorderRules: (startIndex: number, endIndex: number) => void;
  setRules: (rules: FieldRule[]) => void;
  updateConstraints: (id: string, constraints: FieldConstraints) => void;
}

const getDefaultConstraints = (type: FieldType): FieldConstraints => {
  switch (type) {
    case 'string':
      return { maxLength: 50 };
    case 'number':
      return { min: 0, max: 100 };
    case 'date':
      return {};
    case 'email':
      return {};
    case 'address':
      return {};
    default:
      return {};
  }
};

const getDefaultFieldName = (type: FieldType, index: number): string => {
  const names: Record<FieldType, string> = {
    string: '文本字段',
    number: '数字字段',
    email: '邮箱地址',
    date: '日期',
    address: '地址',
  };
  return `${names[type]}${index > 0 ? index + 1 : ''}`;
};

export const useFieldRuleStore = create<FieldRuleStore>((set, get) => ({
  rules: [],

  addRule: (type: FieldType) => {
    const currentRules = get().rules;
    const countOfType = currentRules.filter((r) => r.type === type).length;
    const newRule: FieldRule = {
      id: uuidv4(),
      fieldName: getDefaultFieldName(type, countOfType),
      type,
      constraints: getDefaultConstraints(type),
      sortIndex: currentRules.length,
    };
    set({ rules: [...currentRules, newRule] });
  },

  removeRule: (id: string) => {
    const rules = get().rules.filter((rule) => rule.id !== id);
    const reorderedRules = rules.map((rule, index) => ({
      ...rule,
      sortIndex: index,
    }));
    set({ rules: reorderedRules });
  },

  updateRule: (id: string, updates: Partial<FieldRule>) => {
    set({
      rules: get().rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      ),
    });
  },

  reorderRules: (startIndex: number, endIndex: number) => {
    const rules = [...get().rules];
    const [removed] = rules.splice(startIndex, 1);
    rules.splice(endIndex, 0, removed);
    const reorderedRules = rules.map((rule, index) => ({
      ...rule,
      sortIndex: index,
    }));
    set({ rules: reorderedRules });
  },

  setRules: (rules: FieldRule[]) => {
    set({ rules });
  },

  updateConstraints: (id: string, constraints: FieldConstraints) => {
    set({
      rules: get().rules.map((rule) =>
        rule.id === id ? { ...rule, constraints } : rule
      ),
    });
  },
}));
