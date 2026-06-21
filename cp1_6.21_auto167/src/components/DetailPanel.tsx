import React, { useState, useEffect } from 'react';
import type { Lens, LensStatus } from '../types';

interface DetailPanelProps {
  lens: Lens | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNotes: (id: string, status: LensStatus, notes: string) => void;
}

const STATUS_MAP: Record<LensStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: '#F59E0B' },
  approved: { label: '已通过', color: '#22C55E' },
  reshoot: { label: '需补拍', color: '#EF4444' },
};

const DetailPanel: React.FC<DetailPanelProps> = ({ lens, isOpen, onClose, onUpdateNotes }) => {
  const [notes, setNotes] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (lens) {
      setNotes(lens.reviewNotes || '');
    }
  }, [lens]);

  if (!isOpen || !lens) return null;

  const statusInfo = STATUS_MAP[lens.status];

  const handleSave = () => {
    onUpdateNotes(lens.id, lens.status, notes);
  };

  const panelContent = (
    <div
      className={isMobile ? 'slide-in-up' : 'slide-in-right'}
      style={{
        width: isMobile ? '100%' : 400,
        height: isMobile ? '70%' : '100%',
        background: '#1E293B',
        borderRadius: isMobile ? '16px 16px 0 0' : 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#F8FAFC' }}>镜头详情</div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.3s ease',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          width: '100%',
          height: 300,
          borderRadius: 8,
          background: '#334155',
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94A3B8',
          fontSize: 14,
          gap: 10,
        }}
      >
        <div style={{ fontSize: 56 }}>{lens.type === 'video' ? '🎥' : '🖼️'}</div>
        <div>播放器占位区域</div>
      </div>

      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#F8FAFC',
            marginBottom: 4,
          }}
        >
          {lens.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 10,
              color: '#fff',
              background: statusInfo.color,
              fontWeight: 600,
            }}
          >
            {statusInfo.label}
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{lens.uploadTime}</span>
        </div>

        <div
          style={{
            background: '#0F172A',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10, fontWeight: 600 }}>
            元数据
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>格式</div>
              <div style={{ fontSize: 13, color: '#F8FAFC' }}>{lens.format || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>尺寸</div>
              <div style={{ fontSize: 13, color: '#F8FAFC' }}>{lens.dimensions || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>时长</div>
              <div style={{ fontSize: 13, color: '#F8FAFC' }}>{lens.duration || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>ID</div>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontFamily: 'monospace' }}>
                {lens.id.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8, fontWeight: 600 }}>
            评审意见
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="输入对该镜头的评审意见..."
            style={{
              width: '100%',
              minHeight: 110,
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              color: '#F8FAFC',
              resize: 'vertical',
              lineHeight: 1.6,
              transition: 'border 0.3s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
          />
          <button
            onClick={handleSave}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}
          >
            保存评审意见
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fade-in"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
        }}
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%' }}>
          {panelContent}
        </div>
      </div>
    );
  }

  return panelContent;
};

export default DetailPanel;
