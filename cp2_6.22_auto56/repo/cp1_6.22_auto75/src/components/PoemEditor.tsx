import { useState } from 'react';
import { PoemLine } from '../types';

interface PoemEditorProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  poem: PoemLine[];
  onEditLine: (lineId: string, newText: string) => void;
}

export default function PoemEditor({
  theme,
  onThemeChange,
  onGenerate,
  isGenerating,
  poem,
  onEditLine
}: PoemEditorProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>诗意视觉化</h1>
          <p style={styles.subtitle}>Poetry Visualizer</p>
        </div>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>输入主题或关键词</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isGenerating && theme.trim()) {
              onGenerate();
            }
          }}
          placeholder="例：月光、春天、思念、ocean、dream..."
          style={styles.input}
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !theme.trim()}
        style={{
          ...styles.generateBtn,
          ...(isGenerating || !theme.trim() ? styles.generateBtnDisabled : {})
        }}
        onMouseEnter={(e) => {
          if (!isGenerating && theme.trim()) {
            e.currentTarget.style.filter = 'brightness(1.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = '';
          e.currentTarget.style.transform = '';
        }}
      >
        {isGenerating ? (
          <span style={styles.spinnerContainer}>
            <svg style={styles.spinner} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span>灵感生成中...</span>
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z" />
            </svg>
            生成诗歌
          </span>
        )}
      </button>

      {poem.length > 0 && (
        <div style={styles.poemPreview}>
          <div style={styles.previewHeader}>
            <span style={styles.previewIcon}>✦</span>
            <span style={styles.previewTitle}>诗句预览</span>
          </div>
          <div style={styles.linesContainer}>
            {poem.map((line, idx) => (
              <div
                key={line.id}
                style={{
                  ...styles.poemLineItem,
                  ...(hoveredLine === line.id ? styles.poemLineHovered : {})
                }}
                onMouseEnter={() => setHoveredLine(line.id)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <span style={styles.lineNumber}>0{idx + 1}</span>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => onEditLine(line.id, e.target.value)}
                  style={styles.lineEditInput}
                />
                <span style={styles.editHint}>编辑</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.tipsBox}>
        <p style={styles.tipsTitle}>✦ 提示</p>
        <p style={styles.tipsText}>1. 支持中英文主题词输入</p>
        <p style={styles.tipsText}>2. 点击右侧诗句可直接修改</p>
        <p style={styles.tipsText}>3. 按回车键确认修改</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '28px 24px',
    background: 'rgba(18, 18, 38, 0.72)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: '22px',
    border: '1.5px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
    height: '100%',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.2) transparent'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    paddingBottom: '6px'
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #38bdf8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)'
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #93c5fd 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    letterSpacing: '1px'
  },
  subtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    margin: '2px 0 0 0',
    letterSpacing: '2.5px',
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 500,
    letterSpacing: '0.5px'
  },
  input: {
    padding: '14px 18px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1.5px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    color: 'white',
    fontSize: '15px',
    fontFamily: `Georgia, 'Noto Serif SC', serif`,
    outline: 'none',
    transition: 'all 0.25s ease',
    placeholder: 'rgba(255, 255, 255, 0.25)'
  } as React.CSSProperties,
  generateBtn: {
    padding: '15px 22px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 35%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 6px 24px rgba(139, 92, 246, 0.35)',
    fontFamily: `Georgia, 'Noto Serif SC', serif`
  },
  generateBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    filter: 'grayscale(0.3)'
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  spinner: {
    width: '18px',
    height: '18px',
    animation: 'rotate 0.8s linear infinite'
  },
  poemPreview: {
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  previewIcon: {
    fontSize: '14px',
    color: '#a78bfa'
  },
  previewTitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
    letterSpacing: '0.5px'
  },
  linesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  poemLineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    transition: 'all 0.2s ease'
  },
  poemLineHovered: {
    background: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  lineNumber: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.35)',
    fontFamily: 'monospace',
    minWidth: '26px',
    fontWeight: 600
  },
  lineEditInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: '14px',
    fontFamily: `Georgia, 'Noto Serif SC', serif`,
    padding: '2px 0',
    minWidth: 0
  } as React.CSSProperties,
  editHint: {
    fontSize: '10px',
    color: 'rgba(167, 139, 250, 0.7)',
    opacity: 0.8,
    letterSpacing: '0.5px'
  },
  tipsBox: {
    marginTop: 'auto',
    padding: '14px 16px',
    background: 'rgba(139, 92, 246, 0.08)',
    borderRadius: '12px',
    border: '1px solid rgba(139, 92, 246, 0.15)'
  },
  tipsTitle: {
    fontSize: '12px',
    color: '#c4b5fd',
    fontWeight: 600,
    marginBottom: '8px',
    letterSpacing: '0.5px'
  },
  tipsText: {
    fontSize: '11.5px',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 1.8,
    margin: 0
  }
};
