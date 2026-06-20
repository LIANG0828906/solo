import React from 'react';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <div className="playlist-card" onClick={onClick}>
      <div
        className="playlist-card-cover"
        style={{ background: playlist.coverGradient }}
      >
        🎵
      </div>
      <div className="playlist-card-info">
        <div className="playlist-card-name">{playlist.name}</div>
        <div className="playlist-card-count">
          {playlist.songs.length} 首歌曲
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
