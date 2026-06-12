import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Book, Member, BorrowRecord, ReadingNote } from '../types';
import {
  getBookById,
  getClubMembers,
  getBorrowHistory,
  getNotes,
  addNote,
  updateBookProgress
} from '../api';
import BorrowTimeline from '../components/BorrowTimeline';

function getProgressColor(progress: number): string {
  if (progress < 33) return '#f44336';
  if (progress < 66) return '#ff9800';
  return '#4caf50';
}

function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<BorrowRecord[]>([]);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [progressError, setProgressError] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [bookData, membersData, historyData, notesData] = await Promise.all([
      getBookById(id),
      getClubMembers(),
      getBorrowHistory(id),
      getNotes(id)
    ]);
    setBook(bookData);
    setMembers(membersData);
    setHistory(historyData);
    setNotes(notesData);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const holder = book?.currentHolderId
    ? members.find((m) => m.id === book.currentHolderId)
    : null;

  const handleProgressClick = () => {
    if (book) {
      setProgressInput(String(book.readingProgress));
      setShowProgressInput(true);
      setProgressError(false);
    }
  };

  const handleProgressSubmit = async () => {
    const value = parseInt(progressInput, 10);
    if (isNaN(value) || value < 0 || value > 100) {
      setProgressError(true);
      return;
    }
    if (book) {
      const updated = await updateBookProgress(book.id, value);
      setBook(updated);
    }
    setShowProgressInput(false);
    setProgressError(false);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !book || members.length === 0) return;

    const note = await addNote({
      bookId: book.id,
      memberId: members[0].id,
      content: newNote.trim()
    });
    setNotes([...notes, note]);
    setNewNote('');
  };

  const circumference = 2 * Math.PI * 45;
  const progress = book?.readingProgress || 0;
  const dashOffset = circumference - (progress / 100) * circumference;

  if (!book) {
    return (
      <div className="app-layout">
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="navbar-title">📚 读书俱乐部</div>
          </Link>
        </nav>
        <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="navbar-title">📚 读书俱乐部</div>
        </Link>
        {members[0] && (
          <div className="navbar-user">
            <img src={members[0].avatar} alt={members[0].name} />
          </div>
        )}
      </nav>

      <div className="book-detail">
        <Link to="/" className="back-link">
          ← 返回俱乐部
        </Link>

        <div className="book-detail-header">
          <div className="book-detail-cover">
            <img src={book.cover} alt={book.title} />
          </div>
          <div className="book-detail-info">
            <h1 className="book-detail-title">{book.title}</h1>
            <p className="book-detail-author">作者：{book.author}</p>
            <div className="book-detail-holder">
              <span>当前持有者：</span>
              {holder ? (
                <>
                  <img
                    src={holder.avatar}
                    alt={holder.name}
                    className="holder-avatar"
                  />
                  <span>{holder.name}</span>
                </>
              ) : (
                <span style={{ color: '#4caf50' }}>书籍在俱乐部</span>
              )}
            </div>

            <div className="progress-ring-container">
              <div className="progress-ring" onClick={handleProgressClick}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    className="progress-ring-bg"
                    cx="60"
                    cy="60"
                    r="45"
                  />
                  <circle
                    className="progress-ring-fill"
                    cx="60"
                    cy="60"
                    r="45"
                    stroke={getProgressColor(progress)}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className="progress-ring-text">{progress}%</div>

                {showProgressInput && (
                  <div
                    className="progress-input-overlay"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="number"
                      className={`form-input ${progressError ? 'error' : ''}`}
                      value={progressInput}
                      onChange={(e) => {
                        setProgressInput(e.target.value);
                        setProgressError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleProgressSubmit();
                      }}
                      autoFocus
                      style={{ width: 80, textAlign: 'center' }}
                      min={0}
                      max={100}
                    />
                    <div className="progress-hint">请输入0-100的整数</div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'center'
                      }}
                    >
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setShowProgressInput(false)}
                      >
                        取消
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={handleProgressSubmit}
                      >
                        确定
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                  阅读进度
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  点击环形图可编辑进度
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-section">
          <h3 className="section-title">📖 借阅流转时间线</h3>
          <BorrowTimeline records={history} members={members} />
        </div>

        <div className="notes-section">
          <h3 className="section-title">✍️ 阅读笔记</h3>
          <div className="notes-list">
            {notes.map((note) => {
              const member = members.find((m) => m.id === note.memberId);
              return (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    {member && (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="note-avatar"
                      />
                    )}
                    <div>
                      <div className="note-author">
                        {member?.name || '未知成员'}
                      </div>
                      <div className="note-time">
                        {new Date(note.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="note-content">{note.content}</div>
                </div>
              );
            })}
            {notes.length === 0 && (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                暂无阅读笔记
              </p>
            )}
          </div>

          <form className="add-note-form" onSubmit={handleNoteSubmit}>
            <textarea
              placeholder="记录你的阅读感悟..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <div className="add-note-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newNote.trim()}
                style={{ opacity: newNote.trim() ? 1 : 0.5 }}
              >
                发布笔记
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookDetailPage;
