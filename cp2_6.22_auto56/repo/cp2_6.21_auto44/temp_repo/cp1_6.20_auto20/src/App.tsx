import React, { useState, useEffect, useCallback } from 'react';
import { Playlist, Song } from './types';
import PlaylistCard from './components/PlaylistCard';
import PlayerBar from './components/PlayerBar';
import SongList from './components/SongList';

type View =
  | { type: 'home' }
  | { type: 'playlist'; playlistId: string };

const App: React.FC = () => {
  const [view, setView] = useState<View>({ type: 'home' });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('加载歌单失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/playlists/${id}`);
      const data = await res.json();
      setCurrentPlaylist(data.playlist);
    } catch (error) {
      console.error('加载歌单失败:', error);
    }
  };

  useEffect(() => {
    if (view.type === 'playlist') {
      loadPlaylist(view.playlistId);
    } else {
      setCurrentPlaylist(null);
      setCurrentSongIndex(-1);
      setIsPlaying(false);
    }
  }, [view]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim() })
      });
      const data = await res.json();
      setPlaylists((prev) => [...prev, data.playlist]);
      setNewPlaylistName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('创建歌单失败:', error);
    }
  };

  const handleDeletePlaylist = async () => {
    if (view.type !== 'playlist') return;
    try {
      await fetch(`/api/playlists/${view.playlistId}`, {
        method: 'DELETE'
      });
      setPlaylists((prev) => prev.filter((p) => p.id !== view.playlistId));
      setShowDeleteConfirm(false);
      setView({ type: 'home' });
    } catch (error) {
      console.error('删除歌单失败:', error);
    }
  };

  const handleSongsChange = useCallback(async (newSongs: Song[]) => {
    if (!currentPlaylist) return;
    setCurrentPlaylist((prev) => prev ? { ...prev, songs: newSongs } : null);
    try {
      const songsToSave = newSongs.map(({ fileUrl, ...rest }) => rest) as Song[];
      await fetch(`/api/playlists/${currentPlaylist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs: songsToSave })
      });
    } catch (error) {
      console.error('保存歌曲失败:', error);
    }
  }, [currentPlaylist]);

  const handleSongClick = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const handleDeleteSong = (index: number) => {
    if (!currentPlaylist) return;
    const newSongs = currentPlaylist.songs.filter((_, i) => i !== index);
    let newIndex = currentSongIndex;
    if (index === currentSongIndex) {
      newIndex = -1;
      setIsPlaying(false);
    } else if (index < currentSongIndex) {
      newIndex = currentSongIndex - 1;
    }
    setCurrentSongIndex(newIndex);
    handleSongsChange(newSongs);
  };

  const handlePlayPause = () => {
    if (currentSongIndex < 0 && currentPlaylist && currentPlaylist.songs.length > 0) {
      setCurrentSongIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handlePrev = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return;
    const newIndex = currentSongIndex <= 0
      ? currentPlaylist.songs.length - 1
      : currentSongIndex - 1;
    setCurrentSongIndex(newIndex);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return;
    const newIndex = currentSongIndex >= currentPlaylist.songs.length - 1
      ? 0
      : currentSongIndex + 1;
    setCurrentSongIndex(newIndex);
    setIsPlaying(true);
  };

  const handleSongEnd = () => {
    handleNext();
  };

  const renderHome = () => (
    <>
      <div className="app-header">
        <h1 className="app-title">🎵 我的歌单</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 创建歌单
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎶</div>
          <div className="empty-state-text">还没有歌单，创建你的第一个歌单吧</div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + 创建歌单
          </button>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => setView({ type: 'playlist', playlistId: playlist.id })}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">创建新歌单</div>
            <input
              type="text"
              className="input"
              placeholder="请输入歌单名称"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderPlaylistDetail = () => {
    if (!currentPlaylist) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      );
    }

    return (
      <div className="playlist-detail">
        <div className="playlist-detail-header">
          <button className="btn btn-icon" onClick={() => setView({ type: 'home' })} title="返回">
            ←
          </button>
          <h1 className="app-title" style={{ marginBottom: 0 }}>{currentPlaylist.name}</h1>
          <button
            className="btn btn-icon"
            style={{ marginLeft: 'auto', color: 'var(--danger)' }}
            onClick={() => setShowDeleteConfirm(true)}
            title="删除歌单"
          >
            🗑
          </button>
        </div>

        <div className="playlist-detail-content">
          <SongList
            songs={currentPlaylist.songs}
            currentSongIndex={currentSongIndex}
            onSongsChange={handleSongsChange}
            onSongClick={handleSongClick}
            onDeleteSong={handleDeleteSong}
          />

          <PlayerBar
            songs={currentPlaylist.songs}
            currentSongIndex={currentSongIndex}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPrev={handlePrev}
            onNext={handleNext}
            onSongEnd={handleSongEnd}
          />
        </div>

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">确认删除</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                确定要删除歌单 "{currentPlaylist.name}" 吗？此操作不可撤销。
              </p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  取消
                </button>
                <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleDeletePlaylist}>
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      {view.type === 'home' ? renderHome() : renderPlaylistDetail()}
    </div>
  );
};

export default App;
