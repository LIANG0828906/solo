import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAudioPlayer, AudioPlayerState } from '../hooks/useAudioPlayer';
import { incrementPlayCount } from '../utils/localStorage';

interface AudioContextType extends AudioPlayerState {
  loadAndPlay: (url: string, soundId: string) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export function useAudioContext(): AudioContextType {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudioContext must be within AudioProvider');
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer();
  const countedRef = useRef<Set<string>>(new Set());

  const loadAndPlay = useCallback(
    (url: string, soundId: string) => {
      if (!countedRef.current.has(soundId)) {
        incrementPlayCount(soundId);
        countedRef.current.add(soundId);
      }
      player.loadAndPlay(url, soundId);
    },
    [player]
  );

  const value: AudioContextType = {
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    waveformData: player.waveformData,
    frequencyData: player.frequencyData,
    currentSoundId: player.currentSoundId,
    loadAndPlay,
    play: player.play,
    pause: player.pause,
    stop: player.stop,
    seek: player.seek,
    setVolume: player.setVolume,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
