import { Weather } from '../weather-control/weatherStore';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: { stop: () => void }[] = [];
let thunderInterval: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function createNoiseBuffer(ctx: AudioContext, duration: number = 2): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playNoise(
  ctx: AudioContext,
  output: GainNode,
  volume: number,
  filterFreq: number,
  filterType: BiquadFilterType
): { stop: () => void } {
  const buffer = createNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        source.stop();
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, 400);
    }
  };
}

function playSineWave(
  ctx: AudioContext,
  output: GainNode,
  frequency: number,
  volume: number
): { stop: () => void } {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 3;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  osc.connect(gain);
  gain.connect(output);
  osc.start();
  lfo.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        osc.stop();
        lfo.stop();
        osc.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
        gain.disconnect();
      }, 400);
    }
  };
}

function playSawtooth(
  ctx: AudioContext,
  output: GainNode,
  frequency: number,
  volume: number
): { stop: () => void } {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = frequency;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  osc.start();

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, 400);
    }
  };
}

function playThunder(ctx: AudioContext, output: GainNode): void {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 60;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  osc.start(now);
  osc.stop(now + 0.3);

  setTimeout(() => {
    osc.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, 400);
}

function startThunderScheduler(
  ctx: AudioContext,
  output: GainNode,
  minInterval: number,
  maxInterval: number
): void {
  const schedule = () => {
    const delay = minInterval + Math.random() * (maxInterval - minInterval);
    thunderInterval = window.setTimeout(() => {
      playThunder(ctx, output);
      schedule();
    }, delay * 1000);
  };
  schedule();
}

export function stopSound(): void {
  ambientNodes.forEach((n) => n.stop());
  ambientNodes = [];
  if (thunderInterval !== null) {
    clearTimeout(thunderInterval);
    thunderInterval = null;
  }
}

export function playWeatherSound(weather: Weather): void {
  stopSound();
  const ctx = getAudioContext();
  if (!masterGain) return;

  switch (weather) {
    case Weather.Sunny:
      ambientNodes.push(playSineWave(ctx, masterGain, 1500, 0.1));
      break;
    case Weather.Rainy:
      ambientNodes.push(playNoise(ctx, masterGain, 0.3, 1000, 'lowpass'));
      startThunderScheduler(ctx, masterGain, 2, 5);
      break;
    case Weather.Snowy:
      ambientNodes.push(playNoise(ctx, masterGain, 0.15, 6000, 'highpass'));
      break;
    case Weather.Stormy:
      ambientNodes.push(playSawtooth(ctx, masterGain, 80, 0.4));
      ambientNodes.push(playNoise(ctx, masterGain, 0.2, 500, 'lowpass'));
      startThunderScheduler(ctx, masterGain, 1, 3);
      break;
  }
}
