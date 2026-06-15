import { useState, useMemo, useEffect, useRef } from 'react';
import { useWineStore } from './store';
import { AROMA_WORDS, WINE_COLORS } from './types';
import type { Tasting } from './types';

interface TastingFormProps {
  wineId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function TastingForm({ wineId, onClose, onSubmitted }: TastingFormProps) {
  const { addTasting } = useWineStore();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    color: '宝石红',
    aroma: '',
    sweetness: 2,
    acidity: 3,
    tannin: 3,
    body: 3,
    rating: 88,
    summary: '',
  });

  const [showAromaSuggestions, setShowAromaSuggestions] = useState(false);
  const aromaInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const aromaSuggestions = useMemo(() => {
    if (!formData.aroma.trim()) return [];
    const query = formData.aroma.toLowerCase();
    return AROMA_WORDS.filter((word) => word.toLowerCase().includes(query)).slice(0, 8);
  }, [formData.aroma]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        aromaInputRef.current &&
        !aromaInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowAromaSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSelectAroma = (word: string) => {
    setFormData((prev) => {
      const current = prev.aroma.trim();
      if (!current) {
        return { ...prev, aroma: word };
      }
      const parts = current.split(/[,，、\s]+/);
      parts[parts.length - 1] = word;
      return { ...prev, aroma: parts.join('、') };
    });
    setShowAromaSuggestions(false);
    aromaInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tasting: Omit<Tasting, 'id'> = {
      wineId,
      ...formData,
    };
    addTasting(tasting);
    onClose();
    onSubmitted?.();
  };

  const handleSliderChange = (
    field: 'sweetness' | 'acidity' | 'tannin' | 'body' | 'rating',
    value: number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderSlider = (
    field: 'sweetness' | 'acidity' | 'tannin' | 'body',
    label: string,
    min: number = 1,
    max: number = 5
  ) => {
    const value = formData[field];
    const percent = ((value - min) / (max - min)) * 100;

    return (
      <div className="slider-group">
        <div className="slider-header">
          <span className="slider-label">{label}</span>
          <span className="slider-value">{value} / {max}</span>
        </div>
        <div
          className="slider-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const val = Math.round(min + pct * (max - min));
            handleSliderChange(field, Math.max(min, Math.min(max, val)));
          }}
        >
          <div className="slider-fill" style={{ width: `${percent}%` }} />
          <div className="slider-thumb" style={{ left: `${percent}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => handleSliderChange(field, Number(e.target.value))}
          style={{
            width: '100%',
            opacity: 0,
            position: 'absolute',
            height: '20px',
            cursor: 'pointer',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新增品鉴记录</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">品鉴日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">颜色</label>
                <select
                  className="form-select"
                  value={formData.color}
                  onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                >
                  {WINE_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">香气（可输入并选择联想词）</label>
              <div className="aroma-autocomplete-wrapper">
                <input
                  ref={aromaInputRef}
                  type="text"
                  className="form-input"
                  placeholder="如：黑醋栗、烟草、皮革..."
                  value={formData.aroma}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, aroma: e.target.value }));
                    setShowAromaSuggestions(true);
                  }}
                  onFocus={() => setShowAromaSuggestions(true)}
                />
                {showAromaSuggestions && aromaSuggestions.length > 0 && (
                  <div ref={suggestionsRef} className="aroma-suggestions">
                    {aromaSuggestions.map((word) => (
                      <div
                        key={word}
                        className="aroma-suggestion-item"
                        onClick={() => handleSelectAroma(word)}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {['黑醋栗', '樱桃', '香草', '烟草', '皮革'].slice(0, 5).map((word) => (
                  <button
                    key={word}
                    type="button"
                    className="grape-tag"
                    onClick={() => {
                      setFormData((prev) => {
                        const current = prev.aroma.trim();
                        if (!current) return { ...prev, aroma: word };
                        return { ...prev, aroma: current + '、' + word };
                      });
                    }}
                  >
                    + {word}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              {renderSlider('sweetness', '甜度')}
              {renderSlider('acidity', '酸度')}
            </div>
            <div className="form-row">
              {renderSlider('tannin', '单宁')}
              {renderSlider('body', '酒体')}
            </div>

            <div className="form-group">
              <div className="slider-header">
                <span className="slider-label">总体评分</span>
                <span className="slider-value">{formData.rating} / 100</span>
              </div>
              <div
                className="slider-track"
                style={{ height: '8px' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  const val = Math.round(60 + pct * 40);
                  handleSliderChange('rating', Math.max(60, Math.min(100, val)));
                }}
              >
                <div
                  className="slider-fill"
                  style={{ width: `${((formData.rating - 60) / 40) * 100}%` }}
                />
                <div
                  className="slider-thumb"
                  style={{ left: `${((formData.rating - 60) / 40) * 100}%` }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">一句话总结</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="用一句话概括本次品鉴感受..."
                value={formData.summary}
                onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-submit">
              保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
