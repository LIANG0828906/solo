import { useState, useEffect, useCallback } from 'react';
import type { TrainingType } from '../types';

interface AddRecordFormProps {
  onSubmit: (data: { type: TrainingType; duration: number; date: string; notes: string }) => Promise<void>;
  loading: boolean;
}

const AddRecordForm = ({ onSubmit, loading }: AddRecordFormProps) => {
  const [type, setType] = useState<TrainingType>('strength');
  const [duration, setDuration] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = useCallback(async () => {
    if (!duration || parseInt(duration) <= 0) {
      alert('请输入有效的训练时长');
      return;
    }
    try {
      await onSubmit({
        type,
        duration: parseInt(duration),
        date,
        notes,
      });
      setDuration('');
      setNotes('');
    } catch (error) {
      console.error('提交失败:', error);
    }
  }, [type, duration, date, notes, onSubmit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
        }}
      >
        添加训练记录
      </h3>
      <form onSubmit={handleFormSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div className="form-group">
            <label htmlFor="type">训练类型</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TrainingType)}
              disabled={loading}
            >
              <option value="strength">力量训练</option>
              <option value="cardio">有氧运动</option>
              <option value="yoga">瑜伽</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="duration">时长 (分钟)</label>
            <input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">日期</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="notes">训练感想</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="记录今天的训练感受..."
            rows={3}
            disabled={loading}
            style={{
              resize: 'vertical',
              minHeight: '80px',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
          }}
        >
          <span
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}
          >
            按 Ctrl+Enter 快速提交
          </span>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? '提交中...' : '添加记录'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecordForm;
