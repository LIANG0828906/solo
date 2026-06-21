import { create } from 'zustand';

export interface Player {
  id: string;
  nickname: string;
  color: string;
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
}

export interface SongNote {
  time: number;
  track: number;
  index: number;
}

export interface SongData {
  name: string;
  bpm: number;
  duration: number;
  notes: SongNote[];
}

export interface GameResult {
  playerId: string;
  nickname: string;
  score: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  wins: number;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  wins: number;
  totalGames: number;
  winRate: number;
}

export interface ComboPopup {
  id: number;
  combo: number;
  timestamp: number;
}

interface GameState {
  playerId: string;
  nickname: string;
  roomId: string | null;
  players: Player[];
  gameState: 'lobby' | 'waiting' | 'countdown' | 'playing' | 'finished';
  countdown: number;
  songData: SongData | null;
  startTime: number;
  myPlayer: Player | null;
  results: GameResult[];
  leaderboard: LeaderboardEntry[];
  comboPopups: ComboPopup[];
  lastHitType: 'perfect' | 'good' | 'miss' | null;
  showMissFlash: boolean;

  setPlayerId: (id: string) => void;
  setNickname: (name: string) => void;
  setRoomId: (id: string | null) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setGameState: (state: 'lobby' | 'waiting' | 'countdown' | 'playing' | 'finished') => void;
  setCountdown: (count: number) => void;
  setSongData: (data: SongData, startTime: number) => void;
  updateScore: (playerId: string, scoreData: Partial<Player> & { hitType?: 'perfect' | 'good' | 'miss' }) => void;
  setResults: (results: GameResult[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  addComboPopup: (combo: number) => void;
  removeComboPopup: (id: number) => void;
  setLastHitType: (type: 'perfect' | 'good' | 'miss' | null) => void;
  triggerMissFlash: () => void;
  resetGame: () => void;
}

const initialPlayer: Player = {
  id: '',
  nickname: '',
  color: '#3b82f6',
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  good: 0,
  miss: 0,
};

let popupIdCounter = 0;

export const useGameStore = create<GameState>((set, get) => ({
  playerId: '',
  nickname: '',
  roomId: null,
  players: [],
  gameState: 'lobby',
  countdown: 0,
  songData: null,
  startTime: 0,
  myPlayer: null,
  results: [],
  leaderboard: [],
  comboPopups: [],
  lastHitType: null,
  showMissFlash: false,

  setPlayerId: (id) => set({ playerId: id }),
  setNickname: (name) => set({ nickname: name }),
  setRoomId: (id) => set({ roomId: id }),

  setPlayers: (players) => {
    const state = get();
    const myPlayer = players.find(p => p.id === state.playerId) || null;
    set({ players, myPlayer });
  },

  addPlayer: (player) => {
    const state = get();
    const players = [...state.players.filter(p => p.id !== player.id), player];
    const myPlayer = player.id === state.playerId ? player : state.myPlayer;
    set({ players, myPlayer });
  },

  removePlayer: (playerId) => {
    const state = get();
    set({
      players: state.players.filter(p => p.id !== playerId),
    });
  },

  setGameState: (gameState) => set({ gameState }),
  setCountdown: (countdown) => set({ countdown }),

  setSongData: (songData, startTime) => set({ songData, startTime }),

  updateScore: (playerId, scoreData) => {
    const state = get();
    const players = state.players.map(p =>
      p.id === playerId ? { ...p, ...scoreData } as Player : p
    );
    const myPlayer = state.myPlayer?.id === playerId
      ? { ...state.myPlayer, ...scoreData } as Player
      : state.myPlayer;

    const updates: Partial<GameState> = { players, myPlayer };

    if (scoreData.hitType && playerId === state.playerId) {
      updates.lastHitType = scoreData.hitType;
      if (scoreData.hitType === 'miss') {
        updates.showMissFlash = true;
        setTimeout(() => set({ showMissFlash: false }), 300);
      }
      const newCombo = scoreData.combo ?? 0;
      if (newCombo > 0 && newCombo % 10 === 0 && scoreData.hitType !== 'miss') {
        state.addComboPopup(newCombo);
      }
    }

    set(updates);
  },

  setResults: (results) => set({ results }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  addComboPopup: (combo) => {
    const id = ++popupIdCounter;
    set((state) => ({
      comboPopups: [...state.comboPopups, { id, combo, timestamp: Date.now() }],
    }));
    setTimeout(() => {
      get().removeComboPopup(id);
    }, 1200);
  },

  removeComboPopup: (id) => {
    set((state) => ({
      comboPopups: state.comboPopups.filter(p => p.id !== id),
    }));
  },

  setLastHitType: (type) => set({ lastHitType: type }),

  triggerMissFlash: () => {
    set({ showMissFlash: true });
    setTimeout(() => set({ showMissFlash: false }), 300);
  },

  resetGame: () => set({
    gameState: 'lobby',
    roomId: null,
    players: [],
    myPlayer: null,
    countdown: 0,
    songData: null,
    startTime: 0,
    results: [],
    comboPopups: [],
    lastHitType: null,
  }),
}));
