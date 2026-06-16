import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { PerfumeState, Note, PerfumeProfile, Comment } from '../types';

const generatePerfumeName = (topNotes: Note[], middleNotes: Note[], baseNotes: Note[]): string => {
  const prefixes = ['晨曦', '暮色', '秘境', '幻影', '流光', '星尘', '幽梦', '诗意'];
  const suffixes = ['之歌', '之舞', '之吻', '之心', '之约', '之境', '之语', '之忆'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const mainNote = [...topNotes, ...middleNotes, ...baseNotes][0];
  if (mainNote) {
    return `${prefix}·${mainNote.name}${suffix}`;
  }
  return `${prefix}香水${suffix}`;
};

export const usePerfumeStore = create<PerfumeState>((set, get) => ({
  selectedTopNotes: [],
  selectedMiddleNotes: [],
  selectedBaseNotes: [],
  concentration: 25,
  diffusion: 5,
  longevity: 5,
  profiles: [],

  addNote: (note: Note) => {
    set((state) => {
      if (note.type === 'top') {
        if (state.selectedTopNotes.find((n) => n.id === note.id)) return state;
        if (state.selectedTopNotes.length >= 3) return state;
        return { selectedTopNotes: [...state.selectedTopNotes, note] };
      } else if (note.type === 'middle') {
        if (state.selectedMiddleNotes.find((n) => n.id === note.id)) return state;
        if (state.selectedMiddleNotes.length >= 3) return state;
        return { selectedMiddleNotes: [...state.selectedMiddleNotes, note] };
      } else {
        if (state.selectedBaseNotes.find((n) => n.id === note.id)) return state;
        if (state.selectedBaseNotes.length >= 3) return state;
        return { selectedBaseNotes: [...state.selectedBaseNotes, note] };
      }
    });
  },

  removeNote: (noteId: string) => {
    set((state) => ({
      selectedTopNotes: state.selectedTopNotes.filter((n) => n.id !== noteId),
      selectedMiddleNotes: state.selectedMiddleNotes.filter((n) => n.id !== noteId),
      selectedBaseNotes: state.selectedBaseNotes.filter((n) => n.id !== noteId),
    }));
  },

  setConcentration: (value: number) => set({ concentration: value }),
  setDiffusion: (value: number) => set({ diffusion: value }),
  setLongevity: (value: number) => set({ longevity: value }),

  getRating: () => {
    const state = get();
    const allSelected = [
      ...state.selectedTopNotes,
      ...state.selectedMiddleNotes,
      ...state.selectedBaseNotes,
    ];
    if (allSelected.length === 0) return 0;

    const hasTop = state.selectedTopNotes.length > 0;
    const hasMiddle = state.selectedMiddleNotes.length > 0;
    const hasBase = state.selectedBaseNotes.length > 0;
    let balance = 0;
    if (hasTop) balance += 1;
    if (hasMiddle) balance += 1;
    if (hasBase) balance += 1;

    const balanceScore = (balance / 3) * 2;
    const varietyScore = Math.min(allSelected.length / 4, 1) * 1.5;
    const paramScore = ((state.concentration / 40) * 0.5 + (state.diffusion / 10) * 0.5 + (state.longevity / 10) * 0.5) / 1.5 * 1.5;

    return Math.min(Math.round((balanceScore + varietyScore + paramScore) * 10) / 10, 5);
  },

  createProfile: (): PerfumeProfile => {
    const state =