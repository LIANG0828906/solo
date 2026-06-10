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

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  attack: number = 0.01,
  decay: number = 0.1
) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

export const playGearRotate = () => {
  const ctx = getAudioContext();
  const duration = 0.2;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const envelope = Math.exp(-t * 15);
    const noise = (Math.random() * 2 - 1) * 0.3;
    const metallic = Math.sin(t * 300) * 0.2 * envelope;
    data[i] = (noise + metallic) * envelope * 0.4;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.value = 0.25;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
};

export const playGearLock = () => {
  playTone(880, 0.15, 'sine', 0.25, 0.005, 0.1);
  setTimeout(() => {
    playTone(1320, 0.2, 'sine', 0.2, 0.005, 0.15);
  }, 50);
};

export const playCollect = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.15, 'sine', 0.15, 0.01, 0.1);
    }, i * 60);
  });
};

export const playUnlock = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [392, 493.88, 587.33, 783.99, 987.77].forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.3, 'triangle', 0.18, 0.02, 0.2);
    }, i * 100);
  });

  setTimeout(() => {
    const bufferSize = ctx.sampleRate * 1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 3);
      const shimmer = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.3;
      data[i] = shimmer * envelope * 0.15;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }, 400);
};

export const playError = () => {
  const ctx = getAudioContext();
  const duration = 0.3;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const envelope = Math.exp(-t * 10);
    const vibration = Math.sin(t * 80) * 0.5 * envelope;
    data[i] = vibration * 0.3;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  const gain = ctx.createGain();
  gain.gain.value = 0.35;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
};
