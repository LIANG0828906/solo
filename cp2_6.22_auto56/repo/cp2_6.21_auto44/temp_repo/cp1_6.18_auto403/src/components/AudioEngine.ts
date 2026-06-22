import type { Note } from '../store';
import type { Waveform } from '../store';

interface PlaybackSnapshot {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  bpm: number;
  volume: number;
  reverb: number;
  waveform: Waveform;
}

interface ActiveNote {
  oscillator: OscillatorNode;
  envelopeGain: GainNode;
  stopAtTime: number;
}

const midiToFrequency = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

class AudioEngineSingleton {
  private static instance: AudioEngineSingleton | null = null;

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private activeNotes: Map<string, ActiveNote> = new Map();

  private playStartContextTime = 0;
  private playStartStoreTime = 0;
  private isPlaying = false;
  private playLoopId: number | null = null;
  private scheduledNoteIds = new Set<string>();

  public onTimeUpdate: ((time: number) => void) | null = null;
  public onPlayEnd: (() => void) | null = null;

  static getInstance(): AudioEngineSingleton {
    if (!AudioEngineSingleton.instance) {
      AudioEngineSingleton.instance = new AudioEngineSingleton();
    }
    return AudioEngineSingleton.instance;
  }

  private ensureContext() {
    if (this.audioContext) return this.audioContext;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.audioContext = ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.7;

    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.8;

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.generateImpulseResponse(ctx, 2.5, 2);

    this.reverbWetGain = ctx.createGain();
    this.reverbWetGain.gain.value = 0.2;

    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;

    this.masterGain.connect(this.dryGain).connect(this.analyserNode);
    this.masterGain.connect(this.convolver).connect(this.reverbWetGain).connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);

    return ctx;
  }

  private generateImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  getAnalyser(): AnalyserNode | null {
    this.ensureContext();
    return this.analyserNode;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  updateVolume(volumePercent: number) {
    this.ensureContext();
    if (!this.masterGain) return;
    const target = volumePercent / 100;
    if (this.audioContext) {
      this.masterGain.gain.setTargetAtTime(target, this.audioContext.currentTime, 0.01);
    } else {
      this.masterGain.gain.value = target;
    }
  }

  updateReverb(reverbPercent: number) {
    this.ensureContext();
    const wet = reverbPercent / 100;
    const dry = 1 - wet * 0.6;
    if (this.audioContext && this.reverbWetGain && this.dryGain) {
      this.reverbWetGain.gain.setTargetAtTime(wet, this.audioContext.currentTime, 0.01);
      this.dryGain.gain.setTargetAtTime(dry, this.audioContext.currentTime, 0.01);
    }
  }

  private scheduleNote(
    note: Note,
    contextTime: number,
    waveform: Waveform,
    masterBpm: number,
  ) {
    if (!this.audioContext || !this.masterGain) return;
    const osc = this.audioContext.createOscillator();
    const env = this.audioContext.createGain();
    osc.type = waveform;
    osc.frequency.value = midiToFrequency(note.pitch);

    const speedFactor = 120 / masterBpm;
    const startCtx = contextTime + note.startTime * speedFactor;
    const durationSec = note.duration * speedFactor;
    const endCtx = startCtx + durationSec;

    const attack = 0.01;
    const release = Math.min(0.12, durationSec * 0.3);
    const peak = 0.25;

    env.gain.setValueAtTime(0, startCtx);
    env.gain.linearRampToValueAtTime(peak, startCtx + attack);
    env.gain.setValueAtTime(peak, endCtx - release);
    env.gain.linearRampToValueAtTime(0, endCtx);

    osc.connect(env).connect(this.masterGain);
    osc.start(startCtx);
    osc.stop(endCtx + release + 0.05);

    this.activeNotes.set(note.id, {
      oscillator: osc,
      envelopeGain: env,
      stopAtTime: endCtx + release + 0.05,
    });
  }

  play(notes: Note[], snapshot: PlaybackSnapshot) {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') ctx.resume();

    this.stopAllActiveNotes();
    this.scheduledNoteIds.clear();

    const speedFactor = 120 / snapshot.bpm;
    const durationScaled = 8 * speedFactor;

    this.isPlaying = true;
    this.playStartContextTime = ctx.currentTime;
    this.playStartStoreTime = snapshot.currentTime;

    notes.forEach((n) => {
      const noteStartCtx = this.playStartContextTime + (n.startTime - this.playStartStoreTime) * speedFactor;
      if (noteStartCtx + 0.001 >= ctx.currentTime) {
        this.scheduleNote(n, this.playStartContextTime - this.playStartStoreTime * speedFactor, snapshot.waveform, snapshot.bpm);
        this.scheduledNoteIds.add(n.id);
      }
    });

    this.updateVolume(snapshot.volume);
    this.updateReverb(snapshot.reverb);

    const loop = () => {
      if (!this.isPlaying || !this.audioContext) return;
      const elapsed = (this.audioContext.currentTime - this.playStartContextTime) / speedFactor;
      const current = this.playStartStoreTime + elapsed;

      if (current >= 8) {
        this.stop();
        if (this.onPlayEnd) this.onPlayEnd();
        return;
      }
      if (this.onTimeUpdate) this.onTimeUpdate(current);
      this.playLoopId = requestAnimationFrame(loop);
    };
    this.playLoopId = requestAnimationFrame(loop);
  }

  pause() {
    this.isPlaying = false;
    if (this.playLoopId !== null) cancelAnimationFrame(this.playLoopId);
    this.playLoopId = null;
    this.stopAllActiveNotes();
  }

  stop() {
    this.isPlaying = false;
    if (this.playLoopId !== null) cancelAnimationFrame(this.playLoopId);
    this.playLoopId = null;
    this.stopAllActiveNotes();
  }

  private stopAllActiveNotes() {
    if (!this.audioContext) {
      this.activeNotes.clear();
      return;
    }
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach((an) => {
      try {
        an.envelopeGain.gain.cancelScheduledValues(now);
        an.envelopeGain.gain.setValueAtTime(an.envelopeGain.gain.value, now);
        an.envelopeGain.gain.linearRampToValueAtTime(0, now + 0.05);
        an.oscillator.stop(now + 0.06);
      } catch {
        // ignore
      }
    });
    this.activeNotes.clear();
  }

  private midiWriteVarLen(value: number): number[] {
    let buffer = value & 0x7f;
    const out: number[] = [];
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }
    while (true) {
      out.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return out;
  }

  private midiNumberToBytes(value: number, bytes: number): number[] {
    const out: number[] = [];
    for (let i = bytes - 1; i >= 0; i--) out.push((value >> (i * 8)) & 0xff);
    return out;
  }

  private stringToBytes(str: string): number[] {
    return Array.from(str).map((c) => c.charCodeAt(0));
  }

  exportMidi(notes: Note[], bpm: number, filename: string) {
    const PPQN = 480;
    const microsecondsPerBeat = Math.floor(60000000 / bpm);
    const secondsPerTick = 60 / (bpm * PPQN);

    const events: { tick: number; bytes: number[] }[] = [];

    events.push({
      tick: 0,
      bytes: [0xff, 0x51, 0x03, ...this.midiNumberToBytes(microsecondsPerBeat, 3)],
    });

    const sorted = [...notes].sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch);
    sorted.forEach((note) => {
      const startTick = Math.round(note.startTime / secondsPerTick);
      const endTick = Math.round((note.startTime + note.duration) / secondsPerTick);
      events.push({ tick: startTick, bytes: [0x90, note.pitch, 0x64] });
      events.push({ tick: endTick, bytes: [0x80, note.pitch, 0x40] });
    });

    events.push({
      tick: events.length > 0 ? Math.max(...events.map((e) => e.tick)) + PPQN : PPQN,
      bytes: [0xff, 0x2f, 0x00],
    });

    events.sort((a, b) => a.tick - b.tick);

    const trackBytes: number[] = [];
    let prevTick = 0;
    events.forEach((ev) => {
      const delta = ev.tick - prevTick;
      trackBytes.push(...this.midiWriteVarLen(delta));
      trackBytes.push(...ev.bytes);
      prevTick = ev.tick;
    });

    const header: number[] = [
      ...this.stringToBytes('MThd'),
      ...this.midiNumberToBytes(6, 4),
      ...this.midiNumberToBytes(0, 2),
      ...this.midiNumberToBytes(1, 2),
      ...this.midiNumberToBytes(PPQN, 2),
    ];

    const trackChunk: number[] = [
      ...this.stringToBytes('MTrk'),
      ...this.midiNumberToBytes(trackBytes.length, 4),
      ...trackBytes,
    ];

    const full = [...header, ...trackChunk];
    const uint8 = new Uint8Array(full);
    const blob = new Blob([uint8], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = (filename || 'melody').replace(/\.mid$/i, '');
    a.download = `${baseName}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const AudioEngine = AudioEngineSingleton;
