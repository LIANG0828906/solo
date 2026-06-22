import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Sprint } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sprint: Sprint) => void;
  initialSprint?: Sprint | null;
}

export function SprintModal({
  isOpen,
  onClose,
  onSave,
  initialSprint,
}: SprintModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (initialSprint) {
      setName(initialSprint.name);
      setStartDate(initialSprint.startDate);
      setEndDate(initialSprint.endDate);
    } else {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      setName('');
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [initialSprint, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    const sprint: Sprint = {
      id: initialSprint?.id || uuidv4(),
      name: name.trim(),
      startDate,
      endDate,
      tasks: initialSprint?.tasks || [],
      dailySnapshots: initialSprint?.dailySnapshots || [],
    };
    onSave(sprint);
    onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="modal-title">
            {initialSprint ? '编辑冲刺' : '创建冲刺'}
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
            <label className="form-label">冲刺名称 *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：Sprint 1"
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">开始日期 *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">结束日期 *</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
              {initialSprint ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
