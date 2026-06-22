import { useState, useMemo } from 'react';
import type { Movie } from '../api';
import MovieCard from './MovieCard';

interface BookShelfProps {
  movies: Movie[];
  onUpdateRating: (id: string, rating: number) => void;
  onDelete: (id: string) => void;
  onReorder: (year: number, fromId: string, toId: string) => void;
}

function BookShelf({
  movies,
  onUpdateRating,
  onDelete,
  onReorder,
}: BookShelfProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [currentDragYear, setCurrentDragYear] = useState<number | null>(null);

  const groupedByYear = useMemo(() => {
    const groups = new Map<number, Movie[]>();
    for (const movie of movies) {
      const year = new Date(movie.watchDate).getFullYear();
      if (!groups.has(year)) {
        groups.set(year, []);
      }
      groups.get(year)!.push(movie);
    }
    for (const [, list] of groups) {
      list.sort((a, b) => a.order - b.order);
    }
    const sortedYears = Array.from(groups.keys()).sort((a, b) => b - a);
    return sortedYears.map(year => ({
      year,
      movies: groups.get(year)!,
    }));
  }, [movies]);

  const handleDragStart = (e: React.DragEvent, id: string, year: number) => {
    setDraggingId(id);
    setCurrentDragYear(year);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (
    e: React.DragEvent,
    targetId: string,
    year: number
  ) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    if (sourceId && sourceId !== targetId && year === currentDragYear) {
      onReorder(year, sourceId, targetId);
    }
    setDraggingId(null);
    setCurrentDragYear(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setCurrentDragYear(null);
  };

  if (movies.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>🎬</div>
        <div style={styles.emptyTitle}>书架还是空的</div>
        <div style={styles.emptySubtitle}>
          点击右上角的"添加电影"按钮，开始记录你的观影旅程吧！
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {groupedByYear.map(({ year, movies: yearMovies }) => (
        <div key={year} style={styles.yearSection}>
          <div style={styles.yearHeader}>
            <span style={styles.yearBadge}>{year}</span>
            <span style={styles.yearCount}>{yearMovies.length} 部</span>
          </div>
          <div
            style={styles.shelfBoard}
            onDragOver={handleDragOver}
          >
            <div
              style={styles.shelfRow}
              onDragEnd={handleDragEnd}
            >
              {yearMovies.map(movie => (
                <div
                  key={movie.id}
                  style={{
                    ...styles.cardSlot,
                    transform: draggingId === movie.id ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <MovieCard
                    movie={movie}
                    onUpdateRating={onUpdateRating}
                    onDelete={onDelete}
                    onDragStart={(e, id) => handleDragStart(e, id, year)}
                    onDragOver={handleDragOver}
                    onDrop={(e, id) => handleDrop(e, id, year)}
                    isDragging={draggingId === movie.id}
                  />
                </div>
              ))}
            </div>
            <div style={styles.shelfBottom} />
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  yearSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  yearHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  yearBadge: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
    padding: '6px 16px',
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: '20px',
    border: '1px solid rgba(102, 126, 234, 0.5)',
  },
  yearCount: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
  },
  shelfBoard: {
    backgroundColor: '#2d2d44',
    borderRadius: '12px',
    padding: '24px 20px',
    boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.2)',
    position: 'relative',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  shelfRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    minHeight: '280px',
    alignItems: 'flex-end',
    paddingBottom: '8px',
  },
  shelfBottom: {
    position: 'absolute',
    bottom: '-4px',
    left: '10px',
    right: '10px',
    height: '8px',
    backgroundColor: '#25253a',
    borderRadius: '0 0 12px 12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
  },
  cardSlot: {
    position: 'relative',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    gap: '16px',
  },
  emptyIcon: {
    fontSize: '80px',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    maxWidth: '400px',
    lineHeight: 1.6,
  },
};

export default BookShelf;
