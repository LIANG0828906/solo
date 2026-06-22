import { useState, useMemo, useCallback, memo } from 'react';
import { saveAs } from 'file-saver';
import type { ColorNode, GradientType } from '../types';

interface GradientPreviewProps {
  nodes: ColorNode[];
  gradientType: GradientType;
}

const gradientDirections: Record<GradientType, string> = {
  horizontal: 'to right',
  vertical: 'to bottom',
  radial: 'circle',
  diagonal: 'to bottom right'
};

function GradientPreview({ nodes, gradientType }: GradientPreviewProps) {
  const [copied, setCopied] = useState(false);

  const sortedNodes = useMemo(
    () => [...nodes].sort((a, b) => a.position - b.position),
    [nodes]
  );

  const colorStops = useMemo(() => {
    return sortedNodes
      .map(node => `${node.color} ${node.position}%`)
      .join(', ');
  }, [sortedNodes]);

  const gradientValue = useMemo(() => {
    const direction = gradientDirections[gradientType];
    if (gradientType === 'radial') {
      return `radial-gradient(${direction}, ${colorStops})`;
    }
    return `linear-gradient(${direction}, ${colorStops})`;
  }, [gradientType, colorStops]);

  const cssCode = useMemo(() => {
    return `background: ${gradientValue};`;
  }, [gradientValue]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [cssCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob(
      [`.gradient-background {\n  background: ${gradientValue};\n}\n`],
      { type: 'text/css;charset=utf-8' }
    );
    saveAs(blob, 'gradient.css');
  }, [gradientValue]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        height: '100%'
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#aaa',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        预览
      </h3>

      <div
        className="preview-canvas"
        style={{
          flex: 1,
          minHeight: '300px',
          borderRadius: '16px',
          background: gradientValue,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid #333'
        }}
      />

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#aaa',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            CSS 代码
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`action-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '已复制' : '复制'}
            </button>
            <button className="action-btn" onClick={handleDownload}>
              下载 .css
            </button>
          </div>
        </div>

        <div className="code-block-wrapper">
          <div className="code-block">{cssCode}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(GradientPreview);
