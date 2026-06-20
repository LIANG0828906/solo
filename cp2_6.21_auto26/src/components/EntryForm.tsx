import { useState, useEffect } from 'react';
import type { Entry, Mood } from '../types';
import { MOOD_CONFIG } from '../types';

interface EntryFormProps {
  initialData?: Entry;
  onSubmit: (data: { title: string; source: string; summary: string; mood: Mood }) => void;
  onCancel: () => void;
}

export default function EntryForm({ initialData, onSubmit, onCancel }: EntryFormProps) {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState<Mood>('excited');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setSource(initialData.source);
      setSummary(initialData.summary);
      setMood(initialData.mood);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, source, summary, mood });
  };

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      <div className="form-group">
        <label htmlFor="title" className="form-label">标题</label>
        <input
          id="title"
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入条目标题..."
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="source" className="form-label">来源网站</label>
        <input
          id="source"
          type="text"
          className="form-input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="例如：知乎、B站、个人博客..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="summary" className="form-label">摘要（支持 Markdown）</label>
        <textarea
          id="summary"
          className="form-textarea"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="记录你的想法和感受，支持 Markdown 语法..."
          rows={6}
        />
      </div>

      <div className="form-group">
        <label className="form-label">心情标签</label>
        <div className="mood-selector">
          {(Object.keys(MOOD_CONFIG) as Mood[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`mood-option ${mood === m ? 'selected' : ''}`}
              style={{
                '--mood-color': MOOD_CONFIG[m].color,
                borderColor: mood === m ? MOOD_CONFIG[m].color : '#e8e4e0',
                backgroundColor: mood === m ? `${MOOD_CONFIG[m].color}15` : '#ffffff',
              } as React.CSSProperties}
              onClick={() => setMood(m)}
            >
              <span
                className="mood-dot"
                style={{ backgroundColor: MOOD_CONFIG[m].color }}
              />
              <span className="mood-label">{MOOD_CONFIG[m].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
          {initialData ? '保存修改' : '添加条目'}
        </button>
      </div>
    </form>
  );
}
