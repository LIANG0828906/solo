import { useCallback, useEffect, useRef } from 'react';
import { audioSynth } from '@/utils/audio';

export const useAudio = () => {
  const isInitialized = useRef(false);

  useEffect(() => {
    const initAudio = () => {
      if (!isInitialized.current) {
        audioSynth.init();
        isInitialized.current = true;
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playNote = useCallback((pitch: number, duration?: number, velocity?: number) => {
    audioSynth.playNote(pitch, duration, velocity);
  }, []);

  const playChord = useCallback((rootPitch: number, intervals: number[], duration?: number) => {
    audioSynth.playChord(rootPitch, intervals, duration);
  }, []);

  const playTideSound = useCallback(() => {
    audioSynth.playTideSound();
  }, []);

  return {
    playNote,
    playChord,
    playTideSound,
  };
};
