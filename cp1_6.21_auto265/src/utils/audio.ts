let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

interface PlayToneOptions {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  attackTime?: number;
  releaseTime?: number;
}

export function playTone({
  frequency,
  duration,
  type = 'sine',
  volume = 0.25,
  attackTime = 0.005,
  releaseTime = 0.03,
}: PlayToneOptions): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attackTime);
    gain.gain.linearRampToValueAtTime(volume, now + duration / 1000 - releaseTime);
    gain.gain.linearRampToValueAtTime(0, now + duration / 1000);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
  } catch {
    // 静默失败，音效不影响游戏体验
  }
}

export function playPlayer1Place(): void {
  playTone({ frequency: 523.25, duration: 80, type: 'sine', volume: 0.25 });
}

export function playPlayer2Place(): void {
  playTone({ frequency: 659.25, duration: 80, type: 'sine', volume: 0.25 });
}

export function playWin(): void {
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone({ frequency: freq, duration: 120, type: 'sine', volume: 0.3 });
    }, i * 80);
  });
}

export function playUndo(): void {
  playTone({ frequency: 392.0, duration: 120, type: 'triangle', volume: 0.2 });
}

export function initAudioOnFirstInteraction(): void {
  const handler = () => {
    try {
      getAudioContext();
    } catch {
      // 忽略
    }
    document.removeEventListener('pointerdown', handler);
    document.removeEventListener('keydown', handler);
  };
  document.addEventListener('pointerdown', handler, { once: true });
  document.addEventListener('keydown', handler, { once: true });
}
