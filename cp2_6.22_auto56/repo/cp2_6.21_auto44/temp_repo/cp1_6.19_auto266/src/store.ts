import { create } from 'zustand';
import { Member, Match, Season, MatchResult } from './types';

interface SeasonRanking {
  memberId: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  winRate: number;
}

interface SeasonRankingResponse {
  season: Season;
  ranking: SeasonRanking[];
  mostActive?: SeasonRanking;
}

interface ChessStore {
  members: Member[];
  matches: Match[];
  seasons: Season[];
  currentRanking: SeasonRankingResponse | null;
  loading: boolean;

  fetchMembers: () => Promise<void>;
  addMember: (member: { id: string; name: string; elo: number }) => Promise<boolean>;
  updateMember: (id: string, data: { name?: string; elo?: number }) => Promise<boolean>;
  deleteMember: (id: string) => Promise<boolean>;

  fetchMatches: () => Promise<void>;
  addMatch: (data: {
    player1Id: string;
    player2Id: string;
    result: MatchResult;
    date: string;
  }) => Promise<boolean>;

  fetchSeasons: () => Promise<void>;
  createSeason: (data: {
    name: string;
    startDate: string;
    endDate: string;
  }) => Promise<boolean>;
  fetchSeasonRanking: (seasonId: string) => Promise<void>;
}

const API_BASE = '/api';

export const useChessStore = create<ChessStore>((set) => ({
  members: [],
  matches: [],
  seasons: [],
  currentRanking: null,
  loading: false,

  fetchMembers: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/members`);
      const data = await res.json();
      set({ members: data });
    } finally {
      set({ loading: false });
    }
  },

  addMember: async (member) => {
    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!res.ok) return false;
      const data = await res.json();
      set((state) => ({
        members: [...state.members, data].sort((a, b) => b.elo - a.elo),
      }));
      return true;
    } catch {
      return false;
    }
  },

  updateMember: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      const updated = await res.json();
      set((state) => ({
        members: state.members
          .map((m) => (m.id === id ? updated : m))
          .sort((a, b) => b.elo - a.elo),
      }));
      return true;
    } catch {
      return false;
    }
  },

  deleteMember: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
      }));
      return true;
    } catch {
      return false;
    }
  },

  fetchMatches: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/matches`);
      const data = await res.json();
      set({ matches: data });
    } finally {
      set({ loading: false });
    }
  },

  addMatch: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      const result = await res.json();
      set((state) => {
        const updatedMembers = state.members
          .map((m) => {
            if (m.id === result.player1.id) return result.player1;
            if (m.id === result.player2.id) return result.player2;
            return m;
          })
          .sort((a, b) => b.elo - a.elo);
        const sortedMatches = [result.match, ...state.matches].sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return { members: updatedMembers, matches: sortedMatches };
      });
      return true;
    } catch {
      return false;
    }
  },

  fetchSeasons: async () => {
    try {
      const res = await fetch(`${API_BASE}/seasons`);
      const data = await res.json();
      set({ seasons: data });
    } catch {}
  },

  createSeason: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      const result = await res.json();
      set((state) => ({
        seasons: [result.season, ...state.seasons].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },

  fetchSeasonRanking: async (seasonId) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/seasons/${seasonId}/ranking`);
      const data = await res.json();
      set({ currentRanking: data });
    } finally {
      set({ loading: false });
    }
  },
}));
