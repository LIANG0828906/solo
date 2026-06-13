export type SoundType = 'kick' | 'hihat';

export class AudioModule {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  playSound(type: SoundType): void {
    const ctx = this.getContext();
    
    if (type === 'kick') {
      this.playKick(ctx);
    } else {
      this.playHiHat(ctx);
    }
  }

  private playKick(ctx: AudioContext): void {
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const noise = this.createNoise(ctx);
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);

    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(gainNode);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.3);
    noise.stop(now + 0.3);
  }

  private playHiHat(ctx: AudioContext): void {
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const noise = this.createNoise(ctx);
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.Q.setValueAtTime(0.5, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.2);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.connect(filter);
    filter.connect(gainNode);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.2);
    noise.stop(now + 0.2);
  }

  private createNoise(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }
}
