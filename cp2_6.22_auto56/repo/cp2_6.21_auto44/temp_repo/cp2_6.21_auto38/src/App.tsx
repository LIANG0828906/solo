import React, { useCallback } from 'react';
import SearchBar from './modules/search/searchBar';
import PlaylistPanel from './modules/playlist/playlistPanel';
import { usePlaylistStore, Track } from './modules/playlist/playlistStore';
import { useCollaboration } from './modules/collaboration/collaborationService';

const App: React.FC = () => {
  const applyRemoteAction = usePlaylistStore((s) => s.applyRemoteAction);

  const handleRemoteAction = useCallback(
    (action: { type: 'add' | 'remove' | 'reorder'; track?: Track; trackId?: string; fromIndex?: number; toIndex?: number }) => {
      applyRemoteAction(action);
    },
    [applyRemoteAction]
  );

  const { isConnected, onlineCount, pulseKey, connect, disconnect, broadcastAction } =
    useCollaboration(handleRemoteAction);

  const handlePlaylistAction = useCallback(
    (action: { type: 'add' | 'remove' | 'reorder'; track?: Track; trackId?: string; fromIndex?: number; toIndex?: number }) => {
      if (isConnected) {
        broadcastAction(action);
      }
    },
    [isConnected, broadcastAction]
  );

  const handleAddTrack = useCallback(
    (track: Track) => {
      if (isConnected) {
        broadcastAction({ type: 'add', track });
      }
    },
    [isConnected, broadcastAction]
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            position: 'sticky',
            top: 0,
            zIndex: 15,
            background: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(108, 99, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎵</span>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>
              协作音乐播放列表
            </span>
          </div>
          <button
            onClick={isConnected ? disconnect : connect}
            style={{
              width: '140px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              background: isConnected
                ? 'linear-gradient(135deg, #555, #666)'
                : 'linear-gradient(135deg, #6a5acd, #8a2be2)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'filter 0.2s, box-shadow 0.2s',
              filter: isConnected ? 'none' : 'brightness(1)',
            }}
            onMouseEnter={(e) => {
              if (!isConnected) {
                e.currentTarget.style.filter = 'brightness(1.2)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(138, 43, 226, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isConnected ? '停止协作' : '开始协作'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SearchBar onAddTrack={handleAddTrack} />
        </div>
      </div>

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <PlaylistPanel
          onlineCount={onlineCount}
          pulseKey={pulseKey}
          isConnected={isConnected}
          onAction={handlePlaylistAction}
        />
      </div>
    </div>
  );
};

export default App;
