import { useState, useEffect, useMemo } from 'react';
import BookCard from './BookCard';
import { api, type Book, type BookStatus, type PresetBook } from '../api';

const STATUS_CONFIG: { key: BookStatus; label: string; emoji: string }[] = [
  { key: 'finished', label: '已读', emoji: '✅' },
  { key: 'reading', label: '在读', emoji: '📖' },
  { key: 'to-read', label: '想读', emoji: '📚' },
];

interface BookShelfProps {
  books: Book[];
  onBooksChanged: () => void;
  newestId: string | null;
  onClearNewest: () => void;
}

export default function BookShelf({ books, onBooksChanged, newestId, onClearNewest }: BookShelfProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [closingAdd, setClosingAdd] = useState(false);

  const [noteBook, setNoteBook] = useState<Book | null>(null);
  const [closingNote, setClosingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [existingNote, setExistingNote] = useState<string>('');

  const [presetBooks, setPresetBooks] = useState<PresetBook[]>([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    coverUrl: '',
    totalPages: '',
    currentPage: '0',
    status: 'to-read' as BookStatus,
  });
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPresetBooks().then(setPresetBooks).catch(() => {});
  }, []);

  const grouped = useMemo(() => {
    const m: Record<BookStatus, Book[]> = { finished: [], reading: [], 'to-read': [] };
    for (const b of books) {
      if (m[b.status]) m[b.status].push(b);
      else m['to-read'].push(b);
    }
    return m;
  }, [books]);

  useEffect(() => {
    if (newestId) {
      const t = setTimeout(onClearNewest, 600);
      return () => clearTimeout(t);
    }
  }, [newestId, onClearNewest]);

  const closeAdd = () => {
    setClosingAdd(true);
    setTimeout(() => {
      setShowAdd(false);
      setClosingAdd(false);
    }, 240);
  };

  const openNote = async (book: Book) => {
    setNoteBook(book);
    setNoteContent('');
    try {
      const notes = await api.getNotes(book.id);
      if (notes.length > 0) {
        const latest = notes[notes.length - 1];
        setExistingNote(latest.content);
        setNoteContent(latest.content);
      } else {
        setExistingNote('');
      }
    } catch {
      setExistingNote('');
    }
  };

  const closeNote = () => {
    setClosingNote(true);
    setTimeout(() => {
      setNoteBook(null);
      setClosingNote(false);
    }, 240);
  };

  const submitNote = async () => {
    if (!noteBook || !noteContent.trim()) return;
    try {
      await api.addNote(noteBook.id, noteContent.trim());
      closeNote();
    } catch (e) {
      alert('保存笔记失败');
    }
  };

  const selectPreset = (idx: number) => {
    const p = presetBooks[idx];
    if (!p) return;
    setSelectedPresetIdx(idx);
    setForm({
      ...form,
      title: p.title,
      author: p.author,
      coverUrl: p.coverUrl,
      totalPages: String(p.totalPages),
    });
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.coverUrl || !form.totalPages) {
      alert('请填写所有必填项（书名、作者、封面、页数）');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        author: form.author,
        coverUrl: form.coverUrl,
        totalPages: Number(form.totalPages),
        currentPage: Number(form.currentPage) || 0,
        status: form.status,
      };
      await api.addBook(payload);
      onBooksChanged();
      closeAdd();
      setForm({ title: '', author: '', coverUrl: '', totalPages: '', currentPage: '0', status: 'to-read' });
      setSelectedPresetIdx(null);
    } catch (err) {
      alert('添加书籍失败');
    } finally {
      setSubmitting(false);
    }
  };

  const updateProgress = (id: string, page: number) => {
    api
      .updateBook(id, { currentPage: page })
      .then(() => onBooksChanged())
      .catch(() => {});
  };

  return (
    <div className="bookshelf-section">
      {/* Header */}
      <div className="app-header">
        <div className="app-title">📚 我的虚拟书架</div>
        <button className="add-book-btn" onClick={() => setShowAdd(true)}>
          ＋ 添加书籍
        </button>
      </div>

      {/* Shelf */}
      <div className="shelf">
        {STATUS_CONFIG.map((row) => (
          <div key={row.key} className="shelf-row">
            <div className="shelf-header">
              <span className="shelf-label">
                {row.emoji} {row.label}
              </span>
              <span className="shelf-badge">{grouped[row.key].length}</span>
            </div>
            <div className="book-grid">
              {grouped[row.key].length === 0 ? (
                <div className="empty-shelf">暂无书籍 · 点击右上角「添加书籍」开始构建你的书架</div>
              ) : (
                grouped[row.key].map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    isNew={b.id === newestId}
                    onOpenNotes={openNote}
                    onUpdateProgress={updateProgress}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Book Modal */}
      {showAdd && (
        <div
          className={`modal-overlay ${closingAdd ? 'closing' : 'active'}`}
          onClick={(e) => e.target === e.currentTarget && closeAdd()}
        >
          <div className="modal-box">
            <div className="modal-title">✨ 添加新书籍</div>
            <form onSubmit={submitAdd} className="form-grid">
              <div className="preset-title">从 20 本经典名著中快速选择：</div>
              <div className="preset-scroll">
                {presetBooks.map((p, idx) => (
                  <div
                    key={idx}
                    className={`preset-item ${selectedPresetIdx === idx ? 'selected' : ''}`}
                    style={{ background: p.coverUrl }}
                    onClick={() => selectPreset(idx)}
                    title={`${p.title} · ${p.author}`}
                  >
                    <span>{p.title}</span>
                  </div>
                ))}
              </div>

              <div className="form-row">
                <label>书名 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="请输入书名"
                />
              </div>

              <div className="form-dual">
                <div className="form-row">
                  <label>作者 *</label>
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    placeholder="作者姓名"
                  />
                </div>
                <div className="form-row">
                  <label>阅读状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
                  >
                    <option value="to-read">想读</option>
                    <option value="reading">在读</option>
                    <option value="finished">已读</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label>封面图片 URL（或使用上方预设）*</label>
                <input
                  value={form.coverUrl}
                  onChange={(e) => {
                    setForm({ ...form, coverUrl: e.target.value });
                    setSelectedPresetIdx(null);
                  }}
                  placeholder="可填入图片链接或 CSS linear-gradient(...)"
                />
              </div>

              <div className="form-dual">
                <div className="form-row">
                  <label>总页数 *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalPages}
                    onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
                    placeholder="例如 300"
                  />
                </div>
                <div className="form-row">
                  <label>当前页数 (默认 0)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.currentPage}
                    onChange={(e) => setForm({ ...form, currentPage: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeAdd}>
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '添加中...' : '加入书架'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteBook && (
        <div
          className={`modal-overlay ${closingNote ? 'closing' : 'active'}`}
          onClick={(e) => e.target === e.currentTarget && closeNote()}
        >
          <div className="modal-box">
            <div className="modal-title">📝 《{noteBook.title}》读书笔记</div>
            <textarea
              className="note-textarea"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="在这里记录你的阅读感悟、摘录精彩片段..."
              autoFocus
            />
            <div style={{ fontSize: '12px', color: '#8B5E3C', marginTop: '8px', fontStyle: 'italic' }}>
              {existingNote && !noteContent ? '上次笔记已载入，可以继续编辑' : ''}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeNote}>
                取消
              </button>
              <button type="button" className="btn-primary" onClick={submitNote}>
                保存笔记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
