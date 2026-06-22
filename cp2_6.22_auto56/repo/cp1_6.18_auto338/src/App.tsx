import React, { useEffect, useCallback, useRef } from 'react';
import { useAudioStore } from './store/audioStore';
import { audioEngine } from './audio/audioEngine';
import TrackComponent from './components/Track';
import MixerBus from './components/MixerBus';

const App: React.FC = () => {
  const {
    tracks,
    globalBpm,
    globalVolume,
    isPlaying,
    rmsLevels,
    peakLevels,
    peakHoldValues,
    addTrack,
    setTrackTitle,
    setTrackColor,
    setTrackVolume,
    toggleMute,
    toggleSolo,
    setClipRange,
    setAudioBuffer,
    setEffectType,
    setEffectEnabled,
    setEffectPosition,
    setEffectParam,
    setGlobalBpm,
    setGlobalVolume,
    togglePlay,
    setRmsLevel,
    setPeakLevel
  } = useAudioStore();

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      audioEngine.init();
      audioEngine.setOnLevelUpdate((trackId, rms, peak) => {
        setRmsLevel(trackId, rms);
        setPeakLevel(trackId, peak);
      });

      tracks.forEach((track) => {
        audioEngine.initTrack(track.id);
        audioEngine.rebuildEffectChain(track.id, track.effectSlots);
      });

      isInitialized.current = true;
    }

    return () => {
      // audioEngine.dispose();
    };
  }, []);

  useEffect(() => {
    audioEngine.setGlobalVolume(globalVolume);
  }, [globalVolume]);

  useEffect(() => {
    tracks.forEach((track) => {
      audioEngine.setTrackVolume(track.id, track.volume);
      audioEngine.setTrackMuted(track.id, track.muted);
    });
  }, [tracks]);

  useEffect(() => {
    if (isPlaying) {
      audioEngine.play(tracks);
    } else {
      audioEngine.stop();
    }
  }, [isPlaying]);

  const handlePlayToggle = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  const handleFileUpload = useCallback(async (trackId: string, file: File) => {
    try {
      const { bufferId, duration } = await audioEngine.loadAudioFile(file);
      audioEngine.initTrack(trackId);
      audioEngine.setTrackBuffer(trackId, bufferId);
      setAudioBuffer(trackId, bufferId, duration);

      const track = useAudioStore.getState().tracks.find((t) => t.id === trackId);
      if (track) {
        audioEngine.rebuildEffectChain(trackId, track.effectSlots);
      }
    } catch (error) {
      console.error('Failed to load audio file:', error);
    }
  }, [setAudioBuffer]);

  const handleEffectTypeChange = useCallback((trackId: string, slotId: string, type: any) => {
    setEffectType(trackId, slotId, type);

    setTimeout(() => {
      const track = useAudioStore.getState().tracks.find((t) => t.id === trackId);
      if (track) {
        audioEngine.rebuildEffectChain(trackId, track.effectSlots);
      }
    }, 0);
  }, [setEffectType]);

  const handleEffectEnabledChange = useCallback((trackId: string, slotId: string, enabled: boolean) => {
    setEffectEnabled(trackId, slotId, enabled);

    setTimeout(() => {
      const track = useAudioStore.getState().tracks.find((t) => t.id === trackId);
      if (track) {
        audioEngine.rebuildEffectChain(trackId, track.effectSlots);
      }
    }, 0);
  }, [setEffectEnabled]);

  const handleEffectPositionChange = useCallback((trackId: string, slotId: string, position: 'pre' | 'post') => {
    setEffectPosition(trackId, slotId, position);

    setTimeout(() => {
      const track = useAudioStore.getState().tracks.find((t) => t.id === trackId);
      if (track) {
        audioEngine.rebuildEffectChain(trackId, track.effectSlots);
      }
    }, 0);
  }, [setEffectPosition]);

  const handleEffectParamChange = useCallback((trackId: string, slotId: string, param: string, value: number) => {
    setEffectParam(trackId, slotId, param, value);

    const track = useAudioStore.getState().tracks.find((t) => t.id === trackId);
    const slot = track?.effectSlots.find((s) => s.id === slotId);
    if (slot && slot.type !== 'none') {
      audioEngine.updateEffectParam(trackId, slotId, slot.type, param, value);
    }
  }, [setEffectParam]);

  return (
    <div className="app-container">
      <header className="master-header">
        <div className="header-left">
          <h1 className="app-title">🎵 Audio Collab Studio</h1>
        </div>

        <div className="header-center">
          <div className="control-group">
            <label className="control-label">BPM</label>
            <input
              type="range"
              min="60"
              max="180"
              step="5"
              value={globalBpm}
              onChange={(e) => setGlobalBpm(Number(e.target.value))}
              className="control-slider"
            />
            <span className="control-value">{globalBpm}</span>
          </div>

          <div className="control-group">
            <label className="control-label">主音量</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={globalVolume}
              onChange={(e) => setGlobalVolume(Number(e.target.value))}
              className="control-slider"
            />
            <span className="control-value">{globalVolume}%</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className={`play-button ${isPlaying ? 'playing' : 'stopped'}`}
            onClick={handlePlayToggle}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            )}
          </button>

          <button
            className="add-track-btn"
            onClick={addTrack}
            disabled={tracks.length >= 8}
          >
            + 添加轨道 ({tracks.length}/8)
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="mixer-section">
          <MixerBus
            tracks={tracks}
            rmsLevels={rmsLevels}
            peakLevels={peakLevels}
            peakHoldValues={peakHoldValues}
          />
        </div>

        <div className="tracks-section">
          <div className="tracks-header">
            <h2 className="section-title">多轨编辑器</h2>
            <span className="track-count">{tracks.length} / 8 轨道</span>
          </div>
          <div className="tracks-scroll-container">
            <div className="tracks-list">
              {tracks.map((track) => (
                <TrackComponent
                  key={track.id}
                  track={track}
                  onTitleChange={setTrackTitle}
                  onColorChange={setTrackColor}
                  onVolumeChange={setTrackVolume}
                  onMuteToggle={toggleMute}
                  onSoloToggle={toggleSolo}
                  onClipChange={setClipRange}
                  onFileUpload={handleFileUpload}
                  onEffectTypeChange={handleEffectTypeChange}
                  onEffectEnabledChange={handleEffectEnabledChange}
                  onEffectPositionChange={handleEffectPositionChange}
                  onEffectParamChange={handleEffectParamChange}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background-color: #121212;
          min-width: 1200px;
          overflow: hidden;
        }

        .master-header {
          height: 60px;
          background-color: #1A1A1A;
          border-bottom: 1px solid #333333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
          gap: 20px;
        }

        .header-left {
          flex-shrink: 0;
        }

        .app-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .header-center {
          display: flex;
          align-items: center;
          gap: 32px;
          flex: 1;
          justify-content: center;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 120px;
        }

        .control-label {
          font-size: 10px;
          color: #888888;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-slider {
          width: 120px;
          height: 18px;
        }

        .control-value {
          font-size: 11px;
          color: #ffffff;
          font-weight: 500;
          text-align: right;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .play-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease, background-color 0.2s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .play-button:active {
          transform: scale(0.95);
        }

        .play-button.playing {
          background-color: #4CAF50;
          box-shadow: 0 0 16px rgba(76, 175, 80, 0.4);
        }

        .play-button.stopped {
          background-color: #F44336;
          box-shadow: 0 0 16px rgba(244, 67, 54, 0.4);
        }

        .play-button:hover {
          filter: brightness(1.1);
        }

        .add-track-btn {
          padding: 8px 16px;
          background: #4ECDC4;
          color: #121212;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          transition: transform 0.1s ease, opacity 0.2s ease;
          white-space: nowrap;
        }

        .add-track-btn:hover:not(:disabled) {
          filter: brightness(1.05);
        }

        .add-track-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-track-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 16px;
          overflow: hidden;
        }

        .mixer-section {
          flex-shrink: 0;
        }

        .tracks-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tracks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px 8px;
          flex-shrink: 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          margin: 0;
        }

        .track-count {
          font-size: 12px;
          color: #666666;
        }

        .tracks-scroll-container {
          flex: 1;
          overflow-x: auto;
          overflow-y: auto;
          border: 1px solid #333333;
          border-radius: 8px;
          background: #1E1E1E;
        }

        .tracks-list {
          min-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default App;
