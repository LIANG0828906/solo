import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoffeeStore } from '../store';
import { COFFEE_VARIETIES, BREW_METHODS, FLAVOR_TAGS } from '../types';

export default function CoffeeForm() {
  const navigate = useNavigate();
  const addRecord = useCoffeeStore((s) => s.addRecord);

  const [name, setName] = useState('');
  const [variety, setVariety] = useState(COFFEE_VARIETIES[0]);
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10));
  const [brewMethod, setBrewMethod] = useState(BREW_METHODS[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState(80);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || submitting) return;
      setSubmitting(true);
      try {
        await addRecord({
          name: name.trim(),
          variety,
          roastDate,
          brewMethod,
          flavorTags: [...selectedTags],
          rating,
          notes: notes.trim()
        });
        navigate('/');
      } finally {
        setSubmitting(false);
      }
    },
    [name, variety, roastDate, brewMethod, selectedTags, rating, notes, submitting, addRecord, navigate]
  );

  return (
    <section>
      <h2 className="section-title">📝 记录一杯新咖啡</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">咖啡名称 *</label>
              <input
                className="input"
                type="text"
                placeholder="如：埃塞俄比亚 耶加雪菲"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">品种</label>
              <select className="select" value={variety} onChange={(e) => setVariety(e.target.value)}>
                {COFFEE_VARIETIES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">烘焙日期</label>
              <input
                className="input"
                type="date"
                value={roastDate}
                onChange={(e) => setRoastDate(e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label className="label">冲泡方式</label>
              <div className="radio-group">
                {BREW_METHODS.map((m) => (
                  <label
                    key={m}
                    className={'radio-option' + (brewMethod === m ? ' selected' : '')}
                  >
                    <input
                      type="radio"
                      name="brew"
                      value={m}
                      checked={brewMethod === m}
                      onChange={(e) => setBrewMethod(e.target.value)}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group full-width">
              <label className="label">风味标签（可多选）</label>
              <div className="tag-chip-group">
                {FLAVOR_TAGS.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className={'tag-chip' + (selectedTags.includes(tag) ? ' selected' : '')}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group full-width">
              <label className="label">个人评分 · {rating}</label>
              <div className="slider-container">
                <input
                  className="slider"
                  type="range"
                  min={0}
                  max={100}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
                <span className="rating-display">{rating}</span>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="label">品鉴笔记</label>
              <textarea
                className="textarea"
                placeholder="记录下这杯咖啡给你带来的感受、场景或心情…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || submitting}
            >
              {submitting ? '保存中…' : '☕ 保存记录'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
