import React, { useState, FormEvent } from 'react';
import { CATEGORY_LABELS, CATEGORY_COLORS, TimelineEvent } from '../types';

interface EventFormProps {
  onEventAdded: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    borderBottom: '1px solid #0f3460',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#fff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '12px',
    color: '#8892b0',
    marginBottom: '4px',
    display: 'block',
  },
  input: {
    background: '#0a0a1a',
    border: '1px solid #0f3460',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  },
  textarea: {
    background: '#0a0a1a',
    border: '1px solid #0f3460',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  row: {
    display: 'flex',
    gap: '8px',
  },
  col: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  categoryRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  categoryChip: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s',
    fontWeight: 600,
  },
  starRow: {
    display: 'flex',
    gap: '2px',
  },
  star: {
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'color 0.15s',
    background: 'none',
    border: 'none',
    padding: '0',
  },
  submitBtn: {
    background: '#0f3460',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default function EventForm({ onEventAdded }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TimelineEvent['category']>('culture');
  const [importance, setImportance] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !date || !lat || !lng) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          description,
          category,
          importance,
        }),
      });
      if (res.ok) {
        setTitle('');
        setDate('');
        setLat('');
        setLng('');
        setDescription('');
        setCategory('culture');
        setImportance(3);
        onEventAdded();
      }
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>添加历史事件</div>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.col}>
          <label style={styles.label}>事件标题 *</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="如：赤壁之战"
            required
          />
        </div>
        <div style={styles.col}>
          <label style={styles.label}>日期（负数表示公元前，如 -208）*</label>
          <input
            style={styles.input}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="如：-208 或 1969"
            required
          />
        </div>
        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>纬度 *</label>
            <input
              style={styles.input}
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="30.58"
              required
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>经度 *</label>
            <input
              style={styles.input}
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="113.94"
              required
            />
          </div>
        </div>
        <div style={styles.col}>
          <label style={styles.label}>描述</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="事件描述..."
          />
        </div>
        <div style={styles.col}>
          <label style={styles.label}>类别</label>
          <div style={styles.categoryRow}>
            {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => (
              <span
                key={cat}
                style={{
                  ...styles.categoryChip,
                  background: category === cat ? CATEGORY_COLORS[cat] : 'transparent',
                  color: category === cat ? '#fff' : CATEGORY_COLORS[cat],
                  borderColor: CATEGORY_COLORS[cat],
                }}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
        </div>
        <div style={styles.col}>
          <label style={styles.label}>重要性</label>
          <div style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                style={{
                  ...styles.star,
                  color: s <= importance ? '#ffd32a' : '#333',
                }}
                onClick={() => setImportance(s)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <button
          style={{
            ...styles.submitBtn,
            opacity: submitting ? 0.6 : 1,
          }}
          type="submit"
          disabled={submitting}
        >
          {submitting ? '提交中...' : '添加事件'}
        </button>
      </form>
    </div>
  );
}
