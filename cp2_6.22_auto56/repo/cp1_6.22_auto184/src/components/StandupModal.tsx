import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { StandupEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: StandupEntry) => void;
  initialEntry?: StandupEntry | null;
}

export function StandupModal({
  isOpen,
  onClose,
  onSubmit,
  initialEntry,
}: StandupModalProps) {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');

  useEffect(() => {
    if (initialEntry) {
      setYesterday(initialEntry.yesterday);
      setToday(initialEntry.today);
      setBlockers(initialEntry.blockers);
    } else {
      setYesterday('');
      setToday('');
      setBlockers('');
    }
  }, [initialEntry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayDate = new Date().toISOString().split('T')[0];
    const entry: StandupEntry = {
      id: initialEntry?.id || uuidv4(),
      date: initialEntry?.date || todayDate,
      yesterday,
      today,
      blockers,
    };
    onSubmit(entry);
    onClose();
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="modal-title">
            今日站会 - {formatDisplayDate(initialEntry?.date || todayDate)}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">昨天完成了什么？</label>
            <textarea
              className="form-textarea"
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              placeholder="描述昨天完成的工作..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">今天计划做什么？</label>
            <textarea
              className="form-textarea"
              value={today}
              onChange={(e) => setToday(e.target.value)}
              placeholder="描述今天的工作计划..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">有什么阻塞问题？</label>
            <textarea
              className="form-textarea"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="描述遇到的阻塞或风险..."
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
