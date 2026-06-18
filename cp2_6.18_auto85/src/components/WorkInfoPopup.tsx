import React from 'react';
import { WorkMaterial } from '@/types';

interface WorkInfoPopupProps {
  work: WorkMaterial | null;
}

export const WorkInfoPopup: React.FC<WorkInfoPopupProps> = ({ work }) => {
  if (!work) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 120,
        transform: 'translateX(-50%)',
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #475569',
        borderRadius: 16,
        padding: '20px 28px',
        minWidth: 360,
        maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <img
          src={work.imageUrl}
          alt={work.title}
          style={{
            width: 100,
            height: 100,
            objectFit: 'cover',
            borderRadius: 10,
            flexShrink: 0,
            border: '1px solid #475569',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
            {work.title || '未命名作品'}
          </div>
          {work.author && (
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10 }}>
              艺术家：{work.author}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            {work.size && (
              <div>
                <span style={{ color: '#64748B' }}>尺寸：</span>
                <span style={{ color: '#CBD5E1' }}>{work.size}</span>
              </div>
            )}
            {work.medium && (
              <div>
                <span style={{ color: '#64748B' }}>媒介：</span>
                <span style={{ color: '#CBD5E1' }}>{work.medium}</span>
              </div>
            )}
            {work.price > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748B' }}>价格：</span>
                <span style={{ color: '#A3E635', fontWeight: 600 }}>¥{work.price.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
