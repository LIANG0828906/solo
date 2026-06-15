import { useRef, useEffect, useCallback, useState } from 'react';
import { AudioAnalyzer, AudioAnalysisData } from '../AudioAnalyzer';

export function useAudioAnalyzer() {
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const audioDataRef = useRef<AudioAnalysisData>({
    frequencyData: new Float32Array(256),
    timeDomainData: new Float32Array(256),
    energy: 0,
    lowFrequency: 0,
    highFrequency: 0,
    frequencyBands: new Array(12).fill(0),
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<string>('');

  useEffect(() => {
    analyzerRef.current = new AudioAnalyzer();
    
    analyzerRef.current.setOnUpdate((data) => {
      audioDataRef.current = data;
      if (data.isPlaying !== isPlaying) {
        setIsPlaying(data.isPlaying);
      }
      setCurrentTime(data.currentTime);
      setDuration(data.duration);
    });

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
    };
  }, []);

  const loadAudio = useCallback(async (url: string, trackName: string, isBlob = false) => {
    if (!analyzerRef.current) return;
    try {
      await analyzerRef.current.loadAudio(url, isBlob);
      setCurrentTrack(trackName);
      await analyzerRef.current.play();
    } catch (e) {
      console.error('Failed to load audio:', e);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!analyzerRef.current) return;
    analyzerRef.current.togglePlay();
  }, []);

  const setVolume = useCallback((value: number) => {
    if (!analyzerRef.current) return;
    analyzerRef.current.setVolume(value);
  }, []);

  const seek = useCallback((time: number) => {
    if (!analyzerRef.current) return;
    analyzerRef.current.seek(time);
  }, []);

  const getAudioDataRef = useCallback(() => {
    return audioDataRef;
  }, []);

  return {
    loadAudio,
    togglePlay,
    setVolume,
    seek,
    isPlaying,
    currentTime,
    duration,
    currentTrack,
    getAudioDataRef,
  };
}
