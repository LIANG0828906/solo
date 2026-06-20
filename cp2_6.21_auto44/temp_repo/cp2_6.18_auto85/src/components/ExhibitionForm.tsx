import React, { useState } from 'react';
import { VenueTemplate, Exhibition } from '@/types';
import { VENUE_CONFIGS } from '@/utils/venueConfigs';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { VenuePreviewThumbnail } from './VenuePreviewThumbnail';
import { ExhibitionCreatedModal } from './ExhibitionCreatedModal';

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
  const [createdExhibition, setCreatedExhibition] = useState<Exhibition | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const templates: { key: VenueTemplate; label: string; desc: string }[] = [
    { key: 'white_gallery', label: '白色画廊', desc: '明亮简洁，适合现代艺术展' },
    { key: 'industrial_warehouse', label: '工业仓库', desc: '粗粝质感，适合装置艺术' },
    { key: 'outdoor_park', label: '露天公园', desc: '自然氛围，适合雕塑与公共艺术' },
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

    setIsCreating(true);
    setTimeout(() => {
      const newEx = createExhibition({
        name: name.trim(),
        description: description.trim(),
        venueTemplate,
        wallLayout,
      });
      setIsCreating(false);
      setCreatedExhibition(newEx);
    }, 400);
  };

  const handleStartCurating = () => {
    setCreatedExhibition(null);
    onClose();
  };

  if (createdExhibition) {
    return (
      <ExhibitionCreatedModal
        exhibition={createdExhibition}
        onClose={() => {
          setCreatedExhibition(null);
          onClose();
        }}
        onStartCurating={handleStartCurating}
      />
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, padding: '28px 32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>创建新展览</h2>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              为您的艺术作品打造专属虚拟展厅
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#334155',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#475569';
              (e.currentTarget as HTMLButtonElement).style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#334155';
              (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">
                展览名称 <span style={{ color: '#EF4444' }}>*</span> (最多50字)
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：光之边界——当代影像艺术展"
                maxLength={50}
                style={{ padding: '12px 16px', fontSize: 14 }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                {name.length}/50
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">展览简介 (最多200字)</label>
              <textarea
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要介绍本次展览的主题、策展理念与参展艺术家..."
                rows={3}
                maxLength={200}
                style={{ resize: 'none', fontFamily: 'inherit', padding: '12px 16px', fontSize: 14 }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                {description.length}/200
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <label className="label" style={{ marginBottom: 0 }}>
                虚拟场馆模板
              </label>
              <span style={{ fontSize: 11, color: '#64748B' }}>点击选择场馆，预览窗口实时切换</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {templates.map((t) => {
                const isSelected = venueTemplate === t.key;
                return (
                  <div
                    key={t.key}
                    onClick={() => {
                      setVenueTemplate(t.key);
                      setWallLayout(0);
                    }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: isSelected ? '2px solid #A3E635' : '1px solid #475569',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      background: '#334155',
                      transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isSelected
                        ? '0 10px 30px rgba(163, 230, 53, 0.18)'
                        : '0 4px 14px rgba(0, 0, 0, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#64748B';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#475569';
                      }
                    }}
                  >
                    <div
                      style={{
                        padding: 10,
                        display: 'flex',
                        justifyContent: 'center',
                        background: VENUE_CONFIGS[t.key].bgColor,
                        borderBottom: isSelected ? '2px solid rgba(163, 230, 53, 0.5)' : '1px solid #475569',
                      }}
                    >
                      <VenuePreviewThumbnail
                        template={t.key}
                        layoutIndex={0}
                        isSelected={isSelected}
                        width={200}
                        height={150}
                      />
                    </div>
                    <div style={{ padding: '14px 14px 16px 14px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>
                          {t.label}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'linear-gradient(135deg, #4F46E5, #22C55E)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          >
                            已选择
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
                        {t.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <label className="label" style={{ marginBottom: 0 }}>
                墙面布局
              </label>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                当前：<span style={{ color: '#A3E635', fontWeight: 600 }}>布局 {wallLayout + 1}</span>
                　共9种，不同墙数与排列
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8 }}>
              {Array.from({ length: 9 }).map((_, i) => {
                const isSelected = wallLayout === i;
                return (
                  <div
                    key={i}
                    onClick={() => setWallLayout(i)}
                    style={{
                      cursor: 'pointer',
                      padding: '16px 6px',
                      borderRadius: 10,
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(34, 197, 94, 0.25))'
                        : '#334155',
                      border: isSelected
                        ? '1px solid #A3E635'
                        : '1px solid #475569',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#A3E635' : '#CBD5E1',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#64748B';
                        (e.currentTarget as HTMLDivElement).style.background = '#475569';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#475569';
                        (e.currentTarget as HTMLDivElement).style.background = '#334155';
                      }
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#A3E635',
                          color: '#0F172A',
                          fontSize: 10,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        ✓
                      </div>
                    )}
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              style={{
                color: '#F87171',
                fontSize: 13,
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 10,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22 }}>💡</div>
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                <div style={{ color: '#CBD5E1', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  创建后将自动生成唯一ID与分享链接
                </div>
                您随时可以在顶部工具栏发布展览并复制链接分享给访客
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '12px 22px', fontSize: 13 }}>
              取消
            </button>
            <button
              type="submit"
              className="btn-gradient"
              disabled={isCreating}
              style={{
                padding: '12px 28px',
                fontSize: 13,
                opacity: isCreating ? 0.7 : 1,
                cursor: isCreating ? 'not-allowed' : 'pointer',
                minWidth: 140,
              }}
            >
              {isCreating ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  创建中...
                </span>
              ) : (
                '✨ 创建展览'
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
