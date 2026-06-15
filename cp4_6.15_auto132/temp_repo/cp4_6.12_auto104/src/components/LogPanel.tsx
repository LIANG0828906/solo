import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Movie, Genre } from '../types';

const GENRES: Genre[] = ['动作', '喜剧', '剧情', '科幻', '恐怖', '动画', '其他'];

const getRatingColor = (rating: number): string => {
  if (rating >= 9) return '#ffd700';
  if (rating >= 7) return '#4caf50';
  if (rating >= 5) return '#2196f3';
  return '#9e9e9e';
};

interface ModalProps {
  movie?: Movie;
  onClose: () => void;
  onSave: (data: Omit<Movie, 'id'>) => void;
}

function MovieModal({ movie, onClose, onSave }: ModalProps) {
  const [title, setTitle] = useState(movie?.title || '');
  const [country, setCountry] = useState(movie?.country || '');
  const [year, setYear] = useState(movie?.year || new Date().getFullYear());
  const [date, setDate] = useState(movie?.date || new Date().toISOString().split('T')[0]);
  const [genre, setGenre] = useState<Genre[]>(movie?.genre || []);
  const [rating, setRating] = useState(movie?.rating ?? 7);
  const [comment, setComment] = useState(movie?.comment || '');
  const [visible, setVisible] = useState(false);
  const fieldsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const toggleGenre = (g: Genre) => {
    setGenre((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), country: country.trim(), year, date, genre, rating, comment });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={fieldsRef} className="modal-fields">
          <h3 className="modal-title" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease' }}>
            {movie ? '编辑电影' : '添加电影'}
          </h3>
          <div className="form-group" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.05s' }}>
            <label>电影名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入电影名称"
            />
          </div>
          <div className="form-row" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.1s' }}>
            <div className="form-group">
              <label>国家/地区</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="例如：中国"
              />
            </div>
            <div className="form-group">
              <label>年份</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.15s' }}>
            <label>观影日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.2s' }}>
            <label>类型（多选）</label>
            <div className="genre-tags">
              {GENRES.map((g) => (
                <span
                  key={g}
                  className={`genre-tag ${genre.includes(g) ? 'active' : ''}`}
                  onClick={() => toggleGenre(g)}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.25s' }}>
            <label>评分：<span style={{ color: getRatingColor(rating), fontWeight: 600 }}>{rating}</span></label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="rating-slider"
                style={{ ['--progress' as any]: `${((rating - 1) / 9) * 100}%` }}
              />
            </div>
          </div>
          <div className="form-group" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.3s' }}>
            <label>短评</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="写一句短评..."
              rows={3}
            />
          </div>
          <div className="modal-actions" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.3s ease 0.35s' }}>
            <button className="btn-cancel" onClick={onClose}>取消</button>
            <button className="btn-save" onClick={handleSubmit}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MovieCardProps {
  movie: Movie;
  isHighlighted: boolean;
  isNew: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAnimationEnd: () => void;
}

function MovieCard({ movie, isHighlighted, isNew, onEdit, onDelete, onAnimationEnd }: MovieCardProps) {
  const [deleting, setDeleting] = useState(false);
  const color = getRatingColor(movie.rating);

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(onDelete, 300);
  };

  return (
    <div
      className={`movie-card ${isHighlighted ? 'highlighted' : ''} ${isNew ? 'card-enter' : ''} ${deleting ? 'card-delete' : ''}`}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="card-header">
        <h4 className="movie-title">{movie.title}</h4>
        <span
          className="rating-badge"
          style={{ backgroundColor: color, color: movie.rating >= 9 ? '#1a1a2e' : '#fff' }}
        >
          {movie.rating}
        </span>
      </div>
      <div className="card-meta">
        <span>{movie.country} · {movie.year}</span>
        <span className="card-date">{movie.date}</span>
      </div>
      <div className="card-genres">
        {movie.genre.map((g) => (
          <span key={g} className="card-genre-tag">{g}</span>
        ))}
      </div>
      {movie.comment && <p className="card-comment">{movie.comment}</p>}
      <div className="card-actions">
        <button className="card-btn" onClick={onEdit}>编辑</button>
        <button className="card-btn card-btn-delete" onClick={handleDelete}>删除</button>
      </div>
    </div>
  );
}

function LogPanel() {
  const { movies, addMovie, editMovie, deleteMovie, highlightedId, setHighlightedId } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const filteredMovies = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return movies;
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.country.toLowerCase().includes(q) ||
        m.genre.some((g) => g.includes(q))
    );
  }, [movies, search]);

  const filteredSorted = useMemo(() => {
    return [...filteredMovies].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMovies]);

  const handleSave = (data: Omit<Movie, 'id'>) => {
    if (editingMovie) {
      editMovie(editingMovie.id, data);
    } else {
      const tempId = 'temp-' + Date.now();
      addMovie(data);
      setTimeout(() => {
        const latest = useStore.getState().movies[0];
        if (latest) {
          setNewIds((prev) => new Set(prev).add(latest.id));
        }
      }, 0);
    }
    setShowModal(false);
    setEditingMovie(null);
  };

  const handleCardAnimationEnd = (movieId: string) => {
    setNewIds((prev) => {
      if (!prev.has(movieId)) return prev;
      const next = new Set(prev);
      next.delete(movieId);
      return next;
    });
  };

  return (
    <div className="log-panel">
      <div className="panel-header">
        <h2 className="panel-title">观影日志</h2>
        <span className="movie-count">{movies.length} 部</span>
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="搜索或添加电影"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <button
        className="add-btn"
        onClick={() => {
          setEditingMovie(null);
          setShowModal(true);
        }}
      >
        + 添加电影
      </button>
      <div className="movie-list">
        {filteredSorted.length === 0 ? (
          <div className="empty-state">
            <p>暂无记录</p>
            <p className="empty-hint">点击上方按钮添加第一部电影吧</p>
          </div>
        ) : (
          filteredSorted.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isHighlighted={highlightedId === movie.id}
              isNew={newIds.has(movie.id)}
              onEdit={() => {
                setEditingMovie(movie);
                setShowModal(true);
                setHighlightedId(null);
              }}
              onDelete={() => deleteMovie(movie.id)}
              onAnimationEnd={() => handleCardAnimationEnd(movie.id)}
            />
          ))
        )}
      </div>

      {showModal && (
        <MovieModal
          movie={editingMovie || undefined}
          onClose={() => {
            setShowModal(false);
            setEditingMovie(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default LogPanel;
