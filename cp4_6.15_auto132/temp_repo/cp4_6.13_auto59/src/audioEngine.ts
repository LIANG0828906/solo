import { create } from 'zustand';

export const COLOR_THEMES = [
  { name: '极光蓝绿', primary: '#00d2ff', secondary: '#00ffab', accent: '#7b2ff7' },
  { name: '落日橙红', primary: '#ff6b35', secondary: '#ff2e63', accent: '#ffc107' },
  { name: '赛博紫粉', primary: '#e040fb', secondary: '#ff4081', accent: '#7c4dff' },
  { name: '森林翠绿', primary: '#00e676', secondary: '#76ff03', accent: '#1de9b6' },
  { name: '海洋蓝紫', primary: '#536dfe', secondary: '#304ffe', accent: '#448aff' },
] as const;

export type VisualMode = 'full' | 'circle-particle';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  fileName: string;
  duration: number;
  currentTime: number;
  averageFrequency: number;
  energyPeak: number;
  beatIntensity: number;
  visualMode: VisualMode;
  freqRangeMin: number;
  freqRangeMax: number;
  colorThemeIndex: number;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  setPlaying: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setLoaded: (v: boolean) => void;
  setFileName: (v: string) => void;
  setDuration: (v: number) => void;
  setCurrentTime: (v: number) => void;
  setAudioFeatures: (avg: number, peak: number, beat: number) => void;
  setVisualMode: () => void;
  setFreqRangeMin: (v: number) => void;
  setFreqRangeMax: (v: number) => void;
  setColorTheme: (v: number) => void;
  setFrequencyData: (d: Uint8Array) => void;
  setTimeDomainData: (d: Uint8Array) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  isLoading: false,
  isLoaded: false,
  fileName: '',
  duration: 0,
  currentTime: 0,
  averageFrequency: 0,
  energyPeak: 0,
  beatIntensity: 0,
  visualMode: 'full',
  freqRangeMin: 20,
  freqRangeMax: 20000,
  colorThemeIndex: 0,
  frequencyData: new Uint8Array(0),
  timeDomainData: new Uint8Array(0),
  setPlaying: (v) => set({ isPlaying: v }),
  setLoading: (v) => set({ isLoading: v }),
  setLoaded: (v) => set({ isLoaded: v }),
  setFileName: (v) => set({ fileName: v }),
  setDuration: (v) => set({ duration: v }),
  setCurrentTime: (v) => set({ currentTime: v }),
  setAudioFeatures: (averageFrequency, energyPeak, beatIntensity) =>
    set({ averageFrequency, energyPeak, beatIntensity }),
  setVisualMode: () => set({ visualMode: get().visualMode === 'full' ? 'circle-particle' : 'full' }),
  setFreqRangeMin: (v) => set({ freqRangeMin: v }),
  setFreqRangeMax: (v) => set({ freqRangeMax: v }),
  setColorTheme: (v) => set({ colorThemeIndex: v }),
  setFrequencyData: (d) => set({ frequencyData: d }),
  setTimeDomainData: (d) => set({ timeDomainData: d }),
  reset: () =>
    set({
      isPlaying: false,
      isLoading: false,
      isLoaded: false,
      fileName: '',
      duration: 0,
      currentTime: 0,
      averageFrequency: 0,
      energyPeak: 0,
      beatIntensity: 0,
      frequencyData: new Uint8Array(0),
      timeDomainData: new Uint8Array(0),
    }),
}));

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private rafId: number = 0;
  private prevEnergy: number = 0;
  private energyHistory: number[] = [];
  private readonly FFT_SIZE = 2048;

  async loadFile(file: File): Promise<void> {
    const store = useAudioStore.getState();
    store.setLoading(true);
    store.setFileName(file.name);

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.analyser.connect(this.gainNode);

      store.setDuration(this.audioBuffer.duration);
      store.setLoaded(true);
      store.setLoading(false);
      this.pauseOffset = 0;
    } catch (e) {
      store.setLoading(false);
      store.setLoaded(false);
      throw e;
    }
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return;

    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser);

    this.sourceNode.onended = () => {
      const store = useAudioStore.getState();
      if (store.isPlaying) {
        store.setPlaying(false);
        store.setCurrentTime(0);
        this.pauseOffset = 0;
      }
    };

    this.sourceNode.start(0, this.pauseOffset);
    this.startTime = this.audioContext.currentTime - this.pauseOffset;
    useAudioStore.getState().setPlaying(true);
    this.startLoop();
  }

  pause(): void {
    if (!this.audioContext || !this.sourceNode) return;
    this.pauseOffset = this.audioContext.currentTime - this.startTime;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    useAudioStore.getState().setPlaying(false);
    cancelAnimationFrame(this.rafId);
  }

  reset(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.pauseOffset = 0;
    this.prevEnergy = 0;
    this.energyHistory = [];
    cancelAnimationFrame(this.rafId);
    const store = useAudioStore.getState();
    store.setPlaying(false);
    store.setCurrentTime(0);
    store.setAudioFeatures(0, 0, 0);
    store.setFrequencyData(new Uint8Array(0));
    store.setTimeDomainData(new Uint8Array(0));
    store.reset();
  }

  seek(time: number): void {
    if (!this.audioBuffer) return;
    const wasPlaying = useAudioStore.getState().isPlaying;
    if (wasPlaying && this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
      cancelAnimationFrame(this.rafId);
    }
    this.pauseOffset = time;
    if (wasPlaying) {
      this.play();
    } else {
      useAudioStore.getState().setCurrentTime(time);
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (useAudioStore.getState().isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseOffset;
  }

  private startLoop(): void {
    const loop = () => {
      this.analyze();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private analyze(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getByteTimeDomainData(timeData);

    const store = useAudioStore.getState();
    const sampleRate = this.audioContext!.sampleRate;
    const binHz = sampleRate / this.FFT_SIZE;

    const minBin = Math.max(0, Math.floor(store.freqRangeMin / binHz));
    const maxBin = Math.min(bufferLength - 1, Math.ceil(store.freqRangeMax / binHz));

    let sum = 0;
    let peak = 0;
    let count = 0;
    for (let i = minBin; i <= maxBin; i++) {
      sum += freqData[i];
      if (freqData[i] > peak) peak = freqData[i];
      count++;
    }

    const avgFreq = count > 0 ? sum / count : 0;
    const normalizedEnergy = peak / 255;

    this.energyHistory.push(normalizedEnergy);
    if (this.energyHistory.length > 43) {
      this.energyHistory.shift();
    }
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const beatIntensity = Math.max(0, normalizedEnergy - avgEnergy * 1.3);

    store.setAudioFeatures(avgFreq / 255, normalizedEnergy, beatIntensity);
    store.setFrequencyData(freqData);
    store.setTimeDomainData(timeData);
    store.setCurrentTime(this.getCurrentTime());
  }
}
