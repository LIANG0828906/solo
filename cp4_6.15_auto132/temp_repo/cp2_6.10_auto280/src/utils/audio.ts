let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const NOTE_FREQUENCIES = [
  261.63,
  293.66,
  329.63,
  349.23,
  392.00,
  440.00,
  493.88,
  523.25,
  587.33,
  659.25,
  698.46,
  783.99,
];

export const playRandomNote = (intensity: number = 50): void => {
  try {
    const ctx = getAudioContext();

    const frequency = NOTE_FREQUENCIES[Math.floor(Math.random() * NOTE_FREQUENCIES.length)];
    const octaveShift = Math.floor(Math.random() * 2) - 1;
    const finalFrequency = frequency * Math.pow(2, octaveShift);

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(finalFrequency, ctx.currentTime);

    const detuneAmount = (Math.random() - 0.5) * 20;
    oscillator.detune.setValueAtTime(detuneAmount, ctx.currentTime);

    const duration = 0.3 + (intensity / 100) * 0.4;
    const volume = 0.1 + (intensity / 100) * 0.2;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};
