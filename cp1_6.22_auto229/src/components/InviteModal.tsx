import React, { useState } from 'react';
import { X, Copy, Check, Users } from 'lucide-react';
import { Button } from './Button';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
  maxCollaborators: number;
  currentCount: number;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  inviteLink,
  maxCollaborators,
  currentCount,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '12px',
    padding: '24px',
    width: '480px',
    maxWidth: '90vw',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  };

  const linkContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  };

  const linkStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: 'var(--color-bg-tertiary)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const slotsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    marginTop: '12px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <Users size={20} />
            邀请协作者
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={infoStyle}>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            分享此链接邀请协作者加入项目
          </div>
          <div style={linkContainerStyle}>
            <div style={linkStyle}>{inviteLink}</div>
            <Button onClick={handleCopy} size="sm" variant="primary">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
          <div style={slotsStyle}>
            <Users size={14} />
            <span>
              当前协作者: {currentCount} / {maxCollaborators}
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          <p>• 通过链接加入的协作者可以查看和编辑项目</p>
          <p>• 协作者的编辑操作会实时同步到所有参与者</p>
          <p>• 最多支持 {maxCollaborators} 位协作者同时在线</p>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};
