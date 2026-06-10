class AudioEngine {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ): void {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  playCollision(): void {
    this.playTone(440, 0.1, 'sine', 0.3);
  }

  playSuccess(): void {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', 0.25);
      }, index * 150);
    });
  }

  playFailure(): void {
    const notes = [440.00, 349.23, 293.66];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sawtooth', 0.2);
      }, index * 200);
    });
  }

  playTick(): void {
    this.playTone(880, 0.05, 'sine', 0.15);
  }
}

export const audioEngine = new AudioEngine();
