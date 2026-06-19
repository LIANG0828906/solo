let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playSaveSound() {
  playTone(880, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(1108.73, 0.15, 'sine', 0.1), 80);
}

export function playInviteSound() {
  playTone(523.25, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(659.25, 0.1, 'triangle', 0.1), 100);
  setTimeout(() => playTone(783.99, 0.15, 'triangle', 0.1), 200);
}

export function playDragSound() {
  playTone(698.46, 0.08, 'sine', 0.08);
}

export function playDropSound() {
  playTone(523.25, 0.06, 'sine', 0.1);
  setTimeout(() => playTone(783.99, 0.1, 'sine', 0.08), 50);
}

export function playStarSound() {
  playTone(1046.5, 0.08, 'sine', 0.12);
  setTimeout(() => playTone(1318.51, 0.1, 'sine', 0.1), 60);
  setTimeout(() => playTone(1567.98, 0.15, 'sine', 0.08), 120);
}

export function playErrorSound() {
  playTone(220, 0.15, 'sawtooth', 0.06);
}

export function playClickSound() {
  playTone(1200, 0.04, 'sine', 0.06);
}
