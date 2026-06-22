import { useState, useMemo } from 'react';
import { useAnimationStore } from '@/stores/animationStore';
import { generateAllKeyframes } from '@/utils/cssGenerator';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const { elements, keyframes, timeline } = useAnimationStore();
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    if (keyframes.length === 0) {
      return '/* 暂无关键帧数据，请先在时间轴上添加关键帧 */';
    }
    return generateAllKeyframes(elements, keyframes, timeline.duration);
  }, [elements, keyframes, timeline.duration]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">导出 CSS 代码</h2>
          <button
            className="modal-close"
            onClick={onClose}
            title="关闭"
          >
            ×
          </button>
        </div>

        <div className="code-display">{code}</div>

        <div className="modal-actions">
          {copied ? (
            <span className="copy-success">✓ 已复制到剪贴板</span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              代码可直接复制使用于项目中
            </span>
          )}
          <button
            className="btn-copy"
            onClick={handleCopy}
            disabled={keyframes.length === 0}
            style={{ opacity: keyframes.length === 0 ? 0.5 : 1 }}
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
