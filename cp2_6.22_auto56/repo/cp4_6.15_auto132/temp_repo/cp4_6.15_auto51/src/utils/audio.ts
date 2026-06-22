let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let volume = 0.3;

const initAudio = (): void => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volumeMultiplier: number = 1
): void => {
  if (!audioContext || !masterGain) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume * volumeMultiplier, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

export const playCardPlace = (): void => {
  initAudio();
  playTone(880, 0.08, 'sine', 0.8);
  setTimeout(() => playTone(660, 0.06, 'sine', 0.6), 20);
};

export const playFoundationSuccess = (comboCount: number = 1): void => {
  initAudio();
  const baseFreq = 523.25;
  const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
  const maxNotes = Math.min(comboCount + 1, notes.length);

  for (let i = 0; i < maxNotes; i++) {
    setTimeout(() => {
      playTone(notes[i], 0.12, 'sine', 0.9);
    }, i * 60);
  }
};

export const playInvalidMove = (): void => {
  initAudio();
  playTone(150, 0.15, 'square', 0.4);
  setTimeout(() => playTone(120, 0.12, 'square', 0.3), 80);
};

export const playFlip = (): void => {
  initAudio();
  playTone(440, 0.05, 'triangle', 0.5);
};

export const playDraw = (): void => {
  initAudio();
  playTone(330, 0.04, 'sine', 0.4);
  setTimeout(() => playTone(392, 0.04, 'sine', 0.35), 30);
  setTimeout(() => playTone(440, 0.04, 'sine', 0.3), 60);
};

export const playWin = (): void => {
  initAudio();
  const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.8), i * 120);
  });
};

export const setVolume = (newVolume: number): void => {
  volume = Math.max(0, Math.min(1, newVolume));
  if (masterGain) {
    masterGain.gain.value = volume;
  }
};

export const getVolume = (): number => volume;
