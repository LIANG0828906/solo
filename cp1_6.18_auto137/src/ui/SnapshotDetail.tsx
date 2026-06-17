import React from 'react';
import { Snapshot } from '../stores/snapshotStore';

const tagLabels: Record<string, string> = {
  positive: '积极',
  negative: '消极',
  neutral: '中性',
};

const tagColors: Record<string, string> = {
  positive: '#4ADE80',
  negative: '#F87171',
  neutral: '#60A5FA',
};

interface SnapshotDetailProps {
  snapshot: Snapshot | null;
  onClose: () => void;
}

export const SnapshotDetail: React.FC<SnapshotDetailProps> = ({ snapshot, onClose }) => {
  if (!snapshot) return null;

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          background: 'rgba(20, 20, 30, 0.98)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(108, 99, 255, 0.2)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
          animation: 'scaleIn 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'relative', background: '#0A0A14' }}>
          <img
            src={snapshot.imageUrl}
            alt={snapshot.title}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231A1A2E"/><stop offset="50%" stop-color="%232A2A40"/><stop offset="100%" stop-color="%231A1A2E"/></linearGradient></defs><rect fill="url(%23g)" width="800" height="400"/><text x="400" y="210" text-anchor="middle" fill="%236C63FF" font-size="64">📷</text><text x="400" y="270" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="18">网页快照</text></svg>';
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6C63FF';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '28px', overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '24px',
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {snapshot.title}
            </h2>
            <span
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                background: tagColors[snapshot.sentimentLabel] + '20',
                border: `1px solid ${tagColors[snapshot.sentimentLabel]}40`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: tagColors[snapshot.sentimentLabel],
                  marginRight: '8px',
                  boxShadow: `0 0 8px ${tagColors[snapshot.sentimentLabel]}`,
                }}
              />
              {tagLabels[snapshot.sentimentLabel]} · {(snapshot.sentimentStrength * 100).toFixed(0)}%
            </span>
          </div>

          <div
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {formatDate(snapshot.timestamp)} · 位于{snapshot.wall === 'left' ? '左侧' : '右侧'}走廊
          </div>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '15px',
              lineHeight: 1.7,
              margin: '0 0 24px 0',
            }}
          >
            {snapshot.description}
          </p>

          <div
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(108, 99, 255, 0.05) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(108, 99, 255, 0.2)',
            }}
          >
            <div
              style={{
                color: '#6C63FF',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}
            >
              💭 情感分析评论
            </div>
            <p
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '16px',
                lineHeight: 1.7,
                fontStyle: 'italic',
              }}
            >
              "{snapshot.comment}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
