import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { parseScore, ParsedNote, ParseResult } from '../utils/parser';
import { audioEngine } from '../utils/audioEngine';

export interface SavedFragment {
  id: string;
  title: string;
  scoreText: string;
  notes: ParsedNote[];
  bpm: number;
  noteCount: number;
  createdAt: number;
}

interface MusicState {
  scoreText: string;
  notes: ParsedNote[];
  parseError: string | null;

  isPlaying: boolean;
  isPaused: boolean;
  currentNoteIndex: number;
  playProgress: number;
  highlightedNotes: number[];

  bpm: number;
  metronomeEnabled: boolean;
  currentBeat: number;
  isStrongBeat: boolean;
  beatIndicatorKey: number;

  savedFragments: SavedFragment[];

  setScoreText: (text: string) => void;
  parseScore: () => void;
  togglePlay: () => void;
  stopPlay: () => void;
  setBpm: (bpm: number) => void;
  toggleMetronome: () => void;
  saveFragment: (title: string) => { success: boolean; message: string };
  loadFragment: (id: string) => void;
  deleteFragment: (id: string) => void;
  addHighlightedNote: (midiNumber: number) => void;
  removeHighlightedNote: (midiNumber: number) => void;
}

let playRafId: number | null = null;
let playStartTime = 0;
let pausedElapsedTime = 0;

function loadSavedFromStorage(): SavedFragment[] {
  try {
    const raw = localStorage.getItem('score_saved_fragments');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(fragments: SavedFragment[]) {
  try {
    localStorage.setItem('score_saved_fragments', JSON.stringify(fragments));
  } catch {}
}

export const useMusicStore = create<MusicState>((set, get) => ({
  scoreText: 'C4,1 D4,1 E4,1 F4,1 G4,2 A4,1 G4,1 F4,2 E4,1 D4,1 C4,2',
  notes: [],
  parseError: null,

  isPlaying: false,
  isPaused: false,
  currentNoteIndex: -1,
  playProgress: 0,
  highlightedNotes: [],

  bpm: 100,
  metronomeEnabled: false,
  currentBeat: 0,
  isStrongBeat: false,
  beatIndicatorKey: 0,

  savedFragments: loadSavedFromStorage(),

  setScoreText: (text: string) => set({ scoreText: text }),

  parseScore: () => {
    const { scoreText } = get();
    const result: ParseResult = parseScore(scoreText);
    set({
      notes: result.notes,
      parseError: result.error,
      currentNoteIndex: -1,
      playProgress: 0,
      isPlaying: false,
      isPaused: false,
    });
    if (playRafId !== null) {
      cancelAnimationFrame(playRafId);
      playRafId = null;
    }
  },

  togglePlay: () => {
    const state = get();
    if (state.notes.length === 0) {
      get().parseScore();
      return;
    }

    audioEngine.resume();

    if (state.isPlaying && !state.isPaused) {
      if (playRafId !== null) {
        cancelAnimationFrame(playRafId);
        playRafId = null;
      }
      pausedElapsedTime = audioEngine.getCurrentTime() - playStartTime;
      set({ isPaused: true });
      return;
    }

    if (state.isPaused) {
      playStartTime = audioEngine.getCurrentTime() - pausedElapsedTime;
      set({ isPaused: false });
      schedulePlayback();
      return;
    }

    const beatDuration = 60 / state.bpm;
    let totalDuration = 0;
    state.notes.forEach((n) => {
      totalDuration += n.duration * beatDuration;
    });

    playStartTime = audioEngine.getCurrentTime();
    pausedElapsedTime = 0;
    set({ isPlaying: true, isPaused: false, currentNoteIndex: -1, playProgress: 0 });

    state.notes.forEach((note, idx) => {
      let noteStart = 0;
      for (let i = 0; i < idx; i++) {
        noteStart += state.notes[i].duration * beatDuration;
      }
      const noteDuration = note.duration * beatDuration;
      audioEngine.playNote(note.midiNumber, noteDuration, playStartTime + noteStart);
    });

    schedulePlayback();
  },

  stopPlay: () => {
    if (playRafId !== null) {
      cancelAnimationFrame(playRafId);
      playRafId = null;
    }
    pausedElapsedTime = 0;
    set({ isPlaying: false, isPaused: false, currentNoteIndex: -1, playProgress: 0 });
  },

  setBpm: (bpm: number) => {
    set({ bpm });
    audioEngine.setBpm(bpm);
  },

  toggleMetronome: () => {
    const state = get();
    const newEnabled = !state.metronomeEnabled;
    set({ metronomeEnabled: newEnabled });

    if (newEnabled) {
      audioEngine.startMetronome(state.bpm, (beat, isStrong) => {
        set({
          currentBeat: beat,
          isStrongBeat: isStrong,
          beatIndicatorKey: Date.now(),
        });
      });
    } else {
      audioEngine.stopMetronome();
      set({ currentBeat: 0, isStrongBeat: false });
    }
  },

  saveFragment: (title: string) => {
    const state = get();
    if (!title.trim()) {
      return { success: false, message: '请输入标题' };
    }
    if (state.notes.length === 0) {
      return { success: false, message: '请先解析乐谱' };
    }
    if (state.savedFragments.length >= 20) {
      return { success: false, message: '收藏已达上限（最多20个）' };
    }

    const fragment: SavedFragment = {
      id: uuidv4(),
      title: title.trim(),
      scoreText: state.scoreText,
      notes: state.notes,
      bpm: state.bpm,
      noteCount: state.notes.length,
      createdAt: Date.now(),
    };

    const newList = [...state.savedFragments, fragment];
    saveToStorage(newList);
    set({ savedFragments: newList });
    return { success: true, message: '收藏成功' };
  },

  loadFragment: (id: string) => {
    const state = get();
    const fragment = state.savedFragments.find((f) => f.id === id);
    if (!fragment) return;

    if (playRafId !== null) {
      cancelAnimationFrame(playRafId);
      playRafId = null;
    }

    set({
      scoreText: fragment.scoreText,
      notes: fragment.notes,
      parseError: null,
      bpm: fragment.bpm,
      currentNoteIndex: -1,
      playProgress: 0,
      isPlaying: false,
      isPaused: false,
    });

    audioEngine.setBpm(fragment.bpm);

    setTimeout(() => {
      get().togglePlay();
    }, 100);
  },

  deleteFragment: (id: string) => {
    const state = get();
    const newList = state.savedFragments.filter((f) => f.id !== id);
    saveToStorage(newList);
    set({ savedFragments: newList });
  },

  addHighlightedNote: (midiNumber: number) => {
    const state = get();
    if (!state.highlightedNotes.includes(midiNumber)) {
      set({ highlightedNotes: [...state.highlightedNotes, midiNumber] });
    }
  },

  removeHighlightedNote: (midiNumber: number) => {
    const state = get();
    set({ highlightedNotes: state.highlightedNotes.filter((n) => n !== midiNumber) });
  },
}));

function schedulePlayback() {
  const state = useMusicStore.getState();
  const beatDuration = 60 / state.bpm;
  let totalDuration = 0;
  state.notes.forEach((n) => {
    totalDuration += n.duration * beatDuration;
  });

  const noteStartTimes: number[] = [];
  let accum = 0;
  state.notes.forEach((n) => {
    noteStartTimes.push(accum);
    accum += n.duration * beatDuration;
  });

  function tick() {
    const currentState = useMusicStore.getState();
    if (!currentState.isPlaying || currentState.isPaused) return;

    const elapsed = audioEngine.getCurrentTime() - playStartTime;
    const progress = Math.min(1, elapsed / totalDuration);

    let noteIdx = -1;
    for (let i = noteStartTimes.length - 1; i >= 0; i--) {
      if (elapsed >= noteStartTimes[i]) {
        noteIdx = i;
        break;
      }
    }

    if (noteIdx !== currentState.currentNoteIndex) {
      useMusicStore.setState({ currentNoteIndex: noteIdx, playProgress: progress });
    } else if (Math.abs(progress - currentState.playProgress) > 0.001) {
      useMusicStore.setState({ playProgress: progress });
    }

    if (elapsed >= totalDuration) {
      useMusicStore.setState({
        isPlaying: false,
        isPaused: false,
        currentNoteIndex: -1,
        playProgress: 1,
      });
      playRafId = null;
      return;
    }

    playRafId = requestAnimationFrame(tick);
  }

  playRafId = requestAnimationFrame(tick);
}
