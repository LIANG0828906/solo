import { useCallback, useRef, useEffect } from 'react';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function useAudio() {
  const initialized = useRef(false);

  useEffect(() => {
    const initAudio = () => {
      if (!initialized.current) {
        getAudioContext();
        initialized.current = true;
        document.removeEventListener('click', initAudio);
        document.removeEventListener('keydown', initAudio);
      }
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  const playPlaceSound = useCallback(() => {
    playTone(320, 0.15, 'triangle', 0.4);
    setTimeout(() => playTone(480, 0.1, 'sine', 0.3), 50);
  }, []);

  const playGenerateSound = useCallback(() => {
    playTone(523, 0.2, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.2, 'sine', 0.3), 100);
    setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 200);
  }, []);

  const playOvercomeSound = useCallback(() => {
    playTone(200, 0.1, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.15, 'square', 0.15), 50);
  }, []);

  const playRotateSound = useCallback(() => {
    playTone(440, 0.08, 'sine', 0.2);
  }, []);

  const playFlipSound = useCallback(() => {
    playTone(300, 0.1, 'triangle', 0.25);
    setTimeout(() => playTone(400, 0.1, 'triangle', 0.2), 50);
  }, []);

  const playSuccessSound = useCallback(() => {
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'sine', 0.25), i * 100);
    });
  }, []);

  const playClickSound = useCallback(() => {
    playTone(600, 0.05, 'square', 0.15);
  }, []);

  return {
    playPlaceSound,
    playGenerateSound,
    playOvercomeSound,
    playRotateSound,
    playFlipSound,
    playSuccessSound,
    playClickSound,
  };
}
