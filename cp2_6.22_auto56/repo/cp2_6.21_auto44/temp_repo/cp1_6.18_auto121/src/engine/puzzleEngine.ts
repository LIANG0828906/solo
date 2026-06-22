import { v4 as uuidv4 } from 'uuid';
import {
  Decade,
  getDecadeData,
  getClueList,
  getAllDecades,
} from '../data/cityData';

export interface Fragment {
  id: string;
  decade: Decade;
  label: string;
  description: string;
  gridPosition: number;
}

export type PuzzlePhase = 'unlock' | 'assembling' | 'completed';

export interface PuzzleState {
  fragments: Fragment[];
  placedFragments: Record<number, Fragment>;
  unplacedFragments: Fragment[];
  currentDecade: Decade;
  progress: number;
  phase: PuzzlePhase;
  hintText: string;
  currentAudioPath: string | null;
}

const GRID_SIZE = 9;

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function initializePuzzle(): PuzzleState {
  const decades = getAllDecades();
  const fragments: Fragment[] = [];
  let positionIndex = 0;

  decades.forEach((decade) => {
    const decadeData = getDecadeData(decade);
    decadeData.fragments.forEach((frag) => {
      fragments.push({
        id: uuidv4(),
        decade,
        label: frag.label,
        description: frag.description,
        gridPosition: positionIndex,
      });
      positionIndex++;
    });
  });

  const shuffled = shuffleArray(fragments);

  return {
    fragments,
    placedFragments: {},
    unplacedFragments: shuffled,
    currentDecade: '1980s',
    progress: 0,
    phase: 'assembling',
    hintText: '将右侧碎片拖拽至左侧对应年代的网格中',
    currentAudioPath: null,
  };
}

export function placeFragment(
  state: PuzzleState,
  fragmentId: string,
  gridPosition: number
): { state: PuzzleState; isCorrect: boolean; audioPath: string | null } {
  const fragment = state.unplacedFragments.find((f) => f.id === fragmentId);
  if (!fragment) {
    return { state, isCorrect: false, audioPath: null };
  }

  if (state.placedFragments[gridPosition]) {
    return { state, isCorrect: false, audioPath: null };
  }

  const isCorrect = fragment.gridPosition === gridPosition;

  if (!isCorrect) {
    return {
      state: {
        ...state,
        hintText: '位置不对，再试试看！',
      },
      isCorrect: false,
      audioPath: null,
    };
  }

  const newPlaced = { ...state.placedFragments, [gridPosition]: fragment };
  const newUnplaced = state.unplacedFragments.filter(
    (f) => f.id !== fragmentId
  );
  const progress = Math.round(
    (Object.keys(newPlaced).length / GRID_SIZE) * 100
  );
  const decadeData = getDecadeData(fragment.decade);
  const isCompleted = Object.keys(newPlaced).length === GRID_SIZE;

  return {
    state: {
      ...state,
      placedFragments: newPlaced,
      unplacedFragments: newUnplaced,
      progress,
      currentDecade: fragment.decade,
      phase: isCompleted ? 'completed' : state.phase,
      hintText: isCompleted
        ? '恭喜！拼图完成，时光之门已打开！'
        : `太棒了！${fragment.label} 归位！`,
      currentAudioPath: decadeData.audioPath,
    },
    isCorrect: true,
    audioPath: decadeData.audioPath,
  };
}

export function checkCompletion(state: PuzzleState): boolean {
  return Object.keys(state.placedFragments).length === GRID_SIZE;
}

export function getCurrentHints(state: PuzzleState): string[] {
  return getClueList(state.currentDecade);
}

export function resetPuzzle(): PuzzleState {
  return initializePuzzle();
}
