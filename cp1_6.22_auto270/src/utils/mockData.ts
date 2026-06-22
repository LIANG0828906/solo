export interface MockTrackData {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  channelData: Float32Array;
  waveColor: string;
}

const SAMPLE_RATE = 44100;
const VOCAL_DURATION = 30;
const BGM_DURATION = 30;

function generateVocalData(): Float32Array {
  const numSamples = Math.floor(SAMPLE_RATE * VOCAL_DURATION);
  const data = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 200 + 50 * Math.sin(t * 3);
    const envelope = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(t * 2)), 0.5);
    let sample = 0;
    sample += 0.5 * Math.sin(2 * Math.PI * freq * t);
    sample += 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
    sample += 0.15 * Math.sin(2 * Math.PI * freq * 3 * t);
    sample += 0.05 * Math.sin(2 * Math.PI * freq * 4 * t);
    sample += 0.02 * (Math.random() * 2 - 1);
    data[i] = sample * envelope * 0.6;
    if (t > 0.5 && t < 1.0) data[i] *= (t - 0.5) * 2;
    if (t > VOCAL_DURATION - 1.0) data[i] *= (VOCAL_DURATION - t);
  }
  return data;
}

function generateBgmData(): Float32Array {
  const numSamples = Math.floor(SAMPLE_RATE * BGM_DURATION);
  const data = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;
    sample += 0.2 * Math.sin(2 * Math.PI * 130.81 * t);
    sample += 0.15 * Math.sin(2 * Math.PI * 164.81 * t);
    sample += 0.15 * Math.sin(2 * Math.PI * 196.00 * t);
    sample += 0.1 * Math.sin(2 * Math.PI * 261.63 * t);
    sample += 0.08 * Math.sin(2 * Math.PI * 329.63 * t);
    sample += 0.05 * Math.sin(2 * Math.PI * 392.00 * t);
    sample += 0.04 * Math.sin(2 * Math.PI * 523.25 * t);
    sample += 0.03 * (Math.random() * 2 - 1);
    const envelope = 0.6 + 0.4 * Math.sin(t * 0.5);
    data[i] = sample * envelope * 0.4;
    if (t < 0.5) data[i] *= t * 2;
    if (t > BGM_DURATION - 1.0) data[i] *= (BGM_DURATION - t);
  }
  return data;
}

export function generateMockTracks(): MockTrackData[] {
  return [
    {
      id: 'track-vocal',
      name: '人声',
      duration: VOCAL_DURATION,
      sampleRate: SAMPLE_RATE,
      channelData: generateVocalData(),
      waveColor: '#FF6B6B',
    },
    {
      id: 'track-bgm',
      name: '背景音乐',
      duration: BGM_DURATION,
      sampleRate: SAMPLE_RATE,
      channelData: generateBgmData(),
      waveColor: '#4ECDC4',
    },
  ];
}

export function createWavBlob(data: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = data.length * (bitsPerSample / 8);
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function trimChannelData(
  data: Float32Array,
  sampleRate: number,
  startSec: number,
  endSec: number
): { trimmedData: Float32Array; newDuration: number } {
  const startSample = Math.floor(startSec * sampleRate);
  const endSample = Math.floor(endSec * sampleRate);
  const before = data.slice(0, startSample);
  const after = data.slice(endSample);
  const trimmedData = new Float32Array(before.length + after.length);
  trimmedData.set(before, 0);
  trimmedData.set(after, before.length);
  const newDuration = trimmedData.length / sampleRate;
  return { trimmedData, newDuration };
}
