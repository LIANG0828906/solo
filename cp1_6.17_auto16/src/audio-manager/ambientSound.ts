import { WeatherType } from '../weather-control/weatherTypes';

let audioCtx: AudioContext | null = null;
let currentNodes: AudioNode[] = [];
let gainNodes: GainNode[] = [];
let thunderInterval: ReturnType<typeof setInterval> | null = null;
let isPlaying = false;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function fadeGain(gain: GainNode, from: number, to: number, duration: number): void {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(from, now);
  gain.gain.linearRampToValueAtTime(to, now + duration);
}

function playSunnySound(): void {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1500;
  gain.gain.value = 0;

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();

  fadeGain(gain, 0, 0.1, 0.5);
  currentNodes.push(osc);
  gainNodes.push(gain);
}

function createWhiteNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function playRainySound(): void {
  const ctx = getAudioCtx();
  const noise = createWhiteNoise(ctx);
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.value = 800;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0;
  fadeGain(gain, 0, 0.3, 0.5);
  noise.start();

  currentNodes.push(noise);
  gainNodes.push(gain);

  const playThunder = () => {
    const thunderOsc = ctx.createOscillator();
    const thunderGain = ctx.createGain();
    thunderOsc.type = 'square';
    thunderOsc.frequency.value = 60;
    thunderGain.gain.value = 0.5;
    thunderOsc.connect(thunderGain);
    thunderGain.connect(ctx.destination);
    thunderOsc.start();
    thunderGain.gain.setValueAtTime(0.5, ctx.currentTime);
    thunderGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    thunderOsc.stop(ctx.currentTime + 0.3);
  };

  const scheduleThunder = () => {
    const delay = 2000 + Math.random() * 3000;
    thunderInterval = setTimeout(() => {
      if (isPlaying) {
        playThunder();
        scheduleThunder();
      }
    }, delay);
  };
  scheduleThunder();
}

function playSnowySound(): void {
  const ctx = getAudioCtx();
  const noise = createWhiteNoise(ctx);
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'highpass';
  filter.frequency.value = 4000;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0;
  fadeGain(gain, 0, 0.15, 0.5);
  noise.start();

  currentNodes.push(noise);
  gainNodes.push(gain);
}

function playStormySound(): void {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 80;
  oscGain.gain.value = 0;
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  fadeGain(oscGain, 0, 0.4, 0.5);
  osc.start();
  currentNodes.push(osc);
  gainNodes.push(oscGain);

  const noise = createWhiteNoise(ctx);
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseGain.gain.value = 0;
  fadeGain(noiseGain, 0, 0.2, 0.5);
  noise.start();
  currentNodes.push(noise);
  gainNodes.push(noiseGain);

  const playThunder = () => {
    const thunderOsc = ctx.createOscillator();
    const thunderGain = ctx.createGain();
    thunderOsc.type = 'square';
    thunderOsc.frequency.value = 50;
    thunderGain.gain.value = 0.6;
    thunderOsc.connect(thunderGain);
    thunderGain.connect(ctx.destination);
    thunderOsc.start();
    thunderGain.gain.setValueAtTime(0.6, ctx.currentTime);
    thunderGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    thunderOsc.stop(ctx.currentTime + 0.3);
  };

  const scheduleThunder = () => {
    const delay = 1000 + Math.random() * 2000;
    thunderInterval = setTimeout(() => {
      if (isPlaying) {
        playThunder();
        scheduleThunder();
      }
    }, delay);
  };
  scheduleThunder();
}

function stopAllNodes(): void {
  isPlaying = false;
  if (thunderInterval !== null) {
    clearTimeout(thunderInterval);
    thunderInterval = null;
  }
  for (const gain of gainNodes) {
    try {
      fadeGain(gain, gain.gain.value, 0, 0.3);
    } catch {
      // ignore
    }
  }
  setTimeout(() => {
    for (const node of currentNodes) {
      try {
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
          node.stop();
        }
      } catch {
        // ignore
      }
    }
    currentNodes = [];
    gainNodes = [];
  }, 400);
}

export function playWeatherSound(weather: WeatherType): void {
  stopAllNodes();
  setTimeout(() => {
    isPlaying = true;
    switch (weather) {
      case WeatherType.Sunny:
        playSunnySound();
        break;
      case WeatherType.Rainy:
        playRainySound();
        break;
      case WeatherType.Snowy:
        playSnowySound();
        break;
      case WeatherType.Stormy:
        playStormySound();
        break;
    }
  }, 450);
}

export function stopSound(): void {
  stopAllNodes();
}
