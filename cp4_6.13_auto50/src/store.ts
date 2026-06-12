import { create } from 'zustand';
import {
  GameState,
  ActionType,
  createGameState,
  movePlayer,
  interact,
  getLevel
} from './gameEngine';
import {
  TimeRecorderState,
  createTimeRecorder,
  recordFrame,
  jumpToFrame,
  enterRewindMode,
  exitRewindMode,
  stepForward,
  stepBackward,
  togglePlayback,
  getCurrentState,
  getCurrentFrame
} from './timeRecorder';

export type GameAction =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'special' }
  | { type: 'toggleRewind' }
  | { type: 'jumpToFrame'; frameIndex: number }
  | { type: 'stepForward' }
  | { type: 'stepBackward' }
  | { type: 'togglePlayback' }
  | { type: 'nextLevel' }
  | { type: 'restartLevel' };

interface GameStore {
  gameState: GameState;
  recorder: TimeRecorderState;
  moveCount: number;
  dispatch: (action: GameAction) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createGameState(0),
  recorder: createTimeRecorder(createGameState(0)),
  moveCount: 0,

  dispatch: (action: GameAction) => {
    const state = get();

    switch (action.type) {
      case 'move': {
        if (state.recorder.isRewindMode) {
          return;
        }
        const { state: newGameState, action: actionType } = movePlayer(
          state.gameState,
          action.dx,
          action.dy
        );
        if (actionType === 'none') {
          return;
        }
        const newRecorder = recordFrame(state.recorder, newGameState, actionType);
        set({
          gameState: newGameState,
          recorder: newRecorder,
          moveCount: state.moveCount + (actionType !== 'none' ? 1 : 0)
        });
        break;
      }

      case 'special': {
        if (state.recorder.isRewindMode) {
          return;
        }
        const { state: newGameState, action: actionType } = interact(state.gameState);
        if (actionType !== 'none') {
          const newRecorder = recordFrame(state.recorder, newGameState, actionType);
          set({
            gameState: newGameState,
            recorder: newRecorder
          });
        }
        break;
      }

      case 'toggleRewind': {
        const { recorder } = state;
        if (recorder.isRewindMode) {
          const newRecorder = exitRewindMode(recorder);
          const currentState = getCurrentState(newRecorder);
          set({
            recorder: newRecorder,
            gameState: currentState
          });
        } else {
          const newRecorder = enterRewindMode(recorder);
          set({ recorder: newRecorder });
        }
        break;
      }

      case 'jumpToFrame': {
        if (!state.recorder.isRewindMode) {
          return;
        }
        const newRecorder = jumpToFrame(state.recorder, action.frameIndex);
        const currentState = getCurrentState(newRecorder);
        set({
          recorder: newRecorder,
          gameState: currentState
        });
        break;
      }

      case 'stepForward': {
        if (!state.recorder.isRewindMode) {
          return;
        }
        const newRecorder = stepForward(state.recorder);
        const currentState = getCurrentState(newRecorder);
        set({
          recorder: newRecorder,
          gameState: currentState
        });
        break;
      }

      case 'stepBackward': {
        if (!state.recorder.isRewindMode) {
          return;
        }
        const newRecorder = stepBackward(state.recorder);
        const currentState = getCurrentState(newRecorder);
        set({
          recorder: newRecorder,
          gameState: currentState
        });
        break;
      }

      case 'togglePlayback': {
        if (!state.recorder.isRewindMode) {
          return;
        }
        const newRecorder = togglePlayback(state.recorder);
        set({ recorder: newRecorder });
        break;
      }

      case 'nextLevel': {
        const nextLevel = state.gameState.levelIndex + 1;
        const newGameState = createGameState(nextLevel);
        const newRecorder = createTimeRecorder(newGameState);
        set({
          gameState: newGameState,
          recorder: newRecorder,
          moveCount: 0
        });
        break;
      }

      case 'restartLevel': {
        const newGameState = createGameState(state.gameState.levelIndex);
        const newRecorder = createTimeRecorder(newGameState);
        set({
          gameState: newGameState,
          recorder: newRecorder,
          moveCount: 0
        });
        break;
      }
    }
  }
}));

export function useGameState(): GameState {
  return useGameStore(state => state.gameState);
}

export function useRecorder(): TimeRecorderState {
  return useGameStore(state => state.recorder);
}

export function useMoveCount(): number {
  return useGameStore(state => state.moveCount);
}

export function useDispatch(): (action: GameAction) => void {
  return useGameStore(state => state.dispatch);
}

export function useCurrentFrame() {
  const recorder = useRecorder();
  return getCurrentFrame(recorder);
}

export function useLevelName(): string {
  const gameState = useGameState();
  return getLevel(gameState).name;
}
