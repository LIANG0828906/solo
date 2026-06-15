import React, { useState, useEffect, useMemo, useCallback } from 'react';
import chroma from 'chroma-js';
import { loadPaletteById } from '@/utils/indexedDB';
import type { Palette } from '@/types';
import './GradientPreview.css';

interface GradientPreviewProps {
  colorId: string;
}

const GradientPreview: React.FC<GradientPreviewProps> = ({ colorId }) => {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    const loadPalette = async () => {
      setLoading(true);
      try {
        const data = await loadPaletteById(colorId);
        setPalette(data || null);
      } catch (error) {
        console.error('加载色卡失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPalette();
  }, [colorId]);

  const gradientCSS = useMemo(() => {
    if (!palette || palette.colors.length < 2) return '';
    const colors = palette.colors;
    const scale = chroma.scale(colors).mode('lab');
    const stops = Array.from({ length: 11 }, (_, i) => {
      const position = (i / 10) * 100;
      const color = scale(i / 10).hex();
      return `${color} ${position}%`;
    });
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [palette]);

  const cssCode = useMemo(() => {
    if (!palette) return '';
    return `.gradient-background {
  background: ${gradientCSS};
  height: 100%;
  width: 100%;
}`;
  }, [palette, gradientCSS]);

  const handleCopy = useCallback(async () => {
    setCopyError(false);

    const copyWithExecCommand = (text: string): boolean => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (err) {
        document.body.removeChild(textarea);
        return false;
      }
    };

    const showSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const showError = () => {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cssCode);
        showSuccess();
      } else {
        const success = copyWithExecCommand(cssCode);
        if (success) {
          showSuccess();
        } else {
          showError();
        }
      }
    } catch (error) {
      const fallbackSuccess = copyWithExecCommand(cssCode);
      if (fallbackSuccess) {
        showSuccess();
      } else {
        console.error('复制失败:', error);
        showError();
      }
    }
  }, [cssCode]);

  if (loading) {
    return <div className="gradient-preview skeleton" />;
  }

  if (!palette) {
    return <div className="gradient-preview error">无法加载渐变预览</div>;
  }

  return (
    <div className="gradient-preview">
      <div className="gradient-header">
        <h3 className="gradient-title">渐变背景预览</h3>
        <p className="gradient-subtitle">基于当前色卡生成的平滑渐变</p>
      </div>

      <div
        className="gradient-display"
        style={{ background: gradientCSS }}
      />

      <div className="code-section">
        <div className="code-header">
          <span className="code-label">CSS 代码</span>
          <button
            type="button"
            className={`copy-btn ${copyError ? 'copy-error-btn' : ''}`}
            onClick={handleCopy}
            aria-label="复制CSS代码"
            disabled={copied}
          >
            {copyError ? (
              <span className="copy-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                复制失败
              </span>
            ) : copied ? (
              <span className="copy-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已复制
              </span>
            ) : (
              <span className="copy-normal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                复制代码
              </span>
            )}
          </button>
        </div>
        <pre className="code-block">
          <code>{cssCode}</code>
        </pre>
      </div>
    </div>
  );
};

export default GradientPreview;
