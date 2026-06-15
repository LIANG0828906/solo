import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Visualizer, VisualizerMode } from './Visualizer';

type AudioState = 'idle' | 'loaded' | 'playing' | 'paused';

interface FileInfo {
  name: string;
  duration: number;
}

interface DecodedBufferData {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  channels: Float32Array[];
}

type WorkerInMessage =
  | { type: 'decode'; data: ArrayBuffer; sampleRate: number }
  | { type: 'process'; frequencyData: Uint8Array; timeData: Uint8Array }
  | { type: 'reset' };

type WorkerOutMessage =
  | { type: 'decoded'; buffer: DecodedBufferData }
  | { type: 'decoded-error'; error: string }
  | { type: 'processed'; spectrumData: Float32Array; waveformData: Float32Array };

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlayerUI: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);
  const rafIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragProgressRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [mode, setMode] = useState<VisualizerMode>('spectrum');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState<boolean>(false);

  const getCurrentTime = useCallback((): number => {
    if (!audioContextRef.current) return 0;
    if (audioState === 'paused') return pausedAtRef.current;
    if (audioState === 'playing') {
      return audioContextRef.current.currentTime - startTimeRef.current;
    }
    return 0;
  }, [audioState]);

  const recreateSource = useCallback((): AudioBufferSourceNode | null => {
    if (!audioContextRef.current || !audioBufferRef.current || !analyserRef.current || !gainNodeRef.current) {
      return null;
    }
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(analyserRef.current);
    analyserRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(audioContextRef.current.destination);
    source.onended = () => {
      if (!isDraggingRef.current && audioState !== 'paused') {
        setAudioState('paused');
        pausedAtRef.current = 0;
        setProgress(0);
      }
    };
    return source;
  }, [audioState]);

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const workerCode = `
type WorkerMessage =
  | { type: 'decode'; data: ArrayBuffer; sampleRate: number }
  | { type: 'process'; frequencyData: Uint8Array; timeData: Uint8Array }
  | { type: 'reset' };

const BAND_COUNT = 32;
const SMOOTHING = 0.75;

let smoothedSpectrum = new Float32Array(BAND_COUNT);
let lastTime = 0;
const MIN_INTERVAL = 33;

function computeBarkBands(frequencyData, fftSize) {
  const bands = new Float32Array(BAND_COUNT);
  const nyquist = 22050;
  const binWidth = nyquist / fftSize;

  const barkEdges = [
    20, 100, 200, 300, 400, 510, 630, 770, 920, 1080, 1270, 1480,
    1720, 2000, 2320, 2700, 3150, 3700, 4400, 5300, 6400, 7700,
    9500, 12000, 15500
  ];

  for (let i = 0; i < BAND_COUNT; i++) {
    const lowFreq = barkEdges[Math.min(i, barkEdges.length - 1)];
    const highFreq = barkEdges[Math.min(i + 1, barkEdges.length - 1)] || nyquist;
    const lowBin = Math.floor(lowFreq / binWidth);
    const highBin = Math.min(Math.ceil(highFreq / binWidth), fftSize);

    let sum = 0;
    let count = 0;
    for (let j = lowBin; j < highBin; j++) {
      sum += frequencyData[j];
      count++;
    }
    bands[i] = count > 0 ? sum / count / 255 : 0;
  }
  return bands;
}

function smoothSpectrum(newBands) {
  const result = new Float32Array(BAND_COUNT);
  for (let i = 0; i < BAND_COUNT; i++) {
    result[i] = smoothedSpectrum[i] * SMOOTHING + newBands[i] * (1 - SMOOTHING);
    smoothedSpectrum[i] = result[i];
  }
  return result;
}

function processWaveform(timeData) {
  const targetLen = 512;
  const output = new Float32Array(targetLen);
  const step = timeData.length / targetLen;
  for (let i = 0; i < targetLen; i++) {
    const idx = Math.floor(i * step);
    output[i] = (timeData[idx] - 128) / 128;
  }
  return output;
}

self.addEventListener('message', async (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'decode': {
      try {
        const offlineCtx = new OfflineAudioContext(1, 1, msg.sampleRate);
        const audioBuffer = await offlineCtx.decodeAudioData(msg.data.slice(0));
        const channels = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channels.push(audioBuffer.getChannelData(i));
        }
        const plainBuffer = {
          sampleRate: audioBuffer.sampleRate,
          length: audioBuffer.length,
          duration: audioBuffer.duration,
          numberOfChannels: audioBuffer.numberOfChannels,
          channels
        };
        const transferList = channels.map(c => c.buffer);
        self.postMessage({ type: 'decoded', buffer: plainBuffer }, transferList);
      } catch (err) {
        self.postMessage({ type: 'decoded-error', error: err.message });
      }
      break;
    }
    case 'process': {
      const now = performance.now();
      if (now - lastTime < MIN_INTERVAL) return;
      lastTime = now;
      const bands = computeBarkBands(msg.frequencyData, msg.frequencyData.length * 2);
      const smoothed = smoothSpectrum(bands);
      const waveform = processWaveform(msg.timeData);
      self.postMessage(
        { type: 'processed', spectrumData: smoothed, waveformData: waveform },
        [smoothed.buffer, waveform.buffer]
      );
      break;
    }
    case 'reset': {
      smoothedSpectrum = new Float32Array(BAND_COUNT);
      lastTime = 0;
      break;
    }
  }
});
`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.addEventListener('message', (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'decoded': {
          if (!audioContextRef.current) break;
          const ctx = audioContextRef.current;
          const bufData = msg.buffer;
          const buffer = ctx.createBuffer(
            bufData.numberOfChannels,
            bufData.length,
            bufData.sampleRate
          );
          for (let c = 0; c < bufData.numberOfChannels; c++) {
            buffer.copyToChannel(bufData.channels[c], c);
          }
          audioBufferRef.current = buffer;
          setFileInfo(prev => prev ? { ...prev, duration: buffer.duration } : null);
          setAudioState('loaded');
          break;
        }
        case 'decoded-error': {
          console.error('Decode error:', msg.error);
          setAudioState('idle');
          break;
        }
        case 'processed': {
          if (visualizerRef.current) {
            visualizerRef.current.updateData(msg.spectrumData, msg.waveformData);
          }
          break;
        }
      }
    });

    workerRef.current = worker;
    return worker;
  }, []);

  useEffect(() => {
    if (canvasRef.current && !visualizerRef.current) {
      visualizerRef.current = new Visualizer(canvasRef.current);
      visualizerRef.current.start();
    }
    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.destroy();
        visualizerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.setMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.setPlaying(audioState === 'playing');
    }
  }, [audioState]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime || 0, 0.01);
    }
  }, [volume]);

  const ensureAudioContext = useCallback((): AudioContext => {
    if (audioContextRef.current) return audioContextRef.current;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    timeDataRef.current = new Uint8Array(analyser.fftSize);

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gainNodeRef.current = gain;

    return ctx;
  }, [volume]);

  const animationLoop = useCallback((): void => {
    if (analyserRef.current && workerRef.current && freqDataRef.current && timeDataRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
      analyserRef.current.getByteTimeDomainData(timeDataRef.current);
      const msg: WorkerInMessage = {
        type: 'process',
        frequencyData: freqDataRef.current,
        timeData: timeDataRef.current
      };
      workerRef.current.postMessage(msg);
    }

    if (!isDraggingRef.current && audioState === 'playing' && fileInfo) {
      const currentTime = getCurrentTime();
      const p = Math.min(1, currentTime / fileInfo.duration);
      setProgress(p);
    }

    rafIdRef.current = requestAnimationFrame(animationLoop);
  }, [audioState, fileInfo, getCurrentTime]);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(animationLoop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [animationLoop]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const handleFile = useCallback(async (file: File): Promise<void> => {
    if (!file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
      alert('请选择音频文件（MP3、WAV等）');
      return;
    }

    const ctx = ensureAudioContext();
    const worker = ensureWorker();

    setFileInfo({ name: file.name, duration: 0 });
    setAudioState('idle');
    pausedAtRef.current = 0;
    setProgress(0);

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
      sourceNodeRef.current = null;
    }

    worker.postMessage({ type: 'reset' } satisfies WorkerInMessage);

    const arrayBuffer = await file.arrayBuffer();
    const msg: WorkerInMessage = {
      type: 'decode',
      data: arrayBuffer,
      sampleRate: ctx.sampleRate
    };
    worker.postMessage(msg, [arrayBuffer]);
  }, [ensureAudioContext, ensureWorker]);

  const onUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const togglePlay = async (): Promise<void> => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (audioState === 'playing') {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
      }
      pausedAtRef.current = getCurrentTime();
      setAudioState('paused');
      return;
    }

    if (audioState === 'loaded' || audioState === 'paused') {
      const source = recreateSource();
      if (!source) return;

      const offset = audioState === 'paused' ? pausedAtRef.current : 0;
      startTimeRef.current = audioContextRef.current.currentTime - offset;
      sourceNodeRef.current = source;

      try {
        source.start(0, offset);
        setAudioState('playing');
      } catch (err) {
        console.error('Play error:', err);
      }
    }
  };

  const seekToProgress = (p: number): void => {
    if (!fileInfo || !audioBufferRef.current || !audioContextRef.current) return;
    const clamped = Math.max(0, Math.min(1, p));
    const targetTime = clamped * fileInfo.duration;

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
      sourceNodeRef.current = null;
    }

    pausedAtRef.current = targetTime;
    setProgress(clamped);

    if (audioState === 'playing') {
      const source = recreateSource();
      if (source) {
        startTimeRef.current = audioContextRef.current.currentTime - targetTime;
        sourceNodeRef.current = source;
        try {
          source.start(0, targetTime);
        } catch { /* ignore */ }
      }
    }
  };

  const getProgressFromEvent = (clientX: number, barEl: HTMLElement): number => {
    const rect = barEl.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const onProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!fileInfo) return;
    isDraggingRef.current = true;
    setIsDraggingProgress(true);
    const p = getProgressFromEvent(e.clientX, e.currentTarget);
    dragProgressRef.current = p;
    setProgress(p);
  };

  const onProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (!fileInfo) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    setIsDraggingProgress(true);
    const p = getProgressFromEvent(touch.clientX, e.currentTarget);
    dragProgressRef.current = p;
    setProgress(p);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent): void => {
      if (!isDraggingRef.current) return;
      const bar = document.querySelector('.progress-bar') as HTMLElement | null;
      if (!bar) return;
      const p = getProgressFromEvent(e.clientX, bar);
      dragProgressRef.current = p;
      setProgress(p);
    };

    const onMouseUp = (): void => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDraggingProgress(false);
      seekToProgress(dragProgressRef.current);
    };

    const onTouchMove = (e: TouchEvent): void => {
      if (!isDraggingRef.current) return;
      const touch = e.touches[0];
      const bar = document.querySelector('.progress-bar') as HTMLElement | null;
      if (!bar) return;
      const p = getProgressFromEvent(touch.clientX, bar);
      dragProgressRef.current = p;
      setProgress(p);
    };

    const onTouchEnd = (): void => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDraggingProgress(false);
      seekToProgress(dragProgressRef.current);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [fileInfo, audioState]);

  const displayTime = audioState === 'playing' || audioState === 'paused'
    ? getCurrentTime()
    : progress * (fileInfo?.duration || 0);

  return (
    <div className="app-container">
      <div className="visualizer-wrapper">
        <canvas ref={canvasRef} className="visualizer-canvas" />
      </div>

      <div className="player-card">
        {!fileInfo ? (
          <div
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onClick={onUploadClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="upload-text">点击或拖拽音频文件到此处</div>
            <div className="upload-hint">支持 MP3、WAV、OGG 等格式</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
          </div>
        ) : (
          <div className="controls">
            <div className="file-info">
              <span className="file-name" title={fileInfo.name}>{fileInfo.name}</span>
              <span className="file-duration">{formatTime(fileInfo.duration)}</span>
            </div>

            <div className="progress-container">
              <span className="time-label">{formatTime(displayTime)}</span>
              <div
                className={`progress-bar ${isDraggingProgress ? 'dragging' : ''}`}
                onMouseDown={onProgressMouseDown}
                onTouchStart={onProgressTouchStart}
              >
                <div className="progress-fill" style={{ width: `${progress * 100}%` }}>
                  <div className="progress-handle" />
                </div>
              </div>
              <span className="time-label">{formatTime(fileInfo.duration)}</span>
            </div>

            <div className="control-row">
              <div className="play-section">
                <button
                  className="play-btn"
                  onClick={togglePlay}
                  disabled={audioState === 'idle'}
                  aria-label={audioState === 'playing' ? '暂停' : '播放'}
                >
                  {audioState === 'playing' ? (
                    <svg viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  )}
                </button>

                <div className="volume-control">
                  <svg className="volume-icon" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === 'spectrum' ? 'active' : ''}`}
                  onClick={() => setMode('spectrum')}
                >
                  频谱
                </button>
                <button
                  className={`mode-btn ${mode === 'waveform' ? 'active' : ''}`}
                  onClick={() => setMode('waveform')}
                >
                  波形
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerUI;
