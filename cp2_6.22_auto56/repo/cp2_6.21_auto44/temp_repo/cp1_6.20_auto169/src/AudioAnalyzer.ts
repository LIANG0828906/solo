import { useState, useRef, useEffect, useCallback } from 'react';

export interface AudioAnalyzerResult {
  dataArray: Uint8Array | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  fileName: string;
  loadAudio: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  seek: (time: number) => void;
  getFrequencyData: () => Uint8Array | null;
}

export function useAudioAnalyzer(): AudioAnalyzerResult {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [fileName, setFileName] = useState('');
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }
  }, [volume]);

  const loadAudio = useCallback(async (file: File) => {
    initAudioContext();

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    }

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.crossOrigin = 'anonymous';
    audioElementRef.current = audio;

    setFileName(file.name);

    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', (e) => reject(e), { once: true });
    });

    if (audioContextRef.current && analyserRef.current && gainNodeRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    setDuration(audio.duration);
    setCurrentTime(0);

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.play();
    setIsPlaying(true);
  }, [initAudioContext]);

  const play = useCallback(() => {
    if (audioElementRef.current && audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      setDataArray(new Uint8Array(dataArrayRef.current));
      return dataArrayRef.current;
    }
    return null;
  }, []);

  useEffect(() => {
    let animationId: number;

    const updateSpectrum = () => {
      if (isPlaying && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        setDataArray(new Uint8Array(dataArrayRef.current));
      }
      animationId = requestAnimationFrame(updateSpectrum);
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(updateSpectrum);
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    dataArray,
    isPlaying,
    currentTime,
    duration,
    volume,
    fileName,
    loadAudio,
    play,
    pause,
    togglePlay,
    setVolume,
    seek,
    getFrequencyData,
  };
}
