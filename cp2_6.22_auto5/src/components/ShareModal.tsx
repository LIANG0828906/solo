import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { Snippet, Expiration } from '../types';
import { EXPIRATION_OPTIONS } from '../types';

interface ShareModalProps {
  snippet: Snippet;
  onClose: () => void;
  onUpdateExpiration: (id: string, expiration: Expiration) => void;
}

export default function ShareModal({ snippet, onClose, onUpdateExpiration }: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [selectedExpiration, setSelectedExpiration] = useState<Expiration>(() => {
    if (!snippet.expiresAt) return 'never';
    const diff = snippet.expiresAt - snippet.createdAt;
    if (diff <= 3600000) return '1h';
    if (diff <= 86400000) return '24h';
    if (diff <= 604800000) return '7d';
    return 'never';
  });

  const shareUrl = `${window.location.origin}/s/${snippet.shareId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 180,
        margin: 2,
        color: {
          dark: '#0d1117',
          light: '#ffffff',
        },
      });
    }
  }, [shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExpirationChange = (exp: Expiration) => {
    setSelectedExpiration(exp);
    onUpdateExpiration(snippet.id, exp);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          分享片段
        </div>

        <div className="share-section">
          <div className="share-label">分享链接</div>
          <div className="share-link-box">
            <input
              className="share-link-input"
              type="text"
              value={shareUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button className="btn btn-primary" onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  复制
                </>
              )}
            </button>
          </div>
        </div>

        <div className="share-section">
          <div className="share-label">二维码</div>
          <div className="qr-wrapper">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="expiration-selector">
          <div className="share-label">有效期设置</div>
          <div className="expiration-options">
            {EXPIRATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`expiration-option ${selectedExpiration === opt.value ? 'active' : ''}`}
                onClick={() => handleExpirationChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
