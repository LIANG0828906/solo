import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantStore } from './store';
import { compressImage } from './utils';
import type { PlantCategory, LightRequirement } from './types';

const CATEGORIES: PlantCategory[] = ['多肉', '蕨类', '观叶', '开花', '仙人掌'];
const LIGHT_OPTIONS: LightRequirement[] = ['喜阴', '半阴', '喜阳'];

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23E8F5F2"/><text x="50%25" y="55%25" font-size="100" text-anchor="middle" dominant-baseline="middle">🌿</text></svg>';

export const PlantForm: React.FC = () => {
  const navigate = useNavigate();
  const addPlant = usePlantStore(s => s.addPlant);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlantCategory>('多肉');
  const [light, setLight] = useState<LightRequirement>('半阴');
  const [waterFrequency, setWaterFrequency] = useState(3);
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.8);
      setAvatar(compressed);
    } catch (err) {
      console.error('Image processing failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const plant = await addPlant({
        name: name.trim(),
        category,
        light,
        waterFrequency,
        location: location.trim() || '未设置',
        avatar,
      });
      navigate(`/plant/${plant.id}`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade">
      <div className="form-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
        <h1 className="page-title">新增植物</h1>
        <div style={{ width: 60 }} />
      </div>

      <form className="plant-form" onSubmit={handleSubmit}>
        <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
          <img src={avatar} alt="头像预览" className="avatar-preview" />
          <div className="avatar-overlay">
            <span>📷 点击更换</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="form-group">
          <label>植物名称 *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="给你的植物起个名字"
            required
          />
        </div>

        <div className="form-group">
          <label>品种</label>
          <div className="chip-group">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                className={`chip ${category === c ? 'chip-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>光照需求</label>
          <div className="chip-group">
            {LIGHT_OPTIONS.map(l => (
              <button
                key={l}
                type="button"
                className={`chip ${light === l ? 'chip-active' : ''}`}
                onClick={() => setLight(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>浇水频率（每几天一次）</label>
          <div className="freq-row">
            <button
              type="button"
              className="freq-btn"
              onClick={() => setWaterFrequency(Math.max(1, waterFrequency - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={60}
              value={waterFrequency}
              onChange={e => setWaterFrequency(Math.max(1, parseInt(e.target.value) || 1))}
              className="freq-input"
            />
            <button
              type="button"
              className="freq-btn"
              onClick={() => setWaterFrequency(Math.min(60, waterFrequency + 1))}
            >
              +
            </button>
            <span className="freq-label">天</span>
          </div>
        </div>

        <div className="form-group">
          <label>摆放位置</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="例如：客厅窗台"
          />
        </div>

        <button type="submit" className="submit-btn ripple" disabled={submitting}>
          {submitting ? '保存中...' : '✓ 保存植物'}
        </button>
      </form>
    </div>
  );
};
