import { create } from 'zustand';
import type { BrewRecord, TastingNote } from '@/types';
import { brewStore, tastingNoteStore } from '@/data/brewStore';

interface BrewState {
  brews: BrewRecord[];
  notes: TastingNote[];
  loading: boolean;
  loadByTeaId: (teaId: string) => Promise<void>;
  addBrew: (
    data: Omit<BrewRecord, 'id' | 'createdAt'>,
    noteData: Omit<TastingNote, 'id' | 'brewRecordId' | 'overallScore'> & { overallScore: number }
  ) => Promise<void>;
  deleteBrew: (id: string) => Promise<boolean>;
}

export const useBrewStore = create<BrewState>((set, get) => ({
  brews: [],
  notes: [],
  loading: false,

  async loadByTeaId(teaId) {
    set({ loading: true });
    const [brews, notes] = await Promise.all([
      brewStore.getAllByTeaId(teaId),
      tastingNoteStore.getAllByTeaId(teaId),
    ]);
    set({ brews, notes, loading: false });
  },

  async addBrew(brewData, noteData) {
    const brew = await brewStore.add(brewData);
    await tastingNoteStore.add({
      ...noteData,
      brewRecordId: brew.id,
    });
    if (brewData.teaId) await get().loadByTeaId(brewData.teaId);
  },

  async deleteBrew(id) {
    const brew = await brewStore.getById(id);
    const note = brew ? await tastingNoteStore.getByBrewRecordId(id) : null;
    if (note) await tastingNoteStore.delete(note.id);
    const ok = await brewStore.delete(id);
    if (ok && brew) await get().loadByTeaId(brew.teaId);
    return ok;
  },
}));
