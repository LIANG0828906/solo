import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ArtCanvas, type ArtCanvasHandle } from '@/components/ArtCanvas';
import { Toolbar } from '@/components/Toolbar';
import { Gallery } from '@/components/Gallery';
import { PlaybackModal } from '@/components/PlaybackModal';
import { ShareDialog } from '@/components/ShareDialog';
import { Share2, Check } from 'lucide-react';
import type { Artwork, DrawPoint } from '@/types';
import { PARTICLE_MAX_LIFE } from '@/types';

function App() {
  const initArtworks = useAppStore((s) => s.initArtworks);
  const saveArtwork = useAppStore((s) => s.saveArtwork);
  const startPlayback = useAppStore((s) => s.startPlayback);
  const stopPlayback = useAppStore((s) => s.stopPlayback);
  const currentPlayback = useAppStore((s) => s.currentPlayback);
  const brushConfig = useAppStore((s) => s.brushConfig);
  const codeNotification = useAppStore((s) => s.codeNotification);
  const openShareDialog = useAppStore((s) => s.openShareDialog);

  const canvasRef = useRef<ArtCanvasHandle>(null);
  const hasContentRef = useRef(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    initArtworks();
  }, [initArtworks]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const seq = canvas.getDrawSequence();
    const duration =
      seq.length > 0 ? seq[seq.length - 1].timestamp + PARTICLE_MAX_LIFE : 1000;
    if (!hasContentRef.current || seq.length === 0) {
      return;
    }
    const fullImage = canvas.exportFullImage();
    const thumbnail = canvas.exportThumbnail(200, 150);
    saveArtwork({
      thumbnail,
      fullImage,
      drawSequence: seq as DrawPoint[],
      duration,
    });
  };

  const handleClear = () => {
    if (!hasContentRef.current) {
      canvasRef.current?.clearCanvas();
      return;
    }
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    canvasRef.current?.clearCanvas();
    hasContentRef.current = false;
    setConfirmClear(false);
  };

  const handleGallerySelect = (artwork: Artwork) => {
    startPlayback(artwork);
  };

  return (
    <div className="app-root">
      <div className="app-header">
        <div>
          <div className="app-title">墨迹幻境</div>
          <div className="app-subtitle">INK · FLUID · DREAM</div>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={openShareDialog}
            title="加载分享码"
            aria-label="加载分享码"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <ArtCanvas
          ref={canvasRef}
          brushConfig={brushConfig}
          onDrawStart={() => {
            hasContentRef.current = true;
          }}
          onDrawEnd={() => {}}
        />
      </div>

      <Toolbar
        onSave={handleSave}
        onClear={handleClear}
      />

      <Gallery onSelect={handleGallerySelect} />

      {currentPlayback && (
        <PlaybackModal
          artwork={currentPlayback}
          onClose={() => stopPlayback()}
        />
      )}

      <ShareDialog />

      {codeNotification.show && (
        <div className={`toast ${codeNotification.type}`} role="status" aria-live="polite">
          {codeNotification.type === 'save' && codeNotification.code && (
            <>
              <Check size={16} />
              <span className="toast-text">作品已保存，分享码</span>
              <span className="toast-code">{codeNotification.code}</span>
            </>
          )}
          {codeNotification.type === 'load' && codeNotification.code && (
            <>
              <Check size={16} />
              <span className="toast-text">加载成功</span>
              <span className="toast-code">{codeNotification.code}</span>
            </>
          )}
          {codeNotification.type === 'error' && (
            <>
              <span className="toast-text">分享码无效，请检查后重试</span>
            </>
          )}
        </div>
      )}

      {confirmClear && (
        <div
          className="toast"
          style={{ top: 'auto', bottom: 200, background: 'rgba(120, 50, 40, 0.7)' }}
          role="alert"
        >
          <span className="toast-text">再次点击确认清空画布</span>
        </div>
      )}
    </div>
  );
}

export default App;
