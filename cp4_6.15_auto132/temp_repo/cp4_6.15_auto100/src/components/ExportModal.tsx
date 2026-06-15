import { useState, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

interface ExportModalProps {
  onClose: () => void;
}

const ExportModal = ({ onClose }: ExportModalProps) => {
  const exportToJSON = useEditorStore((state) => state.exportToJSON);
  const [jsonContent, setJsonContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJsonContent(exportToJSON());
  }, [exportToJSON]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bullet-patterns.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#121928',
          borderRadius: 12,
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          border: '1px solid #1e2a45',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e2a45',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              color: '#00d4ff',
              fontFamily: "'Oxanium', sans-serif",
              fontWeight: 600,
            }}
          >
            导出 JSON 配置
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5a6a8a',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#0a0e17',
              border: '1px solid #1e2a45',
              borderRadius: 8,
              padding: 16,
              maxHeight: 350,
              overflow: 'auto',
              fontFamily: "'Consolas', 'Monaco', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: '#e0e8f5',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {jsonContent}
            </pre>
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px 20px',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleDownload}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#00d4ff',
              border: '1px solid #00d4ff',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: "'Oxanium', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              transition: 'all 0.3s ease-out',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            下载文件
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '10px 20px',
              background: copied ? '#00ff88' : '#00d4ff',
              color: '#0a0e17',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: "'Oxanium', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              transition: 'all 0.3s ease-out',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {copied ? '✓ 已复制' : '复制到剪贴板'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ExportModal;
