let audioContext: AudioContext | null = null;
let beepInterval: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playBeep() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.log('Audio not available');
  }
}

export function startBeeping(intervalMs: number = 2000) {
  if (beepInterval !== null) return;
  playBeep();
  beepInterval = window.setInterval(() => {
    playBeep();
  }, intervalMs);
}

export function stopBeeping() {
  if (beepInterval !== null) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
}
