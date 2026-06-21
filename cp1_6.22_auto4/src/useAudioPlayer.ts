import { useState, useRef, useEffect, useCallback } from 'react';

export interface LyricLine {
  time: number;
  text: string;
}

export function parseLRC(lrcContent: string): LyricLine[] {
  const lines = lrcContent.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    let text = line.replace(timeRegex, '').trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      if (text) {
        result.push({ time, text });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const smoothedDataRef = useRef<Float32Array | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(20).fill(0));
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);

  const initAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      smoothedDataRef.current = new Float32Array(20);
    } catch (e) {
      console.error('Failed to initialize audio context:', e);
    }
  }, []);

  const updateFrequencyData = useCallback(() => {
    if (!analyserRef.current || !frequencyDataRef.current || !smoothedDataRef.current) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;

    analyserRef.current.getByteFrequencyData(frequencyDataRef.current as Uint8Array<ArrayBuffer>);

    const binCount = frequencyDataRef.current.length;
    const barCount = 20;
    const newData: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = Math.floor((i / barCount) * binCount * 0.6);
      const end = Math.floor(((i + 1) / barCount) * binCount * 0.6);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += frequencyDataRef.current[j];
      }
      const avg = sum / Math.max(1, (end - start));
      const smoothed = smoothedDataRef.current[i] * 0.7 + avg * 0.3;
      smoothedDataRef.current[i] = smoothed;
      newData.push(smoothed / 255);
    }

    setFrequencyData(newData);
  }, []);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      if (isPlaying) {
        updateFrequencyData();
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, updateFrequencyData]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const loadAudioFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      await audioRef.current.load();
      setAudioLoaded(true);
      initAudioContext();
      return true;
    } catch (e) {
      console.error('Failed to load audio:', e);
      return false;
    }
  }, [initAudioContext]);

  const loadLyricsFile = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = parseLRC(content);
          setLyrics(parsed);
          setLyricsLoaded(true);
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, []);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !audioLoaded) return;

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (e) {
        console.error('Play failed:', e);
      }
    }
  }, [isPlaying, audioLoaded]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const getCurrentLyricIndex = useCallback((): number => {
    if (lyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [lyrics, currentTime]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    lyrics,
    frequencyData,
    audioLoaded,
    lyricsLoaded,
    loadAudioFile,
    loadLyricsFile,
    togglePlay,
    seek,
    getCurrentLyricIndex,
  };
}
