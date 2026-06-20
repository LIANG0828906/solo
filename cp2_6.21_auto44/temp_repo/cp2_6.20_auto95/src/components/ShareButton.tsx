import React, { useState, useCallback } from 'react';
import { useParticleStore } from '../particleStore';
import { copyToClipboard } from '../utils/urlUtils';

export const ShareButton: React.FC = () => {
  const encodeToURL = useParticleStore((state) => state.encodeToURL);
  const [showToast, setShowToast] = useState(false);

  const handleShare = useCallback(async () => {
    const url = encodeToURL();
    const success = await copyToClipboard(url);
    
    if (success) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    }
  }, [encodeToURL]);

  return (
    <>
      <button
        className="share-button"
        onClick={handleShare}
        title="分享当前配置"
      >
        <svg viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      
      {showToast && (
        <div className="toast">
          链接已复制到剪贴板 ✓
        </div>
      )}
    </>
  );
};
