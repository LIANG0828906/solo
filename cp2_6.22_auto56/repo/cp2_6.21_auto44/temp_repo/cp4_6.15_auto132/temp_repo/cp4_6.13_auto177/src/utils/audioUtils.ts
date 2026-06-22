let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function playCraftSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(660, now);
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);
  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.22);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1320, now + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
  gain2.gain.setValueAtTime(0.0001, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.18, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.2);
}
