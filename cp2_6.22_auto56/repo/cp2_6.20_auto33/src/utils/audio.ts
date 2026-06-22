let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delay = 0,
  freqEnd?: number
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (e) {
    // ignore
  }
}

export const sfx = {
  click() {
    playTone(660, 0.08, 'triangle', 0.1);
  },
  feed() {
    playTone(520, 0.08, 'square', 0.08, 0);
    playTone(780, 0.1, 'sine', 0.1, 0.08);
    playTone(1040, 0.12, 'sine', 0.08, 0.18);
  },
  play() {
    playTone(600, 0.1, 'triangle', 0.12, 0, 900);
    playTone(800, 0.15, 'sine', 0.1, 0.08, 1200);
  },
  drink() {
    playTone(400, 0.05, 'sine', 0.08, 0);
    playTone(500, 0.05, 'sine', 0.08, 0.06);
    playTone(600, 0.05, 'sine', 0.08, 0.12);
    playTone(700, 0.1, 'sine', 0.06, 0.18);
  },
  sleep() {
    playTone(300, 0.2, 'sine', 0.08, 0, 200);
    playTone(250, 0.3, 'sine', 0.06, 0.15, 150);
  },
  gift() {
    playTone(700, 0.08, 'triangle', 0.1, 0);
    playTone(900, 0.08, 'triangle', 0.1, 0.08);
    playTone(1100, 0.12, 'triangle', 0.12, 0.16);
    playTone(1400, 0.18, 'sine', 0.1, 0.28);
  },
  levelup() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => {
      playTone(n, 0.18, 'triangle', 0.14, i * 0.08);
      playTone(n * 2, 0.12, 'sine', 0.06, i * 0.08 + 0.04);
    });
  },
  warning() {
    playTone(800, 0.08, 'square', 0.06, 0);
    playTone(800, 0.08, 'square', 0.06, 0.15);
  },
  success() {
    playTone(880, 0.08, 'sine', 0.1, 0);
    playTone(1318, 0.16, 'sine', 0.1, 0.06);
  }
};
