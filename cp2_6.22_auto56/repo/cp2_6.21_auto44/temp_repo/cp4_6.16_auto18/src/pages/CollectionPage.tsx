import { useState, useMemo } from 'react';
import { useMusicStore, GENRES } from '../store/musicStore';
import type { Album } from '../store/musicStore';

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index: number;
  
  while ((index = lowerText.indexOf(lowerQuery, lastIndex)) !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <mark key={`${index}-${lastIndex}`} className="highlight">
        {text.slice(index, index + query.length)}
      </mark>
    );
    lastIndex = index + query.length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return <>{parts}</>;
}

function AlbumCard({
  album,
  searchQuery,
  onPlay,
  onLike,
  onDelete,
  isPlaying
}: {
  album: Album;
  searchQuery: string;
  onPlay: () => void;
  onLike: () => void;
  onDelete: () => void;
  isPlaying: boolean;
}) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(true);
    onLike();
    setTimeout(() => setIsLiked(false), 500);
  };

  return (
    <div className="album-card">
      <div className="album-cover">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={album.name} />
        ) : (
          <div className="default-cover">
            <span className="record-icon">💽</span>
          </div>
        )}
        {isPlaying && (
          <div className="playing-overlay">
            <div className="playing-animation">
              <span></span><span></span><span></span><span></span>
            </div>
            <p>正在播放</p>
          </div>
        )}
        <button
          className="play-btn"
          onClick={onPlay}
          title={isPlaying ? '停止播放' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
      
      <div className="album-info">
        <h3 className="album-name">
          <HighlightText text={album.name} query={searchQuery} />
        </h3>
        <p className="album-artist">
          <HighlightText text={album.artist} query={searchQuery} />
        </p>
        <div className="album-meta">
          <span className="genre-tag">{album.genre}</span>
          <span className="album-year">{album.year}</span>
        </div>
      </div>
      
      <div className="album-actions">
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          title="点赞"
        >
          <span className="heart-icon">❤️</span>
          <span className="like-count">{album.likes}</span>
        </button>
        <button className="delete-btn" onClick={onDelete} title="删除">
          🗑️
        </button>
      </div>
    </div>
  );
}

function AddAlbumModal({
  isOpen,
  onClose,
  onAdd,
  validateAlbum
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (album: Omit<Album, 'id' | 'createdAt' | 'likes'>) => Promise<void>;
  validateAlbum: (album: Omit<Album, 'id' | 'createdAt' | 'likes'>) => { valid: boolean; errors: string[] };
}) {
  const [formData, setFormData] = useState({
    name: '',
    artist: '',
    year: new Date().getFullYear(),
    coverUrl: '',
    genre: GENRES[0]
  });
  const [errors, setErrors] = useState<string[]>([]);

  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAlbum(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onAdd(formData);
      setFormData({
        name: '',
        artist: '',
        year: new Date().getFullYear(),
        coverUrl: '',
        genre: GENRES[0]
      });
      setErrors([]);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrors(error.message.split('\n'));
      }
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      const validation = validateAlbum({ ...formData, [field]: value });
      setErrors(validation.errors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>添加新专辑</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form className="add-album-form" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="form-errors">
              {errors.map((error, index) => (
                <p key={index} className="error-message">⚠️ {error}</p>
              ))}
            </div>
          )}
          <div className="form-group">
            <label>专辑名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="输入专辑名称"
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label>歌手 *</label>
            <input
              type="text"
              value={formData.artist}
              onChange={(e) => handleChange('artist', e.target.value)}
              placeholder="输入歌手名称"
              maxLength={50}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>发行年份</label>
              <input
                type="number"
                min={1900}
                max={currentYear}
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value) || currentYear)}
              />
              <small className="form-hint">范围：1900 - {currentYear}</small>
            </div>
            <div className="form-group">
              <label>音乐风格</label>
              <select
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
              >
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>封面图片URL</label>
            <input
              type="url"
              value={formData.coverUrl}
              onChange={(e) => handleChange('coverUrl', e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              添加收藏
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const {
    albums,
    currentPlaying,
    searchQuery,
    filterGenre,
    filterArtist,
    filterYear,
    sortBy,
    sortOrder,
    addAlbum,
    removeAlbum,
    likeAlbum,
    setCurrentPlaying,
    setSearchQuery,
    setFilterGenre,
    setFilterArtist,
    setFilterYear,
    setSortBy,
    setSortOrder,
    getFilteredAlbums,
    getStats,
    validateAlbum
  } = useMusicStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredAlbums = useMemo(() => getFilteredAlbums(), [albums, searchQuery, filterGenre, filterArtist, filterYear, sortBy, sortOrder]);
  const stats = useMemo(() => getStats(), [albums]);

  const artists = useMemo(
    () => [...new Set(albums.map(a => a.artist))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [albums]
  );

  const years = useMemo(
    () => [...new Set(albums.map(a => a.year.toString()))].sort((a, b) => parseInt(b) - parseInt(a)),
    [albums]
  );

  const maxGenreCount = useMemo(
    () => Math.max(...Object.values(stats.genreDistribution), 1),
    [stats.genreDistribution]
  );

  const handlePlay = (id: string) => {
    if (currentPlaying === id) {
      setCurrentPlaying(null);
    } else {
      setCurrentPlaying(id);
    }
  };

  const handleAddAlbum = async (albumData: Omit<Album, 'id' | 'createdAt' | 'likes'>) => {
    await addAlbum(albumData);
  };

  const handleDeleteAlbum = async (id: string) => {
    if (confirm('确定要删除这张专辑吗？')) {
      await removeAlbum(id);
    }
  };

  return (
    <div className="page collection-page">
      <div className="stats-bar">
        <div className="stats-item">
          <span className="stats-icon">💿</span>
          <div className="stats-info">
            <p className="stats-value">{stats.totalAlbums}</p>
            <p className="stats-label">总专辑数</p>
          </div>
        </div>
        <div className="stats-item">
          <span className="stats-icon">🎤</span>
          <div className="stats-info">
            <p className="stats-value">{stats.totalArtists}</p>
            <p className="stats-label">总歌手数</p>
          </div>
        </div>
        <div className="genre-chart">
          <p className="stats-label">风格分布</p>
          <div className="bar-chart">
            {Object.entries(stats.genreDistribution).length > 0 ? (
              Object.entries(stats.genreDistribution).map(([genre, count], index) => {
                const scale = count / maxGenreCount;
                return (
                  <div key={genre} className="bar-wrapper" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div
                      className="bar"
                      style={{ transform: `scaleY(${scale})` }}
                      title={`${genre}: ${count}`}
                      data-count={count}
                    ></div>
                    <span className="bar-label">{genre}</span>
                  </div>
                );
              })
            ) : (
              <p className="no-data">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索专辑名或歌手..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => setSearchQuery('')}
              title="清除搜索"
            >
              ×
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <button
            className="btn btn-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>⚙️</span> 筛选 {showFilters ? '▲' : '▼'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <span>+</span> 添加专辑
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-bar">
          <div className="filter-group">
            <label>风格</label>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
            >
              <option value="">全部风格</option>
              {GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>歌手</label>
            <select
              value={filterArtist}
              onChange={(e) => setFilterArtist(e.target.value)}
            >
              <option value="">全部歌手</option>
              {artists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>年份</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">全部年份</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>排序</label>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => setSortBy('date')}
              >
                时间
              </button>
              <button
                className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => setSortBy('name')}
              >
                名称
              </button>
              <button
                className="order-btn"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? '升序' : '降序'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          {(filterGenre || filterArtist || filterYear) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFilterGenre('');
                setFilterArtist('');
                setFilterYear('');
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      <div className="albums-grid">
        {filteredAlbums.length > 0 ? (
          filteredAlbums.map(album => (
            <AlbumCard
              key={album.id}
              album={album}
              searchQuery={searchQuery}
              onPlay={() => handlePlay(album.id)}
              onLike={() => likeAlbum(album.id)}
              onDelete={() => handleDeleteAlbum(album.id)}
              isPlaying={currentPlaying === album.id}
            />
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-icon">🎵</span>
            <h3>还没有收藏的专辑</h3>
            <p>点击上方"添加专辑"按钮开始你的音乐收藏之旅吧！</p>
          </div>
        )}
      </div>

      <AddAlbumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAlbum}
        validateAlbum={validateAlbum}
      />
    </div>
  );
}
