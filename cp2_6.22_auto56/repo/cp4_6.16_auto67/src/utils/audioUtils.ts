import { AUDIO } from './constants';

export function generateSineWaveBuffer(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
): AudioBuffer {
  const sampleRate = AUDIO.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin((Math.PI * t) / duration);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
  }

  return buffer;
}

export function generateChordBuffer(
  audioContext: AudioContext,
  frequencies: number[],
  duration: number,
): AudioBuffer {
  const sampleRate = AUDIO.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin((Math.PI * t) / duration) * 0.5;
    let sample = 0;
    frequencies.forEach((freq) => {
      sample += Math.sin(2 * Math.PI * freq * t);
    });
    data[i] = (sample / frequencies.length) * envelope * 0.4;
  }

  return buffer;
}

export function generateMelodyBuffer(
  audioContext: AudioContext,
  notes: { freq: number; duration: number }[],
): AudioBuffer {
  const sampleRate = AUDIO.sampleRate;
  const totalDuration = notes.reduce((sum, n) => sum + n.duration, 0);
  const length = Math.floor(sampleRate * totalDuration);
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let offset = 0;
  notes.forEach((note) => {
    const noteLength = Math.floor(sampleRate * note.duration);
    for (let i = 0; i < noteLength && offset + i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(t * 10, 1) * Math.min((note.duration - t) * 10, 1);
      data[offset + i] = Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.3;
    }
    offset += noteLength;
  });

  return buffer;
}

export function audioBufferToBase64(buffer: AudioBuffer): string {
  const wav = audioBufferToWav(buffer);
  const binary = arrayBufferToBinaryString(wav);
  return btoa(binary);
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return binary;
}

export const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
};
