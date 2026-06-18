import React, { useState, useEffect } from 'react';
import { Exhibition } from '@/types';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { VENUE_CONFIGS } from '@/utils/venueConfigs';
import { VenuePreviewThumbnail } from './VenuePreviewThumbnail';

interface ExhibitionCreatedModalProps {
  exhibition: Exhibition;
  onClose: () => void;
  onStartCurating: () => void;
}

export const ExhibitionCreatedModal: React.FC<ExhibitionCreatedModalProps> = ({
  exhibition,
  onClose,
  onStartCurating,
}) => {
  const { getShareLink } = useExhibitionStore();
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const shareLink = getShareLink(exhibition.id);
  const shortId = exhibition.id.substring(0, 8) + '...' + exhibition.id.substring(exhibition.id.length - 4);
  const venueConfig = VENUE_CONFIGS[exhibition.venueTemplate];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(exhibition.id);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = exhibition.id;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ animation: 'fadeInBg 0.3s ease' }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          padding: 0,
          overflow: 'hidden',
          animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)',
            borderBottom: '1px solid #475569',
            padding: '28px 32px 24px 32px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #22C55E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
              animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            ✨
          </div>
          <div style={{ maxWidth: 'calc(100% - 70px)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
              展览创建成功！
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              您的虚拟展览空间已准备就绪
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <VenuePreviewThumbnail
              template={exhibition.venueTemplate}
              layoutIndex={exhibition.wallLayout}
              isSelected={true}
              width={160}
              height={120}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>展览名称</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {exhibition.name}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(163, 230, 53, 0.15)',
                  color: '#A3E635',
                  border: '1px solid rgba(163, 230, 53, 0.3)',
                }}>
                  {venueConfig.name}
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(71, 85, 105, 0.4)',
                  color: '#CBD5E1',
                }}>
                  布局 {exhibition.wallLayout + 1}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                  🆔 唯一展览ID
                </label>
                <button
                  onClick={copyId}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: idCopied ? '#22C55E' : '#A3E635',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 8px',
                    borderRadius: 4,
                    transition: 'all 0.2s',
                  }}
                >
                  {idCopied ? '✓ 已复制' : '复制'}
                </button>
              </div>
              <div
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                  fontSize: 12,
                  color: '#F8FAFC',
                  letterSpacing: 0.3,
                  userSelect: 'all',
                }}
              >
                <span style={{ opacity: 0.4 }}>exb_</span>
                {exhibition.id}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                  🔗 访客分享链接
                </label>
                <button
                  onClick={copyLink}
                  style={{
                    background: linkCopied
                      ? 'linear-gradient(135deg, #22C55E, #4ADE80)'
                      : 'transparent',
                    border: linkCopied ? 'none' : '1px solid rgba(163, 230, 53, 0.3)',
                    color: linkCopied ? 'white' : '#A3E635',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  {linkCopied ? '✓ 链接已复制' : '复制链接'}
                </button>
              </div>
              <div
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                  fontSize: 11,
                  color: '#A3E635',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'all',
                }}
                title={shareLink}
              >
                {shareLink}
              </div>
            </div>
          </div>

          {linkCopied && (
            <div
              style={{
                textAlign: 'center',
                padding: '10px 14px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 8,
                color: '#4ADE80',
                fontSize: 12,
                fontWeight: 500,
                animation: 'fadeInUp 0.3s ease',
              }}
            >
              🎉 链接已复制到剪贴板！立即分享给您的访客吧
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 4,
            }}
          >
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px 16px', fontSize: 13 }}
            >
              稍后再看
            </button>
            <button
              onClick={onStartCurating}
              className="btn-gradient"
              style={{ flex: 1.5, padding: '12px 16px', fontSize: 13 }}
            >
              🎨 开始布展
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
