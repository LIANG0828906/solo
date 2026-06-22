import { create } from 'zustand';
import { AppState, Buoy, LogEntry, BUOY_COLORS, NOTE_NAMES } from '@/types';
import { audioSynth } from '@/utils/audio';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useStore = create<AppState>((set, get) => ({
  buoys: [],
  frequency: 0.8,
  logs: [],
  selectedBuoyId: null,

  addBuoy: (position: [number, number, number]) => {
    const state = get();
    const existingCount = state.buoys.length;
    const newBuoy: Buoy = {
      id: generateId(),
      position,
      color: BUOY_COLORS[existingCount % BUOY_COLORS.length],
      pitch: Math.floor(Math.random() * 12),
      frequency: state.frequency,
    };

    set((state) => ({
      buoys: [...state.buoys, newBuoy],
    }));

    audioSynth.playNote(newBuoy.pitch, 2, 0.6);

    get().addLog({
      type: 'create',
      message: `放置浮标 · 音高 ${NOTE_NAMES[newBuoy.pitch]}4`,
      pitchChange: newBuoy.pitch,
    });
  },

  removeBuoy: (id: string) => {
    set((state) => ({
      buoys: state.buoys.filter((b) => b.id !== id),
    }));
  },

  updateBuoyPosition: (id: string, position: [number, number, number]) => {
    const buoy = get().buoys.find((b) => b.id === id);
    if (!buoy) return;

    const oldPitch = buoy.pitch;
    const newPitch = Math.floor(Math.abs(position[0] + position[2]) * 3) % 12;
    const pitchChanged = oldPitch !== newPitch;

    set((state) => ({
      buoys: state.buoys.map((b) =>
        b.id === id
          ? { ...b, position, pitch: pitchChanged ? newPitch : b.pitch }
          : b
      ),
    }));

    if (pitchChanged) {
      get().addLog({
        type: 'move',
        message: `移动浮标 · 音高 ${NOTE_NAMES[oldPitch]}4 → ${NOTE_NAMES[newPitch]}4`,
        pitchChange: newPitch - oldPitch,
      });
    }
  },

  setFrequency: (freq: number) => {
    set({ frequency: freq });
    
    set((state) => ({
      buoys: state.buoys.map((b) => ({ ...b, frequency: freq })),
    }));

    get().addLog({
      type: 'frequency',
      message: `调节频率 · ${freq.toFixed(1)} Hz`,
    });
  },

  triggerBuoySound: (id: string) => {
    const buoy = get().buoys.find((b) => b.id === id);
    if (!buoy) return;

    audioSynth.playNote(buoy.pitch, 2.5, 0.7);
    audioSynth.playTideSound();

    get().addLog({
      type: 'click',
      message: `触发浮标 · 音高 ${NOTE_NAMES[buoy.pitch]}4 · 潮汐回响`,
      pitchChange: buoy.pitch,
    });
  },

  reset: () => {
    set({
      buoys: [],
      frequency: 0.8,
      logs: [],
      selectedBuoyId: null,
    });

    audioSynth.playChord(0, [0, 4, 7], 3);

    get().addLog({
      type: 'frequency',
      message: '重置潮汐网络',
    });
  },

  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => ({
      logs: [newEntry, ...state.logs].slice(0, 5),
    }));
  },

  setSelectedBuoy: (id: string | null) => {
    set({ selectedBuoyId: id });
  },
}));
