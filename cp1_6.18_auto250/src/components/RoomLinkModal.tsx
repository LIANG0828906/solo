import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  roomId: string;
  shareUrl: string;
  onClose: () => void;
}

export default function RoomLinkModal({ roomId, shareUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goToRoom = () => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon">🎉</div>
        <h2 className="modal-title">房间创建成功！</h2>
        <p className="modal-desc">
          分享下方链接给乐迷，让大家参与投票吧
        </p>

        <div className="link-box">
          <div className="link-input-wrapper">
            <input
              type="text"
              className="link-input"
              value={shareUrl}
              readOnly
            />
          </div>
          <button
            className={`copy-btn ${copied ? 'is-copied' : ''}`}
            onClick={copyLink}
          >
            {copied ? '✓ 已复制' : '📋 复制链接'}
          </button>
        </div>

        <div className="room-id-box">
          <span className="room-id-label">房间ID：</span>
          <span className="room-id-value">{roomId}</span>
        </div>

        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>
            稍后再说
          </button>
          <button className="gradient-btn enter-btn" onClick={goToRoom}>
            进入房间 →
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .modal-content {
            width: 100%;
            max-width: 480px;
            padding: 36px 32px;
            text-align: center;
            position: relative;
          }
          .modal-icon {
            font-size: 3rem;
            margin-bottom: 12px;
            animation: pulse-scale 1.5s ease-in-out infinite;
          }
          .modal-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
          }
          .modal-desc {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-bottom: 24px;
          }
          .link-box {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
          }
          .link-input-wrapper {
            flex: 1;
            min-width: 0;
          }
          .link-input {
            width: 100%;
            padding: 12px 14px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: var(--text-primary);
            font-size: 0.85rem;
            font-family: 'Courier New', monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .copy-btn {
            padding: 0 18px;
            border-radius: 10px;
            background: rgba(108, 99, 255, 0.18);
            border: 1px solid rgba(108, 99, 255, 0.4);
            color: var(--btn-gradient-start);
            font-weight: 600;
            font-size: 0.85rem;
            white-space: nowrap;
            transition: all 0.2s ease;
          }
          .copy-btn:hover {
            background: rgba(108, 99, 255, 0.28);
            transform: translateY(-2px);
          }
          .copy-btn.is-copied {
            background: rgba(46, 204, 113, 0.2);
            border-color: rgba(46, 204, 113, 0.5);
            color: var(--time-green);
          }
          .room-id-box {
            display: flex;
            justify-content: center;
            gap: 6px;
            padding: 10px 14px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.04);
            font-size: 0.82rem;
            margin-bottom: 28px;
          }
          .room-id-label {
            color: var(--text-tertiary);
          }
          .room-id-value {
            color: var(--text-secondary);
            font-family: 'Courier New', monospace;
            font-weight: 600;
          }
          .modal-actions {
            display: flex;
            gap: 12px;
          }
          .ghost-btn {
            flex: 1;
            padding: 12px 20px;
            border-radius: 10px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: var(--text-secondary);
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .ghost-btn:hover {
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-primary);
          }
          .enter-btn {
            flex: 1;
            padding: 12px 20px;
          }
          @media (max-width: 767px) {
            .modal-content {
              padding: 28px 20px;
            }
            .link-box {
              flex-direction: column;
            }
            .modal-actions {
              flex-direction: column-reverse;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
