import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import SearchPanel from '@/components/SearchPanel';
import PlaylistDetail from '@/components/PlaylistDetail';
import { usePlaylistStore } from '@/stores/playlistStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Music, Disc3, Headphones, TrendingUp, Plus } from 'lucide-react';
import '@/styles/global.css';

function SharePage() {
  const { id } = useParams<{ id: string }>();
  const { fetchPlaylists, playlists } = usePlaylistStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist && playlists.length > 0) {
    return (
      <div className="share-page">
        <div className="share-not-found">
          <Music size={48} />
          <p>歌单不存在或已被删除</p>
          <button className="share-home-btn ripple-effect" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="share-page">
        <div className="share-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <div className="share-container fade-in">
        <div className="share-header">
          <img src={playlist.cover} alt={playlist.name} className="share-cover" />
          <div className="share-info">
            <span className="share-badge">共享歌单</span>
            <h1 className="share-title">{playlist.name}</h1>
            <span className="share-count">{playlist.songs.length} 首歌曲</span>
          </div>
        </div>
        <div className="share-player-wrap">
          <PlayerBar />
        </div>
        <div className="share-content">
          <PlaylistDetail playlistId={id!} readOnly />
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const { playlists, currentPlaylistId, setCurrentPlaylist, fetchPlaylists } = usePlaylistStore();
  const { play } = usePlayerStore();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  useEffect(() => {
    if (currentPlaylistId) {
      setSelectedPlaylistId(currentPlaylistId);
    }
  }, [currentPlaylistId]);

  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentPlaylist(id);
  };

  const handlePlayPlaylist = (pl: typeof playlists[0]) => {
    if (pl.songs.length > 0) {
      play(pl.songs[0], pl.songs, 0);
    }
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectPlaylist={handleSelectPlaylist}
        selectedPlaylistId={selectedPlaylistId}
      />

      <main className="main-content">
        <div className="main-header">
          <div className="main-header-left">
            {selectedPlaylistId ? null : (
              <div className="main-greeting">
                <h1>发现音乐</h1>
                <p>创建歌单，探索属于你的音乐世界</p>
              </div>
            )}
          </div>
          <div className="main-header-right">
            <SearchPanel />
          </div>
        </div>

        {selectedPlaylistId ? (
          <PlaylistDetail playlistId={selectedPlaylistId} />
        ) : (
          <div className="main-grid">
            <div className="grid-section">
              <h2 className="grid-section-title">
                <Disc3 size={20} />
                我的歌单
              </h2>
              <div className="playlist-grid">
                {playlists.map((pl) => (
                  <div key={pl.id} className="playlist-card">
                    <div className="playlist-card-cover-wrap">
                      <img src={pl.cover} alt={pl.name} className="playlist-card-cover" />
                      <div className="playlist-card-overlay">
                        <button
                          className="playlist-card-play ripple-effect"
                          onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(pl); }}
                          title="播放"
                        >
                          <Headphones size={20} />
                        </button>
                        <button
                          className="playlist-card-edit ripple-effect"
                          onClick={(e) => { e.stopPropagation(); handleSelectPlaylist(pl.id); }}
                          title="查看详情"
                        >
                          <Music size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="playlist-card-info">
                      <span className="playlist-card-name">{pl.name}</span>
                      <span className="playlist-card-count">{pl.songs.length} 首</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid-section">
              <h2 className="grid-section-title">
                <TrendingUp size={20} />
                快速开始
              </h2>
              <div className="quick-start">
                <button className="quick-start-card ripple-effect" onClick={() => handleSelectPlaylist(playlists[0]?.id)}>
                  <Disc3 size={24} />
                  <span>播放第一个歌单</span>
                </button>
                <button className="quick-start-card ripple-effect" onClick={() => {
                  const btn = document.querySelector('.sidebar-add-btn') as HTMLElement;
                  btn?.click();
                }}>
                  <Plus size={24} />
                  <span>创建新歌单</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <PlayerBar />

      <nav className="mobile-nav">
        <button className="mobile-nav-btn" onClick={() => setSidebarCollapsed(false)}>
          <Music size={20} />
          <span>歌单</span>
        </button>
        <button className="mobile-nav-btn">
          <Disc3 size={20} />
          <span>发现</span>
        </button>
        <button className="mobile-nav-btn">
          <TrendingUp size={20} />
          <span>推荐</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}
