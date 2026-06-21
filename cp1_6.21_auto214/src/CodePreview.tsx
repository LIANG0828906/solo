import React, { useMemo, useState, useCallback } from 'react';
import { AnimationStep } from './presets';

interface Props {
  steps: AnimationStep[];
  duration: number;
}

interface FrameData {
  percentage: number;
  properties: { property: string; value: string }[];
}

function buildFrames(steps: AnimationStep[]): FrameData[] {
  const map = new Map<number, { property: string; value: string }[]>();
  steps.forEach((s) => {
    if (!map.has(s.percentage)) map.set(s.percentage, []);
    map.get(s.percentage)!.push({ property: s.property, value: s.value });
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([p, props]) => ({ percentage: p, properties: props }));
}

function highlightCSS(css: string): React.ReactNode[] {
  const lines = css.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();

    if (trimmed.startsWith('@keyframes')) {
      const parts = line.match(/^(\s*)(@keyframes)(\s+)([\w-]+)(\s*\{)$/);
      if (parts) {
        nodes.push(
          <div key={i}>
            <span>{parts[1]}</span>
            <span style={{ color: '#C792EA' }}>{parts[2]}</span>
            <span>{parts[3]}</span>
            <span style={{ color: '#FFCB6B' }}>{parts[4]}</span>
            <span>{parts[5]}</span>
          </div>
        );
      } else {
        nodes.push(<div key={i}>{line}</div>);
      }
      return;
    }

    if (trimmed.endsWith('{')) {
      const percentMatch = line.match(/^(\s*)(\d+%)(\s*\{)$/);
      if (percentMatch) {
        nodes.push(
          <div key={i}>
            <span>{percentMatch[1]}</span>
            <span style={{ color: '#F78C6C' }}>{percentMatch[2]}</span>
            <span>{percentMatch[3]}</span>
          </div>
        );
        return;
      }
    }

    const propMatch = line.match(/^(\s*)([a-zA-Z-]+)(\s*:\s*)([^;]+)(;)$/);
    if (propMatch) {
      nodes.push(
        <div key={i}>
          <span>{propMatch[1]}</span>
          <span style={{ color: '#82AAFF' }}>{propMatch[2]}</span>
          <span style={{ color: '#89DDFF' }}>{propMatch[3]}</span>
          <span style={{ color: '#C3E88D' }}>{propMatch[4]}</span>
          <span style={{ color: '#89DDFF' }}>{propMatch[5]}</span>
        </div>
      );
      return;
    }

    nodes.push(<div key={i}>{line}</div>);
  });

  return nodes;
}

const CodePreview: React.FC<Props> = ({ steps, duration }) => {
  const [animName] = useState(() => `anim-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`);
  const [toastVisible, setToastVisible] = useState(false);

  const { plainCSS, usageCSS } = useMemo(() => {
    const frames = buildFrames(steps);
    let kf = `@keyframes ${animName} {\n`;
    frames.forEach((f) => {
      kf += `  ${f.percentage}% {\n`;
      f.properties.forEach(({ property, value }) => {
        kf += `    ${property}: ${value};\n`;
      });
      kf += `  }\n`;
    });
    kf += `}\n`;

    const usage = `.animated-element {\n  animation: ${animName} ${duration}s ease-in-out infinite;\n}\n`;
    return { plainCSS: kf + '\n' + usage, usageCSS: usage };
  }, [steps, duration, animName]);

  const highlighted = useMemo(() => highlightCSS(plainCSS), [plainCSS]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainCSS);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = plainCSS;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    }
  }, [plainCSS]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>CSS 代码</h3>
        <button onClick={handleCopy} style={styles.copyBtn}>
          复制代码
        </button>
      </div>

      <div style={styles.codeArea}>
        <pre style={styles.pre}>
          <code style={styles.code}>{highlighted}</code>
        </pre>
      </div>

      {toastVisible && (
        <div style={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.toastIcon}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          已复制到剪贴板
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    background: '#0F172A',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #1E293B',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    color: '#E2E8F0',
  },
  copyBtn: {
    padding: '6px 12px',
    background: '#475569',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.2s ease-out',
  },
  codeArea: {
    flex: 1,
    overflow: 'auto',
    background: '#020617',
    borderRadius: 8,
    padding: 12,
  },
  pre: {
    margin: 0,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#E2E8F0',
    whiteSpace: 'pre',
    wordBreak: 'break-all',
  },
  code: {
    fontFamily: 'inherit',
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#10B981',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
    animation: 'toastIn 0.2s ease-out',
    zIndex: 100,
  },
  toastIcon: {
    flexShrink: 0,
  },
};

const codeStyle = document.createElement('style');
codeStyle.textContent = `
  [data-copybtn]:hover { background: #6366F1 !important; }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }
`;
document.head.appendChild(codeStyle);

export default CodePreview;
