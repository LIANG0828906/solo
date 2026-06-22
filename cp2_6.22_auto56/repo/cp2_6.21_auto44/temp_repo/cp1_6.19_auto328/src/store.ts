import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Lick, Chord, Preset, PlayerState, UIState, InstrumentType, ChordRoot, ChordType } from '@/types';
import { generateDemoWaveform } from '@/utils/audio';

interface AppState {
  licks: Lick[];
  chords: Chord[];
  presets: Preset[];
  player: PlayerState;
  ui: UIState;

  addLick: (data: Omit<Lick, 'id' | 'timestamp'>) => void;
  updateLick: (id: string, patch: Partial<Lick>) => void;
  removeLick: (id: string) => void;
  selectLick: (id: string | null) => void;

  addChord: (root: ChordRoot, type: ChordType) => void;
  updateChord: (id: string, patch: Partial<Chord>) => void;
  removeChord: (id: string) => void;
  reorderChords: (fromIndex: number, toIndex: number) => void;
  setChordPlayPosition: (pos: number) => void;

  addPreset: (data: Omit<Preset, 'id'>) => void;
  removePreset: (id: string) => void;
  applyPreset: (id: string | null) => void;

  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;

  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setIsMobile: (v: boolean) => void;
}

const demoLicks: Lick[] = [
  {
    id: uuidv4(),
    name: '即兴吉他 Riff',
    audioBlob: null,
    audioUrl: '',
    waveformData: generateDemoWaveform(),
    duration: 12.4,
    timestamp: Date.now() - 86400000,
    instrument: 'guitar',
    key: 'Em',
    bpm: 120,
    tags: ['riff', 'blues'],
  },
  {
    id: uuidv4(),
    name: '人声旋律动机',
    audioBlob: null,
    audioUrl: '',
    waveformData: generateDemoWaveform(),
    duration: 8.2,
    timestamp: Date.now() - 3600000,
    instrument: 'vocal',
    key: 'C',
    bpm: 96,
    tags: ['melody', 'verse'],
  },
  {
    id: uuidv4(),
    name: '键盘分解和弦',
    audioBlob: null,
    audioUrl: '',
    waveformData: generateDemoWaveform(),
    duration: 16.8,
    timestamp: Date.now() - 7200000,
    instrument: 'keyboard',
    key: 'F',
    bpm: 84,
    tags: ['arpeggio', 'pad'],
  },
  {
    id: uuidv4(),
    name: '鼓组律动',
    audioBlob: null,
    audioUrl: '',
    waveformData: generateDemoWaveform(),
    duration: 6.0,
    timestamp: Date.now() - 1800000,
    instrument: 'drums',
    key: '-',
    bpm: 128,
    tags: ['groove', 'loop'],
  },
  {
    id: uuidv4(),
    name: '贝斯 Walk',
    audioBlob: null,
    audioUrl: '',
    waveformData: generateDemoWaveform(),
    duration: 10.5,
    timestamp: Date.now() - 5400000,
    instrument: 'bass',
    key: 'Gm',
    bpm: 110,
    tags: ['walking', 'jazz'],
  },
];

const demoChords: Chord[] = [
  { id: uuidv4(), root: 'C', type: 'Major', order: 0, duration: 4 },
  { id: uuidv4(), root: 'G', type: 'Major', order: 1, duration: 4 },
  { id: uuidv4(), root: 'A', type: 'Minor', order: 2, duration: 4 },
  { id: uuidv4(), root: 'F', type: 'Major', order: 3, duration: 4 },
  { id: uuidv4(), root: 'D', type: 'Minor', order: 4, duration: 2 },
  { id: uuidv4(), root: 'G', type: '7th', order: 5, duration: 2 },
];

const demoPresets: Preset[] = [
  {
    id: uuidv4(),
    name: 'Clean Chorus',
    instrument: 'guitar',
    description: '干净的合唱音色，适合流行节奏扫弦',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Distortion Lead',
    instrument: 'guitar',
    description: '高增益失真主音，适合摇滚 Solo',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Grand Piano',
    instrument: 'keyboard',
    description: '温暖的三角钢琴音色，适合抒情段落',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Synth Pad',
    instrument: 'keyboard',
    description: '厚实的合成铺垫音色',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Studio Vocal',
    instrument: 'vocal',
    description: '带压缩和混响的人声预设',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Rock Kit',
    instrument: 'drums',
    description: '经典摇滚鼓组，底鼓厚实',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Jazz Bass',
    instrument: 'bass',
    description: '爵士贝斯音色，手指拨弦质感',
    imageUrl: '',
  },
  {
    id: uuidv4(),
    name: 'Funk Bass',
    instrument: 'bass',
    description: '放克贝斯，亮利的 Slap 音色',
    imageUrl: '',
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  licks: demoLicks,
  chords: demoChords,
  presets: demoPresets,
  player: {
    isPlaying: false,
    currentLickId: null,
    currentTime: 0,
    playbackRate: 1,
  },
  ui: {
    leftPanelWidth: 320,
    rightPanelWidth: 340,
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    isMobile: false,
    selectedLickId: demoLicks[0]?.id ?? null,
    appliedPresetId: null,
    chordPlayPosition: 0,
  },

  addLick: (data) =>
    set((s) => ({
      licks: [
        { ...data, id: uuidv4(), timestamp: Date.now() },
        ...s.licks,
      ],
    })),

  updateLick: (id, patch) =>
    set((s) => ({
      licks: s.licks.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),

  removeLick: (id) =>
    set((s) => ({
      licks: s.licks.filter((l) => l.id !== id),
      ui: {
        ...s.ui,
        selectedLickId: s.ui.selectedLickId === id ? null : s.ui.selectedLickId,
      },
    })),

  selectLick: (id) =>
    set((s) => ({
      ui: { ...s.ui, selectedLickId: id },
      player: { ...s.player, currentLickId: id, currentTime: 0, isPlaying: false },
    })),

  addChord: (root, type) =>
    set((s) => ({
      chords: [...s.chords, { id: uuidv4(), root, type, order: s.chords.length, duration: 4 }],
    })),

  updateChord: (id, patch) =>
    set((s) => ({
      chords: s.chords.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeChord: (id) =>
    set((s) => {
      const remaining = s.chords
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, order: i }));
      return { chords: remaining };
    }),

  reorderChords: (fromIndex, toIndex) =>
    set((s) => {
      const sorted = [...s.chords].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return {
        chords: sorted.map((c, i) => ({ ...c, order: i })),
      };
    }),

  setChordPlayPosition: (pos) =>
    set((s) => ({ ui: { ...s.ui, chordPlayPosition: pos } })),

  addPreset: (data) =>
    set((s) => ({
      presets: [{ ...data, id: uuidv4() }, ...s.presets],
    })),

  removePreset: (id) =>
    set((s) => ({
      presets: s.presets.filter((p) => p.id !== id),
      ui: {
        ...s.ui,
        appliedPresetId: s.ui.appliedPresetId === id ? null : s.ui.appliedPresetId,
      },
    })),

  applyPreset: (id) =>
    set((s) => ({ ui: { ...s.ui, appliedPresetId: id } })),

  setPlaying: (playing) =>
    set((s) => ({ player: { ...s.player, isPlaying: playing } })),

  setCurrentTime: (time) =>
    set((s) => ({ player: { ...s.player, currentTime: time } })),

  setLeftPanelWidth: (w) => set((s) => ({ ui: { ...s.ui, leftPanelWidth: w } })),
  setRightPanelWidth: (w) => set((s) => ({ ui: { ...s.ui, rightPanelWidth: w } })),

  toggleLeftPanel: () =>
    set((s) => ({ ui: { ...s.ui, leftPanelCollapsed: !s.ui.leftPanelCollapsed } })),
  toggleRightPanel: () =>
    set((s) => ({ ui: { ...s.ui, rightPanelCollapsed: !s.ui.rightPanelCollapsed } })),

  setIsMobile: (v) => set((s) => ({ ui: { ...s.ui, isMobile: v } })),
}));
