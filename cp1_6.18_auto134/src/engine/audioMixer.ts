import { TrackType, TrackNode } from './trackNode';

export enum PlayMode {
  LOOP = 'loop',
  SINGLE = 'single',
  SHUFFLE = 'shuffle'
}

export interface TrackAudioState {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  startTime: number;
  pauseTime: number;
}

export class AudioMixer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackStates: Map<string, TrackAudioState> = new Map();
  private trackBuffers: Map<TrackType, AudioBuffer> = new Map();
  
  private _isPlaying: boolean = false;
  private _playMode: PlayMode = PlayMode.LOOP;
  private _masterVolume: number = 80;
  private _currentTime: number = 0;
  private _duration: number = 8;
  
  private animationFrameId: number | null = null;
  private onProgressCallback: ((time: number, duration: number) => void) | null = null;
  
  constructor() {
    this.initAudioContext();
  }
  
  private initAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this._masterVolume / 100;
      this.generateAllTrackBuffers();
    } catch (e) {
      console.error('Failed to initialize audio context:', e);
    }
  }
  
  public async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }
  
  private generateAllTrackBuffers(): void {
    if (!this.audioContext) return;
    
    this.trackBuffers.set(TrackType.GUITAR, this.generateGuitarBuffer());
    this.trackBuffers.set(TrackType.DRUMS, this.generateDrumsBuffer());
    this.trackBuffers.set(TrackType.BASS, this.generateBassBuffer());
    this.trackBuffers.set(TrackType.KEYBOARD, this.generateKeyboardBuffer());
    this.trackBuffers.set(TrackType.VOCALS, this.generateVocalsBuffer());
    this.trackBuffers.set(TrackType.SYNTH, this.generateSynthBuffer());
  }
  
  private generateGuitarBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = this._duration;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const bpm = 120;
    const beatDuration = 60 / bpm;
    const beatsPerMeasure = 4;
    
    for (let i = 0; i < duration; i++) {
      const noteIndex = i % notes.length;
      const freq = notes[noteIndex];
      const startSample = Math.floor(i * beatDuration * beatsPerMeasure * sampleRate / 8);
      const endSample = Math.floor((i + 1) * beatDuration * beatsPerMeasure * sampleRate / 8);
      
      for (let s = startSample; s < endSample && s < data.length; s++) {
        const t = (s - startSample) / sampleRate;
        const envelope = this.adsrEnvelope(t, 0.01, 0.1, 0.7, 0.2);
        const wave = Math.sin(2 * Math.PI * freq * t);
        data[s] = envelope * wave * 0.3;
      }
    }
    
    return buffer;
  }
  
  private generateDrumsBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = this._duration;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const bpm = 120;
    const beatDuration = 60 / bpm;
    const samplesPerBeat = Math.floor(beatDuration * sampleRate);
    
    for (let beat = 0; beat < duration * (bpm / 60); beat++) {
      const startSample = beat * samplesPerBeat;
      
      if (beat % 2 === 0) {
        const kickFreq = 150;
        for (let s = 0; s < samplesPerBeat / 2 && startSample + s < data.length; s++) {
          const t = s / sampleRate;
          const freq = kickFreq * Math.exp(-t * 30);
          const envelope = Math.exp(-t * 20);
          data[startSample + s] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
        }
      }
      
      if (beat % 4 === 2) {
        for (let s = 0; s < samplesPerBeat / 3 && startSample + s < data.length; s++) {
          const t = s / sampleRate;
          const noise = (Math.random() * 2 - 1);
          const envelope = Math.exp(-t * 40);
          data[startSample + s] += noise * envelope * 0.4;
        }
      }
      
      const hhStart = startSample;
      for (let s = 0; s < samplesPerBeat / 4 && hhStart + s < data.length; s++) {
        const t = s / sampleRate;
        const noise = (Math.random() * 2 - 1);
        const envelope = Math.exp(-t * 80);
        const filtered = noise * 0.5;
        data[hhStart + s] += filtered * envelope * 0.15;
      }
    }
    
    return buffer;
  }
  
  private generateBassBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = this._duration;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const notes = [65.41, 73.42, 82.41, 87.31, 98.00, 110.00, 123.47, 130.81];
    const bpm = 120;
    const beatDuration = 60 / bpm;
    
    for (let i = 0; i < 16; i++) {
      const noteIndex = Math.floor(i / 2) % notes.length;
      const freq = notes[noteIndex];
      const startSample = Math.floor(i * beatDuration * sampleRate / 2);
      const endSample = Math.floor((i + 1) * beatDuration * sampleRate / 2);
      
      for (let s = startSample; s < endSample && s < data.length; s++) {
        const t = (s - startSample) / sampleRate;
        const envelope = this.adsrEnvelope(t, 0.005, 0.05, 0.8, 0.1);
        const saw = 2 * ((freq * t) % 1) - 1;
        data[s] = envelope * saw * 0.25;
      }
    }
    
    return buffer;
  }
  
  private generateKeyboardBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = this._duration;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const chord = [261.63, 329.63, 392.00];
    const bpm = 60;
    const beatDuration = 60 / bpm;
    
    for (let i = 0; i < 8; i++) {
      const startSample = Math.floor(i * beatDuration * 2 * sampleRate);
      const endSample = Math.floor((i + 1) * beatDuration * 2 * sampleRate);
      const baseNote = chord[i % 3];
      
      for (let s = startSample; s < endSample && s < data.length; s++) {
        const t = (s - startSample) / sampleRate;
        const envelope = this.adsrEnvelope(t, 0.02, 0.1, 0.6, 0.3);
        let sample = 0;
        for (const freq of chord) {
          sample += Math.sin(2 * Math.PI * (freq + baseNote - chord[0]) * t);
        }
        data[s] = envelope * sample * 0.15;
      }
    }
    
    return buffer;
  }
  
  private generateVocalsBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = this._duration;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const melody = [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 349.23];
    const bpm = 80;
    const beatDuration = 60 / bpm;
    
    for (let i = 0; i < melody.length; i++) {
      const freq = melody[i];
      const startSample = Math.floor(i * beatDuration * sampleRate);
      const endSample = Math.floor((i + 1) * beatDuration * sampleRate);
      
      for (let s = startSample; s < endSample && s < data.length; s++) {
        const t = (s - startSample) / sampleRate;
        const envelope = this.adsrEnvelope(t, 0.05, 0.1, 0.7, 0.2);
        const vibrato = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.02;
        const wave = Math.sin(2 * Math.PI * freq * vibrato * t);
        const pulseWidth = 0.5 + Math.sin(2 * Math.PI * freq * t) * 0.1;
        const pulse = wave > pulseWidth ? 1 : -1;
        data[s] = envelope * (wave * 0.7 + pulse * 0.3) * 0.2;
      }
    }
    
    return buffer;
  }
  
  private generateSynthBuffer(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = this._duration;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 523.25, 392.00];
    const bpm = 140;
    const beatDuration = 60 / bpm;
    
    for (let i = 0; i < 16; i++) {
      const noteIndex = i % notes.length;
      const freq = notes[noteIndex];
      const startSample = Math.floor(i * beatDuration * sampleRate / 2);
      const endSample = Math.floor((i + 1) * beatDuration * sampleRate / 2);
      
      for (let s = startSample; s < endSample && s < data.length; s++) {
        const t = (s - startSample) / sampleRate;
        const envelope = this.adsrEnvelope(t, 0.001, 0.02, 0.4, 0.05);
        const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
        const lfo = Math.sin(2 * Math.PI * 0.5 * t);
        const filtered = square * (0.5 + lfo * 0.5);
        data[s] = envelope * filtered * 0.15;
      }
    }
    
    return buffer;
  }
  
  private adsrEnvelope(t: number, attack: number, decay: number, sustain: number, release: number): number {
    if (t < attack) {
      return t / attack;
    } else if (t < attack + decay) {
      return 1 - (1 - sustain) * ((t - attack) / decay);
    } else {
      return sustain;
    }
  }
  
  public registerTrack(track: TrackNode): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);
    gainNode.gain.value = track.volume / 100;
    
    this.trackStates.set(track.id, {
      source: null,
      gainNode,
      isPlaying: false,
      startTime: 0,
      pauseTime: 0
    });
  }
  
  public setTrackVolume(trackId: string, volume: number): void {
    const state = this.trackStates.get(trackId);
    if (state && this.audioContext) {
      const targetGain = volume / 100;
      const now = this.audioContext.currentTime;
      state.gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.3);
    }
  }
  
  public setTrackPitch(trackId: string, pitch: number): void {
    const state = this.trackStates.get(trackId);
    if (state && state.source) {
      state.source.detune.value = pitch * 100;
    }
  }
  
  public setTrackSpeed(trackId: string, speed: number): void {
    const state = this.trackStates.get(trackId);
    if (state && state.source) {
      state.source.playbackRate.value = speed;
    }
  }
  
  public setMasterVolume(volume: number): void {
    this._masterVolume = volume;
    if (this.masterGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(volume / 100, now + 0.1);
    }
  }
  
  get masterVolume(): number {
    return this._masterVolume;
  }
  
  get isPlaying(): boolean {
    return this._isPlaying;
  }
  
  get playMode(): PlayMode {
    return this._playMode;
  }
  
  set playMode(mode: PlayMode) {
    this._playMode = mode;
  }
  
  get currentTime(): number {
    return this._currentTime;
  }
  
  get duration(): number {
    return this._duration;
  }
  
  public setOnProgressCallback(callback: (time: number, duration: number) => void): void {
    this.onProgressCallback = callback;
  }
  
  public play(tracks: TrackNode[]): void {
    if (!this.audioContext) return;
    
    this.resume().then(() => {
      tracks.forEach(track => {
        this.playTrack(track);
      });
      
      this._isPlaying = true;
      this.startProgressTracking();
    });
  }
  
  private playTrack(track: TrackNode): void {
    if (!this.audioContext) return;
    
    const state = this.trackStates.get(track.id);
    if (!state) return;
    
    if (state.source) {
      state.source.stop();
      state.source.disconnect();
    }
    
    const buffer = this.trackBuffers.get(track.type);
    if (!buffer) return;
    
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(state.gainNode);
    source.detune.value = track.pitch * 100;
    source.playbackRate.value = track.speed;
    
    const offset = state.pauseTime > 0 ? state.pauseTime : 0;
    source.start(0, offset);
    
    state.source = source;
    state.isPlaying = true;
    state.startTime = this.audioContext.currentTime - offset;
  }
  
  public pause(): void {
    if (!this.audioContext) return;
    
    this.trackStates.forEach((state) => {
      if (state.source && state.isPlaying) {
        state.pauseTime = this.audioContext!.currentTime - state.startTime;
        state.source.stop();
        state.source.disconnect();
        state.source = null;
        state.isPlaying = false;
      }
    });
    
    this._isPlaying = false;
    this.stopProgressTracking();
  }
  
  public stop(): void {
    this.trackStates.forEach((state) => {
      if (state.source) {
        state.source.stop();
        state.source.disconnect();
        state.source = null;
      }
      state.isPlaying = false;
      state.pauseTime = 0;
    });
    
    this._isPlaying = false;
    this._currentTime = 0;
    this.stopProgressTracking();
    
    if (this.onProgressCallback) {
      this.onProgressCallback(0, this._duration);
    }
  }
  
  public seek(time: number): void {
    this._currentTime = Math.max(0, Math.min(this._duration, time));
    
    if (this._isPlaying) {
      this.trackStates.forEach((state) => {
        if (state.source) {
          state.source.stop();
          state.source.disconnect();
          state.source = null;
        }
        state.pauseTime = this._currentTime;
        state.isPlaying = false;
      });
    }
  }
  
  private startProgressTracking(): void {
    const update = () => {
      if (!this._isPlaying || !this.audioContext) return;
      
      const firstState = Array.from(this.trackStates.values())[0];
      if (firstState) {
        this._currentTime = (this.audioContext.currentTime - firstState.startTime) % this._duration;
        
        if (this.onProgressCallback) {
          this.onProgressCallback(this._currentTime, this._duration);
        }
      }
      
      this.animationFrameId = requestAnimationFrame(update);
    };
    
    update();
  }
  
  private stopProgressTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  public dispose(): void {
    this.stop();
    
    this.trackStates.forEach((state) => {
      state.gainNode.disconnect();
    });
    
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
