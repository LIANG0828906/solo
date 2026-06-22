import { useEffect, useRef } from 'react';
import { useBandStore } from '../store/bandStore';
import { visualizer } from '../core/Visualizer';
import { audioEngine } from '../core/AudioEngine';

export function ControlPanel() {
  const isPlaying = useBandStore(state => state.isPlaying);
  const togglePlay = useBandStore(state => state.togglePlay);
  const bpm = useBandStore(state => state.bpm);
  const setBpm = useBandStore(state => state.setBpm);
  const masterVolume = useBandStore(state => state.masterVolume);
  const setMasterVolume = useBandStore(state => state.setMasterVolume);
  
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const analyser = audioEngine.getAnalyser();
    if (analyser) {
      visualizer.setAnalyser(analyser);
    }
    if (waveformCanvasRef.current) {
      visualizer.setWaveformCanvas(waveformCanvasRef.current);
    }
    if (spectrumCanvasRef.current) {
      visualizer.setSpectrumCanvas(spectrumCanvasRef.current);
    }
    
    return () => {
      visualizer.destroy();
    };
  }, []);

  const handlePlayClick = () => {
    if (!audioEngine.getAudioContext()) {
      audioEngine.init();
      const analyser = audioEngine.getAnalyser();
      if (analyser) {
        visualizer.setAnalyser(analyser);
      }
      if (waveformCanvasRef.current) {
        visualizer.setWaveformCanvas(waveformCanvasRef.current);
      }
      if (spectrumCanvasRef.current) {
        visualizer.setSpectrumCanvas(spectrumCanvasRef.current);
      }
    }
    togglePlay();
  };

  return (
    <div className="control-panel">
      <div className="control-row">
        <div className="play-controls">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayClick}
          >
            <span className="play-btn-record" />
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        <div className="slider-group">
          <label className="slider-label">
            <span className="label-text">BPM</span>
            <span className="value-text">{bpm}</span>
          </label>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="bpm-slider"
          />
          <div className="bpm-ticks">
            <span>60</span>
            <span>120</span>
            <span>180</span>
          </div>
        </div>

        <div className="slider-group">
          <label className="slider-label">
            <span className="label-text">总音量</span>
            <span className="value-text">{masterVolume}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      <div className="visualizers">
        <div className="visualizer-section">
          <div className="visualizer-label">波形</div>
          <div className="waveform-container">
            <canvas ref={waveformCanvasRef} className="waveform-canvas" />
          </div>
        </div>
        
        <div className="visualizer-section">
          <div className="visualizer-label">频谱</div>
          <div className="spectrum-container">
            <canvas ref={spectrumCanvasRef} className="spectrum-canvas" />
          </div>
        </div>
      </div>
    </div>
  );
}
