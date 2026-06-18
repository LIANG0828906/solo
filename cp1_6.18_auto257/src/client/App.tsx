import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBookStore } from './store';
import BookList from './BookList';
import CommentWall from './CommentWall';
import type { Book, Comment, InitialData, NewCommentPayload } from '../shared/types';

function Stars({ rating, size = 'normal', interactive, onChange }: {
  rating: number;
  size?: 'tiny' | 'small' | 'normal';
  interactive?: boolean;
  onChange?: (n: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = interactive && hover !== null ? hover : rating;
  const rounded = Math.round(display);

  const handleClick = interactive && onChange
    ? (n: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange!(n + 1);
      }
    : undefined;

  const handleMouseEnter = interactive
    ? (n: number) => () => setHover(n + 1)
    : undefined;

  const handleMouseLeave = interactive ? () => setHover(null) : undefined;

  return (
    <span
      className={`stars ${size === 'tiny' ? 'tiny' : size === 'small' ? 'small' : ''} ${interactive ? 'rating-picker' : ''}`}
      onMouseLeave={handleMouseLeave}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? '评分选择' : undefined}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`star ${i < rounded ? 'filled' : ''}`}
          onClick={handleClick?.(i)}
          onMouseEnter={handleMouseEnter?.(i)}
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? i < rounded : undefined}
          tabIndex={interactive ? 0 : undefined}
        />
      ))}
    </span>
  );
}

function BookDetailModal() {
  const selectedBook = useBookStore((s) => s.selectedBook);
  const setSelectedBook = useBookStore((s) => s.setSelectedBook);
  const [closing, setClosing] = useState(false);
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const socketRef = useSocketRef();

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setSelectedBook(null);
      setClosing(false);
      setUsername('');
      setContent('');
      setRating(5);
    }, 300);
  }, [setSelectedBook]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedBook && !closing) close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedBook, closing, close]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBook || !username.trim() || !content.trim() || submitting) return;
      setSubmitting(true);
      const payload: NewCommentPayload = {
        bookId: selectedBook.id,
        username: username.trim(),
        content: content.trim(),
        rating,
      };
      socketRef.current?.emit('new-comment', payload);
      window.setTimeout(() => {
        setContent('');
        setSubmitting(false);
      }, 300);
    },
    [selectedBook, username, content, rating, submitting, socketRef],
  );

  if (!selectedBook) return null;

  return (
    <div
      className={`modal-overlay ${closing ? 'closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !closing) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div className="modal-content">
        <button
          type="button"
          className="modal-close-btn"
          onClick={close}
          aria-label="关闭详情"
        >
          ✕
        </button>
        <div className="modal-cover" style={{ backgroundColor: selectedBook.coverColor }}>
          <div className="modal-cover-title">{selectedBook.title}</div>
        </div>
        <h2 id="book-detail-title" className="modal-book-title">{selectedBook.title}</h2>
        <div className="modal-book-author">作者：{selectedBook.author}</div>
        <div className="modal-rating-row">
          <Stars rating={selectedBook.rating} size="normal" />
          <span className="rating-number">{selectedBook.rating.toFixed(1)}</span>
          <span style={{ color: '#888', fontSize: 13 }}> / 5.0</span>
        </div>
        <p className="modal-description">{selectedBook.description.slice(0, 200)}{selectedBook.description.length > 200 ? '…' : ''}</p>

        <div className="comment-form-title">✍️ 写书评</div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label className="form-label" htmlFor="cmt-username">昵称</label>
            <input
              id="cmt-username"
              className="form-input"
              type="text"
              placeholder="请输入你的昵称"
              maxLength={16}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="form-row">
            <label className="form-label">评分</label>
            <div>
              <Stars rating={rating} size="normal" interactive onChange={setRating} />
              <span style={{ marginLeft: 10, fontSize: 14, color: '#888' }}>{rating} 星</span>
            </div>
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="cmt-content">评论</label>
            <textarea
              id="cmt-content"
              className="form-textarea"
              placeholder="分享你的阅读感受..."
              maxLength={300}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting || !username.trim() || !content.trim()}
          >
            {submitting ? '发送中…' : '发表评论'}
          </button>
          <button type="button" className="close-btn" onClick={close}>
            关 闭
          </button>
        </form>
      </div>
    </div>
  );
}

let socketInstance: Socket | null = null;
const socketListeners = new Set<(s: Socket | null) => void>();

function useSocketRef() {
  const ref = useRef<Socket | null>(socketInstance);
  useEffect(() => {
    const listener = (s: Socket | null) => {
      ref.current = s;
    };
    socketListeners.add(listener);
    return () => {
      socketListeners.delete(listener);
    };
  }, []);
  return ref;
}

export default function App() {
  const setBooks = useBookStore((s) => s.setBooks);
  const setComments = useBookStore((s) => s.setComments);
  const addComment = useBookStore((s) => s.addComment);
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketInstance = socket;
    socketListeners.forEach((l) => l(socket));

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('initial-data', (data: InitialData) => {
      setBooks(data.books as Book[]);
      setComments(data.comments as Comment[]);
      setOnline((n) => Math.max(n, 1));
    });

    socket.on('comment-broadcast', (comment: Comment) => {
      addComment(comment);
    });

    const healthTimer = window.setInterval(() => {
      void fetch('/health')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.online !== undefined) setOnline(d.online);
        })
        .catch(() => {});
    }, 8000);

    return () => {
      window.clearInterval(healthTimer);
      socket.disconnect();
      socketInstance = null;
      socketListeners.forEach((l) => l(null));
    };
  }, [setBooks, setComments, addComment]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">书 架 乐 章</h1>
        <div className="app-subtitle">SHELF · MELODY — 沉浸阅读，听见思想</div>
        <div className="app-status" aria-live="polite">
          <span className={`status-dot ${connected ? '' : 'offline'}`} style={connected ? {} : { background: '#f87171', boxShadow: '0 0 8px #f87171' }} />
          {connected ? `实时连接 · 在线 ${online} 人` : '连接中…'}
        </div>
      </header>

      <main>
        <BookList />
      </main>

      <BookDetailModal />
      <CommentWall />
    </div>
  );
}
