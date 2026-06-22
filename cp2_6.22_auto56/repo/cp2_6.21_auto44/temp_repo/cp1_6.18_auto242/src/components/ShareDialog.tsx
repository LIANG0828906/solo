import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X } from 'lucide-react';

export function ShareDialog() {
  const open = useAppStore((s) => s.shareDialogOpen);
  const input = useAppStore((s) => s.shareCodeInput);
  const setInput = useAppStore((s) => s.setShareCodeInput);
  const submit = useAppStore((s) => s.submitShareCode);
  const close = useAppStore((s) => s.closeShareDialog);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submit, close]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={close} role="dialog" aria-modal="true" aria-label="加载分享作品">
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={close} aria-label="关闭" style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>
        <div className="share-title">输入分享码</div>
        <div className="share-desc">输入他人分享的6位代码<br />即可加载并复现完整创作过程</div>
        <div className="share-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="share-input"
            value={input}
            maxLength={6}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ABC123"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="share-input-hint">不区分大小写 · 排除 0 O 1 I 等易混字符</div>
        </div>
        <div className="share-actions">
          <button className="share-btn ghost" onClick={close}>
            取消
          </button>
          <button className="share-btn primary" onClick={submit}>
            加载作品
          </button>
        </div>
      </div>
    </div>
  );
}
