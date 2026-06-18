import React, { useState } from 'react';
import { useBoardStore } from '../stores/boardStore';

const loadingSpinnerStyle = (): React.CSSProperties => ({
  width: 24,
  height: 24,
  border: '3px solid rgba(108,92,231,0.15)',
  borderTopColor: '#6C5CE7',
  borderRadius: '50%',
  animation: 'spinner-rotate 0.8s linear infinite',
});

const keyframesStyle = `
@keyframes spinner-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse-active {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,184,148,0.5); }
  50% { box-shadow: 0 0 0 8px rgba(0,184,148,0); }
}
@keyframes blink-dormant {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export const StatusBar: React.FC = () => {
  const {
    isLoading,
    isDormant,
    isConnected,
    collabRole,
    zoom,
    showVersionPanel,
    setShowVersionPanel,
    snapshots,
    initCollaboration,
  } = useBoardStore();

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boardId = params.get('board') || 'inspiration-board-default';
    const role = (params.get('role') as 'editor' | 'viewer') || 'editor';
    initCollaboration(boardId, role);
  }, [initCollaboration]);

  const handleShare = async (role: 'editor' | 'viewer') => {
    try {
      const res = await fetch(`/api/share?boardId=inspiration-board-default&role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.url);
        setShareOpen(true);
      }
    } catch (e) {
      const base = window.location.origin + window.location.pathname;
      setShareUrl(`${base}?board=inspiration-board-default&role=${role}`);
      setShareOpen(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <style>{keyframesStyle}</style>

      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 150,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          border: '1px solid rgba(45,45,68,0.08)',
          boxShadow: '0 2px 8px rgba(45,45,68,0.06)',
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isDormant ? '#FDCB6E' : '#00B894',
            animation: isDormant
              ? 'blink-dormant 0.5s ease-in-out infinite'
              : 'pulse-active 1s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 12,
            color: '#2D2D44',
            fontWeight: 500,
          }}>
            {isDormant ? '休眠' : '活跃'}
          </span>
          <div style={{
            width: 1, height: 16,
            background: 'rgba(45,45,68,0.1)',
            margin: '0 4px',
          }} />
          <span style={{
            fontSize: 12,
            color: isConnected ? '#00B894' : '#A0A0B8',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {isConnected ? (collabRole === 'viewer' ? '观看中' : '已连接') : '离线'}
          </span>
          <div style={{
            width: 1, height: 16,
            background: 'rgba(45,45,68,0.1)',
            margin: '0 4px',
          }} />
          <span style={{
            fontSize: 12,
            color: '#6C5CE7',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {zoomPercent}%
          </span>
        </div>

        {isLoading && (
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(45,45,68,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={loadingSpinnerStyle()} />
          </div>
        )}

        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <button
            onClick={() => setShareOpen(s => !s)}
            style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(45,45,68,0.08)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, transform 0.15s',
              boxShadow: shareOpen ? '0 4px 16px rgba(108,92,231,0.2)' : '0 2px 8px rgba(45,45,68,0.06)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="#6C5CE7" strokeWidth="2" />
              <circle cx="6" cy="12" r="3" stroke="#6C5CE7" strokeWidth="2" />
              <circle cx="18" cy="19" r="3" stroke="#6C5CE7" strokeWidth="2" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {shareOpen && (
            <div style={{
              position: 'absolute',
              top: 56,
              right: 0,
              width: 300,
              background: '#FFF',
              borderRadius: 14,
              border: '1px solid rgba(45,45,68,0.08)',
              boxShadow: '0 8px 32px rgba(45,45,68,0.15)',
              padding: 16,
              animation: 'fade-in 0.2s ease-out',
              zIndex: 300,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2D2D44', marginBottom: 12 }}>
                邀请协作
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => handleShare('editor')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(108,92,231,0.3)',
                    background: 'rgba(108,92,231,0.08)',
                    color: '#6C5CE7',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  编辑者链接
                </button>
                <button
                  onClick={() => handleShare('viewer')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(253,203,110,0.3)',
                    background: 'rgba(253,203,110,0.08)',
                    color: '#B8860B',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  观看者链接
                </button>
              </div>
              {shareUrl && (
                <>
                  <div style={{
                    fontSize: 11,
                    color: '#8A8AA8',
                    marginBottom: 6,
                  }}>
                    分享链接
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <input
                      readOnly
                      value={shareUrl}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(45,45,68,0.1)',
                        background: '#F8F8F2',
                        fontSize: 11,
                        color: '#2D2D44',
                        outline: 'none',
                        fontVariantNumeric: 'tabular-nums',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    />
                    <button
                      onClick={handleCopy}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: copied ? '#00B894' : '#6C5CE7',
                        color: '#FFF',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        minWidth: 64,
                      }}
                    >
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>
                </>
              )}
              <div style={{
                fontSize: 10,
                color: '#A0A0B8',
                marginTop: 12,
                lineHeight: 1.5,
              }}>
                编辑者可修改画布内容；观看者仅能查看实时更新。
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowVersionPanel(!showVersionPanel)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: showVersionPanel ? '#A29BFE' : '#6C5CE7',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: showVersionPanel
              ? '0 4px 16px rgba(108,92,231,0.4)'
              : '0 2px 12px rgba(108,92,231,0.3)',
            transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#FFF" strokeWidth="2" />
            <path d="M12 7v5l3 2" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {snapshots.length > 0 && (
            <div style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              borderRadius: 9,
              background: '#FF6B6B',
              color: '#FFF',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {snapshots.length > 99 ? '99+' : snapshots.length}
            </div>
          )}
        </button>
      </div>
    </>
  );
};
