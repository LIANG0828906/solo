import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePlant } from '../context/PlantContext';
import { Plant } from '../data/mockData';
import PlantDetail from './PlantDetail';

const PAGE_SIZE = 6;

const LazyImage: React.FC<{
  src: string;
  alt: string;
}> = ({ src, alt }) => {
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
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} style={{ overflow: 'hidden', position: 'relative' }}>
      {!loaded && <div className="plant-card-img-placeholder" />}
      {inView && (
        <img
          src={src}
          alt={alt}
          className="plant-card-img"
          onLoad={() => setLoaded(true)}
          style={{ display: loaded ? 'block' : 'none', willChange: 'transform' }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

const SkeletonCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <div className="skeleton-card" style={{ animationDelay: `${delay}s` }}>
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsRef = useRef<number[]>([]);

  const availablePlants = useMemo(() => 
    plants.filter(p => p.isAvailable && p.ownerId !== currentUser.id),
    [plants, currentUser.id]
  );

  useEffect(() => {
    console.log('🎮 FPS监控已启动');
    let running = true;
    
    const measureFPS = () => {
      if (!running) return;
      
      frameCountRef.current++;
      const now = performance.now();
      
      if (now - lastTimeRef.current >= 2000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        fpsRef.current.push(fps);
        if (fpsRef.current.length > 5) fpsRef.current.shift();
        const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
        
        if (avgFps < 55) {
          console.warn(`⚠️ 瀑布流滚动FPS较低: ${avgFps.toFixed(1)}，建议优化`);
        } else {
          console.log(`✅ 瀑布流滚动FPS: ${avgFps.toFixed(1)}`);
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const animId = requestAnimationFrame(measureFPS);
    
    return () => {
      running = false;
      cancelAnimationFrame(animId);
      console.log('🎮 FPS监控已停止');
    };
  }, []);

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
        setDisplayedPlants((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPlants.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        pageRef.current = nextPage;
        if (end >= availablePlants.length) {
          setHasMore(false);
        }
      }
      setLoading(false);
      setInitialLoading(false);
    }, 600);
  }, [loading, hasMore, availablePlants]);

  useEffect(() => {
    setDisplayedPlants([]);
    pageRef.current = 0;
    setHasMore(availablePlants.length > 0);
    setInitialLoading(true);
    setLoading(false);
  }, [availablePlants.length]);

  useEffect(() => {
    if (displayedPlants.length === 0 && !loading && hasMore && initialLoading) {
      loadMore();
    }
  }, [displayedPlants.length, loading, hasMore, initialLoading, loadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loading && hasMore && !initialLoading) {
            loadMore();
          }
        });
      },
      { rootMargin: '250px', threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, initialLoading, loadMore]);

  return (
    <div>
      <h2 className="page-title">🌱 发现绿植 <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 'normal' }}>(共{availablePlants.length}株可交换)</span></h2>
      <div className="masonry-grid" style={{ willChange: 'transform' }}>
        {initialLoading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <SkeletonCard key={`init-skeleton-${i}`} delay={i * 0.08} />
        ))}
        
        {!initialLoading && displayedPlants.map((plant, index) => {
          const owner = getUserById(plant.ownerId);
          return (
            <div
              key={plant.id}
              className="plant-card"
              style={{ animationDelay: `${index * 0.08}s`, willChange: 'transform, opacity' }}
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
                      loading="lazy"
                    />
                    <span className="plant-card-nickname">{owner.nickname}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {!initialLoading && loading && hasMore && Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <SkeletonCard key={`load-skeleton-${i}`} delay={i * 0.05} />
        ))}
      </div>
      
      <div ref={observerRef} style={{ height: '10px' }} />
      
      {!hasMore && displayedPlants.length > 0 && (
        <div className="loader">已经到底啦 ~ 共展示 {displayedPlants.length} 株绿植</div>
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
