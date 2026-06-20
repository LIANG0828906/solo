let audioCtx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
};

export const playTone = (frequency: number, duration = 0.3, type: OscillatorType = 'sine', volume = 0.2) => {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

export const playMatchSuccess = () => {
  playTone(523.25, 0.15, 'sine', 0.25);
  setTimeout(() => playTone(659.25, 0.15, 'sine', 0.2), 80);
  setTimeout(() => playTone(783.99, 0.25, 'sine', 0.2), 160);
};

export const playMatchFail = () => {
  playTone(200, 0.2, 'square', 0.15);
};

export const playRuneSuccess = () => {
  playTone(880, 0.1, 'triangle', 0.2);
};

export const playRuneFail = () => {
  playTone(150, 0.15, 'sawtooth', 0.15);
};

export const playVictory = () => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.35, 'sine', 0.25), i * 120);
  });
};
