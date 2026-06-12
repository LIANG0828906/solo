import { useRef, useCallback } from 'react';
import Scene, { SceneController } from './Scene';
import { ControlsUI } from './components/ControlsUI';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

interface Track {
  name: string;
  url: string;
}

function App() {
  const sceneRef = useRef<SceneController>(null);
  const {
    loadAudio,
    togglePlay,
    setVolume,
    seek,
    isPlaying,
    currentTime,
    duration,
    currentTrack,
    getAudioDataRef,
  } = useAudioAnalyzer();

  const audioDataRef = getAudioDataRef();

  const handleTrackSelect = useCallback((track: Track) => {
    loadAudio(track.url, track.name, false);
  }, [loadAudio]);

  const handleFileUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    loadAudio(url, file.name, true);
  }, [loadAudio]);

  const handleResetCamera = useCallback(() => {
    sceneRef.current?.resetCamera();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Scene ref={sceneRef} audioDataRef={audioDataRef} />
      <ControlsUI
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        currentTrack={currentTrack}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onVolumeChange={setVolume}
        onTrackSelect={handleTrackSelect}
        onFileUpload={handleFileUpload}
        onResetCamera={handleResetCamera}
      />
    </div>
  );
}

export default App;
