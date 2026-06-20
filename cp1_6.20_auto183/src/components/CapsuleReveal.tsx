import React, { useState, useEffect } from 'react';
import { Capsule, formatDate, formatDateTime, getCurrentCapsuleStatus } from '../utils/mapUtils';

interface CapsuleRevealProps {
  capsule: Capsule | null;
  onClose: () => void;
}

const CapsuleReveal: React.FC<CapsuleRevealProps> = ({ capsule, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showText, setShowText] = useState(false);
  const [stage, setStage] = useState<'opening' | 'opened'>('opening');

  useEffect(() => {
    if (capsule) {
      setImageLoaded(false);
      setImageError(false);
      setShowText(false);
      setStage('opening');
      const t1 = window.setTimeout(() => setStage('opened'), 700);
      const t2 = window.setTimeout(() => setShowText(true), 1000);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [capsule]);

  if (!capsule) return null;

  const status = getCurrentCapsuleStatus(capsule.openDate);
  const isUnlocked = status === 'unlocked' || status === 'discovered';

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(30,40,50,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeInUp 0.3s ease',
  };

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #fffcf5 0%, #f8f0dd 100%)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow:
      '0 30px 80px rgba(50,60,50,0.35), 0 0 0 1px rgba(255,255,255,0.6) inset',
    animation: stage === 'opening' ? 'expandCard 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards' : undefined,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(180,160,110,0.25)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px 24px 12px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, rgba(107,163,104,0.12) 0%, transparent 100%)',
    borderBottom: '1px dashed rgba(180,160,110,0.3)',
  };

  const headerEmojiStyle: React.CSSProperties = {
    fontSize: '2.6rem',
    marginBottom: '8px',
    filter: 'drop-shadow(0 4px 8px rgba(180,150,60,0.3))',
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#5d6b4f',
    marginBottom: '4px',
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    fontSize: '0.78rem',
    color: '#8a8270',
    marginTop: '8px',
    flexWrap: 'wrap',
  };

  const metaItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.5)',
    padding: '4px 10px',
    borderRadius: '6px',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  };

  const textStyle: React.CSSProperties = {
    fontSize: '0.98rem',
    lineHeight: 1.9,
    color: '#3d3d3d',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    letterSpacing: '0.3px',
    opacity: showText ? 1 : 0,
    transform: showText ? 'translateY(0)' : 'translateY(10px)',
    transition: 'all 0.8s ease',
    background: 'rgba(255,255,255,0.4)',
    padding: '16px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(180,160,110,0.15)',
    fontStyle: 'italic',
  };

  const imageContainerStyle: React.CSSProperties = {
    marginTop: '16px',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative',
    background: 'rgba(180,160,110,0.1)',
    minHeight: capsule.imageUrl ? '180px' : '0',
    opacity: showText ? 1 : 0,
    transform: showText ? 'translateY(0)' : 'translateY(10px)',
    transition: 'all 0.8s ease 0.15s',
  };

  const skeletonStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(200,180,130,0.1) 25%, rgba(200,180,130,0.25) 50%, rgba(200,180,130,0.1) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton 1.4s ease-in-out infinite',
    display: !imageLoaded && !imageError && capsule.imageUrl ? 'block' : 'none',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover' as const,
    display: imageLoaded ? 'block' : 'none',
  };

  const sealedStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '30px 20px',
    color: '#7a8aa8',
  };

  const footerStyle: React.CSSProperties = {
    padding: '14px 24px 20px',
    borderTop: '1px dashed rgba(180,160,110,0.3)',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    background: 'linear-gradient(0deg, rgba(107,163,104,0.08) 0%, transparent 100%)',
  };

  const closeBtnStyle: React.CSSProperties = {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #4a7c59 0%, #6ba368 100%)',
    color: '#fafafa',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(74,124,89,0.3)',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={headerEmojiStyle}>
            {status === 'sealed' ? '🔒' : '📦'}
          </div>
          <div style={headerTitleStyle}>
            {status === 'sealed' ? '胶囊密封中...' : '✨ 胶囊已开启！'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#a09880' }}>
            {status === 'sealed'
              ? `此胶囊将于 ${formatDate(capsule.openDate)} 开启`
              : '一段来自过去的时光'}
          </div>
          <div style={metaRowStyle}>
            <span style={metaItemStyle}>
              📍 {capsule.lat.toFixed(2)}°, {capsule.lng.toFixed(2)}°
            </span>
            <span style={metaItemStyle}>
              🕰️ {formatDate(capsule.createdAt)} 埋下
            </span>
            <span style={metaItemStyle}>
              📅 开启: {formatDate(capsule.openDate)}
            </span>
          </div>
        </div>

        <div style={bodyStyle}>
          {isUnlocked ? (
            <>
              <div style={textStyle}>「{capsule.text}」</div>

              {capsule.imageUrl && (
                <div style={imageContainerStyle}>
                  <div style={skeletonStyle} />
                  {!imageError && (
                    <img
                      src={capsule.imageUrl}
                      alt="胶囊图片"
                      style={imgStyle}
                      loading="lazy"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        setImageError(true);
                        setImageLoaded(true);
                      }}
                    />
                  )}
                  {imageError && (
                    <div
                      style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#a09880',
                        fontSize: '0.85rem',
                      }}
                    >
                      🖼️ 图片加载失败
                    </div>
                  )}
                </div>
              )}

              {capsule.discoveredAt && (
                <div
                  style={{
                    marginTop: '14px',
                    fontSize: '0.78rem',
                    color: '#a09880',
                    textAlign: 'center',
                    opacity: showText ? 1 : 0,
                    transition: 'opacity 0.6s ease 0.3s',
                  }}
                >
                  被发现于 {formatDateTime(capsule.discoveredAt)}
                </div>
              )}
            </>
          ) : (
            <div style={sealedStyle}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.7 }}>🔐</div>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.8 }}>
                这颗胶囊还在沉睡中...<br />
                请耐心等待 {formatDate(capsule.openDate)} 的到来。<br />
                <span style={{ fontSize: '0.82rem', color: '#a0a0b8' }}>
                  好东西值得等待 🌱
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(74,124,89,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(74,124,89,0.3)';
            }}
          >
            {isUnlocked ? '收藏这份回忆' : '好的，等待那天'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default CapsuleReveal;
