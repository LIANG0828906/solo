import { useState, useEffect, useRef, useCallback } from 'react';
import type { Work } from '../data/works';

interface WorksGridProps {
  works: Work[];
  onWorkClick: (work: Work) => void;
  filterKey: number;
}

export default function WorksGrid({ works, onWorkClick, filterKey }: WorksGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);
  const [columnCount, setColumnCount] = useState(4);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
    setLoadedImages(new Set());
  }, [filterKey]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src && img.src !== src) {
              img.src = src;
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const setImageRef = useCallback((el: HTMLImageElement | null) => {
    if (el && observerRef.current) {
      observerRef.current.observe(el);
    }
  }, []);

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getColumnWorks = (columnIndex: number): Work[] => {
    return works.filter((_, index) => index % columnCount === columnIndex);
  };

  if (works.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="text-6xl mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          🔍
        </div>
        <h3
          className="text-xl font-medium mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          没有找到相关作品
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          试试选择其他标签吧
        </p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="flex gap-4"
      key={animationKey}
    >
      {Array.from({ length: columnCount }).map((_, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-4">
          {getColumnWorks(colIndex).map((work) => {
            const globalIndex = works.findIndex((w) => w.id === work.id);
            return (
              <button
                key={work.id}
                onClick={() => onWorkClick(work)}
                className="group text-left rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 stagger-enter"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-card)',
                  animationDelay: `${globalIndex * 0.06}s`,
                  opacity: 0,
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onWorkClick(work);
                  }
                }}
                aria-label={`查看作品 ${work.title}`}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: `1 / ${work.heightRatio}` }}
                >
                  {!loadedImages.has(work.id) && (
                    <div className="absolute inset-0 skeleton" />
                  )}
                  <img
                    ref={setImageRef}
                    data-src={work.thumbnail}
                    alt={work.title}
                    className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                      loadedImages.has(work.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(work.id)}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-4">
                  <h3
                    className="text-base font-medium mb-2 transition-colors duration-300"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {work.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
