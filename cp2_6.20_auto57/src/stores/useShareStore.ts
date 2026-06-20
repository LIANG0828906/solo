import { create } from 'zustand';
import { NoteData } from './useScoreStore';

interface SharedScore {
  notes: NoteData[];
  tempo: number;
  loaded: boolean;
  error: string | null;
  loadShare: (id: string) => void;
  clearShare: () => void;
}

type RawNote = Partial<Record<keyof NoteData, unknown>>;

export const useShareStore = create<SharedScore>((set) => ({
  notes: [],
  tempo: 120,
  loaded: false,
  error: null,

  loadShare: (id: string) => {
    try {
      const raw = localStorage.getItem(`share_${id}`);
      if (!raw) {
        set({ loaded: true, error: '分享链接无效或已过期' });
        return;
      }
      const data = JSON.parse(raw);
      const notes: NoteData[] = ((data.notes || []) as RawNote[]).map((n, i: number) => ({
        ...(n as NoteData),
        flashState: 'none' as const,
        order: i,
      }));
      set({ notes, tempo: data.tempo || 120, loaded: true, error: null });
    } catch {
      set({ loaded: true, error: '分享数据加载失败' });
    }
  },

  clearShare: () => set({ notes: [], tempo: 120, loaded: false, error: null }),
}));
