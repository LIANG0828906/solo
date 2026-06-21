export class SoundManager {
    private audioCtx: AudioContext | null = null;

    private getContext(): AudioContext {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    playMatch(): void {
        try {
            const ctx = this.getContext();
            const t = ctx.currentTime;

            const o1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            o1.connect(g1);
            g1.connect(ctx.destination);
            o1.type = 'sine';
            o1.frequency.setValueAtTime(660, t);
            o1.frequency.setValueAtTime(880, t + 0.08);
            o1.frequency.setValueAtTime(1100, t + 0.16);
            g1.gain.setValueAtTime(0.25, t);
            g1.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
            o1.start(t);
            o1.stop(t + 0.35);

            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.connect(g2);
            g2.connect(ctx.destination);
            o2.type = 'triangle';
            o2.frequency.setValueAtTime(1320, t + 0.1);
            o2.frequency.setValueAtTime(1760, t + 0.2);
            g2.gain.setValueAtTime(0, t);
            g2.gain.linearRampToValueAtTime(0.15, t + 0.1);
            g2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            o2.start(t);
            o2.stop(t + 0.4);
        } catch (_) {}
    }

    playError(): void {
        try {
            const ctx = this.getContext();
            const t = ctx.currentTime;

            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(220, t);
            o.frequency.linearRampToValueAtTime(140, t + 0.25);
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            o.start(t);
            o.stop(t + 0.3);

            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.connect(g2);
            g2.connect(ctx.destination);
            o2.type = 'square';
            o2.frequency.setValueAtTime(180, t + 0.05);
            o2.frequency.linearRampToValueAtTime(100, t + 0.2);
            g2.gain.setValueAtTime(0.08, t + 0.05);
            g2.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            o2.start(t + 0.05);
            o2.stop(t + 0.25);
        } catch (_) {}
    }

    playVictory(): void {
        try {
            const ctx = this.getContext();
            const t = ctx.currentTime;
            const notes = [523, 587, 659, 784, 880, 1047, 1175, 1319];

            notes.forEach((freq, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = i % 2 === 0 ? 'sine' : 'triangle';
                o.frequency.setValueAtTime(freq, t + i * 0.12);
                g.gain.setValueAtTime(0, t + i * 0.12);
                g.gain.linearRampToValueAtTime(0.25, t + i * 0.12 + 0.03);
                g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.4);
                o.start(t + i * 0.12);
                o.stop(t + i * 0.12 + 0.4);
            });
        } catch (_) {}
    }

    playSelect(): void {
        try {
            const ctx = this.getContext();
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(880, t);
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            o.start(t);
            o.stop(t + 0.1);
        } catch (_) {}
    }
}
