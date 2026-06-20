import React, { memo, useState, useCallback } from 'react';
import { Heart, Copy, Check, Download } from 'lucide-react';
import type { Palette } from '../types/color';
import { generateCSSCodeBlock, generateSVGColorCard, copyToClipboard, generatePNGDownloadUrl } from '../utils/exportUtils';

interface ExportPanelProps {
  palette: Palette;
  onSave: (name?: string) => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ palette, onSave }) => {
  const [saveName, setSaveName] = useState<string>('');
  const [copiedCSS, setCopiedCSS] = useState<boolean>(false);
  const [copiedSVG, setCopiedSVG] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const cssCode = generateCSSCodeBlock(palette);
  const svgCode = generateSVGColorCard(palette);
  const svgPreviewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCode)}`;

  const handleSave = useCallback(() => {
    onSave(saveName.trim() || undefined);
  }, [onSave, saveName]);

  const handleCopyCSS = useCallback(async () => {
    const success = await copyToClipboard(cssCode);
    if (success) {
      setCopiedCSS(true);
      setTimeout(() => setCopiedCSS(false), 2000);
    }
  }, [cssCode]);

  const handleCopySVG = useCallback(async () => {
    const success = await copyToClipboard(svgCode);
    if (success) {
      setCopiedSVG(true);
      setTimeout(() => setCopiedSVG(false), 2000);
    }
  }, [svgCode]);

  const handleDownloadPNG = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const pngUrl = await generatePNGDownloadUrl(svgCode);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${palette.name || 'palette'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to generate PNG:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [svgCode, palette.name, isDownloading]);

  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: '#0f3460',
    color: '#eaeaea',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.2s ease',
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = '#1a5276';
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = '#0f3460';
    e.currentTarget.style.transform = 'scale(1)';
  };

  const handleButtonMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleButtonMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const copiedStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#10b981',
    fontSize: '12px',
    transition: 'opacity 0.2s ease',
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: '#eaeaea',
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 12px 0',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #0f3460',
    background: '#1a1a2e',
    color: '#eaeaea',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div
      style={{
        background: '#16213e',
        borderRadius: '8px',
        padding: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      <h3
        style={{
          fontWeight: 'bold',
          color: '#eaeaea',
          fontSize: '18px',
          margin: '0 0 20px 0',
        }}
      >
        导出方案
      </h3>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={sectionTitleStyle}>保存到收藏</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder={`${palette.name} - ${new Date().toLocaleString()}`}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#1a5276';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#0f3460';
            }}
          />
          <button
            onClick={handleSave}
            style={buttonBaseStyle}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            onMouseDown={handleButtonMouseDown}
            onMouseUp={handleButtonMouseUp}
          >
            <Heart size={16} />
            保存
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ ...sectionTitleStyle, margin: 0 }}>CSS变量导出</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {copiedCSS && (
              <span style={copiedStyle}>
                <Check size={14} />
                已复制
              </span>
            )}
            <button
              onClick={handleCopyCSS}
              style={buttonBaseStyle}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              onMouseDown={handleButtonMouseDown}
              onMouseUp={handleButtonMouseUp}
            >
              <Copy size={16} />
              复制CSS
            </button>
          </div>
        </div>
        <pre
          style={{
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            background: '#1a1a2e',
            color: '#eaeaea',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.5',
            overflowX: 'auto',
            margin: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {cssCode}
        </pre>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ ...sectionTitleStyle, margin: 0 }}>SVG色卡导出</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {copiedSVG && (
              <span style={copiedStyle}>
                <Check size={14} />
                已复制
              </span>
            )}
            <button
              onClick={handleCopySVG}
              style={buttonBaseStyle}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              onMouseDown={handleButtonMouseDown}
              onMouseUp={handleButtonMouseUp}
            >
              <Copy size={16} />
              复制SVG
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              style={{
                ...buttonBaseStyle,
                opacity: isDownloading ? 0.6 : 1,
                cursor: isDownloading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => !isDownloading && handleButtonMouseEnter(e)}
              onMouseLeave={(e) => !isDownloading && handleButtonMouseLeave(e)}
              onMouseDown={(e) => !isDownloading && handleButtonMouseDown(e)}
              onMouseUp={(e) => !isDownloading && handleButtonMouseUp(e)}
            >
              <Download size={16} />
              下载PNG
            </button>
          </div>
        </div>
        <div
          style={{
            background: '#1a1a2e',
            padding: '12px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <img
            src={svgPreviewUrl}
            alt="SVG Color Card"
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ExportPanel);
