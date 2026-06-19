type SoundType = 'click' | 'success' | 'fail';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  private playTone(
    frequencies: number[],
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.15,
    overlapMs: number = 80
  ) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + i * overlapMs / 1000);
      gain.gain.setValueAtTime(0, now + i * overlapMs / 1000);
      gain.gain.linearRampToValueAtTime(volume, now + i * overlapMs / 1000 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * overlapMs / 1000 + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * overlapMs / 1000);
      osc.stop(now + i * overlapMs / 1000 + duration + 0.02);
    });
  }

  play(type: SoundType) {
    switch (type) {
      case 'click':
        this.playTone([520], 0.06, 'sine', 0.1);
        break;
      case 'success':
        this.playTone([523.25, 659.25, 783.99], 0.18, 'triangle', 0.12, 100);
        break;
      case 'fail':
        this.playTone([220, 180], 0.18, 'sawtooth', 0.09, 90);
        break;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();
