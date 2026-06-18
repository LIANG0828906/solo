import { create } from 'zustand';
import type { Member, Piece, Rehearsal, ConflictRecord, MemberRecommendation } from './types';
import { seedMembers, seedPieces, seedRehearsals } from './data/seed';
import { eventBus } from './eventBus';
import { detectConflicts } from './schedule/utils';
import { generateRecommendations } from './repertoire/engine';

interface AppState {
  members: Member[];
  pieces: Piece[];
  rehearsals: Rehearsal[];
  recommendations: Map<string, MemberRecommendation[]>;
  selectedRehearsalId: string | null;

  addRehearsal: (r: Omit<Rehearsal, 'id' | 'conflicts'>) => Rehearsal;
  updateRehearsal: (id: string, data: Partial<Rehearsal>) => void;
  deleteRehearsal: (id: string) => void;
  addParticipant: (rehearsalId: string, memberId: string) => void;
  removeParticipant: (rehearsalId: string, memberId: string) => void;
  setSelectedRehearsal: (id: string | null) => void;

  addPiece: (p: Omit<Piece, 'id' | 'practiceProgress'> & { targetMinutesPerPart: number }) => Piece;
  updatePiece: (id: string, data: Partial<Piece>) => void;
  deletePiece: (id: string) => void;
  updateProgress: (pieceId: string, part: string, minutes: number) => void;

  addMember: (m: Omit<Member, 'id'>) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;

  refreshRecommendations: (rehearsalId: string) => void;
  recomputeConflicts: () => void;
}

const generateId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useStore = create<AppState>((set, get) => ({
  members: [...seedMembers],
  pieces: [...seedPieces],
  rehearsals: (() => {
    const list = [...seedRehearsals];
    for (let i = 0; i < list.length; i++) {
      list[i].conflicts = detectConflicts(list[i], list);
    }
    return list;
  })(),
  recommendations: new Map(),
  selectedRehearsalId: null,

  addRehearsal: (data) => {
    const newR: Rehearsal = {
      ...data,
      id: generateId('r'),
      conflicts: [],
    };
    set((s) => {
      const list = [...s.rehearsals, newR];
      for (let i = 0; i < list.length; i++) {
        list[i].conflicts = detectConflicts(list[i], list);
      }
      eventBus.emit('conflict:detected', list.flatMap((r) => r.conflicts));
      return { rehearsals: list };
    });
    eventBus.emit('rehearsal:created', newR);
    setTimeout(() => get().refreshRecommendations(newR.id), 0);
    return newR;
  },

  updateRehearsal: (id, data) => {
    set((s) => {
      const list = s.rehearsals.map((r) => (r.id === id ? { ...r, ...data } : r));
      for (let i = 0; i < list.length; i++) {
        list[i].conflicts = detectConflicts(list[i], list);
      }
      eventBus.emit('conflict:detected', list.flatMap((r) => r.conflicts));
      const updated = list.find((r) => r.id === id);
      if (updated) eventBus.emit('rehearsal:updated', updated);
      return { rehearsals: list };
    });
    setTimeout(() => get().refreshRecommendations(id), 0);
  },

  deleteRehearsal: (id) => {
    set((s) => {
      const list = s.rehearsals.filter((r) => r.id !== id);
      for (let i = 0; i < list.length; i++) {
        list[i].conflicts = detectConflicts(list[i], list);
      }
      return { rehearsals: list };
    });
    eventBus.emit('rehearsal:deleted', id);
  },

  addParticipant: (rehearsalId, memberId) => {
    const { rehearsals } = get();
    const target = rehearsals.find((r) => r.id === rehearsalId);
    if (!target || target.participantIds.includes(memberId)) return;
    get().updateRehearsal(rehearsalId, {
      participantIds: [...target.participantIds, memberId],
    });
    eventBus.emit('participant:added', { rehearsalId, memberId });
  },

  removeParticipant: (rehearsalId, memberId) => {
    const { rehearsals } = get();
    const target = rehearsals.find((r) => r.id === rehearsalId);
    if (!target) return;
    get().updateRehearsal(rehearsalId, {
      participantIds: target.participantIds.filter((id) => id !== memberId),
    });
    eventBus.emit('participant:removed', { rehearsalId, memberId });
  },

  setSelectedRehearsal: (id) => {
    set({ selectedRehearsalId: id });
    if (id) setTimeout(() => get().refreshRecommendations(id), 0);
  },

  addPiece: (data) => {
    const progress: Piece['practiceProgress'] = {};
    data.requiredParts.forEach((p) => {
      progress[p] = { practicedMinutes: 0, targetMinutes: data.targetMinutesPerPart };
    });
    const newP: Piece = {
      ...data,
      id: generateId('p'),
      practiceProgress: progress,
    };
    set((s) => ({ pieces: [...s.pieces, newP] }));
    eventBus.emit('piece:created', newP);
    return newP;
  },

  updatePiece: (id, data) => {
    set((s) => ({
      pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
    const updated = get().pieces.find((p) => p.id === id);
    if (updated) eventBus.emit('piece:updated', updated);
  },

  deletePiece: (id) => {
    set((s) => ({ pieces: s.pieces.filter((p) => p.id !== id) }));
  },

  updateProgress: (pieceId, part, minutes) => {
    set((s) => ({
      pieces: s.pieces.map((p) => {
        if (p.id !== pieceId) return p;
        const record = p.practiceProgress[part];
        if (!record) return p;
        return {
          ...p,
          practiceProgress: {
            ...p.practiceProgress,
            [part]: {
              ...record,
              practicedMinutes: Math.max(
                0,
                Math.min(record.targetMinutes, record.practicedMinutes + minutes),
              ),
            },
          },
        };
      }),
    }));
    eventBus.emit('progress:updated', { pieceId, part, minutes });
  },

  addMember: (data) => {
    const newM: Member = { ...data, id: generateId('m') };
    set((s) => ({ members: [...s.members, newM] }));
    eventBus.emit('member:created', newM);
    return newM;
  },

  updateMember: (id, data) => {
    set((s) => ({
      members: s.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
    const updated = get().members.find((m) => m.id === id);
    if (updated) eventBus.emit('member:updated', updated);
  },

  refreshRecommendations: (rehearsalId) => {
    const state = get();
    const rehearsal = state.rehearsals.find((r) => r.id === rehearsalId);
    if (!rehearsal) return;
    const recs = generateRecommendations(
      rehearsal,
      state.members,
      state.pieces.filter((p) => rehearsal.pieceIds.includes(p.id)),
    );
    set((s) => {
      const next = new Map(s.recommendations);
      next.set(rehearsalId, recs);
      return { recommendations: next };
    });
  },

  recomputeConflicts: () => {
    set((s) => {
      const list = [...s.rehearsals];
      for (let i = 0; i < list.length; i++) {
        list[i].conflicts = detectConflicts(list[i], list);
      }
      eventBus.emit('conflict:detected', list.flatMap((r) => r.conflicts));
      return { rehearsals: list };
    });
  },
}));

export const useRehearsalConflicts = (rehearsalId: string): ConflictRecord[] =>
  useStore((s) => s.rehearsals.find((r) => r.id === rehearsalId)?.conflicts ?? []);

export const useRecommendations = (rehearsalId: string): MemberRecommendation[] =>
  useStore((s) => s.recommendations.get(rehearsalId) ?? []);
