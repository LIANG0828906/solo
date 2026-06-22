import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Token, TokenStore } from '../types';

const initialTokens: Token[] = [
  { id: uuidv4(), name: 'primary', group: 'colors', type: 'color', value: '#6366F1' },
  { id: uuidv4(), name: 'secondary', group: 'colors', type: 'color', value: '#8B5CF6' },
  { id: uuidv4(), name: 'background', group: 'colors', type: 'color', value: '#1E1E2E' },
  { id: uuidv4(), name: 'text', group: 'colors', type: 'color', value: '#E0E0F0' },
  { id: uuidv4(), name: 'border', group: 'colors', type: 'color', value: '#3A3A4E' },
  { id: uuidv4(), name: 'success', group: 'colors', type: 'color', value: '#10B981' },
  { id: uuidv4(), name: 'xs', group: 'spacing', type: 'spacing', value: '4' },
  { id: uuidv4(), name: 'sm', group: 'spacing', type: 'spacing', value: '8' },
  { id: uuidv4(), name: 'md', group: 'spacing', type: 'spacing', value: '16' },
  { id: uuidv4(), name: 'lg', group: 'spacing', type: 'spacing', value: '24' },
  { id: uuidv4(), name: 'fontFamily', group: 'typography', type: 'font', value: 'system-ui' },
  { id: uuidv4(), name: 'fontSize', group: 'typography', type: 'font', value: '16' },
];

export const useTokenStore = create<TokenStore>((set) => ({
  tokens: initialTokens,
  addToken: (token) =>
    set((state) => ({
      tokens: [...state.tokens, { ...token, id: uuidv4() }],
    })),
  updateToken: (id, updates) =>
    set((state) => ({
      tokens: state.tokens.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteToken: (id) =>
    set((state) => ({
      tokens: state.tokens.filter((t) => t.id !== id),
    })),
}));
