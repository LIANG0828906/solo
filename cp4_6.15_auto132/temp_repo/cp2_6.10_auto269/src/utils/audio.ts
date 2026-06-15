import { ScaleNote } from '@/types';
import { SCALE_FREQUENCIES } from './constants';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const playBellSound = (
  note: ScaleNote,
  velocity: number,
  octave: number = 4,
  duration: number = 3
): void => {
  const ctx = getAudioContext();
  const baseFreq = SCALE_FREQUENCIES[note];
  const frequency = baseFreq * Math.pow(2, octave - 4);
  const gainValue = (velocity / 100) * 0.5;

  const now = ctx.currentTime;
  const harmonics = [1, 2.01, 3.02, 4.03, 5.05];
  const gains = [1.0, 0.5, 0.25, 0.125, 0.0625];

  harmonics.forEach((harmonic, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = frequency * harmonic;

    filter.type = 'lowpass';
    filter.frequency.value = 4000;
    filter.Q.value = 1;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      gainValue * gains[i],
      now + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration * (1 - i * 0.1)
    );

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.5);
  });
};

export const playHarmonySound = (
  note1: ScaleNote,
  note2: ScaleNote,
  velocity: number
): void => {
  const ctx = getAudioContext();
  const gainValue = (velocity / 100) * 0.3;

  const now = ctx.currentTime;

  [note1, note2].forEach((note, idx) => {
    const baseFreq = SCALE_FREQUENCIES[note];
    const frequency = baseFreq * Math.pow(2, 4 - 4);

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const delay = ctx.createDelay(2);
    const feedback = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    delay.delayTime.value = 0.2 + idx * 0.1;
    feedback.gain.value = 0.3;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      gainValue * 0.5,
      now + 0.05
    );
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 4);

    osc.connect(gainNode);
    gainNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(ctx.destination);
    gainNode.connect(ctx.destination);

    osc.start(now + idx * 0.1);
    osc.stop(now + 4.5);
  });
};

export const playRandomMelody = (): void => {
  const notes: ScaleNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const melody: ScaleNote[] = [];
  for (let i = 0; i < 4; i++) {
    melody.push(notes[Math.floor(Math.random() * notes.length)]);
  }

  melody.forEach((note, i) => {
    setTimeout(() => {
      playBellSound(note, 50, 4, 1.5);
    }, i * 250);
  });
};
