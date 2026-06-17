import { FFT_SIZE, TIME_DOMAIN_SIZE } from '@/store/audioStore';

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let audioBuffer: AudioBuffer | null = null;
let frequencyData: Uint8Array | null = null;
let timeDomainData: Uint8Array | null = null;

const ensureContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.8;
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    timeDomainData = new Uint8Array(TIME_DOMAIN_SIZE);
  }
  return audioContext;
};

export const getFrequencyData = (): Uint8Array => {
  if (!analyser || !frequencyData) return new Uint8Array(FFT_SIZE / 2);
  analyser.getByteFrequencyData(frequencyData);
  return frequencyData;
};

export const getTimeDomainData = (): Uint8Array => {
  if (!analyser || !timeDomainData) return new Uint8Array(TIME_DOMAIN_SIZE);
  analyser.getByteTimeDomainData(timeDomainData);
  return timeDomainData;
};

export const computeBeat = (freq: Uint8Array): number => {
  const lowEnd = Math.floor(freq.length * 0.1);
  let sum = 0;
  for (let i = 0; i < lowEnd; i++) sum += freq[i];
  const avg = sum / lowEnd;
  return Math.min(1, avg / 180);
};

export const computeVolumeLevel = (freq: Uint8Array): number => {
  let sum = 0;
  for (let i = 0; i < freq.length; i++) sum += freq[i];
  return Math.min(1, sum / (freq.length * 160));
};

export const loadAudio = async (file: File): Promise<void> => {
  try {
    const ctx = ensureContext();

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('[AuraCanvas] AudioContext is suspended. Please interact with the page to resume audio.', e);
      }
    }

    if (source) {
      try {
        source.stop();
      } catch (_) { /* noop */ }
      source = null;
    }

    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      ctx.decodeAudioData(
        arrayBuffer,
        (buffer) => resolve(buffer),
        (err) => reject(err),
      );
    });
  } catch (err) {
    console.error('[AuraCanvas] Failed to decode audio file:', err);
    throw err;
  }
};

export const startPlayback = (): void => {
  const ctx = ensureContext();
  if (!audioBuffer || !analyser) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch((e) =>
      console.warn('[AuraCanvas] Could not resume AudioContext:', e),
    );
  }

  try {
    if (source) source.stop();
  } catch (_) { /* noop */ }

  source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;
  source.connect(analyser);
  source.start(0);
};

export const stopPlayback = (): void => {
  if (source) {
    try {
      source.stop();
    } catch (_) { /* noop */ }
    source = null;
  }
};

export const setMasterVolume = (v: number): void => {
  ensureContext();
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, v));
};

export const getDuration = (): number => (audioBuffer ? audioBuffer.duration : 0);

export const hasAudioBuffer = (): boolean => !!audioBuffer;
