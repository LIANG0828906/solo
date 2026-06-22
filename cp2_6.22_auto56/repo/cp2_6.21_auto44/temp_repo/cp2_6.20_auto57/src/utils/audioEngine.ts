const SEMITONE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];

  init(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  noteToFrequency(pitch: string, octave: number): number {
    const semitone = SEMITONE_OFFSETS[pitch] ?? 0;
    const midiNote = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  playNote(pitch: string, octave: number, duration: number, velocity: number, tempo: number): void {
    const ctx = this.init();
    const frequency = this.noteToFrequency(pitch, octave);
    const beatDuration = 60 / tempo;
    const noteDuration = duration * beatDuration;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const gain = (velocity / 127) * 0.5;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime + noteDuration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + noteDuration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + noteDuration + 0.05);

    this.activeOscillators.push(oscillator);
    oscillator.onended = () => {
      const idx = this.activeOscillators.indexOf(oscillator);
      if (idx !== -1) this.activeOscillators.splice(idx, 1);
    };
  }

  stopAll(): void {
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
      } catch {
        // oscillator may have already stopped
      }
    }
    this.activeOscillators = [];
  }
}

export const audioEngine = new AudioEngine();
