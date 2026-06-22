import React, { useRef, useState } from 'react';
import { Song } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SongListProps {
  songs: Song[];
  currentSongIndex: number;
  onSongsChange: (songs: Song[]) => void;
  onSongClick: (index: number) => void;
  onDeleteSong: (index: number) => void;
}

const formatDuration = (seconds: number): string => {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 0);
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(audio.src);
    };
    audio.src = URL.createObjectURL(file);
  });
};

const extractSongInfo = (fileName: string): { title: string; artist?: string } => {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim()
    };
  }
  return { title: nameWithoutExt };
};

const SongList: React.FC<SongListProps> = ({
  songs,
  currentSongIndex,
  onSongsChange,
  onSongClick,
  onDeleteSong
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('audio/') ||
        f.name.toLowerCase().endsWith('.mp3') ||
        f.name.toLowerCase().endsWith('.wav')
    );

    const newSongs: Song[] = [];

    for (const file of fileArray) {
      const duration = await getAudioDuration(file);
      const info = extractSongInfo(file.name);
      newSongs.push({
        id: uuidv4(),
        title: info.title,
        artist: info.artist,
        duration,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name
      });
    }

    if (newSongs.length > 0) {
      onSongsChange([...songs, ...newSongs]);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSongDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSongDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleSongDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleSongDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSongs = [...songs];
    const [draggedSong] = newSongs.splice(draggedIndex, 1);
    newSongs.splice(dropIndex, 0, draggedSong);
    onSongsChange(newSongs);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSongDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="song-list-section">
      <div className="song-list-header">
        <div className="song-list-title">歌曲列表（{songs.length}）</div>
        <button className="btn btn-primary" onClick={handleDropZoneClick}>
          + 导入音乐
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      <div
        className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="drop-zone-icon">📁</span>
        <div className="drop-zone-text">
          点击选择或拖拽音频文件到此处（支持 mp3、wav 格式）
        </div>
      </div>

      <ul className="song-list">
        {songs.map((song, index) => (
          <li
            key={song.id}
            className={`song-item ${index === currentSongIndex ? 'playing' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleSongDragStart(e, index)}
            onDragOver={(e) => handleSongDragOver(e, index)}
            onDragLeave={handleSongDragLeave}
            onDrop={(e) => handleSongDrop(e, index)}
            onDragEnd={handleSongDragEnd}
            onClick={() => onSongClick(index)}
            style={{
              borderTop: dragOverIndex === index && draggedIndex !== null
                ? '2px solid var(--accent)'
                : '2px solid transparent'
            }}
          >
            <span className="song-index">{index + 1}</span>
            <div className="song-info">
              <div className="song-title">{song.title}</div>
              {song.artist && <div className="song-artist">{song.artist}</div>}
            </div>
            <span className="song-duration">{formatDuration(song.duration)}</span>
            <div className="song-actions">
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSong(index);
                }}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      {songs.length === 0 && (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">🎶</div>
          <div className="empty-state-text">暂无歌曲，请导入音乐文件</div>
        </div>
      )}
    </div>
  );
};

export default SongList;
