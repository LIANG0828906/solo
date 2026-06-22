import React from 'react';
import { X, Copy, Check, Link2, QrCode } from 'lucide-react';
import type { ShareInfo } from '../types';
import './ShareModal.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareInfo: ShareInfo | null;
  loading?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareInfo,
  loading = false
}) => {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (!shareInfo) return;
    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={handleOverlayClick}>
      <div className="share-modal">
        <div className="share-modal-header">
          <h3 className="share-modal-title">分享食谱</h3>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="share-modal-body">
          <div className="share-link-section">
            <div className="section-icon">
              <Link2 size={20} />
            </div>
            <div className="section-content">
              <label className="section-label">分享链接</label>
              <div className="link-input-wrapper">
                <input
                  type="text"
                  readOnly
                  value={loading ? '加载中...' : shareInfo?.shareUrl || ''}
                  className="link-input"
                />
                <button
                  className="copy-btn"
                  onClick={handleCopy}
                  disabled={loading || !shareInfo}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="share-qr-section">
            <div className="section-icon">
              <QrCode size={20} />
            </div>
            <div className="section-content">
              <label className="section-label">扫码分享</label>
              <div className="qr-code-wrapper">
                {loading ? (
                  <div className="qr-placeholder">生成中...</div>
                ) : shareInfo?.qrCodeDataUrl ? (
                  <img
                    src={shareInfo.qrCodeDataUrl}
                    alt="分享二维码"
                    className="qr-code"
                  />
                ) : (
                  <div className="qr-placeholder">暂无二维码</div>
                )}
              </div>
              <p className="qr-hint">使用手机扫码查看食谱</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
