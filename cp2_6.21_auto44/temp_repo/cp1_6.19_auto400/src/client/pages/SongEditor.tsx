import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSongStore } from '../store/useSongStore';
import { ChordEditor } from '../components/ChordEditor';
import { LyricEditor } from '../components/LyricEditor';
import { PlaybackControl } from '../components/PlaybackControl';
import { MidiPlayer } from '../components/MidiPlayer';

interface SongEditorProps {
  songId: string;
  onBack: () => void;
}

const ROW_HEIGHT = 56;

export const SongEditor: React.FC<SongEditorProps> = ({ songId, onBack }) => {
  const {
    currentSong,
    loadSong,
    chordSequence,
    lyricBlocks,
    bpm,
    isPlaying,
    currentMeasure,
    collaborators,
    startPlayback,
    stopPlayback,
    setCurrentMeasure,
    connectWebSocket,
    disconnectWebSocket,
    updateSong,
    loading,
    error,
    clearError,
    userName
  } = useSongStore();

  const [localBpm, setLocalBpm] = useState(120);
  const [songName, setSongName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const chordContainerRef = useRef<HTMLDivElement>(null);
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    loadSong(songId);
    connectWebSocket(songId);

    return () => {
      disconnectWebSocket();
    };
  }, [songId, loadSong, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (currentSong && !isInitialized.current) {
      setLocalBpm(currentSong.bpm);
      setSongName(currentSong.name);
      isInitialized.current = true;
    }
  }, [currentSong]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setLocalBpm(newBpm);
    if (currentSong) {
      updateSong(currentSong.id, { bpm: newBpm });
    }
  };

  const handleSeek = (measure: number) => {
    setCurrentMeasure(measure);
  };

  const handleMeasureClick = useCallback((measureIndex: number) => {
    if (chordContainerRef.current) {
      const scrollTop = measureIndex * ROW_HEIGHT - 100;
      chordContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleScrollToMeasure = useCallback((measure: number) => {
    if (chordContainerRef.current) {
      const scrollTop = measure * ROW_HEIGHT - 100;
      chordContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
    if (lyricContainerRef.current) {
      const scrollTop = measure * ROW_HEIGHT - 100;
      lyricContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleNameSave = () => {
    if (currentSong && songName.trim()) {
      updateSong(currentSong.id, { name: songName.trim() });
    }
    setIsEditingName(false);
  };

  const totalMeasures = chordSequence.length;

  if (loading && !currentSong) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        padding: '16px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          className="btn btn-ghost ripple"
          onClick={onBack}
          style={{ padding: '8px 12px' }}
        >
          ← 返回
        </button>
        
        <div style={{ flex: 1 }}>
          {isEditingName ? (
            <input
              type="text"
              className="form-input"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              autoFocus
              style={{
                fontSize: '20px',
                fontWeight: '600',
                padding: '4px 8px',
                width: '300px'
              }}
            />
          ) : (
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '600',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              onClick={() => setIsEditingName(true)}
            >
              {songName}
            </h1>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {collaborators.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'var(--bg-tertiary)',
              borderRadius: '20px'
            }}>
              <span style={{ fontSize: '14px' }}>👥</span>
              <div style={{ display: 'flex', gap: '-4px' }}>
                {collaborators.slice(0, 3).map(user => (
                  <div
                    key={user.id}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: user.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: 'white',
                      border: '2px solid var(--bg-secondary)',
                      marginLeft: '-4px'
                    }}
                    title={user.name}
                  >
                    {user.name.charAt(0)}
                  </div>
                ))}
              </div>
              {collaborators.length > 0 && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {userName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="editor-layout"
        style={{
          flex: 1,
          display: 'flex',
          gap: '16px',
          padding: '16px',
          overflow: 'hidden',
          marginBottom: '60px'
        }}
      >
        <div
          ref={lyricContainerRef}
          className="lyric-area"
          style={{
            width: '40%',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          <LyricEditor
            lyricBlocks={lyricBlocks}
            onMeasureClick={handleMeasureClick}
            currentMeasure={currentMeasure}
            rowHeight={ROW_HEIGHT}
          />
        </div>

        <div
          ref={chordContainerRef}
          className="chord-area"
          style={{
            width: '60%',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          <ChordEditor
            chordSequence={chordSequence}
            currentMeasure={currentMeasure}
            isPlaying={isPlaying}
            onScrollToMeasure={handleScrollToMeasure}
            rowHeight={ROW_HEIGHT}
          />
        </div>
      </div>

      <MidiPlayer
        chordSequence={chordSequence}
        bpm={localBpm}
        isPlaying={isPlaying}
        currentMeasure={currentMeasure}
        onMeasureChange={setCurrentMeasure}
        onStop={stopPlayback}
      />

      <PlaybackControl
        isPlaying={isPlaying}
        currentMeasure={currentMeasure}
        totalMeasures={totalMeasures}
        bpm={localBpm}
        onTogglePlay={handleTogglePlay}
        onBpmChange={handleBpmChange}
        onSeek={handleSeek}
      />

      {error && (
        <div className="toast error" onClick={clearError}>
          <span>⚠️</span>
          <span>{error}</span>
          <button
            style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}
            onClick={clearError}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default SongEditor;
