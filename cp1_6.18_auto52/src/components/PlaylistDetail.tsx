import { useState, useEffect } from 'react';
import { Play, Pause, Pencil, Trash2, Share2, Heart, Music } from 'lucide-react';
import { usePlaylistStore } from '@/stores/playlistStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useNavigate } from 'react-router-dom';
import type { Playlist } from '@/services/apiService';

interface PlaylistDetailProps {
  playlistId: string;
  readOnly?: boolean;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaylistDetail({ playlistId, readOnly }: PlaylistDetailProps) {
  const { playlists, removeSong, updatePlaylist, sharePlaylist, deletePlaylist } = usePlaylistStore();
  const { currentSong, isPlaying, play, togglePlay } = usePlayerStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const navigate = useNavigate();

  const playlist = playlists.find((p) => p.id === playlistId);

  useEffect(() => {
    if (playlist && editing) {
      setEditName(playlist.name);
    }
  }, [playlist, editing]);

  if (!playlist) {
    return (
      <div className="detail-empty">
        <Music size={48} />
        <p>选择一个歌单开始</p>
      </div>
    );
  }

  const isCurrentSong = (songId: string) => currentSong?.id === songId;

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    play(playlist.songs[0], playlist.songs, 0);
  };

  const handlePlaySong = (index: number) => {
    if (isCurrentSong(playlist.songs[index].id)) {
      togglePlay();
    } else {
      play(playlist.songs[index], playlist.songs, index);
    }
  };

  const handleShare = async () => {
    const url = await sharePlaylist(playlistId);
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('链接已复制！');
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(''), 2500);
  };

  const handleSaveName = async () => {
    if (editName.trim()) {
      await updatePlaylist(playlistId, { name: editName.trim() });
    }
    setEditing(false);
  };

  const handleDeletePlaylist = async () => {
    await deletePlaylist(playlistId);
    navigate('/');
  };

  const totalDuration = playlist.songs.reduce((sum, s) => sum + s.duration, 0);
  const totalMin = Math.floor(totalDuration / 60);

  return (
    <div className="detail fade-in">
      <div className="detail-header">
        <img src={playlist.cover} alt={playlist.name} className="detail-cover" />
        <div className="detail-header-info">
          <span className="detail-label">歌单</span>
          {editing ? (
            <div className="detail-edit-row">
              <input
                className="detail-edit-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button className="detail-save-btn ripple-effect" onClick={handleSaveName}>保存</button>
              <button className="detail-cancel-btn ripple-effect" onClick={() => setEditing(false)}>取消</button>
            </div>
          ) : (
            <h1 className="detail-title">{playlist.name}</h1>
          )}
          <div className="detail-stats">
            <span>{playlist.songs.length} 首歌曲</span>
            <span className="detail-dot">·</span>
            <span>约 {totalMin} 分钟</span>
            {playlist.shareCount > 0 && (
              <>
                <span className="detail-dot">·</span>
                <span>分享 {playlist.shareCount} 次</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="detail-actions">
        {playlist.songs.length > 0 && (
          <button className="detail-play-all ripple-effect" onClick={handlePlayAll}>
            <Play size={18} />
            <span>播放全部</span>
          </button>
        )}
        {!readOnly && (
          <>
            <button className="detail-action-btn ripple-effect" onClick={() => setEditing(true)} title="编辑歌单">
              <Pencil size={16} />
            </button>
            <button className="detail-action-btn ripple-effect" onClick={handleDeletePlaylist} title="删除歌单">
              <Trash2 size={16} />
            </button>
          </>
        )}
        <button className="detail-action-btn ripple-effect" onClick={handleShare} title="复制分享链接">
          <Share2 size={16} />
          {shareMsg && <span className="detail-share-tooltip">{shareMsg}</span>}
        </button>
        <button className="detail-action-btn ripple-effect" title="收藏">
          <Heart size={16} />
        </button>
      </div>

      {playlist.songs.length === 0 ? (
        <div className="detail-no-songs">
          <Music size={32} />
          <p>歌单还没有歌曲，去搜索添加吧</p>
        </div>
      ) : (
        <div className="detail-song-list">
          <div className="detail-song-header">
            <span className="detail-song-num">#</span>
            <span className="detail-song-title-col">标题</span>
            <span className="detail-song-artist-col">歌手</span>
            <span className="detail-song-duration-col">时长</span>
            {!readOnly && <span className="detail-song-action-col"></span>}
          </div>
          {playlist.songs.map((s, i) => (
            <div
              key={s.id}
              className={`detail-song-row ripple-effect ${isCurrentSong(s.id) ? 'active' : ''}`}
              onClick={() => handlePlaySong(i)}
            >
              <span className="detail-song-num">
                {isCurrentSong(s.id) && isPlaying ? (
                  <span className="detail-playing-indicator">
                    <span /><span /><span />
                  </span>
                ) : (
                  i + 1
                )}
              </span>
              <div className="detail-song-title-col">
                <img src={s.cover} alt={s.name} className="detail-song-cover" />
                <span className="detail-song-name">{s.name}</span>
              </div>
              <span className="detail-song-artist-col">{s.artist}</span>
              <span className="detail-song-duration-col">{formatDuration(s.duration)}</span>
              {!readOnly && (
                <span className="detail-song-action-col">
                  <button
                    className="detail-remove-btn"
                    onClick={(e) => { e.stopPropagation(); removeSong(playlistId, s.id); }}
                    title="移除"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
