import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import TextPreview from './components/TextPreview';
import { loadAllFonts, getFontList, FontInfo } from './utils/fontLoader';

interface Preset {
  label: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  fontFamily: string;
}

const PRESETS: Preset[] = [
  { label: '标题：新闻体', text: '重大突破：科技创新引领未来发展方向', fontSize: 36, fontWeight: 700, lineHeight: 1.3, fontFamily: 'Noto Sans SC' },
  { label: '正文：阅读体', text: '在数字时代，字体排版的优劣直接影响阅读体验。好的排版应当让读者忽略形式，沉浸于内容之中。', fontSize: 16, fontWeight: 400, lineHeight: 1.8, fontFamily: 'Noto Serif SC' },
  { label: '引语：文楷体', text: '书山有路勤为径，学海无涯苦作舟。', fontSize: 24, fontWeight: 400, lineHeight: 1.6, fontFamily: 'LXGW WenKai' },
  { label: 'UI：界面体', text: '确认删除此项目？此操作不可撤销。', fontSize: 14, fontWeight: 400, lineHeight: 1.5, fontFamily: 'Roboto' },
  { label: '展示：艺术体', text: '创意无限 设计未来', fontSize: 42, fontWeight: 400, lineHeight: 1.2, fontFamily: 'ZCOOL QingKe HuangYou' },
];

const WEIGHT_MAP: Record<string, number> = {
  Light: 300,
  Regular: 400,
  Bold: 700,
};

const App: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [text, setText] = useState('');
  const [fontFamily, setFontFamily] = useState('Noto Sans SC');
  const [fontSize, setFontSize] = useState(18);
  const [fontWeightLabel, setFontWeightLabel] = useState('Regular');
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fading, setFading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const compareRef = useRef<HTMLDivElement>(null);
  const fontListRef = useRef<FontInfo[]>([]);

  useEffect(() => {
    fontListRef.current = getFontList();
    loadAllFonts().then(() => setFontsLoaded(true));
  }, []);

  const fontWeight = WEIGHT_MAP[fontWeightLabel] || 400;

  const triggerFading = useCallback((callback?: () => void) => {
    setFading(true);
    setTimeout(() => {
      callback?.();
      setFading(false);
    }, 200);
  }, []);

  const handlePresetClick = useCallback((preset: Preset) => {
    setFading(true);
    setTimeout(() => {
      setText(preset.text);
      setFontFamily(preset.fontFamily);
      setFontSize(preset.fontSize);
      setFontWeightLabel(
        preset.fontWeight === 300 ? 'Light' : preset.fontWeight === 700 ? 'Bold' : 'Regular'
      );
      setLineHeight(preset.lineHeight);
      setFading(false);
    }, 200);
  }, []);

  const handleExport = useCallback(async () => {
    if (!compareRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(compareRef.current, {
        backgroundColor: '#F3F4F6',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, 'font-render-compare.png');
        }
        setExporting(false);
      }, 'image/png');
    } catch {
      setExporting(false);
    }
  }, [exporting]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 200) {
      setText(val);
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: '-apple-system, sans-serif',
        color: '#6B7280',
        fontSize: '16px',
      }}>
        正在加载字体资源...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '48px',
        backgroundColor: '#1F2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}>
          字体排版测试 — 跨平台渲染对比
        </h1>
      </header>

      <div style={{ padding: '20px 20px 0', maxWidth: '100%' }}>
        <div style={{
          width: '80%',
          maxWidth: '700px',
          margin: '0 auto 24px',
          position: 'relative',
        }}>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="输入测试文字..."
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              border: '2px solid #D1D5DB',
              borderRadius: '10px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              fontFamily: '-apple-system, sans-serif',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <span style={{
            position: 'absolute',
            right: '14px',
            bottom: '-20px',
            fontSize: '12px',
            color: text.length >= 190 ? '#EF4444' : '#9CA3AF',
          }}>
            {text.length}/200
          </span>
        </div>
      </div>

      <div className="app-layout" style={{
        display: 'flex',
        gap: '20px',
        padding: '0 20px 20px',
        alignItems: 'flex-start',
      }}>
        <aside className="control-panel" style={{
          width: '280px',
          minWidth: '280px',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: '68px',
        }}>
          <ControlRow label="字体家族">
            <select
              value={fontFamily}
              onChange={(e) => {
                const v = e.target.value;
                triggerFading(() => setFontFamily(v));
              }}
              style={selectStyle}
            >
              {fontListRef.current.map(f => (
                <option key={f.family} value={f.family}>{f.label}</option>
              ))}
            </select>
          </ControlRow>

          <ControlRow label={`字号 ${fontSize}px`}>
            <input
              type="range"
              min={12}
              max={72}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={sliderStyle}
            />
          </ControlRow>

          <ControlRow label="字重">
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Light', 'Regular', 'Bold'].map(w => (
                <button
                  key={w}
                  onClick={() => triggerFading(() => setFontWeightLabel(w))}
                  style={{
                    ...weightBtnStyle,
                    backgroundColor: fontWeightLabel === w ? '#3B82F6' : '#FFFFFF',
                    color: fontWeightLabel === w ? '#FFFFFF' : '#374151',
                    borderColor: fontWeightLabel === w ? '#3B82F6' : '#D1D5DB',
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </ControlRow>

          <ControlRow label={`行高 ${lineHeight.toFixed(1)}`}>
            <input
              type="range"
              min={1.0}
              max={2.0}
              step={0.1}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              style={sliderStyle}
            />
          </ControlRow>

          <div style={{
            borderTop: '1px solid #E5E7EB',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
              预设排版
            </span>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                style={presetBtnStyle}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={compareRef}
            className="compare-area"
            style={{
              display: 'flex',
              gap: '20px',
            }}
          >
            <TextPreview
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={fontWeight}
              lineHeight={lineHeight}
              text={text}
              platform="ios"
              fading={fading}
            />
            <TextPreview
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={fontWeight}
              lineHeight={lineHeight}
              text={text}
              platform="android"
              fading={fading}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                ...exportBtnStyle,
                opacity: exporting ? 0.7 : 1,
                cursor: exporting ? 'not-allowed' : 'pointer',
              }}
            >
              {exporting ? '正在导出...' : '导出截图'}
            </button>
          </div>
        </main>
      </div>

      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, #3B82F6, #60A5FA);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, #3B82F6, #60A5FA);
        }

        @media (max-width: 1000px) {
          .app-layout {
            flex-direction: column !important;
          }
          .control-panel {
            width: 100% !important;
            min-width: unset !important;
            position: static !important;
          }
        }

        @media (max-width: 800px) {
          .compare-area {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

const ControlRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }}>
    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{label}</label>
    {children}
  </div>
);

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '13px',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  color: '#374151',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  cursor: 'pointer',
};

const weightBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const presetBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease',
};

const exportBtnStyle: React.CSSProperties = {
  padding: '10px 28px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#FFFFFF',
  backgroundColor: '#3B82F6',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

export default App;
