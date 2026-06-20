import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageUploader from './ImageUploader';
import ColorPaletteDisplay from './ColorPaletteDisplay';
import { ColorExtractor, ExtractedColor } from './ColorExtractor';
import { ColorSchemeGenerator, ColorScheme } from './ColorSchemeGenerator';

const App: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [error, setError] = useState<string | null>(null);
  const perfStartRef = useRef<number>(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('color-analyzer-theme') as 'light' | 'dark' | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    }
  }, []);

  const handleImageChange = useCallback((dataUrl: string, file: File) => {
    setImageUrl(dataUrl);
    setImageFile(file);
    setExtractedColors([]);
    setColorSchemes([]);
    setError(null);
  }, []);

  const handleExtractColors = useCallback(async () => {
    if (!imageUrl) {
      setError('请先上传图片');
      return;
    }

    perfStartRef.current = performance.now();
    setIsExtracting(true);
    setError(null);

    try {
      const colors = await ColorExtractor.extractColors(imageUrl, 10, 5);

      if (colors.length === 0) {
        throw new Error('未能从图片中提取到颜色');
      }

      setExtractedColors(colors);

      const primaryColor = colors[0];
      const schemes = ColorSchemeGenerator.generateAllSchemes(primaryColor.hex);
      setColorSchemes(schemes);

      const elapsed = performance.now() - perfStartRef.current;
      console.log(`色彩提取耗时: ${elapsed.toFixed(2)}ms`);
    } catch (err) {
      console.error('色彩提取失败:', err);
      setError(err instanceof Error ? err.message : '色彩提取失败，请重试');
    } finally {
      setIsExtracting(false);
    }
  }, [imageUrl]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('color-analyzer-theme', newTheme);
  }, [theme]);

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: '#fff' }}
              >
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </div>
            <div>
              <h1 style={styles.appTitle}>色彩分析画廊</h1>
              <p style={styles.appSubtitle}>智能提取主色调 · 生成专业配色方案</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            style={styles.themeToggle}
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            {theme === 'light' ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        <section className="responsive-top-section">
          <div style={styles.uploadColumn}>
            <ImageUploader onImageChange={handleImageChange} imageUrl={imageUrl} />

            <div style={styles.actionButtons}>
              <button
                onClick={handleExtractColors}
                disabled={!imageUrl || isExtracting}
                style={{
                  ...styles.primaryButton,
                  ...(!imageUrl || isExtracting ? styles.buttonDisabled : {}),
                }}
              >
                {isExtracting ? (
                  <>
                    <span style={styles.buttonSpinner} />
                    正在提取...
                  </>
                ) : (
                  '提取色彩'
                )}
              </button>

              {imageUrl && (
                <button
                  onClick={() => {
                    setImageUrl(null);
                    setImageFile(null);
                    setExtractedColors([]);
                    setColorSchemes([]);
                    setError(null);
                  }}
                  style={styles.secondaryButton}
                >
                  重新上传
                </button>
              )}
            </div>

            {error && <p style={styles.errorMessage}>{error}</p>}

            {imageFile && (
              <p style={styles.fileInfo}>
                已加载: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div style={styles.paletteColumn}>
            <ColorPaletteDisplay
              extractedColors={extractedColors}
              colorSchemes={[]}
              isExtracting={isExtracting}
            />
          </div>
        </section>

        {colorSchemes.length > 0 && (
          <section style={styles.bottomSection}>
            <div style={styles.schemesWrapper}>
              <div className="responsive-schemes-grid">
                {colorSchemes.map((scheme, index) => (
                  <SchemeCard
                    key={scheme.type}
                    scheme={scheme}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2024 色彩分析画廊 | 基于 Color Thief 算法 · 纯前端实现
        </p>
      </footer>
    </div>
  );
};

interface SchemeCardProps {
  scheme: ColorScheme;
  index: number;
}

const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, index }) => {
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState<{
    hex: string;
    rgb: [number, number, number];
    hsl: [number, number, number];
    name: string;
  } | null>(null);
  const [pulsingHex, setPulsingHex] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    const colorString = scheme.colors.map((c) => c.hex).join(' ');
    try {
      await navigator.clipboard.writeText(colorString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [scheme]);

  const handleColorClick = useCallback(
    (color: { hex: string; rgb: [number, number, number] }) => {
      const hsl = ColorExtractor.rgbToHsl(color.rgb[0], color.rgb[1], color.rgb[2]);
      const name = ColorExtractor.getColorName(color.rgb[0], color.rgb[1], color.rgb[2]);
      setSelectedColor({ hex: color.hex, rgb: color.rgb, hsl, name });
      setPulsingHex(color.hex);
      setTimeout(() => setPulsingHex(null), 200);
    },
    []
  );

  return (
    <div
      style={{
        ...styles.schemeCard,
        animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      <div style={styles.schemeCardHeader}>
        <div>
          <h4 style={styles.schemeCardTitle}>{scheme.title}</h4>
          <p style={styles.schemeCardDescription}>{scheme.description}</p>
        </div>
        <button
          onClick={handleCopy}
          style={{
            ...styles.copyButton,
            backgroundColor: copied ? '#34a853' : 'var(--button-bg)',
          }}
        >
          {copied ? '已复制 ✓' : '复制方案'}
        </button>
      </div>

      <div style={styles.schemeSwatchRow}>
        {scheme.colors.map((color, colorIdx) => (
          <div
            key={`sw-${color.hex}-${colorIdx}`}
            onClick={() => handleColorClick(color)}
            style={{
              ...styles.schemeSwatchBlock,
              backgroundColor: color.hex,
              border:
                selectedColor?.hex.toUpperCase() === color.hex.toUpperCase()
                  ? '2px solid #1a73e8'
                  : 'none',
              animation:
                pulsingHex?.toUpperCase() === color.hex.toUpperCase()
                  ? 'pulse 0.2s ease-in-out'
                  : 'none',
              zIndex:
                selectedColor?.hex.toUpperCase() === color.hex.toUpperCase()
                  ? 2
                  : 1,
            }}
            title={color.hex}
          />
        ))}
      </div>

      <div style={styles.schemeHexLabels}>
        {scheme.colors.map((color, colorIdx) => (
          <span key={`hl-${color.hex}-${colorIdx}`} style={styles.hexLabel}>
            {color.hex}
          </span>
        ))}
      </div>

      {selectedColor && (
        <div style={styles.selectedColorDetail}>
          <div
            style={{
              ...styles.detailSwatch,
              backgroundColor: selectedColor.hex,
            }}
          />
          <div style={styles.detailText}>
            <span style={styles.detailName}>{selectedColor.name}</span>
            <span style={styles.detailValues}>
              {selectedColor.hex} · RGB({selectedColor.rgb.join(', ')}) · HSL(
              {selectedColor.hsl.join(', ')})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color 0.5s ease',
  },
  header: {
    backgroundColor: 'var(--card-bg)',
    borderBottom: '1px solid var(--border-color)',
    padding: '16px 40px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    transition: 'all 0.5s ease',
  },
  headerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-color)',
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-color)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  mainContent: {
    flex: 1,
    maxWidth: 1400,
    width: '100%',
    margin: '0 auto',
    padding: '32px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  topSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: 32,
    alignItems: 'flex-start',
  },
  uploadColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  paletteColumn: {
    minHeight: 300,
  },
  actionButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '12px 32px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--button-text)',
    backgroundColor: 'var(--button-bg)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 2px 8px rgba(26, 115, 232, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  buttonSpinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  secondaryButton: {
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-color)',
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
  },
  fileInfo: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  bottomSection: {
    width: '100%',
  },
  schemesWrapper: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 12,
    padding: 28,
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.5s ease',
  },
  schemesOnlyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    borderTop: '2px solid var(--scheme-separator)',
    paddingTop: 24,
  },
  schemeCard: {
    minWidth: 280,
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--scheme-separator)',
    borderRadius: 10,
    padding: 20,
    transition: 'all 0.3s ease',
  },
  schemeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  schemeCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
  },
  schemeCardDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 1.5,
  },
  copyButton: {
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--button-text)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  schemeSwatchRow: {
    display: 'flex',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    height: 40,
  },
  schemeSwatchBlock: {
    flex: 1,
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  schemeHexLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 16,
  },
  hexLabel: {
    fontSize: 11,
    fontFamily: "'Courier New', Courier, monospace",
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  selectedColorDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'var(--bg-color)',
    borderRadius: 8,
    transition: 'all 0.3s ease',
  },
  detailSwatch: {
    width: 36,
    height: 36,
    borderRadius: 6,
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  detailText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  detailName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-color)',
  },
  detailValues: {
    fontSize: 11,
    fontFamily: "'Courier New', Courier, monospace",
    color: '#888',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  footer: {
    backgroundColor: 'var(--card-bg)',
    borderTop: '1px solid var(--border-color)',
    padding: '20px 40px',
    marginTop: 'auto',
    transition: 'all 0.5s ease',
  },
  footerText: {
    maxWidth: 1400,
    margin: '0 auto',
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
};

export default App;
