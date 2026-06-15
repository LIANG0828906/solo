import { create } from 'zustand';
import { StoneColor, Position, GameState, AnimatedStone } from '../types';

interface GameStore extends GameState {
  animatedStones: AnimatedStone[];
  lastMovePosition: Position | null;
  addAnimatedStone: (stone: AnimatedStone) => void;
  removeAnimatedStone: (position: Position) => void;
  clearAnimatedStones: () => void;
  setLastMovePosition: (pos: Position | null) => void;
  updateFromState: (state: GameState) => void;
  playSound: () => void;
}

let audioContext: AudioContext | null = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playStoneSound() {
  initAudio();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.08);

  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

const BOARD_SIZE = 15;

function createEmptyBoard(): StoneColor[][] {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(StoneColor.Empty));
}

const initialState: GameState = {
  board: createEmptyBoard(),
  currentTurn: StoneColor.Black,
  gameOver: false,
  winner: null,
  gameRecord: {
    moves: [],
    startTime: Date.now(),
    totalMoves: 0
  },
  currentMoveIndex: -1,
  isPlaying: true,
  isReplaying: false
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  animatedStones: [],
  lastMovePosition: null,

  addAnimatedStone: (stone) => set((state) => ({
    animatedStones: [...state.animatedStones, stone]
  })),

  removeAnimatedStone: (position) => set((state) => ({
    animatedStones: state.animatedStones.filter(
      s => !(s.position.x === position.x && s.position.y === position.y)
    )
  })),

  clearAnimatedStones: () => set({ animatedStones: [] }),

  setLastMovePosition: (pos) => set({ lastMovePosition: pos }),

  updateFromState: (newState) => set((state) => {
    const oldMoves = state.gameRecord.moves;
    const newMoves = newState.gameRecord.moves;

    if (newMoves.length > oldMoves.length && !newState.isReplaying) {
      const lastMove = newMoves[newMoves.length - 1];
      const animatedStone: AnimatedStone = {
        position: lastMove.position,
        color: lastMove.color,
        startTime: performance.now(),
        duration: 300
      };
      return {
        ...newState,
        animatedStones: [...state.animatedStones, animatedStone],
        lastMovePosition: lastMove.position
      };
    }

    return {
      ...newState,
      lastMovePosition: newState.currentMoveIndex >= 0
        ? newMoves[newState.currentMoveIndex]?.position ?? null
        : null
    };
  }),

  playSound: () => {
    playStoneSound();
  }
}));
