import React, { useCallback } from 'react';
import { Track } from '../store/useStore';
import RecordCard from './RecordCard';

interface RecordShelfProps {
  tracks: Track[];
  flashTrackId: string | null;
  onTrackDragStart: (track: Track, e: React.DragEvent) => void;
  onTrackDragEnd: () => void;
  onTrackClick: (track: Track) => void;
}

const RecordShelf: React.FC<RecordShelfProps> = React.memo(({
  tracks,
  flashTrackId,
  onTrackDragStart,
  onTrackDragEnd,
  onTrackClick,
}) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className="record-shelf"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        padding: '20px',
        height: '100%',
        overflowY: 'auto',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '16px',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        我的收藏
        <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'normal' }}>
          ({tracks.length} 张唱片)
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        {tracks.map((track) => (
          <div
            key={track.id}
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <RecordCard
              track={track}
              size="medium"
              draggable={true}
              isFlashing={flashTrackId === track.id}
              onDragStart={onTrackDragStart}
              onDragEnd={onTrackDragEnd}
              onClick={onTrackClick}
            />
          </div>
        ))}
      </div>

      {tracks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            padding: '40px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💿</div>
          <div>收藏架空空如也</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            搜索歌曲添加到收藏吧
          </div>
        </div>
      )}

      <style>{`
        .record-shelf::-webkit-scrollbar {
          width: 6px;
        }
        .record-shelf::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .record-shelf::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        .record-shelf::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
});

RecordShelf.displayName = 'RecordShelf';

export default RecordShelf;
