import { create } from 'zustand';
import type { NoteData } from './useScoreStore';

interface SharedScore {
  notes: NoteData[];
  tempo: number;
  loaded: boolean;
  error: string | null;
  loadShare: (id: string) => void;
  clearShare: () => void;
}

export const useShareStore = create<SharedScore>((set) => ({
  notes: [],
  tempo: 120,
  loaded: false,
  error: null,

  loadShare: (id: string) => {
    try {
      const raw = localStorage.getItem(`share_${id}`);
      if (!raw) {
        set({ loaded: true, error: '分享链接无效或已过期', notes: [], tempo: 120 });
        return;
      }
      const data = JSON.parse(raw);
      const notes: NoteData[] = (data.notes || []).map((n: Record<string, unknown>, i: number) => ({
        ...(n as Omit<NoteData, 'flashState' | 'order'>),
        flashState: 'none' as const,
        order: i,
      }));
      set({ notes, tempo: data.tempo || 120, loaded: true, error: null });
    } catch {
      set({ loaded: true, error: '分享数据加载失败', notes: [], tempo: 120 });
    }
  },

  clearShare: () => set({ notes: [], tempo: 120, loaded: false, error: null }),
}));
