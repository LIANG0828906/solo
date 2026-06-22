import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';

export type ProgramStatus = 'draft' | 'recording' | 'editing' | 'published';

export interface Annotation {
  id: string;
  time: number;
  text: string;
  color: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  recordDate: string;
  status: ProgramStatus;
  publishDate: string;
  notes: string;
  audioUrl: string | null;
  audioDuration: number;
  guestIds: string[];
  annotations: Annotation[];
}

export interface Guest {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
  rating: number;
  color: string;
}

interface PodcastStore {
  programs: Program[];
  guests: Guest[];
  loaded: boolean;
  loadFromDB: () => Promise<void>;
  addProgram: (program: Omit<Program, 'id' | 'annotations' | 'audioUrl' | 'audioDuration' | 'guestIds'>) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  addAnnotation: (programId: string, annotation: Omit<Annotation, 'id'>) => void;
  updateAnnotation: (programId: string, annotationId: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (programId: string, annotationId: string) => void;
  addGuest: (guest: Omit<Guest, 'id'>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  linkGuestToProgram: (programId: string, guestId: string) => void;
  unlinkGuestFromProgram: (programId: string, guestId: string) => void;
}

const PROGRAMS_KEY = 'podcastflow_programs';
const GUESTS_KEY = 'podcastflow_guests';

const SOFT_COLORS = [
  '#f0abfc', '#c4b5fd', '#a5b4fc', '#93c5fd', '#67e8f9',
  '#6ee7b7', '#86efac', '#bef264', '#fde047', '#fdba74',
  '#fca5a5', '#f9a8d4', '#d8b4fe', '#99f6e4', '#bae6fd',
];

function getRandomColor() {
  return SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)];
}

function persistPrograms(programs: Program[]) {
  idbSet(PROGRAMS_KEY, programs).catch(() => {});
}

function persistGuests(guests: Guest[]) {
  idbSet(GUESTS_KEY, guests).catch(() => {});
}

export const usePodcastStore = create<PodcastStore>((set, get) => ({
  programs: [],
  guests: [],
  loaded: false,

  loadFromDB: async () => {
    try {
      const [programs, guests] = await Promise.all([
        idbGet<Program[]>(PROGRAMS_KEY),
        idbGet<Guest[]>(GUESTS_KEY),
      ]);
      set({
        programs: programs || [],
        guests: guests || [],
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  addProgram: (programData) => {
    const newProgram: Program = {
      ...programData,
      id: uuidv4(),
      annotations: [],
      audioUrl: null,
      audioDuration: 0,
      guestIds: [],
    };
    const programs = [...get().programs, newProgram];
    set({ programs });
    persistPrograms(programs);
  },

  updateProgram: (id, updates) => {
    const programs = get().programs.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    set({ programs });
    persistPrograms(programs);
  },

  deleteProgram: (id) => {
    const programs = get().programs.filter((p) => p.id !== id);
    set({ programs });
    persistPrograms(programs);
  },

  addAnnotation: (programId, annotationData) => {
    const newAnnotation: Annotation = {
      ...annotationData,
      id: uuidv4(),
    };
    const programs = get().programs.map((p) =>
      p.id === programId
        ? { ...p, annotations: [...p.annotations, newAnnotation] }
        : p
    );
    set({ programs });
    persistPrograms(programs);
  },

  updateAnnotation: (programId, annotationId, updates) => {
    const programs = get().programs.map((p) =>
      p.id === programId
        ? {
            ...p,
            annotations: p.annotations.map((a) =>
              a.id === annotationId ? { ...a, ...updates } : a
            ),
          }
        : p
    );
    set({ programs });
    persistPrograms(programs);
  },

  deleteAnnotation: (programId, annotationId) => {
    const programs = get().programs.map((p) =>
      p.id === programId
        ? { ...p, annotations: p.annotations.filter((a) => a.id !== annotationId) }
        : p
    );
    set({ programs });
    persistPrograms(programs);
  },

  addGuest: (guestData) => {
    const newGuest: Guest = {
      ...guestData,
      id: uuidv4(),
      color: guestData.color || getRandomColor(),
    };
    const guests = [...get().guests, newGuest];
    set({ guests });
    persistGuests(guests);
  },

  updateGuest: (id, updates) => {
    const guests = get().guests.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    );
    set({ guests });
    persistGuests(guests);
  },

  deleteGuest: (id) => {
    const guests = get().guests.filter((g) => g.id !== id);
    const programs = get().programs.map((p) => ({
      ...p,
      guestIds: p.guestIds.filter((gid) => gid !== id),
    }));
    set({ guests, programs });
    persistGuests(guests);
    persistPrograms(programs);
  },

  linkGuestToProgram: (programId, guestId) => {
    const programs = get().programs.map((p) =>
      p.id === programId && !p.guestIds.includes(guestId)
        ? { ...p, guestIds: [...p.guestIds, guestId] }
        : p
    );
    set({ programs });
    persistPrograms(programs);
  },

  unlinkGuestFromProgram: (programId, guestId) => {
    const programs = get().programs.map((p) =>
      p.id === programId
        ? { ...p, guestIds: p.guestIds.filter((gid) => gid !== guestId) }
        : p
    );
    set({ programs });
    persistPrograms(programs);
  },
}));
