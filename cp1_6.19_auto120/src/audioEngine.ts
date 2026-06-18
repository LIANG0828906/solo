export type KeyZone = 'left' | 'right' | 'number' | 'other';

const NOTE_DURATION = 0.3;
const FADE_TIME = 0.05;

const LEFT_HAND_NOTES = [261.63, 277.18, 293.66, 311.13, 329.63];
const RIGHT_HAND_NOTES = [392.0, 415.3, 440.0, 466.16, 493.88];
const NUMBER_NOTES = [523.25, 554.37, 587.33, 622.25, 659.25];

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API not supported:', e);
        return null;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private getFrequency(zone: KeyZone): number {
    let notes: number[];
    switch (zone) {
      case 'left':
        notes = LEFT_HAND_NOTES;
        break;
      case 'right':
        notes = RIGHT_HAND_NOTES;
        break;
      case 'number':
        notes = NUMBER_NOTES;
        break;
      default:
        return 0;
    }
    return notes[Math.floor(Math.random() * notes.length)];
  }

  playNote(zone: KeyZone): void {
    if (!this.enabled) return;
    if (zone === 'other') return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const frequency = this.getFrequency(zone);
    if (frequency === 0) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + FADE_TIME);
    gainNode.gain.linearRampToValueAtTime(0, now + NOTE_DURATION);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + NOTE_DURATION);
  }
}

export function getKeyZone(key: string): KeyZone {
  const upperKey = key.toUpperCase();

  const leftHand = 'QWERTASDFG';
  if (leftHand.includes(upperKey)) {
    return 'left';
  }

  const rightHand = 'YUIOPHJKLZXCVBNM';
  if (rightHand.includes(upperKey)) {
    return 'right';
  }

  if (/^[0-9]$/.test(key)) {
    return 'number';
  }

  return 'other';
}
