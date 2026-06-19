import { Howl } from 'howler';
import { NoteColor, Note } from '@/types';
import { NOTE_FREQUENCIES, NOTE_DURATION } from '@/constants';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function generateTone(frequency: number, duration: number): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 3);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
  }

  return buffer;
}

export function playNote(frequency: number, duration: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const buffer = generateTone(frequency, duration);
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

export function playNoteByColor(color: NoteColor, duration: number = 0.5): void {
  const frequency = NOTE_FREQUENCIES[color];
  playNote(frequency, duration);
}

export function playErrorSound(): void {
  try {
    const ctx = getAudioContext();
    const duration = 0.15;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.2;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    source.buffer = buffer;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Error sound playback failed:', error);
  }
}

export function playMelody(notes: Note[]): void {
  notes.forEach((note, index) => {
    setTimeout(() => {
      playNote(note.frequency, NOTE_DURATION / 1000);
    }, index * NOTE_DURATION);
  });
}

export function createHowlNote(frequency: number): Howl {
  getAudioContext();
  const duration = 0.5;
  const buffer = generateTone(frequency, duration);

  const wavBlob = audioBufferToWav(buffer);
  const url = URL.createObjectURL(wavBlob);

  return new Howl({
    src: [url],
    volume: 0.5,
    onend: () => {
      URL.revokeObjectURL(url);
    },
  });
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
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

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
