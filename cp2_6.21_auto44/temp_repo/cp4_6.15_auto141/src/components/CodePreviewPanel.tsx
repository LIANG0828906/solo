import React, { useState, useEffect, useRef } from 'react';
import type { LayoutParams } from '../modules/LayoutEngine';
import { CodeExporter } from '../modules/CodeExporter';

interface CodePreviewPanelProps {
  params: LayoutParams;
  css: string;
  isMobile: boolean;
}

const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({ params, css, isMobile }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const codeExporterRef = useRef(new CodeExporter());

  useEffect(() => {
    const fullHtml = codeExporterRef.current.generateFullHTML(params, css);
    setHtmlCode(fullHtml);
  }, [params, css]);

  const handleCopy = async () => {
    const success = await codeExporterRef.current.copyToClipboard(htmlCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = () => {
    codeExporterRef.current.downloadHTML(params, css);
  };

  const panelStyle: React.CSSProperties = isMobile ? {
    display: 'none'
  } : {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 380,
    backgroundColor: 'white',
    borderLeft: '1px solid #d1d9e6',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    overflow: 'hidden'
  };

  return (
    <div style={panelStyle}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          height: 40,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f0f4f8',
          borderBottom: isExpanded ? '1px solid #d1d9e6' : 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e8edf3';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f4f8';
        }}
      >
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#1e3a5f'
        }}>
          {isExpanded ? '📄 代码预览' : '📄'}
        </span>
        <span style={{
          fontSize: 14,
          color: '#6b7c93',
          transition: 'transform 0.3s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div
          className="fade-in"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#1e3a5f',
            padding: 16
          }}>
            <pre
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.6,
                color: '#e8edf3',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              <code>{formatCode(htmlCode)}</code>
            </pre>
          </div>

          <div style={{
            padding: 12,
            borderTop: '1px solid #d1d9e6',
            display: 'flex',
            gap: 8
          }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                backgroundColor: copied ? '#27ae60' : '#4a6fa5',
                color: 'white',
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                backgroundColor: '#ff6b6b',
                color: 'white',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ee5a5a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6b6b';
              }}
            >
              ⬇ Download .html
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function formatCode(html: string): string {
  return html
    .replace(/</g, '\u003C')
    .replace(/>/g, '\u003E');
}

export default CodePreviewPanel;
