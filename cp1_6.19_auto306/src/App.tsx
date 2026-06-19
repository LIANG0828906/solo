import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useColorStore, type PresetTheme } from './store';
import ColorPicker from './ColorPicker';
import ContrastAnalyzer from './ContrastAnalyzer';

const App: React.FC = () => {
  const {
    foreground,
    background,
    presets,
    contrastResult,
    setForeground,
    setBackground,
    applyPreset
  } = useColorStore();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  const [codeKey, setCodeKey] = useState(0);

  const cssCode = useMemo(() => {
    return `:root {
  --color-primary: ${background};
  --color-background: ${background};
  --color-text: ${foreground};
  --contrast-ratio: ${contrastResult.ratio.toFixed(2)};
  --wcag-level: ${contrastResult.level};
}`;
  }, [foreground, background, contrastResult]);

  useEffect(() => {
    setCodeKey(k => k + 1);
  }, [foreground, background, contrastResult.level, contrastResult.ratio]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setToastVisible(true);
      setToastFading(false);
      setTimeout(() => {
        setToastFading(true);
      }, 1500);
      setTimeout(() => {
        setToastVisible(false);
        setToastFading(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [cssCode]);

  const codeLines = useMemo(() => cssCode.split('\n'), [cssCode]);

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎨</span>
            <div>
              <h1 style={styles.title}>Color Palette Studio</h1>
              <p style={styles.subtitle}>WCAG 对比度分析 · CSS 变量生成</p>
            </div>
          </div>
          <div style={styles.headerAccent} />
        </div>
      </div>

      <div style={styles.mainContainer}>
        {/* 左侧面板 - 20% */}
        <div style={styles.leftPanel}>
          <div style={styles.panelTitle}>
            <span style={styles.panelTitleIcon}>🎯</span>
            颜色选择
          </div>

          <ColorPicker
            label="前景色 (Foreground)"
            value={foreground}
            onChange={setForeground}
            accentColor="#3498DB"
          />

          <ColorPicker
            label="背景色 (Background)"
            value={background}
            onChange={setBackground}
            accentColor="#E67E22"
          />

          <div style={styles.swapBtnWrap}>
            <button
              onClick={() => {
                const fg = foreground;
                const bg = background;
                setForeground(bg);
                setBackground(fg);
              }}
              style={styles.swapBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F39C12';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(230, 126, 34, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#E67E22';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(230, 126, 34, 0.25)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 126, 34, 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(230, 126, 34, 0.25)';
              }}
            >
              ⇄ 交换前景/背景
            </button>
          </div>
        </div>

        {/* 中央区域 - 50% */}
        <div style={styles.centerPanel}>
          <div style={styles.centerContent}>
            <ContrastAnalyzer
              foreground={foreground}
              background={background}
              result={contrastResult}
            />
          </div>

          {/* 预设主题库 */}
          <div style={styles.presetsSection}>
            <div style={styles.presetsHeader}>
              <span style={styles.presetsTitle}>
                <span style={styles.presetsIcon}>✨</span>
                预设主题库
              </span>
              <span style={styles.presetsCount}>{presets.length} 个主题</span>
            </div>
            <div style={styles.presetsScroll}>
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onClick={() => applyPreset(preset)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 右侧面板 - 30% */}
        <div style={styles.rightPanel}>
          <div style={styles.panelTitle}>
            <span style={styles.panelTitleIcon}>📋</span>
            CSS 变量代码
          </div>

          <div style={styles.codeBlock}>
            <div style={styles.codeHeader}>
              <div style={styles.codeDots}>
                <span style={{ ...styles.codeDot, background: '#E74C3C' }} />
                <span style={{ ...styles.codeDot, background: '#F1C40F' }} />
                <span style={{ ...styles.codeDot, background: '#2ECC71' }} />
              </div>
              <span style={styles.codeFilename}>variables.css</span>
              <div style={styles.codeSpacer} />
            </div>
            <div style={styles.codeBodyScroll}>
              <pre
                key={codeKey}
                style={{
                  ...styles.codeBody,
                  opacity: 0,
                  animation: 'fadeIn 0.6s ease-out forwards'
                }}
              >
                {codeLines.map((line, i) => (
                  <div key={i} style={styles.codeLine}>
                    <span style={styles.lineNumber}>{i + 1}</span>
                    <code style={styles.codeContent}>
                      <HighlightedLine line={line} />
                    </code>
                  </div>
                ))}
              </pre>
            </div>
          </div>

          <button
            onClick={handleCopy}
            style={styles.copyBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #F39C12, #E67E22)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(230, 126, 34, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #E67E22, #D35400)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(230, 126, 34, 0.3)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 126, 34, 0.3)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(230, 126, 34, 0.3)';
            }}
          >
            📋 复制代码
          </button>

          <div style={styles.quickInfo}>
            <InfoRow label="前景色 (HEX)" value={foreground} color={foreground} />
            <InfoRow label="背景色 (HEX)" value={background} color={background} />
            <InfoRow
              label="对比度"
              value={`${contrastResult.ratio.toFixed(2)} : 1`}
              level={contrastResult.level}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div
          style={{
            ...styles.toast,
            opacity: toastFading ? 0 : 1,
            transform: toastFading ? 'translateY(-8px) scale(0.98)' : 'translateY(0) scale(1)',
            transition: 'all 0.5s ease-in-out'
          }}
        >
          <span style={styles.toastIcon}>✓</span>
          <span style={styles.toastText}>已复制!</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
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

const PresetCard: React.FC<{ preset: PresetTheme; onClick: () => void }> = ({ preset, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        ...styles.presetCard,
        background: `linear-gradient(135deg, ${preset.foreground}, ${preset.background})`,
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        border: hovered ? '2px solid #FFD700' : '2px solid transparent',
        boxShadow: hovered
          ? '0 8px 24px rgba(255, 215, 0, 0.3), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <div style={styles.presetCardOverlay}>
        <span style={styles.presetCardName}>{preset.name}</span>
      </div>
    </div>
  );
};

const HighlightedLine: React.FC<{ line: string }> = ({ line }) => {
  if (line.includes(':root')) {
    return <>{line.split(/(:root)/).map((part, i) =>
      part === ':root' ? <span key={i} style={{ color: '#C678DD' }}>{part}</span> : <span key={i}>{part}</span>
    )}</>;
  }
  if (line.includes('--')) {
    const match = line.match(/^(\s*--[\w-]+)(:)(\s*[^;]+)(;)/);
    if (match) {
      const [, name, colon, value, semi] = match;
      const isColor = /^#[0-9A-Fa-f]{3,8}/.test(value.trim());
      const isNumber = /^\s*\d+(\.\d+)?/.test(value);
      return (
        <>
          <span style={{ color: '#E06C75' }}>{name}</span>
          <span style={{ color: '#56B6C2' }}>{colon}</span>
          {isColor ? (
            <>
              <span style={{ color: '#98C379' }}>{value}</span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: value.trim(),
                  marginLeft: 4,
                  verticalAlign: 'middle',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
            </>
          ) : isNumber ? (
            <span style={{ color: '#D19A66' }}>{value}</span>
          ) : (
            <span style={{ color: '#E5C07B' }}>{value}</span>
          )}
          <span style={{ color: '#56B6C2' }}>{semi}</span>
        </>
      );
    }
  }
  return <>{line}</>;
};

const InfoRow: React.FC<{ label: string; value: string; color?: string; level?: 'AAA' | 'AA' | 'FAIL' }> = ({
  label, value, color, level
}) => {
  const levelColors: Record<string, string> = {
    AAA: '#2ECC71',
    AA: '#F1C40F',
    FAIL: '#E74C3C'
  };
  const valueColor = level ? levelColors[level] : undefined;

  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {color && (
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: color,
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          />
        )}
        <span
          style={{
            ...styles.infoValue,
            color: valueColor || '#E4E4E7',
            transition: 'color 0.3s ease-in-out'
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    width: '100%',
    background: '#1E1E2E',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 1024
  },
  header: {
    width: '100%',
    background: '#1A1A2A',
    borderBottom: '1px solid #2A2A3E',
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  },
  logoIcon: {
    fontSize: 32
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F4F4F5',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2
  },
  headerAccent: {
    width: 120,
    height: 3,
    borderRadius: 2,
    background: 'linear-gradient(90deg, #E67E22, #D35400, transparent)'
  },
  mainContainer: {
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '20% 50% 30%',
    gap: 20,
    flex: 1
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 0
  },
  centerPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    minWidth: 0
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 0
  },
  panelTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '0 4px 4px',
    borderBottom: '1px solid #2A2A3E',
    paddingBottom: 10
  },
  panelTitleIcon: {
    fontSize: 15
  },
  centerContent: {
    background: '#2A2A3E',
    borderRadius: 16,
    padding: 28,
    border: '1px solid #3A3A4E'
  },
  swapBtnWrap: {
    display: 'flex'
  },
  swapBtn: {
    flex: 1,
    padding: '12px 16px',
    background: '#E67E22',
    color: '#fff',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 13,
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 4px 14px rgba(230, 126, 34, 0.25)',
    letterSpacing: '0.3px'
  },
  presetsSection: {
    background: '#2A2A3E',
    borderRadius: 16,
    padding: 20,
    border: '1px solid #3A3A4E'
  },
  presetsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  presetsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    color: '#E4E4E7',
    letterSpacing: '0.5px'
  },
  presetsIcon: {
    fontSize: 14
  },
  presetsCount: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: 500,
    background: '#1A1A2A',
    padding: '3px 10px',
    borderRadius: 12
  },
  presetsScroll: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    paddingBottom: 6,
    paddingRight: 4
  },
  presetCard: {
    flexShrink: 0,
    width: 120,
    height: 60,
    borderRadius: 10,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  },
  presetCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '6px 10px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
  },
  presetCardName: {
    fontSize: 10,
    fontWeight: 600,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '0.3px'
  },
  codeBlock: {
    background: '#1A1A2A',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #3A3A4E',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 240
  },
  codeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#15151F',
    borderBottom: '1px solid #2A2A3E'
  },
  codeDots: {
    display: 'flex',
    gap: 6
  },
  codeDot: {
    width: 11,
    height: 11,
    borderRadius: '50%'
  },
  codeFilename: {
    fontFamily: "'Fira Code', monospace",
    fontSize: 11,
    color: '#71717A',
    fontWeight: 500
  },
  codeSpacer: {
    flex: 1
  },
  codeBodyScroll: {
    padding: '14px 0',
    overflowY: 'auto',
    flex: 1
  },
  codeBody: {
    margin: 0,
    padding: '0 14px 0 0'
  },
  codeLine: {
    display: 'flex',
    lineHeight: '22px',
    padding: '0 14px'
  },
  lineNumber: {
    width: 32,
    flexShrink: 0,
    textAlign: 'right',
    color: '#4A4A5E',
    fontFamily: "'Fira Code', monospace",
    fontSize: 12,
    userSelect: 'none',
    marginRight: 14
  },
  codeContent: {
    fontFamily: "'Fira Code', monospace",
    fontSize: 12.5,
    color: '#ABB2BF',
    whiteSpace: 'pre',
    fontWeight: 400,
    letterSpacing: '0.2px'
  },
  copyBtn: {
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #E67E22, #D35400)',
    color: '#fff',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 13,
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 4px 16px rgba(230, 126, 34, 0.3)',
    letterSpacing: '0.3px'
  },
  quickInfo: {
    background: '#2A2A3E',
    borderRadius: 12,
    padding: '14px 16px',
    border: '1px solid #3A3A4E',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: 12,
    fontFamily: "'Fira Code', monospace",
    fontWeight: 600
  },
  toast: {
    position: 'fixed',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #2ECC71, #27AE60)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(46, 204, 113, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
    fontWeight: 600,
    fontSize: 14
  },
  toastIcon: {
    fontSize: 16,
    fontWeight: 700
  },
  toastText: {
    letterSpacing: '0.3px'
  }
};

export default App;
