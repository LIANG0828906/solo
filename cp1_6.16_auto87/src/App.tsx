import React, { useCallback, useEffect } from 'react';
import { useStore, Track } from './store/useStore';
import Player from './player/Player';
import RecordShelf from './station/RecordShelf';
import StationManager from './station/StationManager';

const App: React.FC = () => {
  const {
    collections,
    currentStation,
    playState,
    searchText,
    searchResults,
    notification,
    draggedTrack,
    flashTrackId,
    setSearchText,
    addToQueue,
    addTracksByGenre,
    createStation,
    setCurrentTrack,
    togglePlay,
    setProgress,
    playNext,
    setDraggedTrack,
    setFlashTrackId,
    addToCollection,
  } = useStore();

  const handleTrackDragStart = useCallback((track: Track, e: React.DragEvent) => {
    setDraggedTrack(track);
    e.dataTransfer.setData('text/plain', track.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [setDraggedTrack]);

  const handleTrackDragEnd = useCallback(() => {
    setDraggedTrack(null);
  }, [setDraggedTrack]);

  const handleTrackClick = useCallback((track: Track) => {
    setCurrentTrack(track);
  }, [setCurrentTrack]);

  const handlePlayerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trackId = e.dataTransfer.getData('text/plain');
    const track = collections.find(t => t.id === trackId) || draggedTrack;

    if (track) {
      setCurrentTrack(track);
      setFlashTrackId(track.id);
      addToCollection(track);
    }

    setDraggedTrack(null);
  }, [collections, draggedTrack, setCurrentTrack, setFlashTrackId, setDraggedTrack, addToCollection]);

  const handlePlayerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      setDraggedTrack(null);
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [setDraggedTrack]);

  return (
    <div
      className="app-container"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #4A0E0E 0%, #2D1B0E 70%, #1A0F08 100%)',
        position: 'relative',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(139, 90, 43, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(74, 14, 14, 0.2) 0%, transparent 50%),
            linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)
          `,
          pointerEvents: 'none',
        }}
      />

      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 32px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            color: '#1A0F08',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            animation: 'notificationSlide 2s ease forwards',
            backdropFilter: 'blur(10px)',
          }}
        >
          ✨ {notification.message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          height: '100%',
          gap: '0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: '20px 0 20px 20px',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <RecordShelf
            tracks={collections}
            flashTrackId={flashTrackId}
            onTrackDragStart={handleTrackDragStart}
            onTrackDragEnd={handleTrackDragEnd}
            onTrackClick={handleTrackClick}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'relative',
          }}
          onDrop={handlePlayerDrop}
          onDragOver={handlePlayerDragOver}
        >
          <Player
            currentTrack={playState.currentTrack}
            isPlaying={playState.isPlaying}
            progress={playState.progress}
            onTogglePlay={togglePlay}
            onProgressChange={setProgress}
            onPlayNext={playNext}
          />
        </div>

        <div
          style={{
            padding: '20px 20px 20px 0',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(5px)',
              overflow: 'hidden',
            }}
          >
            <StationManager
              searchText={searchText}
              searchResults={searchResults}
              currentQueue={currentStation?.queue || []}
              currentStationName={currentStation?.name || ''}
              onSearchChange={setSearchText}
              onAddToQueue={addToQueue}
              onAddByGenre={addTracksByGenre}
              onCreateStation={createStation}
              onTrackClick={handleTrackClick}
            />
          </div>
        </div>
      </div>

      {draggedTrack && (
        <div
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'blur(2px)',
            opacity: 0.6,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        @keyframes notificationSlide {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-100px);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          85% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(100px);
          }
        }

        ::selection {
          background: rgba(255, 140, 66, 0.5);
          color: #ffffff;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 1200px) {
          .app-container > div {
            grid-template-columns: 240px 1fr 280px;
          }
        }

        @media (max-width: 1024px) {
          .app-container {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .app-container > div {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
