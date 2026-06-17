import React, { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { sampleArticles } from '../data/sampleArticles';
import { inlineStyle } from '../engine/parser';
import { tokenizeCss } from '../engine/cssGenerator';

const BrowserTitleBar: React.FC = () => {
  return (
    <div style={{
      height: '32px',
      backgroundColor: '#E0DED8',
      borderRadius: '8px 8px 0 0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '8px',
      flexShrink: 0,
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#FF5F56',
      }} />
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#FFBD2E',
      }} />
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#27C93F',
      }} />
      <div style={{
        flex: 1,
        marginLeft: '12px',
        height: '20px',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        color: '#666',
        maxWidth: '400px',
      }}>
        style-orchestra.dev/preview
      </div>
    </div>
  );
};

const CssCodeDisplay: React.FC = () => {
  const { cssCode, showToastMessage } = useStore();
  const [isCopying, setIsCopying] = useState(false);

  const tokens = useMemo(() => tokenizeCss(cssCode), [cssCode]);

  const handleCopy = async () => {
    if (isCopying) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(cssCode);
      showToastMessage('CSS代码已复制到剪贴板');
    } catch {
      showToastMessage('复制失败，请手动选择复制');
    } finally {
      setTimeout(() => setIsCopying(false), 300);
    }
  };

  const getColorForType = (type: string): string => {
    switch (type) {
      case 'selector':
        return '#D7BA7D';
      case 'property':
        return '#9CDCFE';
      case 'value':
        return '#CE9178';
      case 'comment':
        return '#6A9955';
      case 'punctuation':
        return '#E0E0E0';
      default:
        return '#E0E0E0';
    }
  };

  return (
    <div style={{
      height: '80px',
      backgroundColor: '#1A1A2E',
      padding: '12px 20px',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C6FFF" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <span style={{ fontSize: '12px', color: '#8080A0', fontWeight: 500 }}>
            生成的 CSS 代码
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#7C6FFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            transform: isCopying ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5A4ACF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#7C6FFF';
          }}
          title="复制代码"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <div style={{
        flex: 1,
        backgroundColor: '#1E1E2E',
        borderRadius: '8px',
        padding: '12px',
        overflow: 'hidden',
        fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'nowrap',
        overflowX: 'auto',
      }}>
        {tokens.map((token, index) => (
          <span
            key={index}
            style={{
              color: getColorForType(token.type),
              whiteSpace: token.type === 'whitespace' ? 'pre' : undefined,
            }}
          >
            {token.value}
          </span>
        ))}
      </div>
    </div>
  );
};

const Toast: React.FC = () => {
  const { ui } = useStore();

  if (!ui.showToast) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: ui.showToast
        ? 'translateX(-50%) translateY(0)'
        : 'translateX(-50%) translateY(20px)',
      opacity: ui.showToast ? 1 : 0,
      backgroundColor: '#33334A',
      color: '#FFFFFF',
      fontSize: '14px',
      borderRadius: '8px',
      padding: '12px 24px',
      zIndex: 1000,
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C6FFF" strokeWidth="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      {ui.toastMessage}
    </div>
  );
};

const PreviewPanel: React.FC = () => {
  const { parsed, ui } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const article = sampleArticles[ui.selectedArticle];

  const transitionStyle: React.CSSProperties = {
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F5F3EE',
    }}>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '40px 20px',
        }}
      >
        <div style={{
          width: '60%',
          maxWidth: '800px',
          minWidth: '500px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <BrowserTitleBar />
          <div style={{
            padding: '40px',
            ...transitionStyle,
          }}>
            <h1 style={{ ...inlineStyle(parsed.h1), ...transitionStyle }}>
              {article.h1}
            </h1>

            <h2 style={{ ...inlineStyle(parsed.h2), ...transitionStyle }}>
              {article.h2}
            </h2>

            {article.paragraphs.slice(0, 2).map((p, i) => (
              <p key={i} style={{ ...inlineStyle(parsed.p), ...transitionStyle }}>
                {p}
              </p>
            ))}

            <h3 style={{ ...inlineStyle(parsed.h3), ...transitionStyle }}>
              {article.h3}
            </h3>

            {article.paragraphs.slice(2).map((p, i) => (
              <p key={i + 2} style={{ ...inlineStyle(parsed.p), ...transitionStyle }}>
                {p}
              </p>
            ))}

            <blockquote style={{ ...inlineStyle(parsed.blockquote), ...transitionStyle }}>
              {article.blockquote}
            </blockquote>
          </div>
        </div>
      </div>

      <CssCodeDisplay />
      <Toast />
    </div>
  );
};

export default PreviewPanel;
