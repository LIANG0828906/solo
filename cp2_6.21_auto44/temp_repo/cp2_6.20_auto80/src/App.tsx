import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Download, FileJson } from 'lucide-react';
import { useStore } from './store';
import { TrackStrip } from './TrackStrip';
import { StepSequencer } from './StepSequencer';
import { audioEngine } from './audioEngine';

function App() {
  const {
    tracks,
    grid,
    isPlaying,
    currentStep,
    currentBar,
    currentBeat,
    bpm,
    isExporting,
    exportMessage,
    toggleGridCell,
    setVolume,
    setPan,
    toggleMute,
    toggleSolo,
    setBPM,
    setCurrentStep,
    play,
    stop,
    reset,
    exportMidi,
    exportJson,
  } = useStore();

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    audioEngine.setGrid(grid);
    audioEngine.setBPM(bpm);
    audioEngine.setOnStepChange((step) => {
      setCurrentStep(step);
    });

    tracks.forEach((track, idx) => {
      audioEngine.setVolume(track.instrument, track.volume);
      audioEngine.setPan(track.instrument, track.pan);
      audioEngine.setMuted(track.instrument, track.muted);
      audioEngine.setSolo(track.instrument, track.solo);
    });
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBPM(parseInt(e.target.value, 10));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">♪</span>
          Beat Maker Studio
        </h1>
        <p className="app-subtitle">交互式音轨混音与节奏编排</p>
      </header>

      <section className="mixer-section">
        <div className="mixer-panel">
          {tracks.map((track, idx) => (
            <React.Fragment key={track.id}>
              <TrackStrip
                track={track}
                trackIndex={idx}
                onVolumeChange={(v) => setVolume(idx, v)}
                onPanChange={(v) => setPan(idx, v)}
                onToggleMute={() => toggleMute(idx)}
                onToggleSolo={() => toggleSolo(idx)}
              />
              {idx < tracks.length - 1 && <div className="track-divider" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="sequencer-section">
        <StepSequencer
          tracks={tracks}
          grid={grid}
          currentStep={currentStep}
          isPlaying={isPlaying}
          onToggleCell={toggleGridCell}
        />
      </section>

      <footer className="control-bar">
        <div className="control-left">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            <span className="play-pulse" />
          </button>
          <button className="reset-btn" onClick={reset} title="重置">
            <RotateCcw size={18} />
          </button>

          <div className="beat-counter">
            <span className="beat-label">BAR</span>
            <span className="beat-value">{currentBar}</span>
            <span className="beat-sep">:</span>
            <span className="beat-label">BEAT</span>
            <span className="beat-value">{currentBeat}</span>
          </div>
        </div>

        <div className="control-center">
          <span className="bpm-label">BPM</span>
          <div className="bpm-slider-container">
            <input
              type="range"
              min={60}
              max={200}
              value={bpm}
              onChange={handleBpmChange}
              className="bpm-slider"
            />
            <div className="bpm-value">{bpm}</div>
          </div>
        </div>

        <div className="control-right">
          <button
            className="export-btn midi-btn"
            onClick={exportMidi}
            disabled={isExporting}
          >
            {isExporting ? (
              <span className="spinner" />
            ) : (
              <Download size={16} />
            )}
            <span>导出 MIDI</span>
          </button>
          <button
            className="export-btn json-btn"
            onClick={exportJson}
            disabled={isExporting}
          >
            {isExporting ? (
              <span className="spinner" />
            ) : (
              <FileJson size={16} />
            )}
            <span>导出 JSON</span>
          </button>
        </div>

        {exportMessage && (
          <div className="export-toast">
            <span className="toast-icon">✓</span>
            {exportMessage}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
