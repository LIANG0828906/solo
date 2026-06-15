import { useRef, useCallback } from 'react';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number = 0.3) => {
    const ctx = getAudioContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }, [getAudioContext]);

  const playSoundByLength = useCallback((length: number, color: string) => {
    const baseFreq = 220;
    const maxFreq = 880;
    const normalizedLength = Math.min(1, Math.max(0, length / 15));
    const frequency = baseFreq + (maxFreq - baseFreq) * normalizedLength;

    const colorBias = parseInt(color.slice(1, 3), 16) / 255;
    const finalFreq = frequency * (0.9 + colorBias * 0.2);

    playTone(finalFreq, 0.4);
  }, [playTone]);

  return { playSoundByLength };
}
