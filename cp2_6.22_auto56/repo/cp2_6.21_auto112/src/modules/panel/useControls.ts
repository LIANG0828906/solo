import { create } from 'zustand';

export interface ColumnConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
}

export const FONT_OPTIONS = [
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
];

export const DEFAULT_TEXT = `Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.

The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing.

Good typography enhances the character and mood of your content.`;

interface ControlsState {
  text: string;
  columns: [ColumnConfig, ColumnConfig, ColumnConfig];
  selectedColumn: 0 | 1 | 2;
  lockedColumn: 0 | 1 | 2 | null;
  setText: (text: string) => void;
  setSelectedColumn: (col: 0 | 1 | 2) => void;
  setLockedColumn: (col: 0 | 1 | 2 | null) => void;
  setControl: <K extends keyof ColumnConfig>(
    colIndex: 0 | 1 | 2,
    key: K,
    value: ColumnConfig[K]
  ) => void;
}

const createDefaultColumn = (fontFamily: string): ColumnConfig => ({
  fontFamily,
  fontSize: 18,
  lineHeight: 1.5,
  letterSpacing: 0,
  color: '#333333',
});

export const useControls = create<ControlsState>((set) => ({
  text: DEFAULT_TEXT,
  columns: [
    createDefaultColumn(FONT_OPTIONS[0].value),
    createDefaultColumn(FONT_OPTIONS[1].value),
    createDefaultColumn(FONT_OPTIONS[2].value),
  ],
  selectedColumn: 0,
  lockedColumn: null,

  setText: (text) => set({ text }),

  setSelectedColumn: (col) => set({ selectedColumn: col }),

  setLockedColumn: (col) => set({ lockedColumn: col }),

  setControl: (colIndex, key, value) =>
    set((state) => {
      const columns = [...state.columns] as [ColumnConfig, ColumnConfig, ColumnConfig];
      columns[colIndex] = { ...columns[colIndex], [key]: value };
      return { columns };
    }),
}));

export function getDiffPercent(
  currentValue: number,
  baseValue: number | null | undefined
): string | null {
  if (baseValue === null || baseValue === undefined || baseValue === 0) return null;
  const diff = ((currentValue - baseValue) / baseValue) * 100;
  if (Math.abs(diff) < 0.5) return null;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(0)}%`;
}

export function getBaseColumnValue<K extends keyof ColumnConfig>(
  columns: [ColumnConfig, ColumnConfig, ColumnConfig],
  lockedColumn: 0 | 1 | 2 | null,
  key: K
): ColumnConfig[K] | null {
  if (lockedColumn === null) return null;
  return columns[lockedColumn][key];
}
