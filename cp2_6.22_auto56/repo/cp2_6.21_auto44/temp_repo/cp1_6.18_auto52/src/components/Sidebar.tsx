import { useState, useRef, useEffect } from 'react';
import { Plus, Home, Music, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { usePlaylistStore } from '@/stores/playlistStore';
import { usePlayerStore } from '@/stores/playerStore';
import { getRecommendations } from '@/services/apiService';
import type { Song } from '@/services/apiService';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectPlaylist: (id: string) => void;
  selectedPlaylistId: string | null;
}

export default function Sidebar({ collapsed, onToggle, onSelectPlaylist, selectedPlaylistId }: SidebarProps) {
  const { playlists, createPlaylist, fetchPlaylists } = usePlaylistStore();
  const recentPlayed = usePlayerStore((s) => s.history.slice(0, 5));
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [coverFile, setCoverFile] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Song[] | null>(null);
  const [showRec, setShowRec] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const cover = coverFile || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20playlist%20cover%20abstract&image_size=square';
    await createPlaylist(name.trim(), cover);
    setShowModal(false);
    setName('');
    setCoverFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverFile(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleRecommend = async () => {
    const recs = await getRecommendations(recentPlayed.map((h) => h.song));
    setRecommendations(recs);
    setShowRec(true);
  };

  if (collapsed) {
    return (
      <aside className="sidebar-collapsed">
        <button className="sidebar-icon-btn" onClick={onToggle} title="展开侧边栏">
          <ChevronRight size={20} />
        </button>
        <button className="sidebar-icon-btn" title="首页">
          <Home size={20} />
        </button>
        <button className="sidebar-icon-btn" onClick={() => setShowModal(true)} title="新建歌单">
          <Plus size={20} />
        </button>
        {playlists.slice(0, 5).map((pl) => (
          <button
            key={pl.id}
            className={`sidebar-icon-btn ${selectedPlaylistId === pl.id ? 'active' : ''}`}
            onClick={() => onSelectPlaylist(pl.id)}
            title={pl.name}
          >
            <Music size={18} />
          </button>
        ))}
        {showModal && renderModal()}
        {showRec && renderRecPanel()}
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">SoundWave</h2>
        <button className="sidebar-toggle" onClick={onToggle} title="折叠侧边栏">
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="sidebar-section">
        <button className="sidebar-home-btn ripple-effect">
          <Home size={18} />
          <span>首页</span>
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-label">我的歌单</span>
          <button className="sidebar-add-btn ripple-effect" onClick={() => setShowModal(true)}>
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar-playlist-list">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className={`sidebar-playlist-item ripple-effect ${selectedPlaylistId === pl.id ? 'active' : ''}`}
              onClick={() => onSelectPlaylist(pl.id)}
            >
              <img src={pl.cover} alt={pl.name} className="sidebar-playlist-cover" />
              <div className="sidebar-playlist-info">
                <span className="sidebar-playlist-name">{pl.name}</span>
                <span className="sidebar-playlist-count">{pl.songs.length} 首</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-recent">
        <div className="sidebar-recent-header">
          <Clock size={14} />
          <span>最近播放</span>
        </div>
        <div className="sidebar-recent-scroll">
          {recentPlayed.length === 0 ? (
            <div className="sidebar-recent-empty">暂无播放记录</div>
          ) : (
            recentPlayed.map((h) => (
              <div key={h.song.id + h.playedAt} className="sidebar-recent-card">
                <img src={h.song.cover} alt={h.song.name} className="sidebar-recent-cover" />
                <span className="sidebar-recent-name">{h.song.name}</span>
              </div>
            ))
          )}
        </div>
        <button className="sidebar-rec-btn ripple-effect" onClick={handleRecommend}>
          <Sparkles size={14} />
          <span>根据历史推荐</span>
        </button>
      </div>

      {showModal && renderModal()}
      {showRec && renderRecPanel()}
    </aside>
  );

  function renderModal() {
    return (
      <div className="modal-overlay overlay-enter" onClick={() => setShowModal(false)}>
        <div className="modal modal-enter" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">新建歌单</h3>
          <input
            className="modal-input"
            placeholder="歌单名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="modal-cover-section">
            <span className="modal-label">封面图片</span>
            <div className="modal-cover-row">
              <img
                src={coverFile || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20playlist%20cover%20abstract&image_size=square'}
                alt="封面预览"
                className="modal-cover-preview"
              />
              <button className="modal-upload-btn ripple-effect" onClick={() => fileRef.current?.click()}>
                上传封面
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-cancel-btn ripple-effect" onClick={() => setShowModal(false)}>
              取消
            </button>
            <button className="modal-confirm-btn ripple-effect" onClick={handleCreate} disabled={!name.trim()}>
              创建
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderRecPanel() {
    return (
      <div className="modal-overlay overlay-enter" onClick={() => setShowRec(false)}>
        <div className="rec-panel modal-enter" onClick={(e) => e.stopPropagation()}>
          <h3 className="rec-panel-title">
            <Sparkles size={18} />
            为你推荐
          </h3>
          {recommendations ? (
            <div className="rec-panel-list">
              {recommendations.map((s) => (
                <div key={s.id} className="rec-panel-item">
                  <img src={s.cover} alt={s.name} className="rec-panel-cover" />
                  <div className="rec-panel-info">
                    <span className="rec-panel-name">{s.name}</span>
                    <span className="rec-panel-artist">{s.artist}</span>
                  </div>
                  <span className="rec-panel-genre">{s.genre}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rec-panel-loading">分析中...</div>
          )}
          <button className="modal-cancel-btn ripple-effect" onClick={() => setShowRec(false)}>
            关闭
          </button>
        </div>
      </div>
    );
  }
}
