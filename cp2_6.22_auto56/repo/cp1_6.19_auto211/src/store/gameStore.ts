import { create } from 'zustand';
import {
  generateMaze,
  placeNotes,
  getSurroundingWalls,
} from '@/utils/mazeGenerator';
import {
  playNoteByColor,
  playErrorSound,
  playMelody,
} from '@/utils/audioPlayer';
import {
  CORRECT_ORDER,
  WAVE_DURATION,
  NOTE_DURATION,
} from '@/constants';
import { GameState, NoteColor, Position } from '@/types';

const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

export const useGameStore = create<GameState>((set, get) => ({
  grid: [],
  player: { x: 1, y: 1 },
  notes: [],
  collectedNotes: [],
  wallWaves: new Map(),
  isComplete: false,
  isPlaying: false,
  correctOrder: CORRECT_ORDER,

  initializeGame: () => {
    const grid = generateMaze();
    const notes = placeNotes(grid);
    set({
      grid,
      notes,
      player: { x: 1, y: 1 },
      collectedNotes: [],
      wallWaves: new Map(),
      isComplete: false,
      isPlaying: false,
    });
  },

  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => {
    const { grid, player, notes, isComplete, isPlaying } = get();
    if (isComplete || isPlaying) return;

    const deltas = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
    };

    const { dx, dy } = deltas[direction];
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (
      newX >= 0 && newX < grid[0]?.length &&
      newY >= 0 && newY < grid.length &&
      grid[newY][newX] === 'path'
    ) {
      set({ player: { x: newX, y: newY } });

      const noteAtPosition = notes.find(
        (n) => !n.collected && n.position.x === newX && n.position.y === newY
      );

      if (noteAtPosition) {
        get().collectNote(noteAtPosition.id);
      }
    }
  },

  collectNote: (noteId: string) => {
    const { notes, collectedNotes, correctOrder, grid } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.collected) return;

    const expectedColor = correctOrder[collectedNotes.length];
    if (note.color !== expectedColor) {
      playErrorSound();
      set({
        notes: notes.map((n) =>
          n.collected && n.id !== noteId ? { ...n, collected: false } : n
        ),
        collectedNotes: [],
      });
      return;
    }

    playNoteByColor(note.color);

    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, collected: true } : n
    );
    const newCollectedNotes = [...collectedNotes, note];

    const surroundingWalls = getSurroundingWalls(grid, note.position);
    get().triggerWallWave(surroundingWalls, note.frequency, note.color);

    set({
      notes: updatedNotes,
      collectedNotes: newCollectedNotes,
    });

    get().checkCompletion();
  },

  triggerWallWave: (positions: Position[], frequency: number, color: NoteColor) => {
    const { wallWaves } = get();
    const newWaves = new Map(wallWaves);
    const now = Date.now();

    positions.forEach((pos) => {
      newWaves.set(positionKey(pos), {
        position: pos,
        frequency,
        color,
        startTime: now,
      });
    });

    set({ wallWaves: newWaves });
  },

  cleanUpWallWaves: () => {
    const { wallWaves } = get();
    const now = Date.now();
    const newWaves = new Map(wallWaves);
    let changed = false;

    newWaves.forEach((wave, key) => {
      if (now - wave.startTime > WAVE_DURATION) {
        newWaves.delete(key);
        changed = true;
      }
    });

    if (changed) {
      set({ wallWaves: newWaves });
    }
  },

  checkCompletion: () => {
    const { collectedNotes, correctOrder } = get();
    if (collectedNotes.length === correctOrder.length) {
      get().playMelody();
    }
  },

  playMelody: () => {
    const { collectedNotes } = get();
    set({ isPlaying: true });

    playMelody(collectedNotes);

    const totalDuration = collectedNotes.length * NOTE_DURATION;
    setTimeout(() => {
      set({ isComplete: true, isPlaying: false });
    }, totalDuration + 500);
  },

  resetGame: () => {
    get().initializeGame();
  },
}));
