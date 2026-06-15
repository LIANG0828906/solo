import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchPoint, interpolatePitch, encodeWav } from '../utils/drawHelpers';

const FFT_SIZE = 2048;
const MAX_RECORD_DURATION = 30;

interface AudioEngineResult {
  audioBuffer: AudioBuffer | null;
  timeData: Uint8Array;
  freqData: Uint8Array;
  isPlaying: boolean;
  isRecording: boolean;
  isLooping: boolean;
  currentTime: number;
  duration: number;
  recordingProgress: number;
  pitchCurve: PitchPoint[];
  loadFile: (file: File) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  play: () => void;
  pause: () => void;
  stopPlayback: () => void;
  toggleLoop: () => void;
  seek: (time: number) => void;
  setPitchCurve: (points: PitchPoint[]) => void;
  exportWav: () => Promise<Blob>;
  fileName: string;
}

export function useAudioEngine(): AudioEngineResult {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [pitchCurve, setPitchCurveState] = useState<PitchPoint[]>([]);
  const [fileName, setFileName] = useState('');
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(0));
  const [freqData, setFreqData] = useState<Uint8Array>(new Uint8Array(0));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number>(0);
  const recordStartRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const pitchCurveRef = useRef<PitchPoint[]>([]);
  const isPlayingRef = useRef(false);
  const isLoopingRef = useRef(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordRafRef = useRef<number>(0);

  useEffect(() => {
    pitchCurveRef.current = pitchCurve;
  }, [pitchCurve]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    audioBufferRef.current = audioBuffer;
  }, [audioBuffer]);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const getAnalyser = useCallback((): AnalyserNode => {
    const ctx = getAudioContext();
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.connect(ctx.destination);
    }
    return analyserRef.current;
  }, []);

  const stopSource = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
  }, []);

  const updatePlayback = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ctx = audioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    const buffer = audioBufferRef.current;
    if (buffer) {
      const elapsed = ctx.currentTime - startTimeRef.current + pauseOffsetRef.current;
      if (elapsed >= buffer.duration) {
        if (isLoopingRef.current) {
          pauseOffsetRef.current = 0;
          startTimeRef.current = ctx.currentTime;
          setCurrentTime(0);
        } else {
          setIsPlaying(false);
          setCurrentTime(buffer.duration);
          return;
        }
      } else {
        setCurrentTime(elapsed);
      }
    }

    const td = new Uint8Array(analyser.frequencyBinCount);
    const fd = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(td);
    analyser.getByteFrequencyData(fd);
    setTimeData(td);
    setFreqData(fd);

    if (sourceRef.current && buffer) {
      const elapsed2 = ctx.currentTime - startTimeRef.current + pauseOffsetRef.current;
      const normalizedTime = elapsed2 / buffer.duration;
      const semitones = interpolatePitch(pitchCurveRef.current, normalizedTime);
      const rate = Math.pow(2, semitones / 12);
      sourceRef.current.playbackRate.value = Math.max(0.25, Math.min(4, rate));
    }

    animFrameRef.current = requestAnimationFrame(updatePlayback);
  }, []);

  const loadFile = useCallback(async (file: File) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    stopSource();
    setIsPlaying(false);
    setCurrentTime(0);
    pauseOffsetRef.current = 0;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(buffer);
    setDuration(buffer.duration);
    setFileName(file.name);

    const emptyTd = new Uint8Array(FFT_SIZE / 2);
    const emptyFd = new Uint8Array(FFT_SIZE / 2);
    setTimeData(emptyTd);
    setFreqData(emptyFd);
  }, [getAudioContext, stopSource]);

  const startRecording = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    stopSource();
    setIsPlaying(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (micSourceRef.current) {
          try { micSourceRef.current.disconnect(); } catch {}
          micSourceRef.current = null;
        }
        cancelAnimationFrame(recordRafRef.current);
        stream.getTracks().forEach((t) => t.stop());
        recordStreamRef.current = null;
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);
          setAudioBuffer(buffer);
          setDuration(buffer.duration);
          setFileName('recording.webm');
        } catch (err) {
          console.error('Failed to decode recording:', err);
        }
        setIsRecording(false);
        setRecordingProgress(0);

        const emptyTd = new Uint8Array(FFT_SIZE / 2);
        const emptyFd = new Uint8Array(FFT_SIZE / 2);
        setTimeData(emptyTd);
        setFreqData(emptyFd);
      };

      const micSource = ctx.createMediaStreamSource(stream);
      const recordAnalyser = getAnalyser();
      micSource.connect(recordAnalyser);
      micSourceRef.current = micSource;

      const recordUpdate = () => {
        const analyser = analyserRef.current;
        if (!analyser) return;
        const td = new Uint8Array(analyser.frequencyBinCount);
        const fd = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(td);
        analyser.getByteFrequencyData(fd);
        setTimeData(td);
        setFreqData(fd);
        recordRafRef.current = requestAnimationFrame(recordUpdate);
      };
      recordRafRef.current = requestAnimationFrame(recordUpdate);

      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingProgress(0);
      recordStartRef.current = Date.now();
      mediaRecorder.start(100);

      const updateProgress = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        const elapsed = (Date.now() - recordStartRef.current) / 1000;
        const progress = Math.min(100, (elapsed / MAX_RECORD_DURATION) * 100);
        setRecordingProgress(progress);
        if (elapsed >= MAX_RECORD_DURATION) {
          stopRecording();
          return;
        }
        recordTimerRef.current = window.setTimeout(updateProgress, 50);
      };
      updateProgress();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setIsRecording(false);
    }
  }, [getAudioContext, getAnalyser, stopSource]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearTimeout(recordTimerRef.current);
    cancelAnimationFrame(recordRafRef.current);
    if (micSourceRef.current) {
      try { micSourceRef.current.disconnect(); } catch {}
      micSourceRef.current = null;
    }
    if (recordStreamRef.current) {
      recordStreamRef.current.getTracks().forEach((t) => t.stop());
      recordStreamRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    const buffer = audioBufferRef.current;
    if (!buffer) return;

    const ctx = getAudioContext();
    const analyser = getAnalyser();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    stopSource();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);

    const loop = isLoopingRef.current;
    source.loop = loop;
    source.onended = () => {
      if (isPlayingRef.current && !loop) {
        setIsPlaying(false);
        setCurrentTime(buffer.duration);
      }
    };

    startTimeRef.current = ctx.currentTime;
    source.start(0, pauseOffsetRef.current);
    sourceRef.current = source;

    setIsPlaying(true);
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updatePlayback);
  }, [getAudioContext, getAnalyser, stopSource, updatePlayback]);

  const pause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingRef.current) return;

    pauseOffsetRef.current += ctx.currentTime - startTimeRef.current;
    stopSource();
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  }, [stopSource]);

  const stopPlayback = useCallback(() => {
    stopSource();
    setIsPlaying(false);
    setCurrentTime(0);
    pauseOffsetRef.current = 0;
    cancelAnimationFrame(animFrameRef.current);

    const emptyTd = new Uint8Array(FFT_SIZE / 2);
    const emptyFd = new Uint8Array(FFT_SIZE / 2);
    setTimeData(emptyTd);
    setFreqData(emptyFd);
  }, [stopSource]);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      if (sourceRef.current) {
        sourceRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const seek = useCallback((time: number) => {
    const buffer = audioBufferRef.current;
    if (!buffer) return;
    const clamped = Math.max(0, Math.min(time, buffer.duration));
    pauseOffsetRef.current = clamped;

    if (isPlayingRef.current) {
      stopSource();
      const ctx = getAudioContext();
      const analyser = getAnalyser();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);
      source.loop = isLoopingRef.current;
      source.onended = () => {
        if (isPlayingRef.current && !isLoopingRef.current) {
          setIsPlaying(false);
        }
      };
      startTimeRef.current = ctx.currentTime;
      source.start(0, clamped);
      sourceRef.current = source;
    }
    setCurrentTime(clamped);
  }, [getAudioContext, getAnalyser, stopSource]);

  const setPitchCurve = useCallback((points: PitchPoint[]) => {
    setPitchCurveState(points);
  }, []);

  const exportWav = useCallback(async (): Promise<Blob> => {
    const buffer = audioBufferRef.current;
    if (!buffer) throw new Error('No audio buffer');

    const curve = pitchCurveRef.current;
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const totalSamples = buffer.length;

    const offlineCtx = new OfflineAudioContext(
      numChannels,
      totalSamples,
      sampleRate
    );

    if (curve.length === 0) {
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      source.start(0);
    } else {
      const sorted = [...curve].sort((a, b) => a.x - b.x);
      const segmentCount = Math.max(sorted.length + 1, 2);
      const boundaries: number[] = [0];
      for (const p of sorted) {
        boundaries.push(p.x * buffer.duration);
      }
      boundaries.push(buffer.duration);

      for (let i = 0; i < boundaries.length - 1; i++) {
        const segStart = boundaries[i];
        const segEnd = boundaries[i + 1];
        if (segEnd <= segStart) continue;

        const segMid = (segStart + segEnd) / 2;
        const normalizedTime = segMid / buffer.duration;
        const semitones = interpolatePitch(curve, normalizedTime);
        const rate = Math.pow(2, semitones / 12);

        const startSample = Math.floor(segStart * sampleRate);
        const endSample = Math.min(Math.floor(segEnd * sampleRate), totalSamples);
        const segLength = endSample - startSample;
        if (segLength <= 0) continue;

        const segBuffer = offlineCtx.createBuffer(
          numChannels,
          segLength,
          sampleRate
        );
        for (let ch = 0; ch < numChannels; ch++) {
          const sourceData = buffer.getChannelData(ch);
          const segData = segBuffer.getChannelData(ch);
          for (let s = 0; s < segLength; s++) {
            segData[s] = sourceData[startSample + s];
          }
        }

        const source = offlineCtx.createBufferSource();
        source.buffer = segBuffer;
        source.playbackRate.value = Math.max(0.25, Math.min(4, rate));
        source.connect(offlineCtx.destination);
        source.start(segStart);
      }
    }

    const rendered = await offlineCtx.startRendering();
    const wavData = encodeWav(rendered);
    return new Blob([wavData], { type: 'audio/wav' });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(recordTimerRef.current);
      stopSource();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stopSource]);

  return {
    audioBuffer,
    timeData,
    freqData,
    isPlaying,
    isRecording,
    isLooping,
    currentTime,
    duration,
    recordingProgress,
    pitchCurve,
    loadFile,
    startRecording,
    stopRecording,
    play,
    pause,
    stopPlayback,
    toggleLoop,
    seek,
    setPitchCurve,
    exportWav,
    fileName,
  };
}
