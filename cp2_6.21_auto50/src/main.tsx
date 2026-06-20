import React, { useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { VisualEngine, AudioAnalysisData } from './visuals/VisualEngine';
import { usePlayerStore } from './store/usePlayerStore';
import { PlayerUI } from './components/PlayerUI';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private _isPlaying = false;
  private previousBass = 0;
  private animFrameId: number | null = null;
  private onAudioData: ((data: AudioAnalysisData) => void) | null = null;
  private onPlayStateChange: ((playing: boolean) => void) | null = null;

  setCallbacks(
    onAudioData: (data: AudioAnalysisData) => void,
    onPlayStateChange: (playing: boolean) => void
  ) {
    this.onAudioData = onAudioData;
    this.onPlayStateChange = onPlayStateChange;
  }

  async loadFromChannelData(
    channelData: ArrayBuffer,
    duration: number,
    sampleRate: number,
    numberOfChannels: number
  ): Promise<void> {
    this.stop();

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const float32 = new Float32Array(channelData);
    const length = float32.length;
    this.audioBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );

    for (let ch = 0; ch < numberOfChannels; ch++) {
      const channel = this.audioBuffer.getChannelData(ch);
      if (ch === 0) {
        channel.set(float32);
      } else {
        channel.set(float32);
      }
    }

    this.pauseOffset = 0;
    this.previousBass = 0;

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
    }
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return;

    this.stopSource();

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.startTime = this.audioContext.currentTime - this.pauseOffset;
    this.sourceNode.start(0, this.pauseOffset);
    this._isPlaying = true;
    if (this.onPlayStateChange) this.onPlayStateChange(true);

    this.sourceNode.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false;
        this.pauseOffset = 0;
        this.stopAnalysis();
        if (this.onPlayStateChange) this.onPlayStateChange(false);
      }
    };

    this.startAnalysisLoop();
  }

  pause(): void {
    if (!this._isPlaying) return;
    if (this.audioContext) {
      this.pauseOffset = this.audioContext.currentTime - this.startTime;
    }
    this.stopSource();
    this.stopAnalysis();
    this._isPlaying = false;
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  seek(time: number): void {
    this.stopSource();
    this.stopAnalysis();
    this.pauseOffset = time;
    if (this._isPlaying) {
      this.play();
    }
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  private stopSource(): void {
    if (this.sourceNode) {
      this.sourceNode.onended = null;
      try {
        this.sourceNode.stop();
      } catch {}
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  private stopAnalysis(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private startAnalysisLoop(): void {
    if (!this.analyser || !this.audioContext || !this.audioBuffer) return;

    this.stopAnalysis();

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(this.analyser.fftSize);

    const analyze = () => {
      if (!this.analyser || !this.audioContext || !this.audioBuffer) return;

      this.analyser.getByteFrequencyData(frequencyData);
      this.analyser.getByteTimeDomainData(timeDomainData);

      const frequencies = Array.from(frequencyData.slice(0, 1024));

      let bassSum = 0;
      for (let i = 0; i <= 10; i++) bassSum += frequencyData[i];
      const bass = bassSum / 11;

      let midSum = 0;
      for (let i = 10; i <= 100; i++) midSum += frequencyData[i];
      const mid = midSum / 91;

      let trebleSum = 0;
      for (let i = 100; i <= 512; i++) trebleSum += frequencyData[i];
      const treble = trebleSum / 413;

      let rmsSum = 0;
      for (let i = 0; i < timeDomainData.length; i++) {
        const v = (timeDomainData[i] - 128) / 128;
        rmsSum += v * v;
      }
      const amplitude = Math.sqrt(rmsSum / timeDomainData.length);

      const beat = bass > 180 && this.previousBass < 160;
      this.previousBass = bass;

      const currentTime = this.audioContext.currentTime - this.startTime;
      const duration = this.audioBuffer.duration;

      if (this.onAudioData) {
        this.onAudioData({
          frequencies,
          waveform: Array.from(timeDomainData),
          bass,
          mid,
          treble,
          amplitude,
          beat,
          currentTime,
          duration,
        });
      }

      this.animFrameId = requestAnimationFrame(analyze);
    };

    this.animFrameId = requestAnimationFrame(analyze);
  }

  stop(): void {
    this.stopSource();
    this.stopAnalysis();
    this._isPlaying = false;
    this.pauseOffset = 0;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

function App() {
  const visualContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VisualEngine | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager());

  const theme = usePlayerStore((s) => s.theme);
  const particleDensity = usePlayerStore((s) => s.particleDensity);
  const waveSensitivity = usePlayerStore((s) => s.waveSensitivity);
  const rotationSpeed = usePlayerStore((s) => s.rotationSpeed);
  const audioFile = usePlayerStore((s) => s.audioFile);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setAudioData = usePlayerStore((s) => s.setAudioData);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setAudioFile = usePlayerStore((s) => s.setAudioFile);
  const isExporting = usePlayerStore((s) => s.isExporting);
  const setExporting = usePlayerStore((s) => s.setExporting);
  const setExportProgress = usePlayerStore((s) => s.setExportProgress);

  useEffect(() => {
    if (!visualContainerRef.current) return;

    const engine = new VisualEngine(visualContainerRef.current);
    engineRef.current = engine;
    engine.animate();

    const worker = new Worker(
      new URL('./audio/AudioProcessor.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, ...data } = e.data;
      if (type === 'decoded') {
        const mgr = audioManagerRef.current;
        mgr.loadFromChannelData(
          data.channelData,
          data.duration,
          data.sampleRate,
          data.numberOfChannels
        ).then(() => {
          if (isPlaying) {
            mgr.play();
          }
        });
      }
    };

    audioManagerRef.current.setCallbacks(
      (audioAnalysisData: AudioAnalysisData) => {
        setAudioData({
          frequencies: audioAnalysisData.frequencies as number[],
          waveform: audioAnalysisData.waveform as number[],
          bass: audioAnalysisData.bass,
          mid: audioAnalysisData.mid,
          treble: audioAnalysisData.treble,
          amplitude: audioAnalysisData.amplitude,
          beat: audioAnalysisData.beat,
          currentTime: audioAnalysisData.currentTime,
          duration: audioAnalysisData.duration,
        });
        engine.updateAudioData(audioAnalysisData);
      },
      (playing: boolean) => {
        setPlaying(playing);
      }
    );

    return () => {
      engine.dispose();
      worker.terminate();
      audioManagerRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParticleDensity(particleDensity);
    }
  }, [particleDensity]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setWaveSensitivity(waveSensitivity);
    }
  }, [waveSensitivity]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setRotationSpeed(rotationSpeed);
    }
  }, [rotationSpeed]);

  useEffect(() => {
    if (!audioFile || !workerRef.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      workerRef.current!.postMessage({
        type: 'decode',
        buffer: reader.result,
      });
    };
    reader.readAsArrayBuffer(audioFile);
  }, [audioFile]);

  useEffect(() => {
    const mgr = audioManagerRef.current;
    if (isPlaying) {
      mgr.play();
    } else {
      mgr.pause();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    audioManagerRef.current.seek(time);
  }, []);

  const handleExportGif = useCallback(async () => {
    if (!engineRef.current || isExporting) return;

    const { exportGif, downloadBlob } = await import('./utils/GifExporter');
    const canvas = engineRef.current.getCanvas();

    setExporting(true);
    setExportProgress(0);

    try {
      const blob = await exportGif({
        canvas,
        width: 600,
        height: 400,
        duration: 5000,
        fps: 15,
        onProgress: (progress) => {
          setExportProgress(Math.round(progress * 100));
        },
      });

      downloadBlob(blob, 'visualization.gif');
    } catch (err) {
      console.error('GIF export failed:', err);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [isExporting, setExporting, setExportProgress]);

  const handleFileUpload = useCallback(
    (file: File) => {
      setAudioFile(file);
      setPlaying(false);
    },
    [setAudioFile, setPlaying]
  );

  return (
    <PlayerUI
      visualContainerRef={visualContainerRef}
      onSeek={handleSeek}
      onExportGif={handleExportGif}
    />
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
