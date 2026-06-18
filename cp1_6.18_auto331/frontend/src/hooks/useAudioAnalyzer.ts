import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioAnalyzerReturn {
  waveformData: number[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  loadAudio: (audioBlob: Blob | null) => void;
}

export function useAudioAnalyzer(audioUrl: string | null): UseAudioAnalyzerReturn {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration * 1000);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      generateWaveformFromAudio(audioUrl);
    }
  }, [audioUrl]);

  const generateWaveformFromAudio = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 2000;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      const max = Math.max(...waveform);
      const normalized = waveform.map(v => v / max);
      
      setWaveformData(normalized);
      setDuration(audioBuffer.duration * 1000);
      audioContext.close();
    } catch (error) {
      console.error('Failed to analyze audio:', error);
      generateFallbackWaveform();
    }
  }, []);

  const generateFallbackWaveform = useCallback(() => {
    const samples = 2000;
    const waveform: number[] = [];
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const envelope = Math.sin(Math.PI * t);
      const wave = Math.sin(i * 0.05) * 0.3 + Math.sin(i * 0.12) * 0.2;
      waveform.push(Math.abs(envelope * wave) + Math.random() * 0.1);
    }
    const max = Math.max(...waveform);
    setWaveformData(waveform.map(v => v / max));
  }, []);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000);
    }
    animationRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [updateProgress]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, []);

  const seek = useCallback((timeMs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000;
      setCurrentTime(timeMs);
    }
  }, []);

  const loadAudio = useCallback((audioBlob: Blob | null) => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.load();
      generateWaveformFromAudio(url);
    }
  }, [generateWaveformFromAudio]);

  return {
    waveformData,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    loadAudio,
  };
}
