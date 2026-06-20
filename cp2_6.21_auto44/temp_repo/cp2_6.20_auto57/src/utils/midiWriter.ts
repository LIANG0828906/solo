const SEMITONE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const TICKS_PER_QUARTER = 480;

function writeUint16(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

function writeUint32(value: number): Uint8Array {
  return new Uint8Array([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ]);
}

function writeVariableLength(value: number): number[] {
  if (value < 0) value = 0;
  const bytes: number[] = [];
  bytes.unshift(value & 0x7f);
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function toMidiNoteNumber(pitch: string, octave: number): number {
  const semitone = SEMITONE_OFFSETS[pitch] ?? 0;
  return (octave + 1) * 12 + semitone;
}

function durationToTicks(duration: number): number {
  return Math.round(duration * TICKS_PER_QUARTER);
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

export function writeMidiFile(
  notes: Array<{ pitch: string; octave: number; duration: number; velocity: number; order: number }>,
  tempo: number
): Blob {
  const sorted = [...notes].sort((a, b) => a.order - b.order);

  const microsPerBeat = Math.round(60000000 / tempo);
  const tempoBytes = [
    (microsPerBeat >> 16) & 0xff,
    (microsPerBeat >> 8) & 0xff,
    microsPerBeat & 0xff,
  ];

  const trackEvents: number[] = [];

  trackEvents.push(...writeVariableLength(0));
  trackEvents.push(0xff, 0x51, 0x03);
  trackEvents.push(...tempoBytes);

  let currentTick = 0;
  let lastEventTick = 0;

  for (const note of sorted) {
    const startTick = currentTick;
    const durationTicks = durationToTicks(note.duration);
    const endTick = startTick + durationTicks;
    const midiNote = toMidiNoteNumber(note.pitch, note.octave);
    const vel = Math.max(1, Math.min(127, note.velocity));

    const deltaOn = startTick - lastEventTick;
    trackEvents.push(...writeVariableLength(deltaOn));
    trackEvents.push(0x90, midiNote, vel);

    const deltaOff = endTick - startTick;
    trackEvents.push(...writeVariableLength(deltaOff));
    trackEvents.push(0x80, midiNote, 0);

    lastEventTick = endTick;
    currentTick = endTick;
  }

  trackEvents.push(...writeVariableLength(0));
  trackEvents.push(0xff, 0x2f, 0x00);

  const trackData = new Uint8Array(trackEvents);

  const headerChunk = concatUint8Arrays([
    new Uint8Array([0x4d, 0x54, 0x68, 0x64]),
    writeUint32(6),
    writeUint16(0),
    writeUint16(1),
    writeUint16(TICKS_PER_QUARTER),
  ]);

  const trackChunk = concatUint8Arrays([
    new Uint8Array([0x4d, 0x54, 0x72, 0x6b]),
    writeUint32(trackData.length),
    trackData,
  ]);

  const midiData = concatUint8Arrays([headerChunk, trackChunk]);

  return new Blob([midiData], { type: 'audio/midi' });
}
