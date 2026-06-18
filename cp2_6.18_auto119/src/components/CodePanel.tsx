import { useState, useMemo } from 'react';
import { useGradientStore } from '../store/gradientStore';
import { generateCSS, generateBackgroundValue } from '../utils/cssGenerator';

const CodePanel = () => {
  const layers = useGradientStore((s) => s.layers);
  const blendMode = useGradientStore((s) => s.blendMode);
  const [copied, setCopied] = useState<'full' | 'bg' | null>(null);

  const fullCSS = useMemo(
    () => generateCSS(layers, blendMode),
    [layers, blendMode]
  );
  const bgValue = useMemo(
    () => generateBackgroundValue(layers, blendMode),
    [layers, blendMode]
  );

  const copyToClipboard = async (text: string, type: 'full' | 'bg') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const highlightCSS = (css: string) => {
    const lines = css.split('\n');
    return lines.map((line, idx) => {
      let highlighted = line;
      highlighted = highlighted.replace(
        /(\/\*[\s\S]*?\*\/)/g,
        '<span style="color:#64748b;font-style:italic">$1</span>'
      );
      highlighted = highlighted.replace(
        /^(\s*)(\.[a-zA-Z0-9_-]+)/g,
        '$1<span style="color:#c4b5fd;font-weight:600">$2</span>'
      );
      highlighted = highlighted.replace(
        /\b(background|background-blend-mode|mix-blend-mode|width|height)\b/g,
        '<span style="color:#7dd3fc">$1</span>'
      );
      highlighted = highlighted.replace(
        /(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/g,
        '<span style="color:#fca5a5">$1</span>'
      );
      highlighted = highlighted.replace(
        /\b(linear-gradient|radial-gradient|conic-gradient)\b/g,
        '<span style="color:#86efac">$1</span>'
      );
      highlighted = highlighted.replace(
        /\b(\d+(?:\.\d+)?(?:deg|px|%))\b/g,
        '<span style="color:#fde047">$1</span>'
      );
      highlighted = highlighted.replace(
        /\b(normal|multiply|screen|center|at|from)\b/g,
        '<span style="color:#f0abfc">$1</span>'
      );
      highlighted = highlighted.replace(
        /(\{|\})/g,
        '<span style="color:#94a3b8">$1</span>'
      );
      highlighted = highlighted.replace(
        /(;)/g,
        '<span style="color:#94a3b8">$1</span>'
      );
      return (
        <div key={idx} style={{ minHeight: 18 }}>
          <span style={codeStyles.lineNum}>{idx + 1}</span>
          <span
            dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }}
          />
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>CSS 代码</span>
          <span style={styles.layerCount}>
            {layers.filter((l) => l.visible).length} 层 · {blendMode}
          </span>
        </div>
        <div style={styles.btnGroup}>
          <button
            onClick={() => copyToClipboard(bgValue, 'bg')}
            style={{
              ...styles.copyBtn,
              ...(copied === 'bg' ? styles.copyBtnSuccess : {}),
            }}
          >
            {copied === 'bg' ? '✓ 已复制' : '复制 background'}
          </button>
          <button
            onClick={() => copyToClipboard(fullCSS, 'full')}
            style={{
              ...styles.copyBtn,
              background:
                copied === 'full'
                  ? '#10b981'
                  : 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
              color: copied === 'full' ? '#fff' : '#0f0f1a',
              borderColor: copied === 'full' ? '#10b981' : 'transparent',
            }}
          >
            {copied === 'full' ? '✓ 已复制全部' : '📋 复制全部'}
          </button>
        </div>
      </div>

      {bgValue && (
        <div style={styles.bgPreviewRow}>
          <span style={styles.bgLabel}>background:</span>
          <div style={styles.bgValueWrap}>
            <code style={styles.bgValue}>{bgValue}</code>
          </div>
        </div>
      )}

      <div style={styles.codeBox}>
        <pre style={styles.pre}>{highlightCSS(fullCSS)}</pre>
      </div>

      <div style={styles.tips}>
        💡 <span>提示：在小屏幕设备上，预览和代码区会自动切换为上下排列</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    minWidth: 320,
    background: '#1e1e2e',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    border: '1px solid #2a2a3e',
    height: 'fit-content',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  title: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  layerCount: { fontSize: 11, color: '#64748b' },
  btnGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  copyBtn: {
    padding: '7px 12px',
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid #334155',
    borderRadius: 7,
    cursor: 'pointer',
    background: '#2a2a3e',
    color: '#e2e8f0',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  copyBtnSuccess: {
    background: '#10b981',
    color: '#fff',
    borderColor: '#10b981',
  },
  bgPreviewRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: '#0f0f1a',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #2a2a3e',
  },
  bgLabel: { fontSize: 11, color: '#a78bfa', fontWeight: 600 },
  bgValueWrap: {
    maxHeight: 80,
    overflowY: 'auto',
    scrollbarWidth: 'thin',
  },
  bgValue: {
    fontSize: 11,
    color: '#fde047',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    wordBreak: 'break-all',
    lineHeight: 1.6,
  },
  codeBox: {
    background: '#0f0f1a',
    borderRadius: 10,
    overflow: 'auto',
    maxHeight: 420,
    border: '1px solid #2a2a3e',
    scrollbarWidth: 'thin',
  },
  pre: {
    margin: 0,
    padding: 12,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: 11.5,
    lineHeight: 1.7,
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  tips: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#64748b',
    padding: '8px 10px',
    background: 'rgba(167,139,250,0.06)',
    borderRadius: 7,
    border: '1px solid rgba(167,139,250,0.15)',
  },
};

const codeStyles: Record<string, React.CSSProperties> = {
  lineNum: {
    display: 'inline-block',
    width: 28,
    color: '#475569',
    fontSize: 10,
    userSelect: 'none',
    textAlign: 'right',
    paddingRight: 10,
    marginRight: 8,
    borderRight: '1px solid #2a2a3e',
  },
};

export default CodePanel;
