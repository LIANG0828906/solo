import { midiNumberToFrequency } from './parser';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private metronomeGain: GainNode | null = null;
  private metronomeTimer: number | null = null;
  private metronomeStartTime: number = 0;
  private metronomeBeatCount: number = 0;
  private bpm: number = 120;
  private onBeatCallback: ((beat: number, isStrong: boolean) => void) | null = null;

  constructor() {}

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);

      this.metronomeGain = this.audioContext.createGain();
      this.metronomeGain.gain.value = 0.3;
      this.metronomeGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playNote(midiNumber: number, durationSeconds: number, startTime?: number) {
    this.initContext();
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const when = startTime ?? ctx.currentTime;
    const frequency = midiNumberToFrequency(midiNumber);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = frequency;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = frequency;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(0.3, when + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, when + durationSeconds);

    const mixer = ctx.createGain();
    mixer.gain.value = 0.5;
    osc1.connect(mixer);
    osc2.connect(mixer);
    mixer.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(when);
    osc2.start(when);
    osc1.stop(when + durationSeconds + 0.05);
    osc2.stop(when + durationSeconds + 0.05);
  }

  playMetronomeClick(isStrong: boolean) {
    this.initContext();
    if (!this.audioContext || !this.metronomeGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const frequency = isStrong ? 5000 : 1000;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = frequency;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gainNode);
    gainNode.connect(this.metronomeGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  startMetronome(bpm: number, onBeat: (beat: number, isStrong: boolean) => void) {
    this.initContext();
    this.stopMetronome();
    this.bpm = bpm;
    this.onBeatCallback = onBeat;
    this.metronomeBeatCount = 0;
    this.metronomeStartTime = this.audioContext?.currentTime ?? 0;
    this.scheduleMetronome();
  }

  private scheduleMetronome() {
    if (!this.audioContext) return;

    const beatInterval = 60 / this.bpm;
    const now = this.audioContext.currentTime;

    const scheduleAhead = 0.1;
    while (this.metronomeStartTime <= now + scheduleAhead) {
      const isStrong = this.metronomeBeatCount % 4 === 0;
      const beat = (this.metronomeBeatCount % 4) + 1;
      
      this.playMetronomeClick(isStrong);
      
      const delay = Math.max(0, (this.metronomeStartTime - now) * 1000);
      setTimeout(() => {
        if (this.onBeatCallback) {
          this.onBeatCallback(beat, isStrong);
        }
      }, delay);

      this.metronomeStartTime += beatInterval;
      this.metronomeBeatCount++;
    }

    this.metronomeTimer = window.requestAnimationFrame(() => this.scheduleMetronome());
  }

  stopMetronome() {
    if (this.metronomeTimer !== null) {
      window.cancelAnimationFrame(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    this.onBeatCallback = null;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  getCurrentTime(): number {
    this.initContext();
    return this.audioContext?.currentTime ?? 0;
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioEngine = new AudioEngine();
