import { useState } from 'react';
import { useKeyStore } from '../store/keyStore';
import type { Key } from '../types';

interface KeyCardProps {
  keyData: Key;
  onRevoke: (id: string, name: string) => void;
}

export function KeyCard({ keyData, onRevoke }: KeyCardProps) {
  const key = keyData;
  const [copied, setCopied] = useState(false);
  const decryptKey = useKeyStore((state) => state.decryptKey);
  const logUsage = useKeyStore((state) => state.logUsage);

  const isRevoked = key.status === 'revoked';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleCopy = async () => {
    if (isRevoked || copied) return;

    try {
      const plainKey = key.plainKey || decryptKey(key.encryptedKey);
      await navigator.clipboard.writeText(plainKey);
      setCopied(true);
      logUsage(key.id);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRevoke = () => {
    if (isRevoked) return;
    onRevoke(key.id, key.name);
  };

  return (
    <div className={`key-card ${isRevoked ? 'revoked' : ''}`}>
      <div className="key-card-header">
        <span className="key-name">{key.name}</span>
        <span className={`key-role ${key.role}`}>{key.role}</span>
      </div>

      <div className="key-prefix-section">
        <div className="key-label">密钥前缀</div>
        <div className="key-prefix">{key.keyPrefix}...</div>
      </div>

      {key.revealVisible && key.plainKey ? (
        <div className="key-plain">{key.plainKey}</div>
      ) : (
        <div className="key-hidden">已隐藏</div>
      )}

      <div className="key-meta">
        <span>创建于 {formatDate(key.createdAt)}</span>
        <span className="key-status">
          <span className={`status-dot ${key.status}`}></span>
          {isRevoked ? '已吊销' : '活跃'}
        </span>
      </div>

      <div className="key-actions">
        <button
          className={`btn btn-sm btn-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={isRevoked}
        >
          {copied ? '已复制' : '复制'}
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={handleRevoke}
          disabled={isRevoked}
        >
          吊销
        </button>
      </div>
    </div>
  );
}
