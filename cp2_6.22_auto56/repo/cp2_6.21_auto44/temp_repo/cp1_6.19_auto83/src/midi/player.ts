import { InstrumentType, Note, Track, ProjectData, QUARTER_NOTE_WIDTH } from '../data/project';

export interface PlayerCallbacks {
  onPlayheadUpdate: (position: number) => void;
  onNotePlay: (trackId: string, noteId: string) => void;
  onPlayStop: () => void;
}

type OscType = OscillatorType;

interface InstrumentConfig {
  oscType: OscType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq?: number;
  filterQ?: number;
}

const INSTRUMENT_CONFIGS: Record<InstrumentType, InstrumentConfig> = {
  piano: {
    oscType: 'triangle',
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 0.8
  },
  guitar: {
    oscType: 'sawtooth',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.4,
    release: 0.5,
    filterFreq: 3000,
    filterQ: 1.5
  },
  drums: {
    oscType: 'square',
    attack: 0.001,
    decay: 0.08,
    sustain: 0,
    release: 0.1
  },
  bass: {
    oscType: 'sine',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.6,
    release: 0.3,
    filterFreq: 800,
    filterQ: 0.5
  }
};

export class MidiPlayer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private startTime = 0;
  private startPosition = 0;
  private animationFrameId: number | null = null;
  private scheduledNotes: Set<string> = new Set();
  private scheduledOscillators: Array<{ osc: OscillatorNode; gain: GainNode }> = [];
  private callbacks: PlayerCallbacks;
  private project: ProjectData | null = null;
  private bpm = 120;

  constructor(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks;
  }

  private initAudioContext(): void {
    if (this.audioContext) return;

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AC();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.audioContext.destination);
  }

  setProject(project: ProjectData): void {
    this.project = project;
    this.bpm = project.meta.bpm;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private beatsToSeconds(beats: number): number {
    return beats * (60 / this.bpm);
  }

  play(fromPosition: number = 0): void {
    if (!this.project) return;

    this.initAudioContext();
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopScheduledOscillators();
    this.scheduledNotes.clear();
    this.scheduledOscillators = [];

    this.isPlaying = true;
    this.startTime = this.audioContext!.currentTime;
    this.startPosition = fromPosition;

    this.scheduleAllNotes();
    this.startPlayheadLoop();
  }

  pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.stopScheduledOscillators();
    this.callbacks.onPlayStop();
  }

  stop(): void {
    this.isPlaying = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.stopScheduledOscillators();
    this.scheduledNotes.clear();
    this.scheduledOscillators = [];
    this.callbacks.onPlayheadUpdate(0);
    this.callbacks.onPlayStop();
  }

  private stopScheduledOscillators(): void {
    const now = this.audioContext?.currentTime || 0;
    this.scheduledOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.stop(now + 0.06);
      } catch {
        try {
          osc.stop(now);
        } catch {}
      }
    });
    this.scheduledOscillators = [];
  }

  private scheduleAllNotes(): void {
    if (!this.project || !this.audioContext) return;

    this.project.tracks.forEach(track => {
      if (track.muted) return;

      track.notes.forEach(note => {
        if (note.start + note.duration < this.startPosition) return;

        const noteStartBeat = Math.max(0, note.start - this.startPosition);
        const noteStartAudio = this.startTime + this.beatsToSeconds(noteStartBeat);

        if (noteStartAudio >= this.audioContext!.currentTime - 0.05) {
          this.scheduleNote(track, note, noteStartAudio);
        }
      });
    });
  }

  private scheduleNote(
    track: Track,
    note: Note,
    when: number
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const noteKey = `${track.id}-${note.id}`;
    if (this.scheduledNotes.has(noteKey)) return;
    this.scheduledNotes.add(noteKey);

    const config = INSTRUMENT_CONFIGS[track.instrument];
    const duration = this.beatsToSeconds(note.duration);
    const freq = this.midiToFreq(note.pitch);

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const trackGain = this.audioContext.createGain();

    osc.type = config.oscType;
    osc.frequency.value = freq;

    trackGain.gain.value = track.volume * note.velocity;

    let outputNode: AudioNode = osc;

    if (config.filterFreq) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = config.filterFreq;
      filter.Q.value = config.filterQ || 1;
      osc.connect(filter);
      outputNode = filter;
    }

    if (track.instrument === 'piano') {
      const osc2 = this.audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq;
      const gain2 = this.audioContext.createGain();
      gain2.gain.value = 0.3;

      osc2.connect(gain2);
      gain2.connect(gain);

      const attackEnd = when + config.attack;
      const decayEnd = attackEnd + config.decay;
      const releaseEnd = when + duration + config.release;

      gain2.gain.setValueAtTime(0, when);
      gain2.gain.linearRampToValueAtTime(0.3 * note.velocity, attackEnd);
      gain2.gain.exponentialRampToValueAtTime(
        0.3 * note.velocity * config.sustain + 0.001,
        decayEnd
      );
      gain2.gain.cancelScheduledValues(releaseEnd);
      gain2.gain.setValueAtTime(gain2.gain.value, when + duration);
      gain2.gain.exponentialRampToValueAtTime(0.001, releaseEnd);

      osc2.start(when);
      osc2.stop(releaseEnd + 0.02);
    }

    if (track.instrument === 'drums') {
      osc.frequency.setValueAtTime(freq * 2, when);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, when + duration);
    }

    if (track.instrument === 'bass') {
      const dist = this.audioContext.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curve[i] = Math.tanh(x * 3);
      }
      dist.curve = curve;
      outputNode.connect(dist);
      outputNode = dist;
    }

    outputNode.connect(gain);
    gain.connect(trackGain);
    trackGain.connect(this.masterGain);

    const attackEnd = when + config.attack;
    const decayEnd = attackEnd + config.decay;
    const sustainLevel = note.velocity * config.sustain;
    const noteEnd = when + duration;
    const releaseEnd = noteEnd + config.release;

    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(note.velocity, attackEnd);
    gain.gain.exponentialRampToValueAtTime(sustainLevel + 0.001, decayEnd);

    if (config.sustain > 0 && duration > config.attack + config.decay) {
      gain.gain.setValueAtTime(sustainLevel + 0.001, noteEnd);
    }

    gain.gain.cancelScheduledValues(noteEnd);
    gain.gain.setValueAtTime(gain.gain.value, noteEnd);
    gain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);

    osc.start(when);
    osc.stop(releaseEnd + 0.02);

    this.scheduledOscillators.push({ osc, gain });

    const triggerDelay = Math.max(0, (when - this.audioContext.currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying) {
        this.callbacks.onNotePlay(track.id, note.id);
      }
    }, triggerDelay);
  }

  private startPlayheadLoop(): void {
    if (!this.audioContext) return;

    const update = () => {
      if (!this.isPlaying || !this.audioContext) return;

      const elapsed = this.audioContext.currentTime - this.startTime;
      const currentPosition = this.startPosition + (elapsed * this.bpm) / 60;

      let maxEnd = this.startPosition;
      if (this.project) {
        this.project.tracks.forEach(t => {
          t.notes.forEach(n => {
            const end = n.start + n.duration;
            if (end > maxEnd) maxEnd = end;
          });
        });
      }

      if (currentPosition >= maxEnd + 2) {
        this.stop();
        return;
      }

      this.callbacks.onPlayheadUpdate(currentPosition);
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  previewNote(instrument: InstrumentType, pitch: number, duration: number = 0.25): void {
    this.initAudioContext();
    if (!this.audioContext || !this.masterGain) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const config = INSTRUMENT_CONFIGS[instrument];
    const freq = this.midiToFreq(pitch);

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = config.oscType;
    osc.frequency.value = freq;

    if (config.filterFreq) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = config.filterFreq;
      filter.Q.value = config.filterQ || 1;
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    const noteDuration = duration * (60 / this.bpm);
    const attackEnd = now + config.attack;
    const releaseEnd = now + noteDuration + config.release;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, attackEnd);
    gain.gain.setValueAtTime(0.6, now + noteDuration);
    gain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);

    osc.start(now);
    osc.stop(releaseEnd + 0.02);
  }

  cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export function positionToPixels(position: number): number {
  return position * QUARTER_NOTE_WIDTH;
}

export function pixelsToPosition(pixels: number): number {
  return pixels / QUARTER_NOTE_WIDTH;
}
