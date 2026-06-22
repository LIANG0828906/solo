import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Movie, MovieFormData } from './api';
import { getPosterInfo } from './api';
import BookShelf from './components/BookShelf';
import AddMovieModal from './components/AddMovieModal';
import YearReport from './components/YearReport';

const STORAGE_KEY = 'personal-movie-shelf-data';

const SAMPLE_MOVIES: Movie[] = [
  {
    id: 'sample-1',
    title: '肖申克的救赎',
    year: 1994,
    director: '弗兰克·德拉邦特',
    rating: 5,
    review: '希望让人自由，影史不朽之作。',
    posterColor: 'rgb(120, 180, 150)',
    watchDate: '2026-01-15',
    order: 0,
  },
  {
    id: 'sample-2',
    title: '盗梦空间',
    year: 2010,
    director: '克里斯托弗·诺兰',
    rating: 5,
    review: '层层嵌套的梦境，烧脑神作。',
    posterColor: 'rgb(150, 120, 180)',
    watchDate: '2026-02-20',
    order: 1,
  },
  {
    id: 'sample-3',
    title: '霸王别姬',
    year: 1993,
    director: '陈凯歌',
    rating: 5,
    review: '不疯魔不成活，华语巅峰。',
    posterColor: 'rgb(180, 120, 120)',
    watchDate: '2026-03-10',
    order: 2,
  },
  {
    id: 'sample-4',
    title: '千与千寻',
    year: 2001,
    director: '宫崎骏',
    rating: 4,
    review: '温暖治愈的童话世界。',
    posterColor: 'rgb(140, 170, 120)',
    watchDate: '2026-04-05',
    order: 3,
  },
  {
    id: 'sample-5',
    title: '星际穿越',
    year: 2014,
    director: '克里斯托弗·诺兰',
    rating: 5,
    review: '爱能穿越时空维度。',
    posterColor: 'rgb(120, 150, 180)',
    watchDate: '2026-05-18',
    order: 4,
  },
  {
    id: 'sample-6',
    title: '泰坦尼克号',
    year: 1997,
    director: '詹姆斯·卡梅隆',
    rating: 4,
    review: '经典爱情，永不沉没。',
    posterColor: 'rgb(170, 140, 130)',
    watchDate: '2026-06-01',
    order: 5,
  },
];

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [immediateQuery, setImmediateQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (m: { year?: number; title?: string; id?: string }) =>
              typeof m.id === 'string' &&
              typeof m.title === 'string' &&
              typeof m.year === 'number' &&
              m.year >= 1888 &&
              m.year <= 2200
          )
        ) {
          setMovies(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }
    setMovies(SAMPLE_MOVIES);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [movies]);

  const handleSearch = useCallback((value: string) => {
    setImmediateQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 150);
  }, []);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return movies;
    return movies.filter(
      m =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        String(m.year).includes(q)
    );
  }, [movies, searchQuery]);

  const handleAddMovie = useCallback(async (data: MovieFormData) => {
    try {
      const posterInfo = await getPosterInfo(data.title, data.year);
      const newMovie: Movie = {
        id: uuidv4(),
        ...data,
        posterColor: posterInfo.posterColor,
        watchDate: new Date().toISOString().split('T')[0],
        order: movies.length
      };
      setMovies(prev => [...prev, newMovie]);
      setShowAddModal(false);
    } catch (error) {
      console.error('添加电影失败:', error);
    }
  }, [movies.length]);

  const handleUpdateRating = useCallback((id: string, rating: number) => {
    setMovies(prev =>
      prev.map(m => (m.id === id ? { ...m, rating } : m))
    );
  }, []);

  const handleDeleteMovie = useCallback((id: string) => {
    setMovies(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleReorder = useCallback((year: number, fromId: string, toId: string) => {
    setMovies(prev => {
      const yearMovies = prev
        .filter(m => {
          const y = new Date(m.watchDate).getFullYear();
          return y === year;
        })
        .sort((a, b) => a.order - b.order);

      const fromIdx = yearMovies.findIndex(m => m.id === fromId);
      const toIdx = yearMovies.findIndex(m => m.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;

      const reordered = [...yearMovies];
      const [removed] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, removed);

      const idToNewOrder = new Map<string, number>();
      reordered.forEach((m, i) => idToNewOrder.set(m.id, i));

      return prev.map(m => {
        const newOrder = idToNewOrder.get(m.id);
        if (newOrder !== undefined) {
          return { ...m, order: newOrder };
        }
        return m;
      });
    });
  }, []);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>📚 个人影藏书架</h1>
        <div style={styles.headerRight}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="搜索电影、导演或年份..."
              value={immediateQuery}
              onChange={e => handleSearch(e.target.value)}
            />
            <span style={styles.searchIcon}>🔍</span>
          </div>
          <button
            style={styles.reportBtn}
            onClick={() => setShowReport(true)}
          >
            📊 年度报告
          </button>
          <button
            style={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            ➕ 添加电影
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <BookShelf
          movies={filteredMovies}
          onUpdateRating={handleUpdateRating}
          onDelete={handleDeleteMovie}
          onReorder={handleReorder}
        />
      </main>

      {showAddModal && (
        <AddMovieModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddMovie}
        />
      )}

      {showReport && (
        <YearReport
          movies={movies}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#fff',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '1px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  searchWrapper: {
    position: 'relative',
  },
  searchInput: {
    width: '280px',
    padding: '10px 40px 10px 16px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(45, 45, 68, 0.8)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  searchIcon: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    opacity: 0.6,
  },
  addBtn: {
    padding: '10px 20px',
    borderRadius: '24px',
    border: 'none',
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  reportBtn: {
    padding: '10px 16px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
};

export default App;
