import { useRef, useCallback, useEffect } from 'react';

interface UseAudioReturn {
  playSuccess: () => void;
  playFail: () => void;
  playWarning: () => void;
  playDrop: () => void;
  setVolume: (volume: number) => void;
}

export const useAudio = (initialVolume: number = 0.3): UseAudioReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(initialVolume);

  const initAudioContext = useCallback((): void => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = volumeRef.current;
      masterGainRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudioContext]);

  const setVolume = useCallback((volume: number): void => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volumeRef.current;
    }
  }, []);

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume: number = 0.3
    ): void => {
      if (!audioContextRef.current || !masterGainRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume * volumeRef.current, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(masterGainRef.current);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    []
  );

  const playSuccess = useCallback((): void => {
    if (!audioContextRef.current || !masterGainRef.current) {
      initAudioContext();
    }

    if (!audioContextRef.current || !masterGainRef.current) return;

    const ctx = audioContextRef.current;

    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },
      { freq: 659.25, time: 0.15, duration: 0.15 },
      { freq: 783.99, time: 0.3, duration: 0.2 },
      { freq: 1046.5, time: 0.5, duration: 0.3 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime + time);
      filter.Q.setValueAtTime(1, ctx.currentTime + time);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
      gainNode.gain.linearRampToValueAtTime(
        0.25 * volumeRef.current,
        ctx.currentTime + time + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + time + duration
      );

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      oscillator.start(ctx.currentTime + time);
      oscillator.stop(ctx.currentTime + time + duration);
    });
  }, [initAudioContext]);

  const playFail = useCallback((): void => {
    if (!audioContextRef.current || !masterGainRef.current) {
      initAudioContext();
    }

    if (!audioContextRef.current || !masterGainRef.current) return;

    const ctx = audioContextRef.current;
    const duration = 0.4;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 8);
      const tear = Math.sin(t * 80 * Math.PI) * 0.3;
      data[i] = (noise + tear) * 0.5 * (1 - t);
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      2000,
      ctx.currentTime + duration
    );

    gainNode.gain.setValueAtTime(0.4 * volumeRef.current, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    source.start(ctx.currentTime);
  }, [initAudioContext]);

  const playWarning = useCallback((): void => {
    if (!audioContextRef.current || !masterGainRef.current) {
      initAudioContext();
    }

    if (!audioContextRef.current || !masterGainRef.current) return;

    const ctx = audioContextRef.current;

    for (let i = 0; i < 2; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + i * 0.15);
      oscillator.frequency.setValueAtTime(440, ctx.currentTime + i * 0.15 + 0.08);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(
        0.15 * volumeRef.current,
        ctx.currentTime + i * 0.15 + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.15 + 0.12
      );

      oscillator.connect(gainNode);
      gainNode.connect(masterGainRef.current);

      oscillator.start(ctx.currentTime + i * 0.15);
      oscillator.stop(ctx.currentTime + i * 0.15 + 0.12);
    }
  }, [initAudioContext]);

  const playDrop = useCallback((): void => {
    if (!audioContextRef.current || !masterGainRef.current) {
      initAudioContext();
    }

    if (!audioContextRef.current || !masterGainRef.current) return;

    const ctx = audioContextRef.current;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3 * volumeRef.current, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }, [initAudioContext]);

  return {
    playSuccess,
    playFail,
    playWarning,
    playDrop,
    setVolume,
  };
};
