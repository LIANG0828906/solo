import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EmotionPanel } from './modules/EmotionPanel';
import { ColorSwatchBar } from './modules/ColorSwatchBar';
import { CanvasRenderer } from './modules/CanvasRenderer';
import { mixEmotionColors, hslToHex } from './utils/colorMapper';
import { generateShortLink, getHashFromUrl, updateUrlHash } from './utils/hashShare';
import type { EmotionValues, HSL } from './utils/colorMapper';

const DEFAULT_EMOTIONS: EmotionValues = {
  happy: 0.5,
  sad: 0.3,
  angry: 0.2,
  calm: 0.4,
};

const App: React.FC = () => {
  const [emotions, setEmotions] = useState<EmotionValues>(DEFAULT_EMOTIONS);
  const [mixedColor, setMixedColor] = useState<HSL>({ h: 0, s: 0, l: 75 });
  const [themeColor, setThemeColor] = useState('#888888');
  const [fps, setFps] = useState(60);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => {
    const saved = getHashFromUrl();
    if (saved) {
      setEmotions(saved);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new CanvasRenderer(canvasRef.current, {
      particleConfig: { count: 50 },
    });
    rendererRef.current = renderer;

    renderer.setOnFpsChange((currentFps) => {
      setFps(currentFps);
    });

    renderer.setOnColorChange((hex) => {
      setThemeColor(hex);
    });

    renderer.setEmotions(emotions);
    renderer.start();

    const handleResize = () => {
      renderer.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setEmotions(emotions);
    }
    const mixed = mixEmotionColors(emotions);
    setMixedColor(mixed);
    setThemeColor(hslToHex(mixed));
  }, [emotions]);

  const handleEmotionsChange = useCallback((newEmotions: EmotionValues) => {
    setEmotions(newEmotions);
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rendererRef.current.setMousePosition(x, y);
  }, []);

  const handleCanvasMouseEnter = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.setMouseInCanvas(true);
    }
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.setMouseInCanvas(false);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.getCanvasDataUrl();
    const link = document.createElement('a');
    link.download = `情绪壁纸_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const handleShare = useCallback(() => {
    updateUrlHash(emotions);
    const shortLink = generateShortLink(emotions);
    setShareLink(shortLink);
    setShowShareModal(true);
    setLinkCopied(false);
  }, [emotions]);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [shareLink]);

  return (
    <div className="app-container" style={{ '--theme-color': themeColor } as React.CSSProperties}>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="main-canvas"
          onMouseMove={handleCanvasMouseMove}
          onMouseEnter={handleCanvasMouseEnter}
          onMouseLeave={handleCanvasMouseLeave}
        />
        
        <div className="fps-badge">
          {fps} FPS
        </div>

        <div className="left-panel">
          <EmotionPanel
            emotions={emotions}
            onChange={handleEmotionsChange}
            themeColor={themeColor}
          />
        </div>

        <div className="bottom-bar">
          <ColorSwatchBar mixedColor={mixedColor} themeColor={themeColor} />
          
          <div className="action-buttons">
            <button className="action-button save-button" onClick={handleSave}>
              <span className="button-icon">💾</span>
              <span>保存壁纸</span>
            </button>
            <button className="action-button share-button" onClick={handleShare}>
              <span className="button-icon">🔗</span>
              <span>分享</span>
            </button>
          </div>
        </div>
      </div>

      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>分享你的情绪色卡</h3>
            <p className="share-desc">复制链接，让朋友看到你的心情</p>
            <div className="share-link-input">
              <input type="text" value={shareLink} readOnly />
              <button onClick={copyShareLink} className="copy-link-button">
                {linkCopied ? (
                  <>
                    <span className="copy-check">✓</span>
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
