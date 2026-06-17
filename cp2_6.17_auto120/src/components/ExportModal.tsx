import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useAnimationStore } from '../store/useAnimationStore';

export const ExportModal: React.FC = () => {
  const isOpen = useAnimationStore((s) => s.isExportModalOpen);
  const setOpen = useAnimationStore((s) => s.setExportModalOpen);
  const generateCSS = useAnimationStore((s) => s.generateCSS);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  const cssCode = generateCSS();

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCopyFailed(false);
    }
  }, [isOpen]);

  const fallbackCopy = (text: string): boolean => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    setCopyFailed(false);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(cssCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // clipboard API failed, try fallback
    }

    const success = fallbackCopy(cssCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        style={{
          width: 600,
          height: 400,
          maxWidth: '90vw',
          maxHeight: '80vh',
          backgroundColor: '#1E1E2E',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#E0E0E0', margin: 0 }}>导出 CSS 代码</h2>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#E0E0E0',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2B2B3D')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={codeRef}
          style={{
            flex: 1,
            backgroundColor: '#121220',
            borderRadius: 8,
            padding: 16,
            overflow: 'auto',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            color: '#E0E0E0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {cssCode}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #3A3A5C',
              backgroundColor: 'transparent',
              color: '#E0E0E0',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2B2B3D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            关闭
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: copyFailed ? '#f44336' : copied ? '#4CAF50' : '#2196F3',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              if (!copied && !copyFailed) e.currentTarget.style.backgroundColor = '#1976D2';
            }}
            onMouseLeave={(e) => {
              if (!copied && !copyFailed) e.currentTarget.style.backgroundColor = '#2196F3';
            }}
          >
            {copyFailed ? <X size={16} /> : copied ? <Check size={16} /> : <Copy size={16} />}
            {copyFailed ? '复制失败，请手动选择' : copied ? '已复制' : '复制代码'}
          </button>
        </div>
      </div>
    </div>
  );
};
