import { useRef, useCallback, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useEditorStore } from '@/store/editorStore';

export function useAudioEngine() {
  const waveSurfersRef = useRef<Map<string, WaveSurfer>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const playStartTimeRef = useRef<number>(0);
  const playStartOffsetRef = useRef<number>(0);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const decodedBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const tracks = useEditorStore((s) => s.tracks);
  const currentTimeRef = useRef(0);

  const spectrumDataRef = useRef<Uint8Array>(new Uint8Array(32));

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    }
    return audioContextRef.current;
  }, []);

  const registerWaveSurfer = useCallback(
    (trackId: string, ws: WaveSurfer) => {
      waveSurfersRef.current.set(trackId, ws);
    },
    []
  );

  const unregisterWaveSurfer = useCallback((trackId: string) => {
    waveSurfersRef.current.delete(trackId);
    sourceNodesRef.current.delete(trackId);
    decodedBuffersRef.current.delete(trackId);
    gainNodesRef.current.delete(trackId);
  }, []);

  const decodeTrackBuffer = useCallback(
    async (trackId: string, blob: Blob) => {
      const ctx = ensureAudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      decodedBuffersRef.current.set(trackId, audioBuffer);
      return audioBuffer;
    },
    [ensureAudioContext]
  );

  const play = useCallback(async () => {
    const ctx = ensureAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    sourceNodesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (_e) {
        /* already stopped */
      }
    });
    sourceNodesRef.current.clear();

    for (const track of tracks) {
      let buffer = decodedBuffersRef.current.get(track.id);
      if (!buffer) {
        try {
          buffer = await decodeTrackBuffer(track.id, track.wavBlob);
        } catch {
          continue;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(analyserRef.current!);

      const gain = ctx.createGain();
      gain.gain.value = track.volume / 100;
      source.disconnect();
      source.connect(gain);
      gain.connect(analyserRef.current!);
      gainNodesRef.current.set(track.id, gain);

      const offset = Math.min(currentTimeRef.current, buffer.duration);
      source.start(0, offset);
      sourceNodesRef.current.set(track.id, source);

      source.onended = () => {
        sourceNodesRef.current.delete(track.id);
      };
    }

    waveSurfersRef.current.forEach((ws) => {
      try {
        ws.play();
      } catch (_e) {
        /* ignore */
      }
    });

    playStartTimeRef.current = performance.now();
    playStartOffsetRef.current = currentTimeRef.current;
    setIsPlaying(true);
  }, [tracks, ensureAudioContext, decodeTrackBuffer, setIsPlaying]);

  const pause = useCallback(() => {
    sourceNodesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (_e) {
        /* already stopped */
      }
    });
    sourceNodesRef.current.clear();

    waveSurfersRef.current.forEach((ws) => {
      try {
        ws.pause();
      } catch (_e) {
        /* ignore */
      }
    });

    const elapsed = (performance.now() - playStartTimeRef.current) / 1000;
    currentTimeRef.current = playStartOffsetRef.current + elapsed;
    setIsPlaying(false);
  }, [setIsPlaying]);

  const seek = useCallback(
    (time: number) => {
      currentTimeRef.current = time;

      waveSurfersRef.current.forEach((ws) => {
        const dur = ws.getDuration();
        if (dur > 0) {
          ws.seekTo(time / dur);
        }
      });

      if (isPlaying) {
        pause();
        playStartTimeRef.current = performance.now();
        playStartOffsetRef.current = time;
        setTimeout(() => play(), 50);
      } else {
        setCurrentTime(time);
      }
    },
    [isPlaying, pause, play, setCurrentTime]
  );

  const setVolume = useCallback((trackId: string, volume: number) => {
    const gain = gainNodesRef.current.get(trackId);
    if (gain) {
      gain.gain.value = volume / 100;
    }
  }, []);

  const getMaxDuration = useCallback(() => {
    let max = 0;
    tracks.forEach((t) => {
      if (t.duration > max) max = t.duration;
    });
    return max;
  }, [tracks]);

  useEffect(() => {
    if (!isPlaying) return;

    let running = true;
    const update = () => {
      if (!running) return;
      const elapsed = (performance.now() - playStartTimeRef.current) / 1000;
      const newTime = playStartOffsetRef.current + elapsed;
      currentTimeRef.current = newTime;
      setCurrentTime(newTime);

      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        spectrumDataRef.current = data;
      }

      animFrameRef.current = requestAnimationFrame(update);
    };
    animFrameRef.current = requestAnimationFrame(update);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, setCurrentTime]);

  useEffect(() => {
    return () => {
      sourceNodesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch (_e) {
          /* ignore */
        }
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    currentTimeRef,
    spectrumDataRef,
    registerWaveSurfer,
    unregisterWaveSurfer,
    decodeTrackBuffer,
    play,
    pause,
    seek,
    setVolume,
    getMaxDuration,
  };
}
