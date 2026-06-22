import React, { useState, useCallback } from 'react';
import { useCard } from '../App';
import type { Layer, Recipient } from '../types/card';
import { replaceTemplateVars, generateThumbnail } from '../utils/export';
import confetti from 'canvas-confetti';

export function PreviewGrid() {
  const { state, generatePreviews, playAnimation } = useCard();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [personalizedPreviews, setPersonalizedPreviews] = useState<{ recipient: Recipient; thumbnailUrl: string; layers: Layer[] }[]>([]);

  const handleGenerate = useCallback(async () => {
    if (state.recipients.length === 0) return;
    setGenerating(true);
    try {
      const results: { recipient: Recipient; thumbnailUrl: string; layers: Layer[] }[] = [];
      for (const recipient of state.recipients) {
        const merged = replaceTemplateVars(state.layers, recipient);
        let thumbUrl = '';
        try {
          const cardEl = document.querySelector('.card-canvas') as HTMLElement;
          if (cardEl) thumbUrl = await generateThumbnail(cardEl);
        } catch {}
        results.push({ recipient, thumbnailUrl: thumbUrl, layers: merged });
      }
      setPersonalizedPreviews(results);
    } finally {
      setGenerating(false);
    }
  }, [state.layers, state.recipients]);

  const openPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  const fontFamilyMap: Record<string, string> = {
    'noto-sans': 'var(--font-sans)',
    'noto-serif': 'var(--font-serif)',
    'zhanku-kuaile': 'var(--font-kuaile)',
  };

  const previewItem = previewIndex !== null ? personalizedPreviews[previewIndex] : null;

  return (
    <div className="preview-grid-container">
      <div className="preview-header">
        <h3>📊 批量预览</h3>
        <div className="preview-actions">
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={generating || state.recipients.length === 0}
          >
            {generating ? '生成中...' : `生成预览 (${state.recipients.length}人)`}
          </button>
        </div>
      </div>

      <div className="preview-grid">
        {personalizedPreviews.map((item, i) => (
          <div key={i} className="preview-thumb-card" onClick={() => openPreview(i)}>
            <div className="preview-thumb-img" style={{
              backgroundColor: state.layers.find(l => l.type === 'background')?.color || '#FFF',
            }}>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.recipient.name} />
              ) : (
                <div className="preview-placeholder">
                  <span>{item.recipient.name}</span>
                </div>
              )}
            </div>
            <div className="preview-thumb-name">{item.recipient.name}</div>
          </div>
        ))}
        {personalizedPreviews.length === 0 && (
          <div className="preview-empty">
            导入收件人名单后点击"生成预览"
          </div>
        )}
      </div>

      {previewItem && (
        <div className="preview-modal-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closePreview}>✕</button>
            <div className="modal-card paper-texture" style={{
              width: 450, height: 600, position: 'relative', overflow: 'hidden',
              borderRadius: 8,
            }}>
              {previewItem.layers.map(layer => {
                if (layer.type === 'background') {
                  return <div key={layer.id} style={{
                    position: 'absolute', left: layer.x * 0.75, top: layer.y * 0.75,
                    width: layer.width * 0.75, height: layer.height * 0.75,
                    backgroundColor: layer.color || '#FFF', zIndex: 0,
                  }} />;
                }
                if (layer.type === 'decoration') {
                  return <div key={layer.id} style={{
                    position: 'absolute',
                    left: layer.x * 0.75, top: layer.y * 0.75,
                    width: layer.width * 0.75, height: layer.height * 0.75,
                    backgroundImage: layer.src ? `url(${layer.src})` : undefined,
                    backgroundSize: 'contain', backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transform: `rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                    zIndex: layer.zIndex,
                  }} />;
                }
                if (layer.type === 'text' && layer.text) {
                  const t = layer.text;
                  return <div key={layer.id} style={{
                    position: 'absolute',
                    left: layer.x * 0.75, top: layer.y * 0.75,
                    width: layer.width * 0.75, height: layer.height * 0.75,
                    display: 'flex', alignItems: 'center',
                    justifyContent: t.textAlign === 'left' ? 'flex-start' : t.textAlign === 'right' ? 'flex-end' : 'center',
                    fontFamily: fontFamilyMap[t.fontFamily] || 'var(--font-sans)',
                    fontSize: `${t.fontSize * 0.75}px`,
                    lineHeight: t.lineHeight,
                    color: t.color,
                    textAlign: t.textAlign,
                    WebkitTextStroke: t.strokeWidth > 0 ? `${t.strokeWidth * 0.75}px ${t.strokeColor}` : undefined,
                    textShadow: t.shadowBlur > 0 || t.shadowOffsetX !== 0
                      ? `${t.shadowOffsetX * 0.75}px ${t.shadowOffsetY * 0.75}px ${t.shadowBlur * 0.75}px ${t.shadowColor}` : undefined,
                    wordBreak: 'break-word',
                    padding: '4px',
                    transform: `rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                    zIndex: layer.zIndex,
                  }}>
                    {t.content}
                  </div>;
                }
                return null;
              })}
            </div>
            <div className="modal-info">
              <span className="modal-recipient">致：{previewItem.recipient.name}</span>
              <span className="modal-message">{previewItem.recipient.message}</span>
            </div>
            <button className="btn-play-preview" onClick={() => {
              playAnimation();
              confetti({ particleCount: 20, spread: 45, origin: { y: 0.7 }, colors: ['#FF6B6B', '#FFE66D'] });
            }}>
              ▶ 播放动画
            </button>
          </div>
        </div>
      )}

      <style>{`
        .preview-grid-container {
          margin: 12px;
          padding: 12px;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          max-height: 260px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .preview-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-primary);
        }
        .btn-generate {
          background: var(--color-secondary);
          color: var(--color-text);
          padding: 6px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          transition: all var(--transition-normal);
        }
        .btn-generate:hover { background: var(--color-secondary-dark); transform: scale(1.05); }
        .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
          overflow-y: auto;
          flex: 1;
          padding: 4px;
        }
        .preview-thumb-card {
          cursor: pointer;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
          background: var(--color-bg);
        }
        .preview-thumb-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }
        .preview-thumb-img {
          width: 100%;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .preview-thumb-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-placeholder {
          text-align: center;
          font-size: 14px;
          color: var(--color-text-light);
          font-weight: 600;
        }
        .preview-thumb-name {
          padding: 4px 8px;
          font-size: 11px;
          color: var(--color-text);
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preview-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 24px;
          font-size: 13px;
          color: var(--color-text-light);
        }
        .preview-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .preview-modal {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: modalSlideUp 0.3s ease;
        }
        @keyframes modalSlideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-close {
          position: absolute;
          top: -8px; right: -8px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          z-index: 10;
          box-shadow: var(--shadow-md);
        }
        .modal-card {
          box-shadow: var(--shadow-lg);
        }
        .modal-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .modal-recipient { font-size: 16px; font-weight: 700; color: var(--color-primary); }
        .modal-message { font-size: 13px; color: var(--color-text-light); }
        .btn-play-preview {
          background: var(--color-primary);
          color: white;
          padding: 10px 24px;
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 700;
        }
        .btn-play-preview:hover { background: var(--color-primary-dark); }
      `}</style>
    </div>
  );
}
