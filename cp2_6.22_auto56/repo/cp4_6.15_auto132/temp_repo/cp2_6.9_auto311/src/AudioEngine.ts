import * as Tone from 'tone';

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private analyser: Tone.Analyser | null = null;
  private initialized = false;
  private currentFrequency = 0;

  async init(): Promise<void> {
    if (this.initialized) return;

    await Tone.start();

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.05,
        decay: 1.2,
        sustain: 0.0,
        release: 0.5,
      },
    }).toDestination();

    const harmonic1 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 1.0, sustain: 0.0, release: 0.4 },
    }).toDestination();

    const harmonic2 = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.08, decay: 0.8, sustain: 0.0, release: 0.3 },
    }).toDestination();

    const harmonic3 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.6, sustain: 0.0, release: 0.2 },
    }).toDestination();

    (this.synth as any)._harmonics = [harmonic1, harmonic2, harmonic3];

    const filter = new Tone.Filter({
      frequency: 8000,
      type: 'lowpass',
      Q: 0.5,
    });

    const reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.15,
    });

    this.synth.connect(filter);
    harmonic1.connect(filter);
    harmonic2.connect(filter);
    harmonic3.connect(filter);
    filter.connect(reverb);
    reverb.toDestination();

    this.analyser = new Tone.Analyser('waveform', 1024);
    this.synth.connect(this.analyser);
    harmonic1.connect(this.analyser);
    harmonic2.connect(this.analyser);
    harmonic3.connect(this.analyser);

    this.initialized = true;
  }

  playBell(frequency: number, velocity: number = 0.8): void {
    if (!this.synth || !this.initialized) return;

    this.currentFrequency = frequency;

    const now = Tone.now();
    this.synth.triggerAttackRelease(frequency, '1.2n', now, velocity * 0.6);

    const harmonics = (this.synth as any)._harmonics;
    if (harmonics) {
      harmonics[0].triggerAttackRelease(frequency * 2, '1.2n', now, velocity * 0.25);
      harmonics[1].triggerAttackRelease(frequency * 3, '1.2n', now, velocity * 0.1);
      harmonics[2].triggerAttackRelease(frequency * 4, '1.2n', now, velocity * 0.05);
    }
  }

  getWaveformData(): Float32Array {
    if (!this.analyser) return new Float32Array(1024);
    return this.analyser.getValue() as Float32Array;
  }

  getFrequency(): number {
    return this.currentFrequency;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  dispose(): void {
    if (this.synth) {
      const harmonics = (this.synth as any)._harmonics;
      if (harmonics) {
        harmonics.forEach((h: Tone.Synth) => h.dispose());
      }
      this.synth.dispose();
    }
    if (this.analyser) {
      this.analyser.dispose();
    }
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();
