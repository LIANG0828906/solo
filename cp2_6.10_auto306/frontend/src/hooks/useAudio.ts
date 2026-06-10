import { useCallback, useEffect, useRef } from 'react';
import { unlockAudioContext, playDropSound, playDivinationSound, playSaveSound } from '@/utils/audio';

export function useAudio() {
  const isUnlocked = useRef(false);

  const handleUserInteraction = useCallback(() => {
    if (!isUnlocked.current) {
      unlockAudioContext();
      isUnlocked.current = true;
    }
  }, []);

  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [handleUserInteraction]);

  const playDrop = useCallback(() => {
    handleUserInteraction();
    playDropSound();
  }, [handleUserInteraction]);

  const playDivination = useCallback(() => {
    handleUserInteraction();
    playDivinationSound();
  }, [handleUserInteraction]);

  const playSave = useCallback(() => {
    handleUserInteraction();
    playSaveSound();
  }, [handleUserInteraction]);

  return {
    playDrop,
    playDivination,
    playSave,
    unlockAudio: handleUserInteraction,
  };
}
