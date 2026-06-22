import React, { useState, useMemo, useCallback } from 'react';
import { Track, MOCK_TRACKS, usePlaylistStore, formatDuration } from '../playlist/playlistStore';

interface SearchBarProps {
  onAddTrack?: (track: Track) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onAddTrack }) => {
  const [query, setQuery] = useState('');
  const addTrack = usePlaylistStore((s) => s.addTrack);

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return MOCK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [query]);

  const handleAddTrack = useCallback(
    (track: Track) => {
      addTrack(track);
      onAddTrack?.(track);
    },
    [addTrack, onAddTrack]
  );

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          padding: '16px 24px',
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(108, 99, 255, 0.15)',
        }}
      >
        <input
          type="text"
          placeholder="搜索歌曲名或艺术家..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            minWidth: '300px',
            height: '44px',
            padding: '0 18px',
            fontSize: '15px',
            color: '#e0e0e0',
            background: 'rgba(30, 30, 46, 0.85)',
            border: '1px solid rgba(108, 99, 255, 0.3)',
            borderRadius: '12px',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            backdropFilter: 'blur(8px)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.7)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(108, 99, 255, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {filteredTracks.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            padding: '20px 24px',
          }}
        >
          {filteredTracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handleAddTrack(track)}
              style={{
                width: '200px',
                height: '120px',
                borderRadius: '12px',
                background: '#1e1e2e',
                border: '1px solid rgba(108, 99, 255, 0.19)',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.title}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.artist}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#6c63ff' }}>
                {formatDuration(track.duration)}
              </div>
            </div>
          ))}
        </div>
      )}

      {query.trim() && filteredTracks.length === 0 && (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
          }}
        >
          未找到匹配的曲目
        </div>
      )}

      {!query.trim() && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            padding: '20px 24px',
          }}
        >
          {MOCK_TRACKS.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handleAddTrack(track)}
              style={{
                width: '200px',
                height: '120px',
                borderRadius: '12px',
                background: 'rgba(30, 30, 46, 0.85)',
                border: '1px solid rgba(108, 99, 255, 0.19)',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                animation: `fadeIn 0.3s ease ${index * 0.03}s both`,
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.title}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.artist}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#6c63ff' }}>
                {formatDuration(track.duration)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
