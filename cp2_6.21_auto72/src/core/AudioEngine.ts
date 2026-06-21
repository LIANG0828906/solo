import type { MusicianConfig, MusicianType } from '../types';
import { DrumSynthesizer, BassSynthesizer, GuitarSynthesizer, KeyboardSynthesizer, getNoteFrequency } from './Synthesizer';

interface Track {
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  config: MusicianConfig;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private tracks: Map<MusicianType, Track> = new Map();
  private isPlaying = false;
  private bpm = 120;
  private masterVolume = 75;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private current16thNote = 0;
  private lookahead = 25.0;
  private scheduleAheadTime = 0.1;

  private drumSynth: DrumSynthesizer | null = null;
  private bassSynth: BassSynthesizer | null = null;
  private guitarSynth: GuitarSynthesizer | null = null;
  private keyboardSynth: KeyboardSynthesizer | null = null;

  constructor() {}

  init(): void {
    if (this.ctx) return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume / 100 * 0.8;
    
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    
    this.drumSynth = new DrumSynthesizer(this.ctx);
    this.bassSynth = new BassSynthesizer(this.ctx);
    this.guitarSynth = new GuitarSynthesizer(this.ctx);
    this.keyboardSynth = new KeyboardSynthesizer(this.ctx);
    
    const musicianTypes: MusicianType[] = ['drummer', 'bassist', 'guitarist', 'keyboardist'];
    musicianTypes.forEach(type => {
      const gain = this.ctx!.createGain();
      gain.gain.value = 0;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 20000;
      gain.connect(filter);
      filter.connect(this.masterGain!);
      this.tracks.set(type, {
        gainNode: gain,
        filterNode: filter,
        config: {} as MusicianConfig
      });
    });
  }

  setMusicianConfig(id: MusicianType, config: MusicianConfig): void {
    const track = this.tracks.get(id);
    if (!track) return;
    track.config = config;
    
    const soloActive = Array.from(this.tracks.values()).some(t => t.config.solo);
    
    if (soloActive && !config.solo) {
      track.gainNode.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.02);
    } else {
      const volume = config.volume / 100 * 0.6;
      track.gainNode.gain.setTargetAtTime(volume, this.ctx!.currentTime, 0.02);
    }
    
    const cutoff = 500 + config.complexity * 1500;
    track.filterNode.frequency.setTargetAtTime(cutoff, this.ctx!.currentTime, 0.05);
  }

  updateSoloStates(): void {
    const tracks = Array.from(this.tracks.values());
    const soloActive = tracks.some(t => t.config.solo);
    
    tracks.forEach(track => {
      if (soloActive && !track.config.solo) {
        track.gainNode.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.02);
      } else {
        const volume = track.config.volume / 100 * 0.6;
        track.gainNode.gain.setTargetAtTime(volume, this.ctx!.currentTime, 0.02);
      }
    });
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume / 100 * 0.8, this.ctx.currentTime, 0.02);
    }
  }

  start(): void {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.schedulerId !== null) {
      clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  private scheduler = (): void => {
    if (!this.isPlaying || !this.ctx) return;
    
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
    
    this.schedulerId = window.setTimeout(this.scheduler, this.lookahead);
  };

  private nextNote(): void {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number): void {
    const drumTrack = this.tracks.get('drummer');
    const bassTrack = this.tracks.get('bassist');
    const guitarTrack = this.tracks.get('guitarist');
    const keyboardTrack = this.tracks.get('keyboardist');

    if (drumTrack && drumTrack.config.id) {
      this.scheduleDrums(drumTrack, beatNumber, time);
    }
    if (bassTrack && bassTrack.config.id) {
      this.scheduleBass(bassTrack, beatNumber, time);
    }
    if (guitarTrack && guitarTrack.config.id) {
      this.scheduleGuitar(guitarTrack, beatNumber, time);
    }
    if (keyboardTrack && keyboardTrack.config.id) {
      this.scheduleKeyboard(keyboardTrack, beatNumber, time);
    }
  }

  private scheduleDrums(track: Track, beatNumber: number, time: number): void {
    const { config } = track;
    const intensity = config.complexity / 5;
    const patternIndex = config.rhythmPattern;
    const beatInBar = beatNumber % 16;
    const isDownbeat = beatInBar % 4 === 0;
    const isOffbeat = beatInBar % 2 === 0;
    
    const shiftOffset = config.rhythmShift / 100 * 0.1;
    const noteTime = time + shiftOffset;

    const patterns = [
      { kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
      { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
      { kick: [0, 5, 8, 13], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14, 15] },
      { kick: [0, 8], snare: [4, 12], hat: [1, 3, 5, 7, 9, 11, 13, 15] },
      { kick: [0, 4, 8, 12], snare: [2, 6, 10, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
      { kick: [0, 7, 8, 15], snare: [3, 11], hat: [0, 2, 4, 6, 8, 10, 12, 14] }
    ];

    const pattern = patterns[patternIndex % patterns.length];

    if (pattern.kick.includes(beatInBar) && this.drumSynth) {
      this.drumSynth.playKick(noteTime, track.gainNode, 0.8 + intensity * 0.2);
    }

    if (pattern.snare.includes(beatInBar) && this.drumSynth) {
      this.drumSynth.playSnare(noteTime, track.gainNode, 0.7 + intensity * 0.3);
    }

    if (pattern.hat.includes(beatInBar) && this.drumSynth) {
      const isOpen = config.genre === 'funk' || (config.complexity >= 4 && beatInBar % 8 === 7);
      this.drumSynth.playHiHat(noteTime, track.gainNode, 0.5 + intensity * 0.3, isOpen);
    }

    if (config.complexity >= 4 && beatInBar % 4 === 2 && this.drumSynth) {
      const tomPitch = beatInBar === 2 ? 1.5 : 1.2;
      if (Math.random() < 0.3) {
        this.drumSynth.playTom(noteTime, track.gainNode, tomPitch, 0.5);
      }
    }

    if (config.genre === 'funk' && isOffbeat && !isDownbeat && this.drumSynth) {
      this.drumSynth.playHiHat(noteTime + 0.05, track.gainNode, 0.3, false);
    }
  }

  private scheduleBass(track: Track, beatNumber: number, time: number): void {
    const { config } = track;
    const beatInBar = beatNumber % 16;
    const shiftOffset = config.rhythmShift / 100 * 0.08;
    const noteTime = time + shiftOffset;
    const rootFreq = getNoteFrequency(config.rootNote, 1, 0) / 2;
    const intensity = config.complexity / 5;

    const patterns = [
      [0, 4, 8, 12],
      [0, 2, 6, 8, 10, 14],
      [0, 3, 5, 8, 11, 13],
      [0, 2, 4, 6, 8, 10, 12, 14],
      [0, 1, 4, 6, 8, 9, 12, 14],
      [0, 2, 3, 6, 8, 10, 11, 14]
    ];

    const pattern = patterns[config.rhythmPattern % patterns.length];

    if (pattern.includes(beatInBar) && this.bassSynth) {
      const noteDuration = (60 / this.bpm) * 0.45;
      let freq = rootFreq;
      
      const scaleOffset = this.getGenreNoteOffset(config.genre, beatInBar, config.complexity);
      freq = rootFreq * Math.pow(2, scaleOffset / 12);

      if (config.genre === 'blues' && beatInBar % 8 === 4) {
        const slideFrom = rootFreq * Math.pow(2, -2 / 12);
        this.bassSynth.playSlide(slideFrom, freq, noteTime, noteDuration * 0.8, track.gainNode, 0.7 + intensity * 0.3);
      } else {
        this.bassSynth.playNote(freq, noteTime, noteDuration, track.gainNode, 0.7 + intensity * 0.3);
      }
    }
  }

  private scheduleGuitar(track: Track, beatNumber: number, time: number): void {
    const { config } = track;
    const beatInBar = beatNumber % 16;
    const shiftOffset = config.rhythmShift / 100 * 0.1;
    const noteTime = time + shiftOffset;
    const rootFreq = getNoteFrequency(config.rootNote, 2, 0);
    const intensity = config.complexity / 5;

    const strumPatterns = [
      [0, 8],
      [0, 4, 8, 12],
      [0, 4, 6, 8, 12],
      [0, 2, 4, 6, 8, 10, 12, 14],
      [0, 2, 4, 8, 10, 12],
      [0, 2, 3, 6, 8, 10, 11, 14]
    ];

    const pattern = strumPatterns[config.rhythmPattern % strumPatterns.length];

    if (pattern.includes(beatInBar) && this.guitarSynth) {
      const noteDuration = (60 / this.bpm) * (beatInBar % 8 === 0 ? 0.8 : 0.4);
      const chordFreqs = this.getChordFrequencies(config.rootNote, config.chordType, 2);
      const synth = this.guitarSynth;
      
      if (config.genre === 'rock' || config.genre === 'funk') {
        chordFreqs.forEach((freq, i) => {
          synth.playNote(freq, noteTime + i * 0.015, noteDuration - i * 0.02, track.gainNode, (0.5 + intensity * 0.3) / chordFreqs.length);
        });
      } else {
        synth.playChord(chordFreqs, noteTime, noteDuration, track.gainNode, 0.5 + intensity * 0.3);
      }
    }

    if (config.complexity >= 5 && beatInBar % 4 === 2 && this.guitarSynth) {
      const leadFreq = rootFreq * Math.pow(2, this.getGenreNoteOffset(config.genre, beatInBar, 5) / 12);
      if (Math.random() < 0.4) {
        this.guitarSynth.playNote(leadFreq * 2, noteTime, (60 / this.bpm) * 0.3, track.gainNode, 0.25);
      }
    }
  }

  private scheduleKeyboard(track: Track, beatNumber: number, time: number): void {
    const { config } = track;
    const beatInBar = beatNumber % 16;
    const shiftOffset = config.rhythmShift / 100 * 0.06;
    const noteTime = time + shiftOffset;
    const intensity = config.complexity / 5;

    const chordPatterns = [
      [0],
      [0, 8],
      [0, 4, 8, 12],
      [0, 4, 6, 8, 12],
      [0, 2, 4, 8, 10, 12],
      [0, 2, 4, 6, 8, 10, 12, 14]
    ];

    const pattern = chordPatterns[config.rhythmPattern % chordPatterns.length];

    if (pattern.includes(beatInBar) && this.keyboardSynth) {
      const noteDuration = (60 / this.bpm) * (beatInBar % 8 === 0 ? 0.9 : 0.5);
      const chordFreqs = this.getChordFrequencies(config.rootNote, config.chordType, 3);
      this.keyboardSynth.playChord(chordFreqs, noteTime, noteDuration, track.gainNode, 0.4 + intensity * 0.4);
    }

    if (config.complexity >= 4 && beatInBar % 2 === 0 && this.keyboardSynth) {
      const melodyFreq = getNoteFrequency(config.rootNote, 4, this.getGenreNoteOffset(config.genre, beatInBar, config.complexity));
      if (Math.random() < 0.3) {
        this.keyboardSynth.playNote(melodyFreq, noteTime, (60 / this.bpm) * 0.25, track.gainNode, 0.15);
      }
    }
  }

  private getGenreNoteOffset(genre: string, beatPosition: number, complexity: number): number {
    const beatInBar = beatPosition % 16;
    
    const patterns: Record<string, number[]> = {
      rock: [0, 7, 12, 10, 7, 5, 3, 2],
      blues: [0, 3, 5, 6, 7, 10, 12, 10],
      funk: [0, 7, 10, 12, 10, 7, 5, 3],
      reggae: [0, 5, 7, 12, 7, 5, 3, 0]
    };

    const pattern = patterns[genre] || patterns.rock;
    const index = Math.floor(beatInBar / 2) % pattern.length;
    const baseOffset = pattern[index];
    
    if (complexity >= 4) {
      const variations = [0, 2, -2, 4, -4];
      const varIndex = Math.floor(beatInBar / 4) % variations.length;
      return baseOffset + (Math.random() < 0.3 ? variations[varIndex] : 0);
    }
    
    return baseOffset;
  }

  private getChordFrequencies(rootNote: string, chordType: string, octave: number): number[] {
    const rootFreq = getNoteFrequency(rootNote, octave, 0);
    const intervals: Record<string, number[]> = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      seventh: [0, 4, 7, 10],
      minor7: [0, 3, 7, 10],
      major7: [0, 4, 7, 11]
    };
    const chordIntervals = intervals[chordType] || intervals.major;
    return chordIntervals.map(interval => rootFreq * Math.pow(2, interval / 12));
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.tracks.clear();
  }
}

export const audioEngine = new AudioEngine();
