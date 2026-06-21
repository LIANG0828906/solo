import React from 'react';

export type PlatformType = 'ios' | 'android';

interface TextPreviewProps {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  text: string;
  platform: PlatformType;
  fading: boolean;
}

const IOSStatusBar: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1F2937',
    borderBottom: '1px solid #F3F4F6',
  }}>
    <span>9:41</span>
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="4" width="3" height="8" rx="1" fill="#1F2937"/><rect x="4" y="2" width="3" height="10" rx="1" fill="#1F2937"/><rect x="8" y="0" width="3" height="12" rx="1" fill="#1F2937"/><rect x="12" y="0" width="3" height="12" rx="1" fill="#1F2937" opacity="0.3"/></svg>
      <svg width="20" height="12" viewBox="0 0 20 12"><rect x="0" y="0" width="18" height="12" rx="3" stroke="#1F2937" strokeWidth="1" fill="none"/><rect x="2" y="2" width="12" height="8" rx="1.5" fill="#1F2937"/><rect x="19" y="3.5" width="1.5" height="5" rx="0.75" fill="#1F2937"/></svg>
    </div>
  </div>
);

const AndroidStatusBar: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 16px',
    fontSize: '11px',
    fontWeight: 400,
    color: '#000000',
    borderBottom: '1px solid #E5E7EB',
  }}>
    <span>12:00</span>
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
      <svg width="16" height="12" viewBox="0 0 20 12"><rect x="0" y="0" width="18" height="12" rx="2" stroke="#000" strokeWidth="1" fill="none"/><rect x="1.5" y="1.5" width="13" height="9" rx="1" fill="#000"/><rect x="18.5" y="3.5" width="1.5" height="5" rx="0.75" fill="#000"/></svg>
    </div>
  </div>
);

const TextPreview: React.FC<TextPreviewProps> = ({
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  text,
  platform,
  fading,
}) => {
  const isIOS = platform === 'ios';

  const panelStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: '400px',
    backgroundColor: isIOS ? '#FFFFFF' : '#F2F2F2',
    borderRadius: isIOS ? '24px' : '4px',
    boxShadow: isIOS
      ? '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
      : '0 2px 12px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'opacity 0.4s ease',
    opacity: fading ? 0.3 : 1,
  };

  const contentStyle: React.CSSProperties = {
    padding: '16px 20px',
    fontFamily: `'${fontFamily}', ${isIOS ? "'-apple-system', 'BlinkMacSystemFont'" : "'Roboto', 'Noto Sans'"}, sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight: fontWeight,
    lineHeight: lineHeight,
    color: '#1F2937',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    flex: 1,
    WebkitFontSmoothing: isIOS ? 'antialiased' : 'auto',
    MozOsxFontSmoothing: isIOS ? 'grayscale' : 'auto',
    textRendering: isIOS ? 'optimizeLegibility' : 'geometricPrecision',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: isIOS ? '14px' : '10px',
    left: isIOS ? '24px' : '16px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: isIOS ? '#9CA3AF' : '#6B7280',
    zIndex: 1,
  };

  return (
    <div style={panelStyle}>
      <div style={{ position: 'relative' }}>
        <span style={labelStyle}>{isIOS ? 'iOS' : 'Android'}</span>
        {isIOS ? <IOSStatusBar /> : <AndroidStatusBar />}
      </div>
      <div style={contentStyle}>
        {text || '在此输入文字以预览效果...'}
      </div>
    </div>
  );
};

export default TextPreview;
