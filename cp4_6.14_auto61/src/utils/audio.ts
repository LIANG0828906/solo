interface BeepController {
  stop: () => void;
}

let activeController: BeepController | null = null;

export function playBeep(frequency: number = 440, duration: number = 0.5): BeepController {
  stopBeep();

  let stopped = false;
  let audioContext: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;

  const stop = () => {
    if (stopped) return;
    stopped = true;

    try {
      if (oscillator && gainNode && audioContext) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscillator.stop(now + 0.05);
        setTimeout(() => {
          if (audioContext) {
            audioContext.close().catch(() => {});
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to stop beep:', error);
    }

    oscillator = null;
    gainNode = null;
    audioContext = null;
    activeController = null;
  };

  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    audioContext = new AudioContextCtor();

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + duration - 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    oscillator.onended = () => {
      stop();
    };

    activeController = { stop };
    return activeController;
  } catch (error) {
    console.error('Failed to play beep:', error);
    return { stop: () => {} };
  }
}

export function stopBeep(): void {
  if (activeController) {
    activeController.stop();
    activeController = null;
  }
}
