import { WeatherType } from '../weather-control/weatherStore';

let audioContext: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let currentSource: AudioBufferSourceNode | OscillatorNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let thunderInterval: number | null = null;
let birdInterval: number | null = null;
let isFading = false;

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0;
    masterGainNode.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

const fadeIn = (duration: number = 1) => {
  if (!masterGainNode || !audioContext) return;
  if (isFading) return;
  isFading = true;
  const now = audioContext.currentTime;
  masterGainNode.gain.cancelScheduledValues(now);
  masterGainNode.gain.setValueAtTime(0, now);
  masterGainNode.gain.linearRampToValueAtTime(1, now + duration);
  setTimeout(() => {
    isFading = false;
  }, duration * 1000);
};

const fadeOut = (duration: number = 1): Promise<void> => {
  return new Promise((resolve) => {
    if (!masterGainNode || !audioContext) {
      resolve();
      return;
    }
    if (isFading) {
      resolve();
      return;
    }
    isFading = true;
    const now = audioContext.currentTime;
    masterGainNode.gain.cancelScheduledValues(now);
    masterGainNode.gain.setValueAtTime(masterGainNode.gain.value, now);
    masterGainNode.gain.linearRampToValueAtTime(0, now + duration);
    setTimeout(() => {
      isFading = false;
      resolve();
    }, duration * 1000);
  });
};

const createWhiteNoise = (duration: number): AudioBuffer => {
  if (!audioContext) throw new Error('AudioContext not initialized');
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const playThunder = (frequency: number = 60, duration: number = 0.3, volume: number = 0.5) => {
  if (!audioContext || !masterGainNode) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = 'square';
  osc.frequency.value = frequency;

  filter.type = 'lowpass';
  filter.frequency.value = 200;

  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGainNode);

  osc.start();
  osc.stop(audioContext.currentTime + duration);
};

const scheduleThunder = (minInterval: number, maxInterval: number) => {
  if (thunderInterval) {
    clearInterval(thunderInterval);
  }
  const playRandomThunder = () => {
    const delay = Math.random() * (maxInterval - minInterval) + minInterval;
    thunderInterval = window.setTimeout(() => {
      playThunder();
      playRandomThunder();
    }, delay * 1000);
  };
  playRandomThunder();
};

const playBirdSound = () => {
  if (!audioContext || !masterGainNode) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  const baseFreq = 1500 + Math.random() * 500;
  osc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, audioContext.currentTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, audioContext.currentTime + 0.2);

  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(masterGainNode);

  osc.start();
  osc.stop(audioContext.currentTime + 0.3);
};

const scheduleBirds = () => {
  if (birdInterval) {
    clearInterval(birdInterval);
  }
  const playRandomBird = () => {
    const delay = Math.random() * 3 + 2;
    birdInterval = window.setTimeout(() => {
      playBirdSound();
      playRandomBird();
    }, delay * 1000);
  };
  playRandomBird();
};

const playSunny = () => {
  if (!audioContext || !masterGainNode) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1500;

  gain.gain.value = 0.1;

  osc.connect(gain);
  gain.connect(masterGainNode);

  osc.start();
  currentSource = osc;

  scheduleBirds();
};

const playRainy = () => {
  if (!audioContext || !masterGainNode) return;

  const noiseBuffer = createWhiteNoise(2);
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noise.loop = true;

  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  gain.gain.value = 0.3;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGainNode);

  noise.start();
  noiseSource = noise;
  currentSource = noise;

  scheduleThunder(2, 5);
};

const playSnowy = () => {
  if (!audioContext || !masterGainNode) return;

  const noiseBuffer = createWhiteNoise(2);
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noise.loop = true;

  filter.type = 'highpass';
  filter.frequency.value = 2000;

  gain.gain.value = 0.15;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGainNode);

  noise.start();
  noiseSource = noise;
  currentSource = noise;
};

const playStormy = () => {
  if (!audioContext || !masterGainNode) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.value = 80;

  filter.type = 'lowpass';
  filter.frequency.value = 200;

  gain.gain.value = 0.4;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGainNode);

  osc.start();
  currentSource = osc;

  scheduleThunder(1, 3);
};

export const playWeatherSound = (weatherType: WeatherType) => {
  initAudioContext();

  stopSound().then(() => {
    switch (weatherType) {
      case WeatherType.SUNNY:
        playSunny();
        break;
      case WeatherType.RAINY:
        playRainy();
        break;
      case WeatherType.SNOWY:
        playSnowy();
        break;
      case WeatherType.STORMY:
        playStormy();
        break;
    }
    fadeIn(1);
  });
};

export const stopSound = async (): Promise<void> => {
  if (thunderInterval) {
    clearTimeout(thunderInterval);
    thunderInterval = null;
  }
  if (birdInterval) {
    clearTimeout(birdInterval);
    birdInterval = null;
  }

  await fadeOut(1);

  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // ignore
    }
    currentSource = null;
  }
  if (noiseSource) {
    try {
      noiseSource.stop();
    } catch (e) {
      // ignore
    }
    noiseSource = null;
  }
};
