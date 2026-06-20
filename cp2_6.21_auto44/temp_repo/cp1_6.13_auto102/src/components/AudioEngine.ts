export class AudioEngine {
  private audioContext: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  resume() {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  playTone(frequency: number, duration: number = 0.2, volume: number = 0.15) {
    const ctx = this.ensureContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  calculateFrequency(color: string, speed: number): number {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const colorFactor = (b - r + 255) / 510;
    const speedFactor = Math.min(speed / 10, 1);

    const baseFreq = 100 + colorFactor * 400;
    const speedBoost = speedFactor * 300;

    return Math.round(Math.min(800, Math.max(100, baseFreq + speedBoost)));
  }
}

export const audioEngine = new AudioEngine();
