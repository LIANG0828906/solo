import React, { useState, useRef } from 'react';
import { CloudDownload } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { useToast } from './Toast';
import { exportWriting } from '../utils/exportUtils';
import { ExportFormat } from '../types';
import { ANIMATION, DARK_COLORS, LIGHT_COLORS } from '../constants';

const ExportButton: React.FC = () => {
  const { text, theme } = useEditor();
  const { showToast } = useToast();
  const [rotating, setRotating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const handleExport = (format: ExportFormat) => {
    setShowMenu(false);
    if (!text.trim()) {
      showToast('暂无内容可导出', 'error');
      return;
    }
    setRotating(true);
    try {
      const filename = exportWriting(text, format);
      setTimeout(() => {
        setRotating(false);
        showToast(`已导出：${filename}`, 'success');
      }, 500);
    } catch (err) {
      setRotating(false);
      showToast('导出失败，请重试', 'error');
    }
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(v => !v)}
        title="导出文件"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme === 'dark' ? '#6366F1' : '#F59E0B',
          color: '#FFFFFF',
          boxShadow: `0 4px 16px ${theme === 'dark' ? 'rgba(99,102,241,0.4)' : 'rgba(245,158,11,0.4)'}`,
          transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        }}
        onMouseLeave={e => {
          if (!rotating) e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }}
      >
        <div
          style={{
            transform: rotating ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: rotating ? `transform ${ANIMATION.exportRotate}ms cubic-bezier(0.34, 1.56, 0.64, 1)` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloudDownload size={18} strokeWidth={2} />
        </div>
      </button>

      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              minWidth: '140px',
              padding: '6px',
              borderRadius: '10px',
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              zIndex: 100,
              animation: 'fadeInUp 0.2s ease',
            }}
          >
            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            {[
              { format: 'txt' as ExportFormat, label: '导出为 TXT', desc: '纯文本格式' },
              { format: 'md' as ExportFormat, label: '导出为 Markdown', desc: '.md 格式' },
            ].map(item => (
              <button
                key={item.format}
                onClick={() => handleExport(item.format)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  color: colors.text,
                  fontSize: '13px',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.5 }}>{item.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
