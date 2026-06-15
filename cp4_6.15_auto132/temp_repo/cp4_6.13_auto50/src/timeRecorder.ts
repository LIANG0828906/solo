import { GameState, ActionType } from './gameEngine';

export interface HistoryFrame {
  frameIndex: number;
  action: ActionType;
  state: GameState;
  timestamp: number;
}

export interface TimeRecorderState {
  history: HistoryFrame[];
  currentIndex: number;
  isRewindMode: boolean;
  isPlaying: boolean;
  rewindCount: number;
  startTime: number;
}

const MAX_HISTORY_FRAMES = 1200;

export function createTimeRecorder(initialState: GameState): TimeRecorderState {
  const initialFrame: HistoryFrame = {
    frameIndex: 0,
    action: 'none',
    state: initialState,
    timestamp: Date.now()
  };

  return {
    history: [initialFrame],
    currentIndex: 0,
    isRewindMode: false,
    isPlaying: false,
    rewindCount: 0,
    startTime: Date.now()
  };
}

export function recordFrame(
  recorder: TimeRecorderState,
  state: GameState,
  action: ActionType
): TimeRecorderState {
  if (recorder.isRewindMode) {
    return recorder;
  }

  const newFrame: HistoryFrame = {
    frameIndex: recorder.history.length,
    action,
    state,
    timestamp: Date.now()
  };

  let newHistory: HistoryFrame[];
  
  if (recorder.currentIndex < recorder.history.length - 1) {
    newHistory = [...recorder.history.slice(0, recorder.currentIndex + 1), newFrame];
  } else {
    newHistory = [...recorder.history, newFrame];
  }

  if (newHistory.length > MAX_HISTORY_FRAMES) {
    const excess = newHistory.length - MAX_HISTORY_FRAMES;
    newHistory = newHistory.slice(excess);
    newHistory = newHistory.map((f, i) => ({ ...f, frameIndex: i }));
  }

  return {
    ...recorder,
    history: newHistory,
    currentIndex: newHistory.length - 1
  };
}

export function jumpToFrame(
  recorder: TimeRecorderState,
  frameIndex: number
): TimeRecorderState {
  const clampedIndex = Math.max(0, Math.min(frameIndex, recorder.history.length - 1));
  
  if (clampedIndex === recorder.currentIndex) {
    return recorder;
  }

  return {
    ...recorder,
    currentIndex: clampedIndex
  };
}

export function enterRewindMode(recorder: TimeRecorderState): TimeRecorderState {
  if (recorder.isRewindMode) {
    return recorder;
  }

  return {
    ...recorder,
    isRewindMode: true,
    isPlaying: false,
    rewindCount: recorder.rewindCount + 1
  };
}

export function exitRewindMode(recorder: TimeRecorderState): TimeRecorderState {
  if (!recorder.isRewindMode) {
    return recorder;
  }

  const currentFrame = recorder.history[recorder.currentIndex];
  
  const newHistory = recorder.history.slice(0, recorder.currentIndex + 1);
  
  return {
    ...recorder,
    history: newHistory,
    currentIndex: newHistory.length - 1,
    isRewindMode: false,
    isPlaying: false
  };
}

export function stepForward(recorder: TimeRecorderState): TimeRecorderState {
  if (recorder.currentIndex >= recorder.history.length - 1) {
    return { ...recorder, isPlaying: false };
  }
  return {
    ...recorder,
    currentIndex: recorder.currentIndex + 1
  };
}

export function stepBackward(recorder: TimeRecorderState): TimeRecorderState {
  if (recorder.currentIndex <= 0) {
    return recorder;
  }
  return {
    ...recorder,
    currentIndex: recorder.currentIndex - 1
  };
}

export function togglePlayback(recorder: TimeRecorderState): TimeRecorderState {
  if (!recorder.isRewindMode) {
    return recorder;
  }
  return {
    ...recorder,
    isPlaying: !recorder.isPlaying
  };
}

export function getCurrentFrame(recorder: TimeRecorderState): HistoryFrame {
  return recorder.history[recorder.currentIndex] || recorder.history[0];
}

export function getCurrentState(recorder: TimeRecorderState): GameState {
  return getCurrentFrame(recorder).state;
}

export function getFrameCount(recorder: TimeRecorderState): number {
  return recorder.history.length;
}

export function insertFrameAt(
  recorder: TimeRecorderState,
  insertIndex: number,
  state: GameState,
  action: ActionType
): TimeRecorderState {
  if (insertIndex < 0 || insertIndex >= recorder.history.length) {
    return recorder;
  }

  const newFrame: HistoryFrame = {
    frameIndex: insertIndex,
    action,
    state,
    timestamp: Date.now()
  };

  const beforeFrames = recorder.history.slice(0, insertIndex);
  const newHistory = [...beforeFrames, newFrame];

  newHistory.forEach((f, i) => {
    f.frameIndex = i;
  });

  return {
    ...recorder,
    history: newHistory,
    currentIndex: newHistory.length - 1
  };
}

export function resetRecorder(recorder: TimeRecorderState, initialState: GameState): TimeRecorderState {
  return createTimeRecorder(initialState);
}

export function getPlaybackProgress(recorder: TimeRecorderState): number {
  if (recorder.history.length <= 1) return 0;
  return recorder.currentIndex / (recorder.history.length - 1);
}

export function estimateFrameSize(): number {
  return 512;
}
