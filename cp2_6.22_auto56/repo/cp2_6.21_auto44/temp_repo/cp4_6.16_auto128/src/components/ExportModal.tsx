import { useState } from 'react';
import { X, FileText, FileCode, Link, Copy, Check } from 'lucide-react';
import { exportAsTxt, exportAsMarkdown, generateShareLink } from '@/utils/export';
import { COLORS } from '@/utils/constants';

interface ExportModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

const ExportModal = ({ title, content, onClose }: ExportModalProps) => {
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleExportTxt = () => {
    exportAsTxt(title, content);
  };

  const handleExportMarkdown = () => {
    exportAsMarkdown(title, content);
  };

  const handleGenerateLink = () => {
    const link = generateShareLink(title, content);
    setShareLink(link);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.bronze,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontFamily: 'inherit',
  };

  const buttonHoverStyle = {
    backgroundColor: COLORS.bronzeHover,
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.woodDark,
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <X size={20} />
        </button>

        <h3
          style={{
            color: '#fff',
            fontSize: '18px',
            marginBottom: '20px',
            paddingRight: '32px',
          }}
        >
          导出与分享
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleExportTxt}
            style={buttonStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.bronze)}
          >
            <FileText size={18} />
            导出为 TXT 文件
          </button>

          <button
            onClick={handleExportMarkdown}
            style={buttonStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.bronze)}
          >
            <FileCode size={18} />
            导出为 Markdown 文件
          </button>

          <button
            onClick={handleGenerateLink}
            style={buttonStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.bronze)}
          >
            <Link size={18} />
            生成分享链接
          </button>

          {shareLink && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    backgroundColor: copied ? '#4CAF50' : COLORS.bronze,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) e.currentTarget.style.backgroundColor = COLORS.bronzeHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) e.currentTarget.style.backgroundColor = COLORS.bronze;
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              {copied && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#4CAF50',
                    textAlign: 'center',
                  }}
                >
                  复制成功！
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
