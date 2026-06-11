import type { Note } from '../pianoRoll';

export function encodeMIDI(notes: Note[], bpm: number = 120): Uint8Array {
  const ticksPerBeat = 480;
  const microsecondsPerBeat = Math.round(60000000 / bpm);

  const events: Array<{ delta: number; data: number[] }> = [];

  events.push({
    delta: 0,
    data: [0xff, 0x51, 0x03, (microsecondsPerBeat >> 16) & 0xff, (microsecondsPerBeat >> 8) & 0xff, microsecondsPerBeat & 0xff]
  });

  const sortedNotes = [...notes].sort((a, b) => a.start - b.start);
  const noteOnEvents: Map<string, { tick: number; pitch: number }> = new Map();

  interface TimedEvent { tick: number; data: number[]; }
  const timedEvents: TimedEvent[] = [];

  sortedNotes.forEach(note => {
    const startTick = Math.round(note.start * ticksPerBeat);
    const endTick = Math.round((note.start + note.duration) * ticksPerBeat);

    timedEvents.push({
      tick: startTick,
      data: [0x90, note.pitch & 0x7f, 0x64]
    });

    timedEvents.push({
      tick: endTick,
      data: [0x80, note.pitch & 0x7f, 0x40]
    });
  });

  timedEvents.sort((a, b) => a.tick - b.tick);

  let prevTick = 0;
  timedEvents.forEach(ev => {
    const delta = ev.tick - prevTick;
    events.push({ delta, data: ev.data });
    prevTick = ev.tick;
  });

  events.push({
    delta: 0,
    data: [0xff, 0x2f, 0x00]
  });

  const trackData: number[] = [];
  events.forEach(ev => {
    trackData.push(...encodeVariableLength(ev.delta));
    trackData.push(...ev.data);
  });

  const midiFile: number[] = [];

  midiFile.push(0x4d, 0x54, 0x68, 0x64);
  midiFile.push(0x00, 0x00, 0x00, 0x06);
  midiFile.push(0x00, 0x00);
  midiFile.push(0x00, 0x01);
  midiFile.push((ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff);

  midiFile.push(0x4d, 0x54, 0x72, 0x6b);
  const length = trackData.length;
  midiFile.push((length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
  midiFile.push(...trackData);

  return new Uint8Array(midiFile);
}

function encodeVariableLength(value: number): number[] {
  const result: number[] = [];
  let buffer = value & 0x7f;

  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }

  while (true) {
    result.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }

  return result;
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function downloadMIDI(base64Data: string, filename: string = 'sheet-music.mid') {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
