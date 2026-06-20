import { useState, useRef } from 'react';
import { Song } from '../types';

interface PlaylistGridProps {
  songs: Song[];
  onRemoveSong: (songId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const genreColors: Record<string, string> = {
  '流行': '#f48fb1',
  '摇滚': '#90a4ae',
  '电子': '#ce93d8',
  '古典': '#a5d6a7',
  '嘻哈': '#ffcc80',
  'R&B': '#81c784',
  '爵士': '#64b5f6',
  '民谣': '#dce775',
};

export default function PlaylistGrid({ songs, onRemoveSong, onReorder }: PlaylistGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggedIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (songs.length === 0) {
    return (
      <div className="playlist-grid">
        <div className="empty-playlist">
          <div className="empty-playlist-icon">🎵</div>
          <div className="empty-playlist-text">
            你的歌单还是空的，使用上方搜索栏添加歌曲吧！
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-grid">
      {songs.map((song, index) => (
        <div
          key={song.id}
          className={`song-card ${draggedIndex === index ? 'dragging' : ''} ${
            dragOverIndex === index ? 'drag-over' : ''
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <button
            className="delete-btn"
            onClick={() => onRemoveSong(song.id)}
            title="删除"
          >
            ×
          </button>
          <img
            src={song.coverUrl}
            alt={song.title}
            className="song-cover"
          />
          <div className="song-title">{song.title}</div>
          <div className="song-artist">{song.artist}</div>
          <span
            className="genre-tag"
            style={{ backgroundColor: genreColors[song.genre] || '#757575' }}
          >
            {song.genre}
          </span>
        </div>
      ))}
    </div>
  );
}
