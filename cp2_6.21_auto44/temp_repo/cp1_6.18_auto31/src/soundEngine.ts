export type NoteType = 'do' | 're' | 'mi' | 'fa';

const FREQUENCIES: Record<NoteType, number> = {
  do: 261.63,
  re: 293.66,
  mi: 329.63,
  fa: 349.23,
};

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playNote(type: NoteType): void {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(FREQUENCIES[type], now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playComboMelody(): void {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const notes: NoteType[] = ['do', 're', 'mi', 'fa'];
    notes.forEach((type, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const start = now + i * 0.12;
      osc.frequency.setValueAtTime(FREQUENCIES[type], start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
}

export const soundEngine = new SoundEngine();
