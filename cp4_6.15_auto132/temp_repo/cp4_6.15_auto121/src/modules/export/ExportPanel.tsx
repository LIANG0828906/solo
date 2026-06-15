import React, { useEffect, useRef, useState } from 'react';
import {
  PixelArray,
  CANVAS_SIZE,
  generateSpriteSheet,
  renderPixelsToCanvas,
} from '../../utils/pixelUtils';

interface ExportPanelProps {
  frames: PixelArray[];
  frameInterval: number;
  onClose: () => void;
}

const PREVIEW_MULT = 6;

const ExportPanel: React.FC<ExportPanelProps> = ({ frames, frameInterval, onClose }) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [spriteDataUrl, setSpriteDataUrl] = useState<string>('');
  const [jsonConfig, setJsonConfig] = useState<string>('');

  const buildExportData = () => {
    const { canvas, frameInfo } = generateSpriteSheet(frames, 1);
    const dataUrl = canvas.toDataURL('image/png');
    setSpriteDataUrl(dataUrl);

    const config = {
      meta: {
        app: 'Pixel RPG Character Maker',
        exportDate: new Date().toISOString(),
        frameCount: frames.length,
        frameSize: { width: CANVAS_SIZE, height: CANVAS_SIZE },
        separatorWidth: 1,
        totalWidth: canvas.width,
        totalHeight: canvas.height,
      },
      animation: {
        name: 'walk_cycle',
        frameInterval: frameInterval,
        loop: true,
      },
      frames: frameInfo.map((info, idx) => ({
        index: idx,
        name: `frame_${String(idx + 1).padStart(3, '0')}`,
        position: { x: info.x, y: info.y },
        size: { width: info.width, height: info.height },
        duration: frameInterval,
      })),
    };
    setJsonConfig(JSON.stringify(config, null, 2));
  };

  useEffect(() => {
    buildExportData();
  }, [frames, frameInterval]);

  useEffect(() => {
    const preview = previewCanvasRef.current;
    if (!preview || frames.length === 0) return;
    const ctx = preview.getContext('2d');
    if (!ctx) return;

    const frameSize = CANVAS_SIZE * PREVIEW_MULT;
    const sep = PREVIEW_MULT;
    const totalW = frames.length * frameSize + (frames.length - 1) * sep;
    preview.width = totalW;
    preview.height = frameSize;

    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(0, 0, totalW, frameSize);

    for (let i = 0; i < frames.length; i++) {
      const offsetX = i * (frameSize + sep);
      if (i > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(offsetX - sep, 0, sep, frameSize);
      }
      renderPixelsToCanvas(ctx, frames[i], PREVIEW_MULT, offsetX, 0);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX + 0.5, 0.5, frameSize - 1, frameSize - 1);
    }
  }, [frames]);

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmExport = async () => {
    setIsExporting(true);
    try {
      const ts = Date.now();
      await new Promise((r) => setTimeout(r, 50));

      downloadFile(spriteDataUrl, `spritesheet_${ts}.png`);

      const jsonBlob = new Blob([jsonConfig], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      downloadFile(jsonUrl, `spritesheet_config_${ts}.json`);
      setTimeout(() => URL.revokeObjectURL(jsonUrl), 1000);

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 300);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>导出精灵表</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.previewSection}>
            <div style={styles.sectionLabel}>预览</div>
            <div style={styles.previewWrapper}>
              <canvas
                ref={previewCanvasRef}
                style={styles.previewCanvas}
              />
            </div>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>帧数</div>
              <div style={styles.infoValue}>{frames.length}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>单帧尺寸</div>
              <div style={styles.infoValue}>
                {CANVAS_SIZE} × {CANVAS_SIZE}
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>总宽度</div>
              <div style={styles.infoValue}>
                {frames.length * CANVAS_SIZE + (frames.length - 1)}px
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>播放间隔</div>
              <div style={styles.infoValue}>{frameInterval}ms</div>
            </div>
          </div>

          <div style={styles.fileList}>
            <div style={styles.fileItem}>
              <span style={styles.fileIcon}>🖼</span>
              <div>
                <div style={styles.fileName}>spritesheet_xxx.png</div>
                <div style={styles.fileDesc}>横向精灵表，含1px白色分隔线</div>
              </div>
            </div>
            <div style={styles.fileItem}>
              <span style={styles.fileIcon}>📄</span>
              <div>
                <div style={styles.fileName}>spritesheet_config_xxx.json</div>
                <div style={styles.fileDesc}>每帧位置、尺寸及播放配置</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            style={{
              ...styles.confirmBtn,
              ...(isExporting ? styles.confirmBtnDisabled : {}),
            }}
            onClick={handleConfirmExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '确认导出并下载'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    width: 680,
    maxWidth: '92vw',
    maxHeight: '88vh',
    background:
      'linear-gradient(145deg, rgba(42, 42, 52, 0.92) 0%, rgba(32, 32, 42, 0.95) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: 14,
    boxShadow:
      '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 212, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
    background:
      'linear-gradient(90deg, rgba(0, 212, 255, 0.06) 0%, transparent 100%)',
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#e8e8e8',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '22px 24px',
  },
  previewSection: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#00d4ff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: "'JetBrains Mono', monospace",
  },
  previewWrapper: {
    background:
      'repeating-conic-gradient(#181820 0% 25%, #1c1c24 0% 50%) 0 0 / 16px 16px',
    borderRadius: 8,
    padding: 16,
    border: '1px solid rgba(0, 212, 255, 0.2)',
    overflowX: 'auto',
    maxWidth: '100%',
  },
  previewCanvas: {
    display: 'block',
    // @ts-ignore - cross-browser pixel rendering
    imageRendering: 'pixelated',
    borderRadius: 4,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    marginBottom: 22,
  },
  infoCard: {
    padding: '12px 14px',
    borderRadius: 8,
    background: 'rgba(20, 20, 28, 0.5)',
    border: '1px solid rgba(0, 212, 255, 0.12)',
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: "'JetBrains Mono', monospace",
  },
  infoValue: {
    fontSize: 15,
    color: '#00d4ff',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(20, 20, 28, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  fileIcon: {
    fontSize: 22,
  },
  fileName: {
    fontSize: 13,
    color: '#ddd',
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 2,
  },
  fileDesc: {
    fontSize: 11,
    color: '#666',
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: '1px solid rgba(0, 212, 255, 0.12)',
    background: 'rgba(20, 20, 28, 0.4)',
  },
  cancelBtn: {
    padding: '10px 22px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  },
  confirmBtn: {
    padding: '10px 24px',
    borderRadius: 6,
    border: '1px solid #00d4ff',
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(0, 212, 255, 0.08))',
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
    boxShadow: '0 0 14px rgba(0, 212, 255, 0.3)',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default ExportPanel;
