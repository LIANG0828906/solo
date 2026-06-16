import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '../store';

interface ExportModalProps {
  onClose: () => void;
}

const EXPORT_WIDTH = 800;
const EXPORT_HEIGHT = 1200;
const DPI = 300;
const SCALE = DPI / 72;

function ExportModal({ onClose }: ExportModalProps) {
  const { elements } = usePosterStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    generatePoster();
  }, []);

  const generatePoster = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = EXPORT_WIDTH * SCALE;
    canvas.height = EXPORT_HEIGHT * SCALE;
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      for (const element of sortedElements) {
        try {
          const img = await loadImage(element.imageUrl);
          const w = element.width * element.scale;
          const h = element.height * element.scale;
          const x = element.x;
          const y = element.y;

          ctx.save();
          if (element.flipped) {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, w, h);
          } else {
            ctx.drawImage(img, x, y, w, h);
          }
          ctx.restore();
        } catch {
          ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
          ctx.fillRect(
            element.x,
            element.y,
            element.width * element.scale,
            element.height * element.scale
          );
          ctx.fillStyle = '#666';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            element.name,
            element.x + (element.width * element.scale) / 2,
            element.y + (element.height * element.scale) / 2
          );
        }
      }

      const url = canvas.toDataURL('image/png');
      setPreviewUrl(url);
      setIsGenerating(false);
    } catch (error) {
      console.error('生成海报失败:', error);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `电影海报_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>导出高清海报</h3>
          <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={styles.previewContainer}>
          {isGenerating ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>正在生成高清预览...</span>
            </div>
          ) : (
            <img src={previewUrl} alt="海报预览" style={styles.previewImage} />
          )}
        </div>

        <div style={styles.infoRow}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>尺寸</span>
            <span style={styles.infoValue}>{EXPORT_WIDTH} × {EXPORT_HEIGHT} px</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>分辨率</span>
            <span style={styles.infoValue}>{DPI} DPI</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>元素数量</span>
            <span style={styles.infoValue}>{elements.length}</span>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            style={{
              ...styles.downloadBtn,
              ...(isGenerating ? styles.downloadBtnDisabled : {}),
            }}
            onClick={handleDownload}
            disabled={isGenerating}
          >
            下载 PNG
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: '16px',
    width: '500px',
    maxWidth: '90vw',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '28px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 8px',
  },
  previewContainer: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(212, 175, 55, 0.2)',
    borderTopColor: '#D4AF37',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoValue: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: 500,
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 24px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  downloadBtn: {
    flex: 1,
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#D4AF37',
    color: '#2C0E0E',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  downloadBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default ExportModal;
