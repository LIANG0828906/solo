import { useState } from 'react';
import { useBookStore } from '../store';
import { createRipple } from '../utils';
import { ReadingStatus } from '../types';

interface Props {
  onClose: () => void;
}

export default function AddBookModal({ onClose }: Props) {
  const addBook = useBookStore((s) => s.addBook);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ReadingStatus>('reading');
  const [cancelRipples, setCancelRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);
  const [saveRipples, setSaveRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !author.trim() || !totalPages) return;
    const pages = parseInt(totalPages);
    if (isNaN(pages) || pages <= 0) return;
    addBook({
      title: title.trim(),
      author: author.trim(),
      totalPages: pages,
      progress,
      status,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-header">添加新书籍</h2>

        <div className="form-group">
          <label className="form-label">书名</label>
          <input
            className="form-input"
            placeholder="请输入书名"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">作者</label>
          <input
            className="form-input"
            placeholder="请输入作者名"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">总页数</label>
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="请输入总页数"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">初始进度：{progress}%</label>
          <input
            className="form-input"
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">阅读状态</label>
          <div className="status-select-group">
            {(['reading', 'finished', 'wishlist'] as ReadingStatus[]).map((s) => (
              <div
                key={s}
                className={`status-option ${status === s ? `active ${s}` : ''}`}
                onClick={() => setStatus(s)}
              >
                {s === 'reading' ? '在读' : s === 'finished' ? '已读完' : '想读'}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={(e) => {
              createRipple(e, setCancelRipples);
              onClose();
            }}
          >
            取消
            {cancelRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
          <button
            className="btn-primary"
            onClick={(e) => {
              createRipple(e, setSaveRipples);
              handleSubmit();
            }}
          >
            添加
            {saveRipples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
