import React, { useState, useCallback, useRef } from 'react';
import { usePlaylistStore, formatDuration, Track } from './playlistStore';

interface PlaylistPanelProps {
  onlineCount: number;
  pulseKey: number;
  isConnected: boolean;
  onAction: (action: { type: 'add' | 'remove' | 'reorder'; track?: Track; trackId?: string; fromIndex?: number; toIndex?: number }) => void;
}

const PlaylistPanel: React.FC<PlaylistPanelProps> = ({ onlineCount, pulseKey, isConnected, onAction }) => {
  const tracks = usePlaylistStore((s) => s.tracks);
  const selectedTrackId = usePlaylistStore((s) => s.selectedTrackId);
  const removeTrack = usePlaylistStore((s) => s.removeTrack);
  const reorderTracks = usePlaylistStore((s) => s.reorderTracks);
  const setSelectedTrack = usePlaylistStore((s) => s.setSelectedTrack);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const pulseAnimRef = useRef<number>(0);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '1';
      if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
        reorderTracks(dragIndex, dragOverIndex);
        onAction({ type: 'reorder', fromIndex: dragIndex, toIndex: dragOverIndex });
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, dragOverIndex, reorderTracks, onAction]
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    []
  );

  const handleDelete = useCallback(
    (trackId: string) => {
      removeTrack(trackId);
      onAction({ type: 'remove', trackId });
      setDeleteTarget(null);
    },
    [removeTrack, onAction]
  );

  const pulseAnimKey = `pulse-${pulseKey}-${pulseAnimRef.current++}`;

  return (
    <div
      style={{
        width: '320px',
        height: '100vh',
        background: '#2b2b3d',
        borderLeft: '1px solid #3a3a50',
        borderTopLeftRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '20px 18px 14px',
          borderBottom: '1px solid #3a3a50',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '10px',
          }}
        >
          播放列表
        </div>
        <div
          key={pulseAnimKey}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#aaa',
            animation: isConnected && pulseKey > 0 ? 'collabPulse 0.6s ease-in-out' : 'none',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isConnected ? '#2ecc71' : '#e74c3c',
              animation: isConnected ? 'blink 1.5s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}
          />
          <span>
            {onlineCount}位在线
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {tracks.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#555',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            暂无曲目<br />搜索并添加歌曲到播放列表
          </div>
        )}
        {tracks.map((track, index) => {
          const isCurrent = track.id === selectedTrackId;
          return (
            <div
              key={track.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => setSelectedTrack(isCurrent ? null : track.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                margin: '2px 8px',
                borderRadius: '8px',
                background:
                  isCurrent
                    ? '#3e3e55'
                    : dragOverIndex === index && dragIndex !== null && dragIndex !== index
                    ? 'rgba(108, 99, 255, 0.15)'
                    : 'rgba(30, 30, 46, 0.5)',
                cursor: 'pointer',
                transition: 'background 0.15s ease, transform 0.2s ease',
                border: dragOverIndex === index && dragIndex !== null && dragIndex !== index ? '1px dashed rgba(108,99,255,0.5)' : '1px solid transparent',
                animation: `slideInRight 0.25s ease ${index * 0.03}s both`,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = '#3a3a50';
                }
                const indicator = e.currentTarget.querySelector<HTMLElement>('.hover-indicator');
                if (indicator) {
                  indicator.style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = 'rgba(30, 30, 46, 0.5)';
                }
                const indicator = e.currentTarget.querySelector<HTMLElement>('.hover-indicator');
                if (indicator) {
                  indicator.style.opacity = isCurrent ? '1' : '0';
                }
              }}
            >
              <div
                className="hover-indicator"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '10%',
                  bottom: '10%',
                  width: '3px',
                  borderRadius: '0 2px 2px 0',
                  background: '#a8a5ff',
                  opacity: isCurrent ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              />
              <span
                style={{
                  width: '28px',
                  fontSize: '12px',
                  color: isCurrent ? '#6c63ff' : '#555',
                  fontWeight: isCurrent ? 700 : 600,
                  flexShrink: 0,
                  textAlign: 'center',
                }}
              >
                {index + 1}
              </span>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: isCurrent ? 600 : 500,
                    color: isCurrent ? '#ffffff' : '#e0e0e0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.title}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: isCurrent ? '#a0a0b0' : '#888',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.artist}
                </div>
              </div>
              {isCurrent && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  style={{ marginRight: '8px', flexShrink: 0 }}
                >
                  <polygon
                    points="3,2 14,8 3,14"
                    fill="#6c63ff"
                  />
                </svg>
              )}
              {!isCurrent && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#6c63ff',
                    margin: '0 8px',
                    flexShrink: 0,
                  }}
                >
                  {formatDuration(track.duration)}
                </span>
              )}
              {isCurrent && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#6c63ff',
                    margin: '0 8px',
                    flexShrink: 0,
                    fontWeight: 600,
                  }}
                >
                  {formatDuration(track.duration)}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(track.id);
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#e74c3c',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  lineHeight: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#c0392b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e74c3c';
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {deleteTarget && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            animation: 'modalFadeIn 0.2s ease',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: 'rgba(43, 43, 61, 0.95)',
              borderRadius: '16px',
              padding: '28px 32px',
              minWidth: '240px',
              textAlign: 'center',
              border: '1px solid rgba(108, 99, 255, 0.2)',
              animation: 'modalScaleIn 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '15px', color: '#e0e0e0', marginBottom: '20px' }}>
              确认删除该曲目？
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#555',
                  color: '#ccc',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#666';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#555';
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#e74c3c',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#c0392b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e74c3c';
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistPanel;
