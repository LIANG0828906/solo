import React, { useEffect } from 'react';
import { Capsule } from '../types';

interface CapsuleModalProps {
  capsule: Capsule | null;
  onClose: () => void;
}

function formatTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export const CapsuleModal: React.FC<CapsuleModalProps> = ({ capsule, onClose }) => {
  useEffect(() => {
    if (!capsule) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capsule, onClose]);

  if (!capsule) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-emoji">{capsule.emoji}</div>
        <div className="modal-text">{capsule.content || '（空胶囊）'}</div>
        <div className="modal-meta">
          埋下于 {formatTime(capsule.createdAt)}
          {capsule.openedAt && <> · 开启于 {formatTime(capsule.openedAt)}</>}
          {capsule.isMine ? ' · 我的胶囊' : ' · 来自陌生人'}
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
};
