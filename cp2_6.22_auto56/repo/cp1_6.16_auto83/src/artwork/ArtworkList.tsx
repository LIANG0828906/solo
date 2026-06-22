import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './ArtworkList.css';

const ArtworkList = () => {
  const { artworks, selectArtwork } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredArtworks = useMemo(() => {
    if (!debouncedTerm) return artworks;
    const term = debouncedTerm.toLowerCase();
    return artworks.filter(
      a => a.title.toLowerCase().includes(term) || a.artist.toLowerCase().includes(term)
    );
  }, [artworks, debouncedTerm]);

  return (
    <div className="artwork-list-container">
      <div className="search-bar">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="搜索作品名称或手工艺人"
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="artwork-grid">
        {filteredArtworks.map(artwork => (
          <div
            key={artwork.id}
            className="artwork-card"
            onClick={() => selectArtwork(artwork.id)}
          >
            <div className="card-image-wrapper">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="card-image"
              />
              {artwork.isEnded && (
                <div className="card-ended-badge">已结束</div>
              )}
            </div>
            <div className="card-content">
              <h3 className="card-title">{artwork.title}</h3>
              <p className="card-artist">{artwork.artist}</p>
              <div className="card-price">
                <span className="price-label">当前价</span>
                <span className="price-value">¥{artwork.currentPrice}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtworkList;
