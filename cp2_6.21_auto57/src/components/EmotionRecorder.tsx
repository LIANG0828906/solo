import React, { useState } from 'react';
import { emotionAPI, CreateRecordPayload } from '../api/emotionAPI';

const CATEGORIES = [
  { key: '快乐', icon: 'far fa-smile', color: '#6bcf7f' },
  { key: '平静', icon: 'far fa-meh', color: '#4fc3f7' },
  { key: '悲伤', icon: 'far fa-sad-tear', color: '#7986cb' },
  { key: '愤怒', icon: 'far fa-angry', color: '#ff6b6b' },
  { key: '焦虑', icon: 'far fa-frown-open', color: '#ffb74d' },
  { key: '疲惫', icon: 'far fa-tired', color: '#b0bec5' },
];

const PRESET_TAGS = [
  { key: '工作加班', icon: 'far fa-building' },
  { key: '运动健身', icon: 'far fa-futbol' },
  { key: '朋友聚会', icon: 'far fa-user-friends' },
  { key: '深夜失眠', icon: 'far fa-moon' },
  { key: '阅读学习', icon: 'far fa-book' },
  { key: '旅行出游', icon: 'far fa-plane' },
];

interface Props {
  onSubmitted: () => void;
}

function getGradientColor(value: number, min: number, max: number, startColor: string, endColor: string): string {
  const t = (value - min) / (max - min);
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  if (!start || !end) return startColor;
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

const EmotionRecorder: React.FC<Props> = ({ onSubmitted }) => {
  const [category, setCategory] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const intensityColor = getGradientColor(intensity, 1, 10, '#ff6b6b', '#6bcf7f');
  const energyColor = getGradientColor(energy, 1, 10, '#4fc3f7', '#1565c0');

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!category) {
      alert('请选择情绪类别');
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const payload: CreateRecordPayload = {
        timestamp,
        category,
        intensity,
        energy,
        note: note.slice(0, 200),
        tags,
      };
      await emotionAPI.createRecord(payload);
      setCategory('');
      setIntensity(5);
      setEnergy(5);
      setNote('');
      setTags([]);
      onSubmitted();
    } catch (err) {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <i className="far fa-edit" />
        记录此刻心情
      </div>

      <div className="form-group">
        <div className="form-label">情绪类别</div>
        <div className="emotion-categories">
          {CATEGORIES.map(cat => (
            <div
              key={cat.key}
              className={`emotion-chip ${category === cat.key ? 'selected' : ''}`}
              onClick={() => setCategory(cat.key)}
              style={category === cat.key ? { borderColor: cat.color, color: cat.color } : {}}
            >
              <i className={`${cat.icon} chip-icon`} />
              {cat.key}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">
          情绪强度
          <span className="slider-label-value" style={{ color: intensityColor }}>
            强度：{intensity}
          </span>
        </div>
        <div className="slider-container">
          <div className="slider-value-intensity" style={{ color: intensityColor }}>
            {intensity}
          </div>
          <input
            type="range"
            className="intensity-slider"
            min={1}
            max={10}
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
          />
          <div className="slider-scale">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">
          精力值（能量水平）
          <span className="slider-label-value" style={{ color: energyColor }}>
            精力：{energy}
          </span>
        </div>
        <div className="slider-container">
          <div className="slider-value-energy" style={{ color: energyColor }}>
            {energy}
          </div>
          <input
            type="range"
            className="energy-slider"
            min={1}
            max={10}
            value={energy}
            onChange={e => setEnergy(Number(e.target.value))}
          />
          <div className="slider-scale">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">生活事件标签</div>
        <div className="tag-checkbox-group">
          {PRESET_TAGS.map(t => (
            <label
              key={t.key}
              className={`tag-checkbox ${tags.includes(t.key) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={tags.includes(t.key)}
                onChange={() => toggleTag(t.key)}
              />
              <i className={t.icon} />
              {t.key}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">文字备注（不超过200字）</div>
        <textarea
          className="form-textarea"
          maxLength={200}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="写下此刻的想法..."
          rows={3}
        />
        <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>
          {note.length}/200
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ width: '100%' }}
      >
        <i className="far fa-check-circle" />
        {submitting ? '提交中...' : '提交记录'}
      </button>
    </div>
  );
};

export default EmotionRecorder;
