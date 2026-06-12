import React, { useState } from 'react';
import { eventBus } from '../eventBus';

interface SummaryCardProps {
  label: string;
  value: string;
  maxChars?: number;
  onChange: (val: string) => void;
}

const CopyIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  maxChars,
  onChange,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      eventBus.emit('showToast', { message: `已复制${label}到剪贴板` });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      eventBus.emit('showToast', { message: '复制失败，请手动复制' });
    }
  };

  const charCount = [...value].length;
  const isOverLimit = maxChars !== undefined && charCount > maxChars;

  return (
    <div className="summary-card">
      <div className="card-header">
        <span className="card-label">{label}</span>
        <div className="card-meta">
          <span
            className="card-char-count"
            style={{ color: isOverLimit ? '#e74c3c' : '#999' }}
          >
            {charCount}{maxChars !== undefined ? `/${maxChars}` : ''}字
          </span>
          <button
            className="copy-btn"
            onClick={handleCopy}
            title={copied ? '已复制' : '复制'}
            style={{
              background: copied ? '#4a90d9' : '#fff',
              color: copied ? '#fff' : 'inherit',
              borderColor: copied ? '#4a90d9' : '#ddd',
            }}
          >
            <CopyIcon />
          </button>
        </div>
      </div>
      <textarea
        className="card-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`在此处编辑${label}内容...`}
      />
    </div>
  );
};
