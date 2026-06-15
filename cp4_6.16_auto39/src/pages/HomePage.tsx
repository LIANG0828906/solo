import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlaylistCard } from '../components/PlaylistCard';
import { usePlaylistStore } from '../store/playlistStore';
import { useDebounce } from '../hooks/useDebounce';
import type { SortType } from '../types';
import './HomePage.css';

export function HomePage() {
  const { playlists, loadPlaylists, isLoading, getFilteredPlaylistSummaries } = usePlaylistStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('createdAt');

  const debouncedSearch = useDebounce(searchQuery, 200);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const filteredPlaylists = useMemo(() => {
    return getFilteredPlaylistSummaries(sortBy, debouncedSearch);
  }, [playlists, sortBy, debouncedSearch, getFilteredPlaylistSummaries]);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🎵</span>
            TuneTales
          </h1>
          <p className="app-subtitle">用音乐讲述你的故事</p>
        </div>
        <Link to="/create" className="create-btn">
          <span>+</span> 创建歌单
        </Link>
      </header>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索歌单标题或主题..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sort-select">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortType)}
          >
            <option value="createdAt">最新更新</option>
            <option value="songCount">歌曲最多</option>
          </select>
        </div>
      </div>

      <div className="playlist-grid">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>加载中...</p>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎶</div>
            <h3>还没有歌单</h3>
            <p>
              {searchQuery ? '没有找到匹配的歌单，换个关键词试试' : '创建你的第一个叙事歌单吧'}
            </p>
            {!searchQuery && (
              <Link to="/create" className="btn-create-empty">
                立即创建
              </Link>
            )}
          </div>
        ) : (
          filteredPlaylists.map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))
        )}
      </div>
    </div>
  );
}
