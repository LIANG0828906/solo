import React, { useState } from 'react';
import {
  usePostGenerator,
  LayoutType,
  ColorSchemeType,
  FontType,
  COLOR_SCHEME_LIST,
  LAYOUT_LIST,
  FONT_LIST,
} from './hooks/usePostGenerator';
import PostPreview from './components/PostPreview';

const TITLE_MAX = 50;
const SUBTITLE_MAX = 100;

const App: React.FC = () => {
  const [title, setTitle] = useState('创意点亮生活');
  const [subtitle, setSubtitle] = useState('设计让世界更美好，每一个细节都值得被认真对待');
  const [layout, setLayout] = useState<LayoutType>('center');
  const [colorScheme, setColorScheme] = useState<ColorSchemeType>('gradient');
  const [font, setFont] = useState<FontType>('sans-serif');

  const { posterStyle, exportPoster, isExporting, previewRef } = usePostGenerator({
    title,
    subtitle,
    layout,
    colorScheme,
    font,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= TITLE_MAX) {
      setTitle(val);
    }
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= SUBTITLE_MAX) {
      setSubtitle(val);
    }
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#495057',
    marginBottom: '12px',
    letterSpacing: '0.02em',
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #DEE2E6',
    background: '#FFFFFF',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
    color: '#212529',
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        background: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* 左侧控制面板 */}
      <div
        style={{
          width: '280px',
          minWidth: '280px',
          background: '#F8F9FA',
          borderRight: '1px solid #DEE2E6',
          padding: '28px 24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          height: '100vh',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#212529',
              margin: 0,
              letterSpacing: '0.01em',
            }}
          >
            海报生成器
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: '#868E96',
              margin: '6px 0 0 0',
            }}
          >
            输入文案，即刻生成精美海报
          </p>
        </div>

        {/* 文案输入 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>标题文案</div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="请输入标题"
            maxLength={TITLE_MAX}
            style={inputBaseStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4A90D9';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,144,217,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#DEE2E6';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '6px',
              fontSize: '11px',
              color: title.length >= TITLE_MAX ? '#E03131' : '#ADB5BD',
            }}
          >
            {title.length}/{TITLE_MAX}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>副标题</div>
          <textarea
            value={subtitle}
            onChange={handleSubtitleChange}
            placeholder="请输入副标题"
            maxLength={SUBTITLE_MAX}
            rows={3}
            style={{
              ...inputBaseStyle,
              resize: 'none',
              lineHeight: 1.5,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4A90D9';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,144,217,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#DEE2E6';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '6px',
              fontSize: '11px',
              color: subtitle.length >= SUBTITLE_MAX ? '#E03131' : '#ADB5BD',
            }}
          >
            {subtitle.length}/{SUBTITLE_MAX}
          </div>
        </div>

        {/* 布局选项 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>排版布局</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {LAYOUT_LIST.map((item) => {
              const active = layout === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setLayout(item.key)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: active ? '#4A90D9' : '#FFFFFF',
                    border: active ? '1px solid #4A90D9' : '1px solid #DEE2E6',
                    transition: 'all 0.25s ease',
                    userSelect: 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: active ? '#FFFFFF' : '#212529',
                      marginBottom: '2px',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: active ? 'rgba(255,255,255,0.8)' : '#868E96',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 配色方案 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>配色方案</div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {COLOR_SCHEME_LIST.map((item) => {
              const active = colorScheme === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setColorScheme(item.key)}
                  title={item.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: item.swatch,
                    cursor: 'pointer',
                    border: active ? '3px solid #4A90D9' : '2px solid #DEE2E6',
                    boxSizing: 'border-box',
                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    transform: active ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: active ? '0 2px 8px rgba(74,144,217,0.3)' : 'none',
                    position: 'relative',
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              marginTop: '10px',
              fontSize: '11px',
              color: '#868E96',
            }}
          >
            当前：{COLOR_SCHEME_LIST.find((c) => c.key === colorScheme)?.name}
          </div>
        </div>

        {/* 字体选择 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>字体样式</div>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value as FontType)}
            style={{
              ...inputBaseStyle,
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage:
                'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23868E96\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
          >
            {FONT_LIST.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* 导出按钮 */}
        <div>
          <button
            onClick={exportPoster}
            disabled={isExporting}
            style={{
              width: '200px',
              height: '50px',
              borderRadius: '25px',
              background: '#4A90D9',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '0 auto',
              opacity: isExporting ? 0.9 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.background = '#357ABD';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(53,122,189,0.35)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4A90D9';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isExporting ? (
              <React.Fragment>
                <span
                  style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span>导出中...</span>
              </React.Fragment>
            ) : (
              <span>导出海报 PNG</span>
            )}
          </button>
        </div>
      </div>

      {/* 右侧预览区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          boxSizing: 'border-box',
          overflow: 'auto',
          background: '#E9ECEF',
        }}
      >
        <div
          style={{
            transition: 'transform 0.3s ease',
          }}
        >
          <PostPreview
            title={title}
            subtitle={subtitle}
            layout={layout}
            posterStyle={posterStyle}
            previewRef={previewRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>

      {/* 全局动画样式 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        body {
          margin: 0;
          padding: 0;
        }
        html, body, #root {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default App;
