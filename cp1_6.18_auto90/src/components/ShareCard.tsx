import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { useAppStore, FlavorWheel, FlavorDimension, DIMENSION_COLORS, DIMENSION_LABELS } from '@/stores/appStore';
import WheelThumbnail from './WheelThumbnail';

const ShareCard: React.FC = () => {
  const { currentWheel } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateComment = (wheel: FlavorWheel): string => {
    const dimensions: FlavorDimension[] = ['sweet', 'sour', 'bitter', 'spicy', 'salty', 'umami'];
    const sorted = [...dimensions].sort((a, b) => wheel[b] - wheel[a]);
    const topFlavors = sorted.filter((d) => wheel[d] >= 5).slice(0, 3);

    if (topFlavors.length === 0) {
      return '风味平衡，口感温和';
    }

    const labels = topFlavors.map((d) => DIMENSION_LABELS[d]);
    if (labels.length === 1) {
      return `${labels[0]}味突出，层次分明`;
    }
    if (labels.length === 2) {
      return `${labels[0]}与${labels[1]}交织，余韵悠长`;
    }
    return `${labels[0]}、${labels[1]}、${labels[2]}三味融合，口感丰富`;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#1A1A2E',
      });

      const blob = await fetch(dataUrl).then((res) => res.blob());
      saveAs(blob, `风味品鉴_${Date.now()}.png`);
    } catch (error) {
      console.error('生成图片失败:', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#1A1A2E',
      });

      const blob = await fetch(dataUrl).then((res) => res.blob());
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const QRCodePlaceholder = () => (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <rect x="0" y="0" width="40" height="40" fill="white" />
      <rect x="2" y="2" width="12" height="12" fill="#1A1A2E" />
      <rect x="4" y="4" width="8" height="8" fill="white" />
      <rect x="6" y="6" width="4" height="4" fill="#1A1A2E" />
      <rect x="26" y="2" width="12" height="12" fill="#1A1A2E" />
      <rect x="28" y="4" width="8" height="8" fill="white" />
      <rect x="30" y="6" width="4" height="4" fill="#1A1A2E" />
      <rect x="2" y="26" width="12" height="12" fill="#1A1A2E" />
      <rect x="4" y="28" width="8" height="8" fill="white" />
      <rect x="6" y="30" width="4" height="4" fill="#1A1A2E" />
      <rect x="16" y="6" width="4" height="4" fill="#1A1A2E" />
      <rect x="20" y="10" width="4" height="4" fill="#1A1A2E" />
      <rect x="18" y="18" width="4" height="4" fill="#1A1A2E" />
      <rect x="26" y="20" width="4" height="4" fill="#1A1A2E" />
      <rect x="30" y="26" width="4" height="4" fill="#1A1A2E" />
      <rect x="22" y="30" width="4" height="4" fill="#1A1A2E" />
      <rect x="18" y="26" width="4" height="4" fill="#1A1A2E" />
    </svg>
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#6C5CE7',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#A29BFE';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(162, 155, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#6C5CE7';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="分享"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1A1A2E',
              borderRadius: '12px',
              border: '1px solid #4A4A6A',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              animation: 'scaleIn 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>分享品鉴名片</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8A8AAA',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div
              ref={cardRef}
              style={{
                width: '384px',
                height: '216px',
                background: 'radial-gradient(ellipse at center, #2D2D44 0%, #1A1A2E 100%)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '12px',
                  fontSize: '10px',
                  color: '#6A6A8A',
                }}
              >
                风味轮盘
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                }}
              >
                <QRCodePlaceholder />
              </div>

              <div style={{ marginTop: '12px' }}>
                <WheelThumbnail data={currentWheel} size={80} />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {(['sweet', 'sour', 'bitter', 'spicy', 'salty', 'umami'] as FlavorDimension[]).map(
                  (dim) => (
                    <span
                      key={dim}
                      style={{
                        padding: '2px 6px',
                        background: `${DIMENSION_COLORS[dim]}33`,
                        color: DIMENSION_COLORS[dim],
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {DIMENSION_LABELS[dim]} {currentWheel[dim]}
                    </span>
                  )
                )}
              </div>

              <div style={{ fontSize: '14px', color: '#AAA', textAlign: 'center', lineHeight: '1.4' }}>
                {generateComment(currentWheel)}
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: '9px',
                  color: '#6A6A8A',
                }}
              >
                生成于 {formatDate(new Date())}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                style={{
                  flex: 1,
                  height: '40px',
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                {isGenerating ? '生成中...' : '⬇ 下载图片'}
              </button>

              <button
                onClick={handleCopy}
                disabled={isGenerating}
                style={{
                  flex: 1,
                  height: '40px',
                  background: copySuccess ? '#00B894' : '#2D2D44',
                  border: '1px solid #4A4A6A',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {copySuccess ? '✓ 已复制' : '📋 复制图片'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareCard;
