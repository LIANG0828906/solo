import React, { useState, useEffect, useRef } from 'react';
import { useVoteStore } from './store';

interface InviteCodeProps {
  onDismiss?: () => void;
  onNext?: () => void;
}

export const InviteCode: React.FC<InviteCodeProps> = ({ onDismiss, onNext }) => {
  const { currentVote } = useVoteStore();
  const [copied, setCopied] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [planeFly, setPlaneFly] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentVote?.inviteCode) return;

    try {
      navigator.clipboard.writeText(currentVote.inviteCode);
      setCopied(true);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentVote.inviteCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {
        setCopied(false);
      }
      document.body.removeChild(textarea);
    }

    setShowAnimation(true);
    setPlaneFly(true);

    timeoutRef.current = window.setTimeout(() => {
      setPlaneFly(false);
    }, 1400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentVote?.inviteCode]);

  const handleCopy = async () => {
    if (!currentVote) return;
    try {
      await navigator.clipboard.writeText(currentVote.inviteCode);
      setCopied(true);
      setPlaneFly(true);
      setTimeout(() => setPlaneFly(false), 1400);
    } catch {
      console.warn('Clipboard copy failed');
    }
  };

  if (!currentVote) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={showAnimation ? 'animate-bounce-in' : ''}
        style={{
          width: '440px',
          maxWidth: '90%',
          background: '#fff',
          borderRadius: '20px',
          padding: '36px 32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {planeFly && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '60px',
              fontSize: '36px',
              animation: 'paperPlaneFly 1.4s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            ✈️
          </div>
        )}

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '30px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)'
          }}
        >
          🎉
        </div>

        <h2 style={{
          textAlign: 'center',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '8px',
          color: '#1a1a1a'
        }}>
          投票创建成功！
        </h2>

        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
          marginBottom: '24px',
          lineHeight: 1.6
        }}>
          邀请码已自动复制到剪贴板，<br />
          分享给朋友一起参与投票吧
        </p>

        <div
          onClick={handleCopy}
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '14px',
            padding: '20px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 200ms',
            border: '2px dashed #d0d7de',
            position: 'relative',
            marginBottom: '20px'
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#888',
            marginBottom: '8px',
            fontWeight: 500
          }}>
            专属邀请码
          </div>
          <div style={{
            fontSize: '42px',
            fontWeight: 800,
            letterSpacing: '6px',
            color: '#1a1a1a',
            fontFamily: '"SF Mono", "Consolas", monospace'
          }}>
            {currentVote.inviteCode}
          </div>
          {copied && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                padding: '4px 10px',
                background: '#52c41a',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                animation: 'fadeInUp 0.3s ease-out'
              }}
            >
              ✓ 已复制
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <button
            onClick={onDismiss}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#f5f5f5',
              color: '#555',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 200ms',
              cursor: 'pointer'
            }}
          >
            稍后再说
          </button>
          <button
            onClick={onNext}
            style={{
              flex: 2,
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 200ms',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
            }}
          >
            进入投票 →
          </button>
        </div>

        <div style={{
          fontSize: '12px',
          color: '#aaa',
          textAlign: 'center'
        }}>
          提示：打开新标签页输入邀请码即可模拟多人协作
        </div>
      </div>
    </div>
  );
};

export default InviteCode;
