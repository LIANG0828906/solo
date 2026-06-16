import { useCallback } from 'react';
import { typewriterAudio } from '@/utils/audio';

export function useTypewriterSound() {
  const playSound = useCallback((char: string) => {
    if (char === '\n' || char === '\r') {
      typewriterAudio.playReturnSound();
    } else {
      typewriterAudio.playKeySound();
    }
  }, []);

  return { playSound };
}
