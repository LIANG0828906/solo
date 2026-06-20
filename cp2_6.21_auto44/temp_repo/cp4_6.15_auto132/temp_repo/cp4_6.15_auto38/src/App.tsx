import { useState, useCallback, useEffect } from 'react';
import type { Movie, PageType } from './types';
import MovieList from './MovieList';
import MovieDetail from './MovieDetail';
import MovieForm from './MovieForm';
import MovieStats from './MovieStats';
import { sampleMovies } from './sampleData';

const STORAGE_KEY = 'movie-collection-data';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('list');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMovies(JSON.parse(saved));
      } catch {
        setMovies(sampleMovies);
      }
    } else {
      setMovies(sampleMovies);
    }
  }, []);

  useEffect(() => {
    if (movies.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    }
  }, [movies]);

  const handleSelectMovie = useCallback((id: string) => {
    setSelectedMovieId(id);
    setCurrentPage('detail');
  }, []);

  const handleOpenAddForm = useCallback(() => {
    setEditingMovie(null);
    setCurrentPage('form');
  }, []);

  const handleOpenEditForm = useCallback((movie: Movie) => {
    setEditingMovie(movie);
    setCurrentPage('form');
  }, []);

  const handleSaveMovie = useCallback(
    (movie: Movie) => {
      setMovies((prev) => {
        const idx = prev.findIndex((m) => m.id === movie.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = movie;
          return updated;
        }
        return [movie, ...prev];
      });
      setSelectedMovieId(movie.id);
      setCurrentPage('detail');
    },
    []
  );

  const handleDeleteMovie = useCallback((id: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
    setSelectedMovieId(null);
    setCurrentPage('list');
  }, []);

  const handleUpdateRating = useCallback((id: string, rating: number) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rating } : m))
    );
  }, []);

  const handleNavigate = useCallback(
    (page: PageType) => {
      setCurrentPage(page);
      if (page === 'list') {
        setSelectedMovieId(null);
      }
    },
    []
  );

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;

  const navItems: { key: PageType; label: string; icon: string }[] = [
    { key: 'list', label: '电影收藏', icon: '🎬' },
    { key: 'stats', label: '统计面板', icon: '📊' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">Cinema Vault</div>
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${currentPage === item.key || (currentPage === 'detail' && item.key === 'list') || (currentPage === 'form' && item.key === 'list') ? 'active' : ''}`}
            onClick={() => handleNavigate(item.key)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div className="nav-item" onClick={handleOpenAddForm}>
          <span>➕</span>
          <span>添加电影</span>
        </div>
      </aside>

      <main className="main-content">
        {currentPage === 'list' && (
          <MovieList
            movies={movies}
            onSelectMovie={handleSelectMovie}
            onAddMovie={handleOpenAddForm}
          />
        )}
        {currentPage === 'detail' && selectedMovie && (
          <MovieDetail
            movie={selectedMovie}
            onBack={() => setCurrentPage('list')}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteMovie}
            onUpdateRating={handleUpdateRating}
          />
        )}
        {currentPage === 'form' && (
          <MovieForm
            editingMovie={editingMovie}
            onCancel={() => (editingMovie ? setCurrentPage('detail') : setCurrentPage('list'))}
            onSave={handleSaveMovie}
          />
        )}
        {currentPage === 'stats' && <MovieStats movies={movies} />}
      </main>
    </div>
  );
}
