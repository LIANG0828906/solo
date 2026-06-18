import { useEffect, useRef } from 'react';
import { WaveEngine } from './engine/WaveEngine';
import { getAudioEngine } from './engine/AudioEngine';
import { useAudioStore } from './store/audioStore';
import { UploadButton } from './ui/UploadButton';
import { SpectrumPanel } from './ui/SpectrumPanel';
import { ControlBar } from './ui/ControlBar';
import { ModeSwitcher } from './ui/ModeSwitcher';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveEngineRef = useRef<WaveEngine | null>(null);
  const audioEngine = getAudioEngine();
  const mode = useAudioStore((state) => state.mode);
  const amplitudes = useAudioStore((state) => state.amplitudes);
  const frequencies = useAudioStore((state) => state.frequencies);
  const duration = useAudioStore((state) => state.duration);
  const setFile = useAudioStore((state) => state.setFile);
  const durationRef = useRef(duration);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!containerRef.current) return;

    const waveEngine = new WaveEngine(containerRef.current, (timeRatio: number) => {
      const targetTime = timeRatio * durationRef.current;
      audioEngine.seek(targetTime);
    });
    waveEngineRef.current = waveEngine;

    return () => {
      waveEngine.dispose();
    };
  }, []);

  useEffect(() => {
    if (waveEngineRef.current) {
      waveEngineRef.current.setMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (waveEngineRef.current) {
      waveEngineRef.current.updateAudioData(amplitudes, frequencies);
    }
  }, [amplitudes, frequencies]);

  const handleFileSelect = async (file: File) => {
    setFile(file);
    await audioEngine.loadFile(file);
    if (waveEngineRef.current) {
      waveEngineRef.current.setHasAudio(true);
    }
  };

  return (
    <div className="app-container">
      <div ref={containerRef} className="scene-container" />

      <div className="ui-overlay">
        <div className="top-left">
          <UploadButton onFileSelect={handleFileSelect} />
        </div>

        <div className="top-right">
          <ModeSwitcher />
        </div>

        <div className="bottom-left">
          <SpectrumPanel />
        </div>

        <div className="bottom-center">
          <ControlBar />
        </div>
      </div>

      {duration === 0 && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <div className="welcome-icon">🎵</div>
            <h1 className="welcome-title">音频3D波形可视化</h1>
            <p className="welcome-subtitle">上传你的音乐，体验沉浸式波形空间</p>
            <div className="welcome-tips">
              <span>支持 MP3 / WAV 格式</span>
              <span>拖拽旋转视角</span>
              <span>双击跳转进度</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
