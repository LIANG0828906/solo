import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import type { Location, MoodType } from '../types';
import { MOOD_CONFIGS, MOOD_ORDER } from '../types';
import { HiX, HiDownload, HiRefresh } from 'react-icons/hi';

interface ShareCardProps {
  locations: Location[];
  onClose: () => void;
}

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😄',
  touched: '🥹',
  surprised: '🎉',
  calm: '🌿',
  tired: '😮‍💨',
};

const ShareCard: React.FC<ShareCardProps> = ({ locations, onClose }) => {
  const renderRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripTitle, setTripTitle] = useState('我的旅程');

  const moodCounts = MOOD_ORDER.reduce((acc, m) => {
    acc[m] = locations.filter(l => l.mood === m).length;
    return acc;
  }, {} as Record<MoodType, number>);

  const totalDots = Math.min(locations.length, 30);
  const moodDots: { type: MoodType; color: string }[] = [];
  MOOD_ORDER.forEach((m) => {
    const count = moodCounts[m];
    const ratio = locations.length > 0 ? count / locations.length : 0;
    const dotsForMood = Math.round(ratio * totalDots);
    for (let i = 0; i < dotsForMood; i++) {
      moodDots.push({ type: m, color: MOOD_CONFIGS[m].dotColor });
    }
  });
  while (moodDots.length < totalDots && moodDots.length < locations.length) {
    const fillMood = MOOD_ORDER.find(m => moodCounts[m] > 0);
    if (fillMood) {
      moodDots.push({ type: fillMood, color: MOOD_CONFIGS[fillMood].dotColor });
    } else {
      break;
    }
  }

  const generateImage = useCallback(async () => {
    if (!renderRef.current) return;
    setGenerating(true);
    setError(null);
    setPreviewUrl(null);

    try {
      const mapEl = document.getElementById('map-container');
      let mapDataUrl: string | null = null;

      if (mapEl) {
        const mapCanvas = await html2canvas(mapEl, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFF8F0',
          scale: Math.min(window.devicePixelRatio || 2, 2),
          logging: false,
          ignoreElements: (el) => {
            const tag = el.tagName?.toLowerCase();
            if (tag === 'a' && (el as HTMLElement).classList?.contains('leaflet-control-attribution')) {
              return true;
            }
            return false;
          },
        });
        mapDataUrl = mapCanvas.toDataURL('image/jpeg', 0.88);
      }

      if (mapDataUrl) {
        const mapImg = renderRef.current.querySelector('.share-map-img') as HTMLImageElement | null;
        if (mapImg) {
          mapImg.src = mapDataUrl;
          await new Promise<void>((resolve) => {
            if (mapImg.complete) resolve();
            else {
              mapImg.onload = () => resolve();
              mapImg.onerror = () => resolve();
            }
          });
        }
      }

      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(renderRef.current, {
        backgroundColor: '#FFF8F0',
        scale: Math.min(window.devicePixelRatio || 2, 2),
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const url = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Generate error:', err);
      setError('生成图片时出错，请重试');
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => generateImage(), 250);
    return () => clearTimeout(t);
  }, [generateImage]);

  const downloadImage = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `旅行地图_${tripTitle}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(45, 42, 38, 0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
          style={{
            width: '100%',
            maxWidth: '480px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                🎁 分享我的旅行地图
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                共 {locations.length} 个旅行足迹
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
              aria-label="关闭"
            >
              <HiX style={{ fontSize: '22px' }} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, flexShrink: 0 }}>
              旅程标题
            </label>
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value.slice(0, 20))}
              maxLength={20}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '13px',
                color: '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              placeholder="给这段旅程起个名字"
            />
          </div>

          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              padding: '8px',
              minHeight: 0,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '4px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="分享卡片预览"
                  style={{
                    width: '100%',
                    display: 'block',
                    borderRadius: '16px',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              ) : (
                <div
                  ref={renderRef}
                  style={{
                    width: '100%',
                    borderRadius: '16px',
                    backgroundColor: '#FFF8F0',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', backgroundColor: '#E8E0D6' }}>
                    <img
                      className="share-map-img"
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: generating ? 'none' : 'block',
                      }}
                    />
                    {generating && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: '10px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                          style={{ fontSize: '32px' }}
                        >
                          🗺️
                        </motion.div>
                        <p style={{ fontSize: '13px', fontWeight: 500 }}>正在生成分享卡片…</p>
                      </div>
                    )}
                    {!generating && error && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                        }}
                      >
                        {error}
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      📍 {locations.length} 个足迹
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(255,248,240,1) 0%, rgba(255,248,240,0) 100%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  <div style={{ padding: '18px 20px 22px' }}>
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        marginBottom: '4px',
                      }}
                    >
                      {tripTitle || '我的旅程'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} · Travel Memory Map
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-sidebar)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          flex: 1,
                        }}
                      >
                        {moodDots.length > 0 ? moodDots.map((dot, i) => (
                          <span
                            key={i}
                            title={MOOD_CONFIGS[dot.type].label}
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: dot.color,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                        )) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>暂无心情记录</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {MOOD_ORDER.filter(m => moodCounts[m] > 0).map(m => (
                          <span
                            key={m}
                            title={`${MOOD_CONFIGS[m].label} × ${moodCounts[m]}`}
                            style={{
                              fontSize: '12px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: `${MOOD_CONFIGS[m].color}25`,
                            }}
                          >
                            {MOOD_EMOJI[m]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={generateImage}
              disabled={generating}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!generating) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <HiRefresh style={{ fontSize: '16px' }} />
              {generating ? '生成中…' : '重新生成'}
            </button>
            <button
              onClick={downloadImage}
              disabled={!previewUrl}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: !previewUrl
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)',
                color: !previewUrl ? 'rgba(255,255,255,0.5)' : '#2D2A26',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: !previewUrl ? 'none' : '0 8px 24px rgba(255,107,107,0.35)',
                transition: 'all 0.15s ease',
                cursor: !previewUrl ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (previewUrl) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,107,107,0.45)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = !previewUrl ? 'none' : '0 8px 24px rgba(255,107,107,0.35)';
              }}
            >
              <HiDownload style={{ fontSize: '18px' }} />
              {previewUrl ? '💾 保存到本地' : '等待生成…'}
            </button>
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            💡 手机端请长按图片保存到相册
          </p>
        </motion.div>
      </motion.div>

      <div
        ref={renderRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '400px',
          pointerEvents: 'none',
          opacity: 0,
          visibility: 'hidden',
        }}
      />
    </>
  );
};

export default ShareCard;
