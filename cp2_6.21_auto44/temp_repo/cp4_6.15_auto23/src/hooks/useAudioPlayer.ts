import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  waveformData: number[];
  frequencyData: number[];
  currentSoundId: string | null;
}

const BINS = 64;

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    waveformData: new Array(BINS).fill(0),
    frequencyData: new Array(BINS).fill(0),
    currentSoundId: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const sourceUrlRef = useRef<string>('');

  const stopVisualization = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    setState((prev) => ({
      ...prev,
      waveformData: new Array(BINS).fill(0),
      frequencyData: new Array(BINS).fill(0),
    }));
  }, []);

  const updateVisualization = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const bufLen = analyser.frequencyBinCount;
    const freqArr = new Uint8Array(bufLen);
    const waveArr = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(freqArr);
    analyser.getByteTimeDomainData(waveArr);

    const step = Math.max(1, Math.floor(bufLen / BINS));
    const freqData: number[] = [];
    const waveData: number[] = [];
    for (let i = 0; i < BINS; i++) {
      const idx = Math.min(i * step, bufLen - 1);
      freqData.push(freqArr[idx] / 255);
      waveData.push((waveArr[idx] - 128) / 128);
    }

    setState((prev) => ({
      ...prev,
      frequencyData: freqData,
      waveformData: waveData,
    }));
    rafRef.current = requestAnimationFrame(updateVisualization);
  }, []);

  const initAudioContext = useCallback(
    (audio: HTMLAudioElement) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {
          /* ignore */
        }
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch {
          /* ignore */
        }
      }
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;
    },
    []
  );

  const loadAndPlay = useCallback(
    (audioUrl: string, soundId: string) => {
      if (!audioUrl) return;

      stopVisualization();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }

      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }

      const isBlob = audioUrl.startsWith('blob:');
      const url = isBlob ? audioUrl : audioUrl;
      sourceUrlRef.current = isBlob ? audioUrl : '';

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = url;
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setState((prev) => ({
          ...prev,
          duration: audio.duration,
          currentSoundId: soundId,
        }));
      });

      audio.addEventListener('timeupdate', () => {
        setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
      });

      audio.addEventListener('ended', () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
        stopVisualization();
      });

      audio.addEventListener('error', () => {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          currentSoundId: null,
        }));
        stopVisualization();
      });

      initAudioContext(audio);

      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.play().then(() => {
        setState((prev) => ({ ...prev, isPlaying: true, currentSoundId: soundId }));
        rafRef.current = requestAnimationFrame(updateVisualization);
      }).catch(() => {
        /* autoplay blocked */
      });
    },
    [initAudioContext, updateVisualization, stopVisualization]
  );

  const play = useCallback(() => {
    if (!audioRef.current) return;
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    audioRef.current.play();
    setState((prev) => ({ ...prev, isPlaying: true }));
    rafRef.current = requestAnimationFrame(updateVisualization);
  }, [updateVisualization]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
    cancelAnimationFrame(rafRef.current);
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      currentSoundId: null,
    }));
    stopVisualization();
  }, [stopVisualization]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = vol;
    setState((prev) => ({ ...prev, volume: vol }));
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    loadAndPlay,
    play,
    pause,
    stop,
    seek,
    setVolume,
  };
}
