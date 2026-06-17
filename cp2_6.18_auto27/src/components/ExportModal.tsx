/**
 * ExportModal 组件：导出 CSS 模态框
 *
 * 模块职责：
 * - 展示当前令牌生成的 CSS 自定义属性代码
 * - 提供一键复制功能
 * - 显示复制成功提示
 *
 * 调用关系：
 * - 读取 store：调用 exportCSS() 工具函数，后者从 store 读取令牌
 * - 由 Toolbar 组件的导出按钮触发显示
 */

import { useState, useCallback } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { exportCSS } from '@/utils/exportCSS';

export default function ExportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const cssCode = open ? exportCSS() : '';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [cssCode]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>导出 CSS 自定义属性</h2>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <pre className="code-block"><code>{cssCode}</code></pre>
        </div>
        <div className="modal-footer">
          <button
            className={`copy-btn ${copied ? 'copied show-toast' : ''}`}
            onClick={handleCopy}
            type="button"
          >
            {copied ? (
              <>
                <Check size={14} /> 已复制
              </>
            ) : (
              <>
                <Copy size={14} /> 复制代码
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
