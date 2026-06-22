import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Work } from '../dataStore';
import { useAppStore } from '../store';

interface PortfolioGridProps {
  works: Work[];
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({ works }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const { updateWork } = useAppStore();

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumnCount(1);
      } else if (width < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(Math.floor((window.innerWidth - 40) / 340));
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columns: Work[][] = Array.from({ length: columnCount }, () => []);
  const columnHeights: number[] = Array(columnCount).fill(0);

  works.forEach((work) => {
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    columns[shortestColumnIndex].push(work);
    
    const aspectRatio = work.thumbnailUrl.includes('/600/400') ? 1.5 :
                        work.thumbnailUrl.includes('/600/350') ? 1.71 :
                        work.thumbnailUrl.includes('/500/400') ? 1.25 :
                        work.thumbnailUrl.includes('/300/400') ? 0.75 :
                        work.thumbnailUrl.includes('/300/450') ? 0.67 :
                        work.thumbnailUrl.includes('/300/425') ? 0.71 :
                        work.thumbnailUrl.includes('/400/500') ? 0.8 :
                        work.thumbnailUrl.includes('/400/600') ? 0.67 :
                        work.thumbnailUrl.includes('/400/450') ? 0.89 : 1;
    
    const estimatedHeight = 320 / aspectRatio + 60;
    columnHeights[shortestColumnIndex] += estimatedHeight + 20;
  });

  const handleWorkClick = (workId: string) => {
    navigate(`/work/${workId}`);
  };

  const handleLike = async (e: React.MouseEvent, work: Work) => {
    e.stopPropagation();
    
    if (animatingIds.has(work.id)) return;
    
    setAnimatingIds((prev) => new Set(prev).add(work.id));
    
    try {
      const response = await fetch(`/api/works/${work.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        updateWork({ ...work, likes: data.likes, isLiked: data.isLiked });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
    
    setTimeout(() => {
      setAnimatingIds((prev) => {
        const next = new Set(prev);
        next.delete(work.id);
        return next;
      });
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      className="flex gap-5 w-full px-5 py-6"
      style={{ justifyContent: 'center' }}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-col gap-5"
          style={{ width: '320px', flexShrink: 0 }}
        >
          {column.map((work, index) => (
            <div
              key={work.id}
              className="relative cursor-pointer group overflow-hidden rounded-xl list-item-enter"
              style={{ animationDelay: `${(columnIndex * column.length + index) * 50}ms` }}
              onClick={() => handleWorkClick(work.id)}
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={work.thumbnailUrl}
                  alt={work.title}
                  className="w-full transition-transform duration-300 ease-out group-hover:scale-105"
                  style={{ borderRadius: '12px' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-white font-bold text-base mb-2">{work.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleLike(e, work)}
                      className="flex items-center gap-1 text-white hover:text-red-400 transition-colors"
                    >
                      <Heart
                        size={18}
                        className={animatingIds.has(work.id) ? 'bounce' : ''}
                        fill={work.isLiked ? '#EF4444' : 'none'}
                        stroke={work.isLiked ? '#EF4444' : 'currentColor'}
                      />
                      <span className="text-sm font-medium">{work.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PortfolioGrid;
