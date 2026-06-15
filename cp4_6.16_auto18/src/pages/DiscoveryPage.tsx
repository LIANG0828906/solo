import { useState, useEffect, useCallback } from 'react';
import { useMusicStore } from '../store/musicStore';
import type { Album } from '../store/musicStore';

export default function DiscoveryPage() {
  const {
    albums,
    currentPlaying,
    getDiscoveryAlbum,
    addAlbum,
    likeAlbum,
    setCurrentPlaying,
    isInitialized
  } = useMusicStore();

  const [discoveryAlbum, setDiscoveryAlbum] = useState<Album | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const refreshDiscovery = useCallback(() => {
    setIsAnimating(true);
    setIsLiked(false);
    setIsAdded(false);
    setTimeout(() => {
      const newAlbum = getDiscoveryAlbum();
      setDiscoveryAlbum(newAlbum);
      setCardKey(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  }, [getDiscoveryAlbum]);

  useEffect(() => {
    if (isInitialized) {
      const album = getDiscoveryAlbum();
      setDiscoveryAlbum(album);
    }
  }, [isInitialized, getDiscoveryAlbum]);

  const handlePlay = () => {
    if (!discoveryAlbum) return;
    if (currentPlaying === discoveryAlbum.id) {
      setCurrentPlaying(null);
    } else {
      setCurrentPlaying(discoveryAlbum.id);
    }
  };

  const handleLike = async () => {
    if (!discoveryAlbum || isLiked) return;
    setIsLiked(true);
    await likeAlbum(discoveryAlbum.id);
  };

  const handleAddToCollection = async () => {
    if (!discoveryAlbum || isAdded) return;
    const exists = albums.some(a =>
      a.name === discoveryAlbum.name && a.artist === discoveryAlbum.artist
    );
    if (exists) {
      alert('这张专辑已经在你的收藏中了！');
      return;
    }
    await addAlbum({
      name: discoveryAlbum.name,
      artist: discoveryAlbum.artist,
      year: discoveryAlbum.year,
      coverUrl: discoveryAlbum.coverUrl,
      genre: discoveryAlbum.genre
    });
    setIsAdded(true);
  };

  if (!discoveryAlbum) {
    return (
      <div className="page discovery-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在寻找推荐...</p>
        </div>
      </div>
    );
  }

  const isPlaying = currentPlaying === discoveryAlbum.id;
  const isVirtual = discoveryAlbum.isVirtual;

  return (
    <div className="page discovery-page">
      <div className="discovery-header">
        <h2>🎲 探索发现</h2>
        <p>为你随机推荐专辑，发现新的音乐宝藏</p>
      </div>

      <div className="discovery-content">
        <div
          key={cardKey}
          className={`discovery-card ${isAnimating ? 'sliding-out' : 'sliding-in'} ${isVirtual ? 'virtual-album' : ''}`}
        >
          {isVirtual && (
            <div className="virtual-badge">
              <span>🎪 虚拟推荐</span>
            </div>
          )}
          <div className="discovery-cover">
            {discoveryAlbum.coverUrl ? (
              <img src={discoveryAlbum.coverUrl} alt={discoveryAlbum.name} />
            ) : (
              <div className="default-cover large">
                <span className="record-icon">💽</span>
              </div>
            )}
            {isPlaying && (
              <div className="playing-overlay">
                <div className="playing-animation large">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <p>正在播放</p>
              </div>
            )}
            <button
              className="play-btn large"
              onClick={handlePlay}
              title={isPlaying ? '停止播放' : '播放'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          <div className="discovery-info">
            <h3 className="album-name">{discoveryAlbum.name}</h3>
            <p className="album-artist">{discoveryAlbum.artist}</p>
            <div className="album-meta">
              <span className="genre-tag">{discoveryAlbum.genre}</span>
              <span className="album-year">{discoveryAlbum.year}</span>
              <span className="like-count-mini">
                ❤️ {discoveryAlbum.likes + (isLiked ? 1 : 0)}
              </span>
            </div>
          </div>

          <div className="discovery-actions">
            <button
              className={`like-btn large ${isLiked ? 'liked pulse-animation' : ''}`}
              onClick={handleLike}
              disabled={isLiked}
              title="点赞"
            >
              <span className="heart-icon">{isLiked ? '❤️' : '🤍'}</span>
              <span>点赞</span>
            </button>
            <button
              className={`btn btn-primary ${isAdded ? 'added' : ''}`}
              onClick={handleAddToCollection}
              disabled={isAdded}
            >
              {isAdded ? '✓ 已收藏' : '📚 加入收藏'}
            </button>
          </div>
        </div>

        <div className="discovery-controls">
          <button
            className="btn btn-secondary refresh-btn"
            onClick={refreshDiscovery}
            disabled={isAnimating}
          >
            <span className="refresh-icon">🔄</span>
            换一批
          </button>
          <p className="discovery-tip">
            {albums.length < 10
              ? '💡 收藏不足10张，正在展示虚拟推荐数据'
              : '💡 从你的收藏中随机推荐'}
          </p>
        </div>
      </div>
    </div>
  );
}
