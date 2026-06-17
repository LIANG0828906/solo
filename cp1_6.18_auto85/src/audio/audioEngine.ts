import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.Synth | null = null;
  private errorSynth: Tone.Synth | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();

    this.synth = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2,
      },
    }).toDestination();
    this.synth.volume.value = -12;

    this.errorSynth = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();
    this.errorSynth.volume.value = -8;

    this.initialized = true;
  }

  playNote(note: string, duration: string = '4n'): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttackRelease(note, duration);
    } catch (e) {
      console.warn('playNote error:', e);
    }
  }

  playError(): void {
    if (!this.errorSynth) return;
    try {
      this.errorSynth.triggerAttackRelease('200', '8n');
    } catch (e) {
      console.warn('playError error:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
