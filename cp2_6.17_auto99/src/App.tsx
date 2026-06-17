import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from './store';
import { AudioEngine } from './audio/AudioEngine';
import { WaveformCanvas } from './ui/WaveformCanvas';
import { ControlPanel } from './ui/ControlPanel';
import { MixerPanel } from './ui/MixerPanel';
import type { WaveformPoint } from './store';

function App() {
  const {
    timbre,
    volume,
    bpm,
    reverbEnabled,
    tracks,
    playbackProgress,
    isPlaying,
    currentWaveform,
    setCurrentWaveform,
    setPlaybackProgress,
    setIsPlaying,
    updateTrackWaveform,
  } = useStore();

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const audioInitializedRef = useRef(false);

  useEffect(() => {
    const initialState = {
      timbre,
      volume,
      bpm,
      reverbEnabled,
      tracks,
    };

    audioEngineRef.current = new AudioEngine(initialState);

    audioEngineRef.current.setOnPlaybackProgress((progress) => {
      setPlaybackProgress(progress);
    });

    audioEngineRef.current.setOnIsPlayingChange((playing) => {
      setIsPlaying(playing);
    });

    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.destroy();
        audioEngineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateState({
        timbre,
        volume,
        bpm,
        reverbEnabled,
        tracks,
      });
    }
  }, [timbre, volume, bpm, reverbEnabled, tracks]);

  const handleWaveformChange = useCallback(
    (points: WaveformPoint[] | ((prev: WaveformPoint[]) => WaveformPoint[])) => {
      if (typeof points === 'function') {
        setCurrentWaveform((prev) => points(prev));
      } else {
        setCurrentWaveform(points);
      }
    },
    [setCurrentWaveform]
  );

  const handleDrawingComplete = useCallback(
    async (points: WaveformPoint[]) => {
      const currentTrack = tracks[selectedTrackIndex];
      if (!currentTrack || !audioEngineRef.current) return;

      if (!audioInitializedRef.current) {
        await audioEngineRef.current.init();
        audioInitializedRef.current = true;
      }

      updateTrackWaveform(currentTrack.id, points);
      audioEngineRef.current.updateTrackBuffer(currentTrack.id, points);

      if (!audioEngineRef.current.getIsPlaying()) {
        await audioEngineRef.current.startPlayback();
      }
    },
    [tracks, selectedTrackIndex, updateTrackWaveform]
  );

  const currentTrackWaveform = tracks[selectedTrackIndex]?.waveformPoints || [];
  const displayWaveform = currentWaveform.length > 0 ? currentWaveform : currentTrackWaveform;

  return (
    <div className="app-container">
      <h1 style={{ color: '#00D4AA', fontSize: '24px', marginBottom: '10px' }}>
        SoundCanvas
      </h1>
      <p style={{ color: '#8A8AAA', fontSize: '14px', marginBottom: '10px' }}>
        Select a track below, then draw a waveform to create sound.
      </p>
      <div className="main-content">
        <div className="waveform-section">
          <WaveformCanvas
            waveformPoints={displayWaveform}
            onWaveformChange={handleWaveformChange}
            onDrawingComplete={handleDrawingComplete}
            playbackProgress={playbackProgress}
            isPlaying={isPlaying}
          />
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#8A8AAA', fontSize: '12px' }}>
              Current Track: {selectedTrackIndex + 1}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {tracks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedTrackIndex(index);
                    setCurrentWaveform([]);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedTrackIndex === index ? '#00D4AA' : '#2D2D3F',
                    color: selectedTrackIndex === index ? '#0F0F23' : '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Track {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ControlPanel />
      </div>
      <MixerPanel />
    </div>
  );
}

export default App;
