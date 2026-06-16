export interface BeatCallback {
  (beatNumber: number): void;
}

export class MusicManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private backgroundOscillators: OscillatorNode[] = [];
  private analyser: AnalyserNode | null = null;
  private beatCallbacks: BeatCallback[] = [];
  private bpm: number = 120;
  private beatInterval: number = 0;
  private lastBeatTime: number = 0;
  private currentBeat: number = 0;
  private isPlaying: boolean = false;
  private startTime: number = 0;

  constructor() {}

  public init(): void {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioContext.destination);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.masterGain.connect(this.analyser);

    this.beatInterval = 60000 / this.bpm;
  }

  public addBeatCallback(callback: BeatCallback): void {
    this.beatCallbacks.push(callback);
  }

  public start(): void {
    if (!this.audioContext) {
      this.init();
    }
    if (this.isPlaying || !this.audioContext) return;

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.lastBeatTime = 0;
    this.currentBeat = 0;

    this.generateBackgroundTrack();
    this.startBeatDetection();
  }

  private generateBackgroundTrack(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const beatDuration = 60 / this.bpm;

    const scheduleBeat = (startTime: number, beatInBar: number) => {
      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(0, startTime);
      kickGain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      kickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      kickGain.connect(this.masterGain!);

      const kick = ctx.createOscillator();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(120, startTime);
      kick.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
      kick.connect(kickGain);
      kick.start(startTime);
      kick.stop(startTime + 0.2);

      if (beatInBar === 2 || beatInBar === 4) {
        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(0, startTime);
        snareGain.gain.linearRampToValueAtTime(0.3, startTime + 0.005);
        snareGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        snareGain.connect(this.masterGain!);

        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const snare = ctx.createBufferSource();
        snare.buffer = buffer;
        const snareFilter = ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.value = 1500;
        snare.connect(snareFilter);
        snareFilter.connect(snareGain);
        snare.start(startTime);
        snare.stop(startTime + 0.15);
      }

      const hhGain = ctx.createGain();
      hhGain.gain.setValueAtTime(0, startTime);
      hhGain.gain.linearRampToValueAtTime(0.1, startTime + 0.005);
      hhGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
      hhGain.connect(this.masterGain!);

      const hhBufferSize = ctx.sampleRate * 0.05;
      const hhBuffer = ctx.createBuffer(1, hhBufferSize, ctx.sampleRate);
      const hhData = hhBuffer.getChannelData(0);
      for (let i = 0; i < hhBufferSize; i++) {
        hhData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hhBufferSize * 0.3));
      }
      const hh = ctx.createBufferSource();
      hh.buffer = hhBuffer;
      const hhFilter = ctx.createBiquadFilter();
      hhFilter.type = 'highpass';
      hhFilter.frequency.value = 7000;
      hh.connect(hhFilter);
      hhFilter.connect(hhGain);
      hh.start(startTime);
      hh.stop(startTime + 0.05);
    };

    const loopDuration = beatDuration * 4;
    const scheduleLoop = (loopStart: number) => {
      for (let i = 0; i < 4; i++) {
        scheduleBeat(loopStart + i * beatDuration, i + 1);
      }
    };

    const scheduleAhead = 0.5;
    let nextLoopTime = this.startTime;

    const scheduler = () => {
      if (!this.isPlaying || !this.audioContext) return;
      while (nextLoopTime < this.audioContext.currentTime + scheduleAhead) {
        scheduleLoop(nextLoopTime);
        nextLoopTime += loopDuration;
      }
      setTimeout(scheduler, 25);
    };
    scheduler();

    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.15;
    bassGain.connect(this.masterGain);

    const bassNotes = [130.81, 130.81, 164.81, 146.83];
    let bassNoteIndex = 0;

    const scheduleBassNote = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, time);
      noteGain.gain.linearRampToValueAtTime(0.8, time + 0.02);
      noteGain.gain.setValueAtTime(0.8, time + beatDuration * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.001, time + beatDuration);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(bassGain);
      osc.start(time);
      osc.stop(time + beatDuration);
    };

    let nextBassTime = this.startTime;
    const bassScheduler = () => {
      if (!this.isPlaying || !this.audioContext) return;
      while (nextBassTime < this.audioContext.currentTime + scheduleAhead) {
        scheduleBassNote(nextBassTime, bassNotes[bassNoteIndex % 4]);
        bassNoteIndex++;
        nextBassTime += beatDuration;
      }
      setTimeout(bassScheduler, 25);
    };
    bassScheduler();
  }

  private startBeatDetection(): void {
    if (!this.isPlaying) return;

    const now = performance.now();
    const elapsed = (this.audioContext?.currentTime || 0) - this.startTime;
    const expectedBeats = Math.floor(elapsed / (60 / this.bpm));

    if (expectedBeats > this.currentBeat) {
      while (this.currentBeat < expectedBeats) {
        this.currentBeat++;
        this.triggerBeat(this.currentBeat);
      }
    }

    if (this.isPlaying) {
      requestAnimationFrame(() => this.startBeatDetection());
    }
  }

  private triggerBeat(beatNumber: number): void {
    for (const callback of this.beatCallbacks) {
      callback(beatNumber);
    }
  }

  public playCollectSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 0.1;
    const masterVolume = this.masterGain.gain.value;

    const notes = [523.25, 659.25, 783.99];

    for (const freq of notes) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(masterVolume * 0.3, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    }
  }

  public getCurrentBeat(): number {
    return this.currentBeat;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
