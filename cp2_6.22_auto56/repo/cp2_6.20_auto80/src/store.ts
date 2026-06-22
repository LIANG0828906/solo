import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import { audioEngine, InstrumentType } from './audioEngine';

export interface Track {
  id: string;
  name: string;
  instrument: InstrumentType;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

export interface StoreState {
  tracks: Track[];
  grid: boolean[][];
  isPlaying: boolean;
  currentStep: number;
  currentBar: number;
  currentBeat: number;
  bpm: number;
  isExporting: boolean;
  exportMessage: string;
}

export interface StoreActions {
  toggleGridCell: (trackIdx: number, stepIdx: number) => void;
  setVolume: (trackIdx: number, value: number) => void;
  setPan: (trackIdx: number, value: number) => void;
  toggleMute: (trackIdx: number) => void;
  toggleSolo: (trackIdx: number) => void;
  setBPM: (value: number) => void;
  setCurrentStep: (step: number) => void;
  play: () => void;
  stop: () => void;
  reset: () => void;
  exportMidi: () => void;
  exportJson: () => void;
  clearExportMessage: () => void;
}

const initialTracks: Track[] = [
  { id: uuidv4(), name: '鼓组', instrument: 'drums', color: '#ff6b6b', volume: -12, pan: 0, muted: false, solo: false },
  { id: uuidv4(), name: '贝斯', instrument: 'bass', color: '#4ecdc4', volume: -15, pan: 0, muted: false, solo: false },
  { id: uuidv4(), name: '吉他', instrument: 'guitar', color: '#45b7d1', volume: -18, pan: -30, muted: false, solo: false },
  { id: uuidv4(), name: '键盘', instrument: 'keys', color: '#f9ca24', volume: -20, pan: 30, muted: false, solo: false },
];

const createInitialGrid = (): boolean[][] => {
  const grid: boolean[][] = [];
  for (let i = 0; i < 4; i++) {
    grid.push(new Array(16).fill(false));
  }
  grid[0][0] = true;
  grid[0][4] = true;
  grid[0][8] = true;
  grid[0][12] = true;
  grid[1][0] = true;
  grid[1][6] = true;
  grid[1][8] = true;
  grid[1][14] = true;
  grid[2][2] = true;
  grid[2][6] = true;
  grid[2][10] = true;
  grid[2][14] = true;
  grid[3][0] = true;
  grid[3][4] = true;
  grid[3][8] = true;
  grid[3][12] = true;
  return grid;
};

const midiNotes: Record<InstrumentType, number> = {
  drums: 36,
  bass: 48,
  guitar: 60,
  keys: 72,
};

function encodeMIDI(tracks: Track[], grid: boolean[][], bpm: number): ArrayBuffer {
  const trackNames: InstrumentType[] = ['drums', 'bass', 'guitar', 'keys'];
  const numTracks = tracks.length + 1;

  function writeVarLen(value: number): number[] {
    const result: number[] = [];
    let buffer = value & 0x7f;
    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }
    while (true) {
      result.push(buffer & 0xff);
      if (buffer & 0x80) {
        buffer >>= 8;
      } else {
        break;
      }
    }
    return result;
  }

  function createTrack(events: number[]): number[] {
    const track: number[] = [];
    track.push(0x4d, 0x54, 0x72, 0x6b);
    const length = events.length;
    track.push((length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
    track.push(...events);
    return track;
  }

  let midiData: number[] = [];

  midiData.push(0x4d, 0x54, 0x68, 0x64);
  midiData.push(0, 0, 0, 6);
  midiData.push(0, 1);
  midiData.push((numTracks >> 8) & 0xff, numTracks & 0xff);
  midiData.push(0, 480);

  const tempoEvents: number[] = [];
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  tempoEvents.push(0);
  tempoEvents.push(0xff, 0x51, 0x03);
  tempoEvents.push((microsecondsPerBeat >> 16) & 0xff, (microsecondsPerBeat >> 8) & 0xff, microsecondsPerBeat & 0xff);
  tempoEvents.push(0, 0xff, 0x2f, 0x00);
  midiData.push(...createTrack(tempoEvents));

  const stepDuration = 120;

  for (let i = 0; i < tracks.length; i++) {
    const events: number[] = [];
    const channel = i < 9 ? i : i + 1;
    const note = midiNotes[trackNames[i]];
    const velocity = 100;
    let time = 0;

    for (let step = 0; step < 16; step++) {
      if (grid[i][step]) {
        events.push(...writeVarLen(time));
        events.push(0x90 + channel, note, velocity);
        events.push(...writeVarLen(stepDuration));
        events.push(0x80 + channel, note, 0);
        time = 0;
      } else {
        time += stepDuration;
      }
    }

    if (time > 0) {
      events.push(...writeVarLen(time));
    }
    events.push(0xff, 0x2f, 0x00);

    midiData.push(...createTrack(events));
  }

  const buffer = new Uint8Array(midiData);
  return buffer.buffer;
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  tracks: initialTracks,
  grid: createInitialGrid(),
  isPlaying: false,
  currentStep: 0,
  currentBar: 1,
  currentBeat: 1,
  bpm: 120,
  isExporting: false,
  exportMessage: '',

  toggleGridCell: (trackIdx: number, stepIdx: number) => {
    set(state => {
      const newGrid = state.grid.map((row, i) =>
        row.map((cell, j) => (i === trackIdx && j === stepIdx ? !cell : cell))
      );
      audioEngine.setGrid(newGrid);
      return { grid: newGrid };
    });
  },

  setVolume: (trackIdx: number, value: number) => {
    set(state => {
      const newTracks = [...state.tracks];
      newTracks[trackIdx] = { ...newTracks[trackIdx], volume: value };
      audioEngine.setVolume(newTracks[trackIdx].instrument, value);
      return { tracks: newTracks };
    });
  },

  setPan: (trackIdx: number, value: number) => {
    set(state => {
      const newTracks = [...state.tracks];
      newTracks[trackIdx] = { ...newTracks[trackIdx], pan: value };
      audioEngine.setPan(newTracks[trackIdx].instrument, value);
      return { tracks: newTracks };
    });
  },

  toggleMute: (trackIdx: number) => {
    set(state => {
      const newTracks = [...state.tracks];
      newTracks[trackIdx] = { ...newTracks[trackIdx], muted: !newTracks[trackIdx].muted };
      audioEngine.setMuted(newTracks[trackIdx].instrument, newTracks[trackIdx].muted);
      return { tracks: newTracks };
    });
  },

  toggleSolo: (trackIdx: number) => {
    set(state => {
      const newTracks = [...state.tracks];
      newTracks[trackIdx] = { ...newTracks[trackIdx], solo: !newTracks[trackIdx].solo };
      audioEngine.setSolo(newTracks[trackIdx].instrument, newTracks[trackIdx].solo);
      return { tracks: newTracks };
    });
  },

  setBPM: (value: number) => {
    const clamped = Math.max(60, Math.min(200, value));
    set({ bpm: clamped });
    audioEngine.setBPM(clamped);
  },

  setCurrentStep: (step: number) => {
    const beat = Math.floor(step / 4) + 1;
    const bar = Math.floor(step / 16) + 1;
    set({ currentStep: step, currentBeat: beat, currentBar: bar });
  },

  play: () => {
    audioEngine.resume();
    audioEngine.play();
    set({ isPlaying: true });
  },

  stop: () => {
    audioEngine.stop();
    set({ isPlaying: false });
  },

  reset: () => {
    audioEngine.reset();
    set({ isPlaying: false, currentStep: 0, currentBar: 1, currentBeat: 1 });
  },

  exportMidi: () => {
    const { tracks, grid, bpm } = get();
    set({ isExporting: true, exportMessage: '' });

    setTimeout(() => {
      const midiBuffer = encodeMIDI(tracks, grid, bpm);
      const blob = new Blob([midiBuffer], { type: 'audio/midi' });
      saveAs(blob, 'beat-maker-export.mid');
      set({ isExporting: false, exportMessage: 'MIDI 文件已导出！' });
      setTimeout(() => set({ exportMessage: '' }), 3000);
    }, 300);
  },

  exportJson: () => {
    const { tracks, grid, bpm } = get();
    set({ isExporting: true, exportMessage: '' });

    setTimeout(() => {
      const data = {
        version: '1.0',
        bpm,
        tracks: tracks.map(t => ({
          name: t.name,
          instrument: t.instrument,
          volume: t.volume,
          pan: t.pan,
          muted: t.muted,
          solo: t.solo,
        })),
        grid,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, 'beat-maker-config.json');
      set({ isExporting: false, exportMessage: 'JSON 配置已导出！' });
      setTimeout(() => set({ exportMessage: '' }), 3000);
    }, 300);
  },

  clearExportMessage: () => set({ exportMessage: '' }),
}));

export default useStore;
