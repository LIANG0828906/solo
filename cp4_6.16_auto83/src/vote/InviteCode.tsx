import React, { useState, useEffect } from 'react';
import { useVoteStore } from './store';

interface InviteCodeProps {
  showNotification?: boolean;
  onAnimationComplete?: () => void;
}

export const InviteCode: React.FC<InviteCodeProps> = ({ showNotification = false, onAnimationComplete }) => {
  const { currentVote, generateInviteCode } = useVoteStore();
  const [copied, setCopied] = useState(false);
  const [showPlane, setShowPlane] = useState(false);
  const [displayCode, setDisplayCode] = useState<string>('');

  useEffect(() => {
    if (currentVote?.inviteCode) {
      setDisplayCode(currentVote.inviteCode);
    }
  }, [currentVote]);

  useEffect(() => {
    if (showNotification && displayCode) {
      copyToClipboard();
      setShowPlane(true);
      const timer = setTimeout(() => {
        setShowPlane(false);
        onAnimationComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, displayCode, onAnimationComplete]);

  const copyToClipboard = async () => {
    if (!displayCode) return;
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = displayCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {showPlane && (
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'paperPlaneFly 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            pointerEvents: 'none',
            zIndex: 1000,
            fontSize: '32px'
          }}
        >
          ✈️
        </div>
      )}

      {showNotification && displayCode && (
        <div
          className="animate-fade-in-up"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 24px',
            background: '#fff',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 2000,
            border: '1px solid #f0f0f0'
          }}
        >
          <span style={{ fontSize: '20px' }}>🎉</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', color: '#888' }}>投票创建成功！邀请码已复制</span>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#1890ff',
                letterSpacing: '4px'
              }}
            >
              {displayCode}
            </span>
          </div>
          <span style={{ fontSize: '18px', color: '#52c41a' }}>✓</span>
        </div>
      )}

      {!showNotification && displayCode && (
        <div
          onClick={copyToClipboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            background: '#f8f9fa',
            borderRadius: '12px',
            cursor: 'pointer',
            border: copied ? '2px solid #52c41a' : '2px solid transparent',
            transition: 'all 200ms'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Invite Code
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#1a1a1a',
                letterSpacing: '6px',
                fontFamily: 'monospace'
              }}
            >
              {displayCode}
            </span>
          </div>
          <button
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: copied ? '#f6ffed' : '#e6f4ff',
              color: copied ? '#52c41a' : '#1890ff',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 200ms'
            }}
          >
            {copied ? '已复制 ✓' : '点击复制'}
          </button>
        </div>
      )}

      {!displayCode && !showNotification && (
        <div
          style={{
            fontSize: '13px',
            color: '#999',
            padding: '8px 16px'
          }}
        >
          暂无邀请码
        </div>
      )}
    </div>
  );
};

export default InviteCode;
export { generateInviteCode as generateCode };
