import React from 'react';
import type { FontConfig } from './fontPresets';

interface PreviewAreaProps {
  singleConfig: FontConfig;
  compareConfigs: FontConfig[];
  compareMode: boolean;
  activeIndex: number;
  onCellClick?: (index: number) => void;
}

const TITLE_TEXT = '现代设计中的字体美学探索';
const BODY_TEXT =
  '字体是视觉传达的核心元素，优秀的排版能够提升阅读体验与信息传达效率。选择恰当的字体组合，可以为作品赋予独特的气质与个性，这正是设计师需要反复打磨的关键环节。';
const QUOTE_TEXT =
  '好的排版应该是隐形的 — 读者不应注意到字体本身，而应完全沉浸在内容之中。';

const buildFontFamily = (name: string): string => {
  if (name === 'system-ui') {
    return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  return `"${name}", system-ui, sans-serif`;
};

const TypographyBlock: React.FC<{ config: FontConfig }> = ({ config }) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: buildFontFamily(config.fontFamily),
    lineHeight: config.lineHeight,
    transition: 'font-size 0.2s ease, line-height 0.2s ease, font-weight 0.2s ease',
    margin: 0,
  };

  const titleSize = Math.max(config.fontSize * 1.8, 20);
  const bodySize = config.fontSize;
  const quoteSize = Math.max(config.fontSize * 0.95, 12);

  return (
    <div style={blockContainerStyle}>
      <h1
        style={{
          ...baseStyle,
          fontSize: titleSize,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: titleSize * 0.6,
          letterSpacing: '-0.01em',
        }}
      >
        {TITLE_TEXT}
      </h1>
      <p
        style={{
          ...baseStyle,
          fontSize: bodySize,
          fontWeight: config.fontWeight,
          color: '#4B5563',
          marginBottom: bodySize * 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {BODY_TEXT}
      </p>
      <blockquote
        style={{
          ...baseStyle,
          fontSize: quoteSize,
          fontStyle: 'italic',
          fontWeight: config.fontWeight,
          color: '#6B7280',
          margin: 0,
          padding: `${quoteSize * 0.6}px 0 ${quoteSize * 0.6}px ${quoteSize * 0.9}px`,
          borderLeft: '4px solid #3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.04)',
          borderRadius: '0 6px 6px 0',
        }}
      >
        {QUOTE_TEXT}
      </blockquote>
    </div>
  );
};

const blockContainerStyle: React.CSSProperties = {
  width: '100%',
};

const PreviewArea: React.FC<PreviewAreaProps> = ({
  singleConfig,
  compareConfigs,
  compareMode,
  activeIndex,
  onCellClick,
}) => {
  if (!compareMode) {
    return (
      <main style={previewContainerStyle}>
        <div
          style={{
            ...previewInnerStyle,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <TypographyBlock config={singleConfig} />
        </div>
        <style>{fadeInKeyframes}</style>
      </main>
    );
  }

  return (
    <main style={previewContainerStyle}>
      <div
        style={{
          ...compareGridStyle,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {compareConfigs.map((cfg, idx) => (
          <div
            key={idx}
            onClick={() => onCellClick?.(idx)}
            style={{
              ...cellStyle,
              ...(activeIndex === idx ? cellActiveStyle : {}),
              cursor: onCellClick ? 'pointer' : 'default',
            }}
          >
            <div style={fontTagStyle}>
              <span style={fontTagLabelStyle}>{idx + 1}</span>
              {cfg.fontFamily.split(',')[0]}
            </div>
            <div style={cellContentStyle}>
              <TypographyBlock config={cfg} />
            </div>
          </div>
        ))}
      </div>
      <style>{fadeInKeyframes}</style>
    </main>
  );
};

const previewContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '100vh',
  backgroundColor: '#ffffff',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

const previewInnerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 820,
  margin: '0 auto',
  padding: '80px 64px',
  boxSizing: 'border-box',
};

const compareGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gridAutoRows: 'minmax(380px, 1fr)',
  gap: 16,
  padding: 20,
  width: '100%',
  boxSizing: 'border-box',
};

const cellStyle: React.CSSProperties = {
  position: 'relative',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1.5px solid #E5E7EB',
  padding: '56px 28px 28px',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const cellActiveStyle: React.CSSProperties = {
  borderColor: '#3B82F6',
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.12), 0 1px 3px rgba(0,0,0,0.08)',
};

const cellContentStyle: React.CSSProperties = {
  width: '100%',
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const fontTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  backgroundColor: 'rgba(17, 24, 39, 0.72)',
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  zIndex: 10,
  maxWidth: 'calc(100% - 24px)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const fontTagLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  backgroundColor: '#3B82F6',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
  flexShrink: 0,
};

const fadeInKeyframes = `
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
`;

export default PreviewArea;
