import React, { useState, useCallback } from 'react';
import { ColorExtractor, ExtractedColor } from './ColorExtractor';
import { ColorScheme, ColorInfo } from './ColorSchemeGenerator';

interface ColorPaletteDisplayProps {
  extractedColors: ExtractedColor[];
  colorSchemes: ColorScheme[];
  isExtracting: boolean;
}

interface SelectedColor {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  name: string;
  source: 'extracted' | 'scheme';
}

const ColorPaletteDisplay: React.FC<ColorPaletteDisplayProps> = ({
  extractedColors,
  colorSchemes,
  isExtracting,
}) => {
  const [selectedColor, setSelectedColor] = useState<SelectedColor | null>(null);
  const [pulsingColor, setPulsingColor] = useState<string | null>(null);
  const [copiedScheme, setCopiedScheme] = useState<number | null>(null);

  const handleColorClick = useCallback(
    (color: { hex: string; rgb: [number, number, number] }, source: 'extracted' | 'scheme') => {
      const hsl = ColorExtractor.rgbToHsl(color.rgb[0], color.rgb[1], color.rgb[2]);
      const name = ColorExtractor.getColorName(color.rgb[0], color.rgb[1], color.rgb[2]);

      setSelectedColor({
        hex: color.hex,
        rgb: color.rgb,
        hsl,
        name,
        source,
      });

      setPulsingColor(color.hex);
      setTimeout(() => setPulsingColor(null), 200);
    },
    []
  );

  const handleCopyScheme = useCallback(async (scheme: ColorScheme, index: number) => {
    const colorString = scheme.colors.map((c) => c.hex).join(' ');
    try {
      await navigator.clipboard.writeText(colorString);
      setCopiedScheme(index);
      setTimeout(() => setCopiedScheme(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, []);

  const isSelected = (hex: string): boolean => {
    return selectedColor?.hex.toUpperCase() === hex.toUpperCase();
  };

  const isPulsing = (hex: string): boolean => {
    return pulsingColor?.toUpperCase() === hex.toUpperCase();
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>主色调色板</h3>

        {isExtracting ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            <p style={styles.loadingText}>正在提取色彩...</p>
          </div>
        ) : extractedColors.length === 0 ? (
          <p style={styles.emptyState}>请先上传图片并点击"提取色彩"按钮</p>
        ) : (
          <>
            <div style={styles.mainPalette}>
              {extractedColors.map((color, index) => (
                <div key={`${color.hex}-${index}`} style={styles.colorItem}>
                  <div
                    onClick={() => handleColorClick(color, 'extracted')}
                    style={{
                      ...styles.mainColorSwatch,
                      backgroundColor: color.hex,
                      border: isSelected(color.hex)
                        ? '3px solid #1a73e8'
                        : '2px solid transparent',
                      boxShadow: isSelected(color.hex)
                        ? '0 0 0 2px rgba(26, 115, 232, 0.3)'
                        : '0 2px 4px rgba(0,0,0,0.1)',
                      animation: isPulsing(color.hex) ? 'pulse 0.2s ease-in-out' : 'none',
                    }}
                    title={color.hex}
                  />
                  <span style={styles.colorHex}>{color.hex}</span>
                  <span style={styles.colorPercentage}>
                    {color.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            {selectedColor && (
              <div style={styles.colorDetails}>
                <div
                  style={{
                    ...styles.detailColorPreview,
                    backgroundColor: selectedColor.hex,
                  }}
                />
                <div style={styles.detailInfo}>
                  <p style={styles.colorName}>
                    {selectedColor.name}{' '}
                    <span style={styles.detailHex}>{selectedColor.hex}</span>
                  </p>
                  <p style={styles.detailSpec}>
                    RGB: ({selectedColor.rgb.join(', ')})
                  </p>
                  <p style={styles.detailSpec}>
                    HSL: ({selectedColor.hsl.join(', ')})
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.schemesSection}>
        <h3 style={styles.sectionTitle}>配色方案</h3>

        {colorSchemes.length === 0 ? (
          <p style={styles.emptyState}>提取主色后将自动生成配色方案</p>
        ) : (
          <div className="responsive-schemes-grid-inline">
            {colorSchemes.map((scheme, schemeIndex) => (
              <div
                key={scheme.type}
                style={{
                  ...styles.schemeCard,
                  animation: `fadeIn 0.4s ease-out ${schemeIndex * 0.1}s both`,
                }}
              >
                <div style={styles.schemeHeader}>
                  <div>
                    <h4 style={styles.schemeTitle}>{scheme.title}</h4>
                    <p style={styles.schemeDescription}>{scheme.description}</p>
                  </div>
                  <button
                    onClick={() => handleCopyScheme(scheme, schemeIndex)}
                    style={{
                      ...styles.copyButton,
                      backgroundColor:
                        copiedScheme === schemeIndex ? '#34a853' : 'var(--button-bg)',
                    }}
                  >
                    {copiedScheme === schemeIndex ? '已复制 ✓' : '复制方案'}
                  </button>
                </div>

                <div style={styles.schemeColors}>
                  {scheme.colors.map((color: ColorInfo, colorIndex: number) => (
                    <div
                      key={`${color.hex}-${colorIndex}`}
                      onClick={() => handleColorClick(color, 'scheme')}
                      style={{
                        ...styles.schemeSwatch,
                        backgroundColor: color.hex,
                        border: isSelected(color.hex)
                          ? '2px solid #1a73e8'
                          : 'none',
                        zIndex: isSelected(color.hex) ? 2 : 1,
                        animation: isPulsing(color.hex)
                          ? 'pulse 0.2s ease-in-out'
                          : 'none',
                      }}
                      title={color.hex}
                    />
                  ))}
                </div>

                <div style={styles.schemeHexRow}>
                  {scheme.colors.map((color: ColorInfo, colorIndex: number) => (
                    <span
                      key={`hex-${color.hex}-${colorIndex}`}
                      style={styles.schemeHexLabel}
                    >
                      {color.hex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  section: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 12,
    padding: 24,
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.5s ease',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-color)',
    marginBottom: 20,
  },
  mainPalette: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start',
  },
  colorItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  mainColorSwatch: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  colorHex: {
    fontSize: 12,
    fontFamily: "'Courier New', Courier, monospace",
    color: 'var(--text-color)',
    fontWeight: 500,
  },
  colorPercentage: {
    fontSize: 10,
    color: '#888',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '4px solid #e0e0e0',
    borderTop: '4px solid var(--button-bg)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 40,
  },
  colorDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: 'var(--bg-color)',
    borderRadius: 8,
    transition: 'all 0.3s ease',
  },
  detailColorPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  detailInfo: {
    flex: 1,
  },
  colorName: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-color)',
    marginBottom: 6,
  },
  detailHex: {
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 400,
    fontSize: 14,
    color: '#666',
  },
  detailSpec: {
    fontSize: 13,
    color: '#666',
    fontFamily: "'Courier New', Courier, monospace",
    lineHeight: 1.6,
  },
  schemesSection: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 12,
    padding: 24,
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.5s ease',
  },
  schemesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  schemeCard: {
    minWidth: 280,
    border: '1px solid var(--scheme-separator)',
    borderRadius: 8,
    padding: 16,
    transition: 'all 0.3s ease',
  },
  schemeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  schemeTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
  },
  schemeDescription: {
    fontSize: 12,
    color: '#888',
  },
  copyButton: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--button-text)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  schemeColors: {
    display: 'flex',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  schemeSwatch: {
    flex: 1,
    height: 40,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  schemeHexRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 4,
  },
  schemeHexLabel: {
    fontSize: 10,
    fontFamily: "'Courier New', Courier, monospace",
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
};

export default ColorPaletteDisplay;
