import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store';
import { fontEffectMap } from '@/utils/fontEffects';
import { Download, Loader, Check } from 'lucide-react';

const CANVAS_W = 800;
const CANVAS_H = 400;
const EXPORT_W = 1920;
const EXPORT_H = 960;

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 10;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#2A2A2A' : '#222222';
      ctx.fillRect(x, y, size, size);
    }
  }
}

export default function CanvasRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const opacityRef = useRef(1);
  const prevStyleRef = useRef<string>('');
  const transitionStartRef = useRef(0);
  const text = useAppStore((s) => s.text);
  const style = useAppStore((s) => s.style);
  const exportState = useAppStore((s) => s.exportState);
  const setExportState = useAppStore((s) => s.setExportState);

  useEffect(() => {
    if (prevStyleRef.current && prevStyleRef.current !== style) {
      opacityRef.current = 0;
      transitionStartRef.current = performance.now();
    }
    prevStyleRef.current = style;
  }, [style]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const effect = fontEffectMap[style];

    const render = (time: number) => {
      if (transitionStartRef.current > 0) {
        const elapsed = time - transitionStartRef.current;
        const progress = Math.min(elapsed / 300, 1);
        opacityRef.current = progress;
        if (progress >= 1) {
          transitionStartRef.current = 0;
        }
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawCheckerboard(ctx, CANVAS_W, CANVAS_H);

      if (text) {
        ctx.save();
        ctx.globalAlpha = opacityRef.current;
        effect.draw(ctx, text, CANVAS_W / 2, CANVAS_H / 2, time);
        ctx.restore();
      } else {
        ctx.save();
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#666';
        ctx.fillText('输入文字开始预览...', CANVAS_W / 2, CANVAS_H / 2);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [text, style]);

  const handleExport = useCallback(() => {
    if (exportState !== 'idle') return;

    setExportState('loading');

    requestAnimationFrame(() => {
      const offscreen = document.createElement('canvas');
      offscreen.width = EXPORT_W;
      offscreen.height = EXPORT_H;
      const offCtx = offscreen.getContext('2d')!;
      const scaleX = EXPORT_W / CANVAS_W;
      const scaleY = EXPORT_H / CANVAS_H;

      offCtx.scale(scaleX, scaleY);
      drawCheckerboard(offCtx, CANVAS_W, CANVAS_H);

      if (text) {
        const effect = fontEffectMap[style];
        offCtx.save();
        offCtx.globalAlpha = 1;
        effect.draw(offCtx, text, CANVAS_W / 2, CANVAS_H / 2, performance.now());
        offCtx.restore();
      }

      offCtx.setTransform(1, 0, 0, 1, 0, 0);

      const link = document.createElement('a');
      link.download = `font-art-${style}-${Date.now()}.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();

      setExportState('success');
      setTimeout(() => {
        setExportState('idle');
      }, 500);
    });
  }, [text, style, exportState, setExportState]);

  const getExportIcon = () => {
    switch (exportState) {
      case 'loading':
        return <Loader size={20} className="spin-animation" />;
      case 'success':
        return <Check size={20} />;
      default:
        return <Download size={20} />;
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={styles.canvas}
        />
      </div>
      <button
        onClick={handleExport}
        style={{
          ...styles.exportBtn,
          background: exportState === 'success' ? '#22C55E' : '#FF6B00',
          cursor: exportState === 'idle' ? 'pointer' : 'default',
        }}
        onMouseEnter={(e) => {
          if (exportState === 'idle') e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (exportState === 'idle') e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="导出高清PNG"
      >
        {getExportIcon()}
      </button>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  canvasContainer: {
    width: '100%',
    padding: 30,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: 8,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  exportBtn: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s, background 0.3s',
    boxShadow: '0 2px 12px rgba(255,107,0,0.4)',
    zIndex: 10,
  },
};
