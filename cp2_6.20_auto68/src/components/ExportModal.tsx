import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { X, Download, Link2, Copy, Check } from 'lucide-react';
import '@/styles/ExportModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportModal = ({ isOpen, onClose, targetRef }: ExportModalProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen && targetRef.current) {
      setIsLoading(true);
      setPreviewUrl(null);
      html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      })
        .then((canvas) => {
          canvasRef.current = canvas;
          setPreviewUrl(canvas.toDataURL('image/png'));
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, targetRef]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `timeline-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${Date.now()}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="export-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="export-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="export-modal-header">
              <h3>导出时间线</h3>
              <button className="close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="export-preview">
              {isLoading ? (
                <div className="loading-spinner" />
              ) : previewUrl ? (
                <img src={previewUrl} alt="导出预览" />
              ) : (
                <p>预览生成失败</p>
              )}
            </div>

            <div className="export-actions">
              <motion.button
                className="download-btn"
                onClick={handleDownload}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!previewUrl}
              >
                <Download size={16} />
                <span>下载</span>
              </motion.button>

              <motion.button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>复制分享链接</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
