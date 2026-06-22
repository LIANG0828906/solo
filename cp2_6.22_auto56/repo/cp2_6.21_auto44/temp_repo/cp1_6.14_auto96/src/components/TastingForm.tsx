import { useState } from 'react';
import { X, Eye, Wind, Flame, Droplets, Utensils, Star } from 'lucide-react';
import type { TastingRecord } from '@/types';
import { AROMA_OPTIONS } from '@/types';
import './TastingForm.css';

interface TastingFormProps {
  wineId: string;
  onSubmit: (data: Omit<TastingRecord, 'id'>) => void;
  onClose: () => void;
}

export default function TastingForm({ wineId, onSubmit, onClose }: TastingFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [appearance, setAppearance] = useState('');
  const [clarity, setClarity] = useState(3);
  const [aromas, setAromas] = useState<string[]>([]);
  const [tannin, setTannin] = useState(5);
  const [acidity, setAcidity] = useState(5);
  const [body, setBody] = useState(5);
  const [notes, setNotes] = useState('');
  const [foodPairing, setFoodPairing] = useState('');
  const [rating, setRating] = useState(0);

  const toggleAroma = (aroma: string) => {
    setAromas(prev =>
      prev.includes(aroma)
        ? prev.filter(a => a !== aroma)
        : [...prev, aroma]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      wineId,
      date,
      appearance,
      clarity,
      aromas,
      tannin,
      acidity,
      body,
      notes,
      foodPairing,
      rating,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h2 className="font-display text-cork text-xl mb-6 pr-10">新增品鉴记录</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-icon"><Calendar size={20} /></div>
            <div className="form-field">
              <label className="form-label">品鉴日期</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-icon"><Eye size={20} /></div>
            <div className="form-field">
              <label className="form-label">外观（颜色与清澈度）</label>
              <input
                type="text"
                className="form-input"
                placeholder="如：深宝石红色，边缘微带砖红"
                value={appearance}
                onChange={e => setAppearance(e.target.value)}
              />
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cork opacity-50">清澈度</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={clarity}
                    onChange={e => setClarity(Number(e.target.value))}
                    className="flex-1 accent-warm-gold"
                    style={{ accentColor: '#C9A962' }}
                  />
                  <span className="text-sm text-warm-gold font-semibold">{clarity}/5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="form-icon"><Wind size={20} /></div>
            <div className="form-field">
              <label className="form-label">香气</label>
              <div className="aroma-selector">
                {AROMA_OPTIONS.map(aroma => (
                  <button
                    key={aroma}
                    type="button"
                    className={`aroma-option ${aromas.includes(aroma) ? 'selected' : ''}`}
                    onClick={() => toggleAroma(aroma)}
                  >
                    {aroma}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="form-icon"><Flame size={20} /></div>
            <div className="form-field">
              <label className="form-label">口感</label>
              <div className="space-y-3 mt-1">
                <FormSlider label="单宁" value={tannin} onChange={setTannin} />
                <FormSlider label="酸度" value={acidity} onChange={setAcidity} />
                <FormSlider label="酒体" value={body} onChange={setBody} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="form-icon"><Droplets size={20} /></div>
            <div className="form-field">
              <label className="form-label">品鉴笔记</label>
              <textarea
                className="form-textarea"
                placeholder="记录你的感受与印象…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-icon"><Utensils size={20} /></div>
            <div className="form-field">
              <label className="form-label">搭配食物</label>
              <input
                type="text"
                className="form-input"
                placeholder="如：烤羊排配迷迭香"
                value={foodPairing}
                onChange={e => setFoodPairing(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-icon"><Star size={20} /></div>
            <div className="form-field">
              <label className="form-label">本次评分</label>
              <div className="rating-input">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rating-star ${i < rating ? 'filled' : ''}`}
                    onClick={() => setRating(i + 1)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={rating === 0}
            style={rating === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            提交品鉴记录
          </button>
        </form>
      </div>
    </div>
  );
}

function FormSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="slider-container">
      <span className="slider-label">{label}</span>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${value * 10}%` }} />
        <div className="slider-thumb" style={{ left: `${value * 10}%` }} />
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute opacity-0 w-full cursor-pointer"
        style={{ height: '20px', top: '-7px', left: 0 }}
      />
      <span className="slider-value">{value}</span>
    </div>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
