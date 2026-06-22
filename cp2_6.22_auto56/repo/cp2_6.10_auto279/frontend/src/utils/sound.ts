let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

export const playFusionSound = (): void => {
  playTone(523.25, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 100);
  setTimeout(() => playTone(783.99, 0.15, 'sine', 0.25), 200);
  setTimeout(() => playTone(1046.50, 0.2, 'triangle', 0.3), 350);
};

export const playSuccessSound = (): void => {
  playTone(523.25, 0.1, 'square', 0.15);
  setTimeout(() => playTone(659.25, 0.1, 'square', 0.15), 80);
  setTimeout(() => playTone(783.99, 0.2, 'square', 0.15), 160);
};

export const playFailureSound = (): void => {
  playTone(311.13, 0.2, 'sawtooth', 0.2);
  setTimeout(() => playTone(261.63, 0.2, 'sawtooth', 0.2), 150);
  setTimeout(() => playTone(220.00, 0.3, 'sawtooth', 0.2), 300);
};

export const playEventSound = (): void => {
  playTone(440.00, 0.15, 'triangle', 0.25);
  setTimeout(() => playTone(440.00, 0.15, 'triangle', 0.25), 200);
  setTimeout(() => playTone(554.37, 0.2, 'triangle', 0.3), 400);
};

export const playExplosionSound = (): void => {
  playTone(100.00, 0.1, 'sawtooth', 0.4);
  playTone(80.00, 0.15, 'sawtooth', 0.35);
  setTimeout(() => playTone(60.00, 0.2, 'sawtooth', 0.3), 100);
};

export const playDragStartSound = (): void => {
  playTone(440.00, 0.05, 'sine', 0.1);
};

export const playDropSound = (): void => {
  playTone(660.00, 0.08, 'sine', 0.15);
};

export const playClickSound = (): void => {
  playTone(800.00, 0.03, 'square', 0.08);
};
