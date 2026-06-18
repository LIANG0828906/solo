import React, { useState } from 'react';
import { VenueTemplate } from '@/types';
import { VENUE_CONFIGS } from '@/utils/venueConfigs';
import { useExhibitionStore } from '@/store/useExhibitionStore';

interface ExhibitionFormProps {
  onClose: () => void;
}

export const ExhibitionForm: React.FC<ExhibitionFormProps> = ({ onClose }) => {
  const { createExhibition } = useExhibitionStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venueTemplate, setVenueTemplate] = useState<VenueTemplate>('white_gallery');
  const [wallLayout, setWallLayout] = useState(0);
  const [error, setError] = useState('');

  const templates: { key: VenueTemplate; label: string }[] = [
    { key: 'white_gallery', label: '白色画廊' },
    { key: 'industrial_warehouse', label: '工业仓库' },
    { key: 'outdoor_park', label: '露天公园' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请填写展览名称');
      return;
    }
    if (name.length > 50) {
      setError('展览名称不能超过50字');
      return;
    }
    if (description.length > 200) {
      setError('展览简介不能超过200字');
      return;
    }

    createExhibition({
      name: name.trim(),
      description: description.trim(),
      venueTemplate,
      wallLayout,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 22, fontWeight: 700 }}>创建新展览</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="label">展览名称 <span style={{ color: '#EF4444' }}>*</span> (最多50字)</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入展览名称"
              maxLength={50}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#64748B', marginTop: 4 }}>{name.length}/50</div>
          </div>

          <div>
            <label className="label">展览简介 (最多200字)</label>
            <textarea
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入展览简介"
              rows={3}
              maxLength={200}
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#64748B', marginTop: 4 }}>{description.length}/200</div>
          </div>

          <div>
            <label className="label">虚拟场馆模板</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {templates.map((t) => (
                <div
                  key={t.key}
                  onClick={() => {
                    setVenueTemplate(t.key);
                    setWallLayout(0);
                  }}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: venueTemplate === t.key ? '2px solid #A3E635' : '1px solid #475569',
                    transition: 'all 0.2s ease',
                    background: '#334155',
                  }}
                >
                  <div
                    style={{
                      height: 80,
                      background: VENUE_CONFIGS[t.key].thumbnail,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 30,
                      background: 'rgba(0,0,0,0.1)',
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderRadius: 2,
                    }} />
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">墙面布局 (共9种)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setWallLayout(i)}
                  style={{
                    cursor: 'pointer',
                    padding: '14px 8px',
                    borderRadius: 8,
                    background: wallLayout === i ? 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(34,197,94,0.3))' : '#334155',
                    border: wallLayout === i ? '1px solid #A3E635' : '1px solid transparent',
                    textAlign: 'center',
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                  }}
                >
                  布局 {i + 1}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: '#F87171', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-gradient">
              创建展览
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
