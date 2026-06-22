import { create } from 'zustand';
import { GameState, GameInput, TurretType, LeaderboardEntry } from './types';
import { createInitialState, updateGame, placeTurret, startGame } from './gameEngine';
import { io, Socket } from 'socket.io-client';

interface GameStore extends GameState {
  socket: Socket | null;
  initSocket: () => void;
  setCanvasSize: (width: number, height: number) => void;
  handleKeyDown: (key: string) => void;
  handleKeyUp: (key: string) => void;
  handleMouseMove: (x: number, y: number) => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  setSelectedTurret: (type: TurretType | null) => void;
  deployTurret: (type: TurretType) => void;
  update: (deltaTime: number, currentTime: number) => void;
  startNewGame: () => void;
  submitScore: (playerName: string) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  ...createInitialState(800, 600),

  initSocket: () => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('leaderboard', (data: LeaderboardEntry[]) => {
      set({ leaderboard: data });
    });

    socket.on('scoreSubmitted', (data: { success: boolean; leaderboard: LeaderboardEntry[] }) => {
      if (data.success) {
        set({ leaderboard: data.leaderboard });
      }
    });

    set({ socket });
  },

  setCanvasSize: (width: number, height: number) => {
    set((state) => {
      if (state.status === 'menu') {
        return { ...createInitialState(width, height), socket: state.socket, leaderboard: state.leaderboard };
      }
      return { canvasWidth: width, canvasHeight: height };
    });
  },

  handleKeyDown: (key: string) => {
    set((state) => {
      const newKeys = { ...state.keys, [key]: true };

      if (key === '1') {
        const newState = placeTurret(state, 'laser', state.ship.x, state.ship.y);
        return { ...newState, keys: newKeys };
      }
      if (key === '2') {
        const newState = placeTurret(state, 'missile', state.ship.x, state.ship.y);
        return { ...newState, keys: newKeys };
      }
      if (key === '3') {
        const newState = placeTurret(state, 'em', state.ship.x, state.ship.y);
        return { ...newState, keys: newKeys };
      }
      if (key === '4') {
        const newState = placeTurret(state, 'gatling', state.ship.x, state.ship.y);
        return { ...newState, keys: newKeys };
      }

      return { ...state, keys: newKeys };
    });
  },

  handleKeyUp: (key: string) => {
    set((state) => {
      const newKeys = { ...state.keys, [key]: false };
      return { ...state, keys: newKeys };
    });
  },

  handleMouseMove: (x: number, y: number) => {
    set({ mouseX: x, mouseY: y });
  },

  handleMouseDown: () => {
    set({ mouseDown: true });
  },

  handleMouseUp: () => {
    set({ mouseDown: false });
  },

  setSelectedTurret: (type: TurretType | null) => {
    set({ selectedTurret: type });
  },

  deployTurret: (type: TurretType) => {
    set((state) => {
      return placeTurret(state, type, state.ship.x, state.ship.y);
    });
  },

  update: (deltaTime: number, currentTime: number) => {
    set((state) => {
      if (state.status !== 'playing') return state;

      const input: GameInput = {
        keys: state.keys,
        mouseX: state.mouseX,
        mouseY: state.mouseY,
        mouseDown: state.mouseDown,
      };

      return updateGame(state, input, deltaTime, currentTime);
    });
  },

  startNewGame: () => {
    set((state) => {
      const newState = startGame(state);
      return newState;
    });
  },

  submitScore: (playerName: string) => {
    const state = get();
    if (state.socket && state.score > 0) {
      state.socket.emit('submitScore', {
        name: playerName,
        score: state.score,
      });
    }
  },

  setLeaderboard: (leaderboard: LeaderboardEntry[]) => {
    set({ leaderboard });
  },
}));
