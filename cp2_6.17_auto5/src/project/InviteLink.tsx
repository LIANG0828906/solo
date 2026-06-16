import React, { useState, useCallback } from 'react';
import { useProjectStore } from './store';

const InviteLink: React.FC = () => {
  const currentProject = useProjectStore(state => state.getCurrentProject());
  const generateInviteLink = useProjectStore(state => state.generateInviteLink);
  const isReadonly = useProjectStore(state => state.isReadonly());

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!currentProject?.inviteLink) return;

    try {
      await navigator.clipboard.writeText(currentProject.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentProject]);

  const handleGenerate = useCallback(() => {
    generateInviteLink();
  }, [generateInviteLink]);

  if (isReadonly) return null;

  return (
    <div
      style={{
        backgroundColor: '#16213E',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #1e293b'
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#f1f5f9',
          marginBottom: '12px'
        }}
      >
        🔗 分享邀请链接
      </div>
      <div
        style={{
          fontSize: '12px',
          color: '#94a3b8',
          marginBottom: '16px',
          lineHeight: 1.5
        }}
      >
        将链接分享给团队成员，他们可以查看项目调色盘和规则（只读模式）
      </div>

      {currentProject?.inviteLink ? (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              backgroundColor: '#0f1525',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#e2e8f0',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {currentProject.inviteLink}
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: copied ? '#4ade80' : '#E94560',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {copied ? '已复制' : '复制链接'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#E94560',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          生成邀请链接
        </button>
      )}
    </div>
  );
};

export default InviteLink;
