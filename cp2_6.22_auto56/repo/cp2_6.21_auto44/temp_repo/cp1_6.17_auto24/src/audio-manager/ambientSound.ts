import { WeatherType } from '../weather-control/weatherStore';

let audioContext: AudioContext | null = null;
let currentSource: {
  stop: () => void;
} | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const createWhiteNoise = (
  ctx: AudioContext,
  volume: number
): { source: AudioBufferSourceNode; gain: GainNode } => {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();

  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);

  return { source, gain };
};

const createBirdSound = (ctx: AudioContext): { stop: () => void } => {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);

  let stopped = false;
  let timeoutId: number | null = null;

  const playChirp = () => {
    if (stopped) return;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1500;

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.linearRampToValueAtTime(2000, now + 0.1);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.2);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(gain);

    osc.start(now);
    osc.stop(now + 0.25);

    const nextChirp = 1000 + Math.random() * 2000;
    timeoutId = window.setTimeout(playChirp, nextChirp);
  };

  playChirp();

  return {
    stop: () => {
      stopped = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        gain.disconnect();
      }, 350);
    }
  };
};

const createThunderSound = (
  ctx: AudioContext,
  baseFreq: number,
  type: OscillatorType,
  volume: number,
  intervalMin: number,
  intervalMax: number
): { stop: () => void } => {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);

  let stopped = false;
  let timeoutId: number | null = null;

  const playThunder = () => {
    if (stopped) return;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = baseFreq;

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + 0.3);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(volume * 2, now + 0.05);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(gain);

    osc.start(now);
    osc.stop(now + 0.35);

    const nextThunder = (intervalMin + Math.random() * (intervalMax - intervalMin)) * 1000;
    timeoutId = window.setTimeout(playThunder, nextThunder);
  };

  playThunder();

  return {
    stop: () => {
      stopped = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
  };
};

const createRainSound = (ctx: AudioContext): { stop: () => void } => {
  const noise = createWhiteNoise(ctx, 0.3);
  const thunder = createThunderSound(ctx, 60, 'square', 0.2, 2, 5);

  return {
    stop: () => {
      noise.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      thunder.stop();
      setTimeout(() => {
        noise.source.stop();
      }, 550);
    }
  };
};

const createSnowSound = (ctx: AudioContext): { stop: () => void } => {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();

  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(() => {
        source.stop();
      }, 550);
    }
  };
};

const createStormSound = (ctx: AudioContext): { stop: () => void } => {
  const noise = createWhiteNoise(ctx, 0.3);

  const rumbleOsc = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  const rumbleFilter = ctx.createBiquadFilter();

  rumbleOsc.type = 'sawtooth';
  rumbleOsc.frequency.value = 80;

  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 150;

  rumbleGain.gain.value = 0;

  rumbleOsc.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(ctx.destination);

  rumbleOsc.start();
  rumbleGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5);

  const thunder = createThunderSound(ctx, 60, 'square', 0.3, 1, 3);

  return {
    stop: () => {
      noise.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      rumbleGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      thunder.stop();
      setTimeout(() => {
        noise.source.stop();
        rumbleOsc.stop();
      }, 550);
    }
  };
};

export const playWeatherSound = (weather: WeatherType): void => {
  stopSound();

  const ctx = getAudioContext();

  switch (weather) {
    case WeatherType.SUNNY:
      currentSource = createBirdSound(ctx);
      break;
    case WeatherType.RAINY:
      currentSource = createRainSound(ctx);
      break;
    case WeatherType.SNOWY:
      currentSource = createSnowSound(ctx);
      break;
    case WeatherType.STORMY:
      currentSource = createStormSound(ctx);
      break;
  }
};

export const stopSound = (): void => {
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }
};
