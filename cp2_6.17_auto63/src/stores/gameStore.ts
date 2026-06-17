import { create } from 'zustand';
import { GameEngine } from '../engine/GameEngine';
import {
  Direction,
  GameState,
  GameActions,
} from '../types';

const MAZE_SIZE = 15;

interface GameStore extends GameState, GameActions {}

const engine = new GameEngine(MAZE_SIZE);

const getInitialState = (): GameState => {
  const init = engine.initializeGame(false);
  return {
    maze: init.maze,
    players: init.players,
    ghosts: init.ghosts,
    shockwaves: init.shockwaves,
    powerUpEffects: init.powerUpEffects,
    status: 'menu',
    twoPlayerMode: false,
    powerUpRespawnTimer: init.powerUpRespawnTimer,
    mazeSize: MAZE_SIZE,
    totalDots: init.totalDots,
    remainingDots: init.remainingDots,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  setDirection: (playerId: string, direction: Direction) => {
    const { players, status } = get();
    if (status !== 'playing') return;

    const newPlayers = engine.setPlayerDirection(players, playerId, direction);
    set({ players: newPlayers });
  },

  startGame: (twoPlayer: boolean = false) => {
    const init = engine.initializeGame(twoPlayer);
    set({
      maze: init.maze,
      players: init.players,
      ghosts: init.ghosts,
      shockwaves: init.shockwaves,
      powerUpEffects: init.powerUpEffects,
      status: 'playing',
      twoPlayerMode: twoPlayer,
      powerUpRespawnTimer: init.powerUpRespawnTimer,
      totalDots: init.totalDots,
      remainingDots: init.remainingDots,
    });
  },

  pauseGame: () => {
    const { status } = get();
    if (status === 'playing') {
      set({ status: 'paused' });
    }
  },

  resumeGame: () => {
    const { status } = get();
    if (status === 'paused') {
      set({ status: 'playing' });
    }
  },

  restartGame: () => {
    const { twoPlayerMode } = get();
    const init = engine.initializeGame(twoPlayerMode);
    set({
      maze: init.maze,
      players: init.players,
      ghosts: init.ghosts,
      shockwaves: init.shockwaves,
      powerUpEffects: init.powerUpEffects,
      status: 'playing',
      powerUpRespawnTimer: init.powerUpRespawnTimer,
      totalDots: init.totalDots,
      remainingDots: init.remainingDots,
    });
  },

  toggleTwoPlayer: () => {
    const { twoPlayerMode } = get();
    set({ twoPlayerMode: !twoPlayerMode });
  },

  update: (deltaTime: number) => {
    const {
      maze,
      players,
      ghosts,
      shockwaves,
      powerUpEffects,
      status,
      powerUpRespawnTimer,
    } = get();

    if (status !== 'playing') return;

    const result = engine.update(
      maze,
      players,
      ghosts,
      shockwaves,
      powerUpEffects,
      deltaTime,
      status,
      powerUpRespawnTimer
    );

    set({
      maze: result.maze,
      players: result.players,
      ghosts: result.ghosts,
      shockwaves: result.shockwaves,
      powerUpEffects: result.powerUpEffects,
      status: result.status,
      remainingDots: result.remainingDots,
      powerUpRespawnTimer: result.powerUpRespawnTimer,
    });
  },
}));
