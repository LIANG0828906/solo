import { useState, useEffect, useRef } from 'react';
import type { Work } from '../data/works';

interface WorksGridProps {
  works: Work[];
  onWorkClick: (work: Work) => void;
  filterKey: number;
}

export default function WorksGrid({ works, onWorkClick, filterKey }: WorksGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [filterKey]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '100px',
      }
    );

    const currentObserver = observerRef.current;
    imageRefs.current.forEach((img) => {
      if (img) {
        currentObserver.observe(img);
      }
    });

    return () => {
      currentObserver.disconnect();
    };
  }, [works]);

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const setImageRef = (id: string, el: HTMLImageElement | null) => {
    if (el) {
      imageRefs.current.set(id, el);
    } else {
      imageRefs.current.delete(id);
    }
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
    <div className="masonry-grid" key={animationKey}>
      {works.map((work, index) => (
        <div
          key={work.id}
          className="masonry-item stagger-enter"
          style={{
            animationDelay: `${index * 0.08}s`,
            opacity: 0,
          }}
        >
          <div
            onClick={() => onWorkClick(work)}
            className="group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1"
            style={{
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            }}
          >
            <div className="relative aspect-video overflow-hidden">
              {!loadedImages.has(work.id) && (
                <div className="absolute inset-0 skeleton" />
              )}
              <img
                ref={(el) => setImageRef(work.id, el)}
                data-src={work.thumbnail}
                alt={work.title}
                className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                  loadedImages.has(work.id) ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(work.id)}
                loading="lazy"
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
          </div>
        </div>
      ))}
    </div>
  );
}
