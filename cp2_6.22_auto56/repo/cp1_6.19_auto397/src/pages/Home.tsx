import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGalleryStore } from '../store/galleryStore';
import MemeCard from '../components/MemeCard';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const memes = useGalleryStore((s) => s.memes);
  const loading = useGalleryStore((s) => s.loading);
  const hasMore = useGalleryStore((s) => s.hasMore);
  const fetchMemes = useGalleryStore((s) => s.fetchMemes);
  const page = useGalleryStore((s) => s.page);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMemes(1);
  }, [fetchMemes]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        fetchMemes(page);
      }
    },
    [hasMore, loading, fetchMemes, page]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '100px'
    });
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">🎨 表情包画廊</h1>
        <p className="home-subtitle">创作你的专属表情包，分享给全世界～</p>
      </div>

      <div className="home-gallery">
        {memes.map((meme) => (
          <MemeCard
            key={meme.id}
            meme={meme}
            onClick={() => navigate(`/detail/${meme.id}`)}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="home-sentinel">
        {loading && (
          <div className="home-loading">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        )}
        {!hasMore && memes.length > 0 && (
          <p className="home-no-more">— 已经到底啦 —</p>
        )}
      </div>
    </div>
  );
};

export default Home;
