import { useState, useMemo } from 'react';
import type { Book, Note, BookStatus } from '../types';

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onUpdateBook: (updates: Partial<Book>) => void;
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteBook: () => void;
}

const statusLabels: Record<BookStatus, string> = {
  unread: '未读',
  reading: '在读',
  finished: '读完'
};

const statusOptions: BookStatus[] = ['unread', 'reading', 'finished'];

const defaultTags = ['金句', '感悟', '疑惑', '摘录', '思考'];

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function BookDetail({
  book,
  onBack,
  onUpdateBook,
  onAddNote,
  onDeleteNote,
  onDeleteBook
}: BookDetailProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteDate, setNoteDate] = useState(getTodayString());
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const allTags = useMemo(() => {
    const tagSet = new Set<string>(defaultTags);
    book.notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [book.notes]);

  const filteredNotes = useMemo(() => {
    let notes = [...book.notes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (selectedTag) {
      notes = notes.filter((note) => note.tags.includes(selectedTag));
    }
    return notes;
  }, [book.notes, selectedTag]);

  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    book.notes.forEach((note) => {
      note.tags.forEach((tag) => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return stats;
  }, [book.notes]);

  const noteDates = useMemo(() => {
    const dates = new Set<string>();
    book.notes.forEach((note) => {
      dates.add(note.date);
    });
    return dates;
  }, [book.notes]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [calendarMonth]);

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    onAddNote({
      date: noteDate,
      content: noteContent.trim(),
      tags: noteTags
    });
    setNoteContent('');
    setNoteTags([]);
    setShowAddNote(false);
  };

  const toggleNoteTag = (tag: string) => {
    setNoteTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = newTagInput.trim();
    if (tag && !noteTags.includes(tag)) {
      setNoteTags((prev) => [...prev, tag]);
    }
    setNewTagInput('');
  };

  const hasNoteOnDay = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(
      calendarMonth.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return noteDates.has(dateStr);
  };

  const progress = Math.max(0, Math.min(100, book.progress));

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← 返回书单
      </button>

      <div className="book-detail">
        <div className="detail-header">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="detail-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="100%25" height="100%25" fill="%23f0ebe0"/><text x="50%25" y="50%25" fill="%238b7355" font-family="Georgia" font-size="14" text-anchor="middle" dy=".3em">无封面</text></svg>';
            }}
          />
          <div className="detail-info">
            <h1 className="detail-title">{book.title}</h1>
            <p className="detail-author">{book.author}</p>
            <span className={`status-badge status-${book.status}`}>
              {statusLabels[book.status]}
            </span>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">阅读状态</label>
              <select
                className="form-input"
                value={book.status}
                onChange={(e) =>
                  onUpdateBook({ status: e.target.value as BookStatus })
                }
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">阅读进度：{progress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) =>
                  onUpdateBook({ progress: parseInt(e.target.value, 10) })
                }
                className="form-input"
                style={{ padding: '8px 0' }}
              />
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                >
                  <span className="progress-text">{progress}%</span>
                </div>
              </div>
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">开始日期：</span>
                <input
                  type="date"
                  value={book.startDate}
                  onChange={(e) =>
                    onUpdateBook({ startDate: e.target.value })
                  }
                  className="form-input"
                  style={{ display: 'inline-block', width: 'auto', padding: '6px 10px' }}
                />
              </div>
              <div className="meta-item">
                <span className="meta-label">结束日期：</span>
                <input
                  type="date"
                  value={book.endDate}
                  onChange={(e) => onUpdateBook({ endDate: e.target.value })}
                  className="form-input"
                  style={{ display: 'inline-block', width: 'auto', padding: '6px 10px' }}
                />
              </div>
            </div>

            <button
              className="btn-secondary"
              style={{ marginTop: '20px', color: '#e74c3c', borderColor: '#e74c3c' }}
              onClick={() => {
                if (confirm('确定要删除这本书吗？所有笔记也会被删除。')) {
                  onDeleteBook();
                }
              }}
            >
              删除本书
            </button>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">阅读日历</h2>
          <div className="calendar-month-header">
            <button
              className="calendar-nav-btn"
              onClick={() =>
                setCalendarMonth(
                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
                )
              }
            >
              ← 上月
            </button>
            <span className="calendar-month-title">
              {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
            </span>
            <button
              className="calendar-nav-btn"
              onClick={() =>
                setCalendarMonth(
                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
                )
              }
            >
              下月 →
            </button>
          </div>
          <div className="calendar">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="calendar-header">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day === null ? 'empty' : ''} ${
                  day !== null && hasNoteOnDay(day) ? 'has-note' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {Object.keys(tagStats).length > 0 && (
          <div className="section">
            <h2 className="section-title">标签云</h2>
            <div className="tag-cloud">
              <button
                className={`tag-cloud-item ${selectedTag === null ? 'active' : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                全部 <span className="tag-count">{book.notes.length}</span>
              </button>
              {Object.entries(tagStats)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <button
                    key={tag}
                    className={`tag-cloud-item ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag} <span className="tag-count">{count}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              阅读笔记 ({filteredNotes.length})
            </h2>
            <button className="btn-primary" style={{ flex: 'none', padding: '10px 20px', width: 'auto' }} onClick={() => setShowAddNote(true)}>
              + 添加笔记
            </button>
          </div>

          {showAddNote && (
            <div className="modal-overlay" onClick={() => setShowAddNote(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">添加笔记</h3>
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">内容</label>
                  <textarea
                    className="form-textarea"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="记录你的阅读感想、金句或疑惑..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">标签</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {allTags.map((tag) => (
                      <span
                        key={tag}
                        className={`tag ${noteTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleNoteTag(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="自定义标签"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                    />
                    <button className="btn-secondary" style={{ flex: 'none', width: 'auto' }} onClick={addCustomTag}>
                      添加
                    </button>
                  </div>
                </div>
                <div className="btn-group">
                  <button className="btn-secondary" onClick={() => setShowAddNote(false)}>
                    取消
                  </button>
                  <button className="btn-primary" onClick={handleAddNote} disabled={!noteContent.trim()}>
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="notes-list" style={{ marginTop: '24px' }}>
            {filteredNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">
                  {selectedTag ? '该标签下暂无笔记' : '还没有笔记，点击右上角添加第一条笔记吧'}
                </div>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <span className="note-date">{formatDate(note.date)}</span>
                    <button
                      className="note-delete"
                      onClick={() => {
                        if (confirm('确定删除这条笔记吗？')) {
                          onDeleteNote(note.id);
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                  <div className="note-content">{note.content}</div>
                  {note.tags.length > 0 && (
                    <div className="note-tags">
                      {note.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
