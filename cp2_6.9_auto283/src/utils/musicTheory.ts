import { A4_FREQUENCY, A4_MIDI, NOTE_NAMES, SCALE_VALIDATION, STRING_BASE_FREQUENCIES } from '../constants';
import type { ScaleValidationResult } from '../types';

export function frequencyToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return Math.round(12 * Math.log2(freq / A4_FREQUENCY) + A4_MIDI);
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = ((midi % 12) + 12) % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function getStringFrequency(
  baseFreq: number,
  tension: number,
  tuningOffset: number
): number {
  const semitoneRatio = Math.pow(2, tuningOffset / 1200);
  return baseFreq * tension * semitoneRatio;
}

export function validateScale(tunings: number[]): ScaleValidationResult {
  const details = tunings.map((tuningOffset, index) => {
    const baseFreq = STRING_BASE_FREQUENCIES[index];
    const expected = baseFreq;
    const actual = baseFreq * Math.pow(2, tuningOffset / 1200);
    const deviationCents = 1200 * Math.log2(actual / expected);

    return {
      stringIndex: index,
      expected,
      actual,
      deviation: deviationCents,
    };
  });

  const maxDeviation = Math.max(...details.map(d => Math.abs(d.deviation)));
  const valid = maxDeviation <= SCALE_VALIDATION.MAX_DEVIATION_CENTS;

  const accuracyScores = details.map(d => {
    const absDev = Math.abs(d.deviation);
    if (absDev <= SCALE_VALIDATION.WARNING_DEVIATION_CENTS) {
      return 100;
    }
    const normalized = Math.min(absDev / SCALE_VALIDATION.MAX_DEVIATION_CENTS, 1);
    return 100 * (1 - normalized);
  });

  const accuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;

  return {
    valid,
    accuracy,
    details,
  };
}

export function centsToSemitones(cents: number): number {
  return cents / 100;
}

export function semitonesToCents(semitones: number): number {
  return semitones * 100;
}

export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12);
}
