import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlant } from '../context/PlantContext';
import { Plant } from '../data/mockData';
import PlantDetail from './PlantDetail';

const PAGE_SIZE = 6;

const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className} style={{ overflow: 'hidden' }}>
      {!loaded && <div className="plant-card-img-placeholder" />}
      {inView && (
        <img
          src={src}
          alt={alt}
          className="plant-card-img"
          onLoad={() => setLoaded(true)}
          style={{ display: loaded ? 'block' : 'none' }}
        />
      )}
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-img" />
    <div className="skeleton-line" />
    <div className="skeleton-line short" />
    <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ flex: 1, height: '14px', borderRadius: '7px', background: 'linear-gradient(90deg, var(--bg-cream-dark) 25%, var(--border-light) 50%, var(--bg-cream-dark) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    </div>
  </div>
);

const HomePage: React.FC = () => {
  const { plants, getUserById, currentUser } = usePlant();
  const [displayedPlants, setDisplayedPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);

  const availablePlants = plants.filter(p => p.isAvailable && p.ownerId !== currentUser.id);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);

    setTimeout(() => {
      const nextPage = pageRef.current + 1;
      const start = (nextPage - 1) * PAGE_SIZE;
      const end = nextPage * PAGE_SIZE;
      const newPlants = availablePlants.slice(start, end);

      if (newPlants.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedPlants((prev) => [...prev, ...newPlants]);
        pageRef.current = nextPage;
        if (end >= availablePlants.length) {
          setHasMore(false);
        }
      }
      setLoading(false);
    }, 500);
  }, [loading, hasMore, availablePlants]);

  useEffect(() => {
    setDisplayedPlants([]);
    pageRef.current = 0;
    setHasMore(availablePlants.length > 0);
    setLoading(false);
  }, [availablePlants.length]);

  useEffect(() => {
    if (displayedPlants.length === 0 && !loading && hasMore) {
      loadMore();
    }
  }, [displayedPlants.length, loading, hasMore, loadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loading && hasMore) {
            loadMore();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  return (
    <div>
      <h2 className="page-title">🌱 发现绿植</h2>
      <div className="masonry-grid">
        {displayedPlants.map((plant, index) => {
          const owner = getUserById(plant.ownerId);
          return (
            <div
              key={plant.id}
              className="plant-card"
              style={{ animationDelay: `${index * 0.08}s` }}
              onClick={() => setSelectedPlant(plant)}
            >
              <button
                className="swap-intent-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlant(plant);
                }}
              >
                想交换 🌿
              </button>
              <LazyImage
                src={plant.images[0]}
                alt={plant.name}
              />
              <div className="plant-card-info">
                <div className="plant-card-name">{plant.name}</div>
                <div className="plant-card-variety">{plant.variety}</div>
                {owner && (
                  <div className="plant-card-owner">
                    <img
                      src={owner.avatar}
                      alt={owner.nickname}
                      className="plant-card-avatar"
                    />
                    <span className="plant-card-nickname">{owner.nickname}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && Array.from({ length: Math.min(PAGE_SIZE, availablePlants.length - displayedPlants.length) }).map((_, i) => (
          <SkeletonCard key={`skeleton-${i}`} />
        ))}
      </div>
      <div ref={observerRef} />
      {!hasMore && displayedPlants.length > 0 && (
        <div className="loader">已经到底啦 ~</div>
      )}
      {selectedPlant && (
        <PlantDetail
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
        />
      )}
    </div>
  );
};

export default HomePage;
