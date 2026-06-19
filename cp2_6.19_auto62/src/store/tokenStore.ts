import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Token, TokenCategory, FilterCategory } from '../types/token';

const defaultTokens: Token[] = [
  { id: uuidv4(), name: 'color.primary', category: 'color', value: '#0EA5E9', description: '品牌主色，用于按钮和选中态' },
  { id: uuidv4(), name: 'color.secondary', category: 'color', value: '#6366F1', description: '次要强调色' },
  { id: uuidv4(), name: 'color.success', category: 'color', value: '#10B981', description: '成功状态色' },
  { id: uuidv4(), name: 'color.warning', category: 'color', value: '#F59E0B', description: '警告状态色' },
  { id: uuidv4(), name: 'color.error', category: 'color', value: '#EF4444', description: '错误状态色' },
  { id: uuidv4(), name: 'color.text', category: 'color', value: '#1E293B', description: '主要文字颜色' },
  { id: uuidv4(), name: 'color.textLight', category: 'color', value: '#64748B', description: '次要文字颜色' },
  { id: uuidv4(), name: 'color.background', category: 'color', value: '#F8FAFC', description: '页面背景色' },
  { id: uuidv4(), name: 'color.surface', category: 'color', value: '#FFFFFF', description: '卡片表面色' },
  { id: uuidv4(), name: 'color.border', category: 'color', value: '#E2E8F0', description: '边框颜色' },
  { id: uuidv4(), name: 'spacing.xs', category: 'spacing', value: '4px', description: '超小间距' },
  { id: uuidv4(), name: 'spacing.sm', category: 'spacing', value: '8px', description: '小间距' },
  { id: uuidv4(), name: 'spacing.md', category: 'spacing', value: '16px', description: '中间距' },
  { id: uuidv4(), name: 'spacing.lg', category: 'spacing', value: '24px', description: '大间距' },
  { id: uuidv4(), name: 'spacing.xl', category: 'spacing', value: '32px', description: '超大间距' },
  { id: uuidv4(), name: 'spacing.2xl', category: 'spacing', value: '48px', description: '特大间距' },
  { id: uuidv4(), name: 'font.family.sans', category: 'typography', value: 'system-ui, -apple-system, sans-serif', description: '无衬线字体' },
  { id: uuidv4(), name: 'font.size.xs', category: 'typography', value: '12px', description: '超小字号' },
  { id: uuidv4(), name: 'font.size.sm', category: 'typography', value: '14px', description: '小字号' },
  { id: uuidv4(), name: 'font.size.base', category: 'typography', value: '16px', description: '基准字号' },
  { id: uuidv4(), name: 'font.size.lg', category: 'typography', value: '18px', description: '大字号' },
  { id: uuidv4(), name: 'font.size.xl', category: 'typography', value: '24px', description: '超大字号' },
  { id: uuidv4(), name: 'font.size.2xl', category: 'typography', value: '32px', description: '特大字号' },
  { id: uuidv4(), name: 'font.weight.normal', category: 'typography', value: '400', description: '常规字重' },
  { id: uuidv4(), name: 'font.weight.medium', category: 'typography', value: '500', description: '中等字重' },
  { id: uuidv4(), name: 'font.weight.bold', category: 'typography', value: '700', description: '粗体字重' },
];

interface TokenState {
  tokens: Token[];
  defaultTokens: Token[];
  activeCategory: FilterCategory;
  resetAnimationKey: number;

  addToken: (token: Omit<Token, 'id'>) => void;
  updateToken: (id: string, value: string) => void;
  removeToken: (id: string) => void;
  setActiveCategory: (category: FilterCategory) => void;
  resetTokens: () => void;
  exportTokens: () => string;
  getFilteredTokens: () => Token[];
  getColorTokens: () => Token[];
  getTokenValue: (name: string) => string | undefined;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: JSON.parse(JSON.stringify(defaultTokens)),
  defaultTokens: JSON.parse(JSON.stringify(defaultTokens)),
  activeCategory: 'all',
  resetAnimationKey: 0,

  addToken: (token) =>
    set((state) => ({
      tokens: [...state.tokens, { ...token, id: uuidv4() }],
    })),

  updateToken: (id, value) =>
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.id === id ? { ...t, value } : t
      ),
    })),

  removeToken: (id) =>
    set((state) => ({
      tokens: state.tokens.filter((t) => t.id !== id),
    })),

  setActiveCategory: (category) =>
    set(() => ({
      activeCategory: category,
    })),

  resetTokens: () =>
    set((state) => ({
      tokens: JSON.parse(JSON.stringify(state.defaultTokens)),
      resetAnimationKey: state.resetAnimationKey + 1,
    })),

  exportTokens: () => {
    const tokens = get().tokens;
    return JSON.stringify(
      tokens.map(({ name, category, value, description }) => ({
        name,
        category,
        value,
        description,
      })),
      null,
      2
    );
  },

  getFilteredTokens: () => {
    const { tokens, activeCategory } = get();
    if (activeCategory === 'all') return tokens;
    return tokens.filter((t) => t.category === activeCategory);
  },

  getColorTokens: () => {
    return get().tokens.filter((t) => t.category === 'color');
  },

  getTokenValue: (name) => {
    const token = get().tokens.find((t) => t.name === name);
    return token?.value;
  },
}));
