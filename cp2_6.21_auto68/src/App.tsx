import React, { useState, useCallback } from 'react';
import { TextConfig } from './TextConfig';
import { CanvasDisplay } from './CanvasDisplay';
import { TemplateSelector } from './TemplateSelector';
import { DecorConfig } from './DecorConfig';
import {
  exportToPNG,
  downloadPNG,
  type TextConfig as TextConfigType,
  type BackgroundTemplate,
  type DecorElement,
  type DecorShape,
  type PosterConfig,
} from './CanvasRenderer';

const defaultTextConfig: TextConfigType = {
  title: '你的标题文字',
  subtitle: '副标题或描述文字',
  fontFamily: 'Arial',
  titleSize: 48,
  subtitleSize: 24,
  color: '#ffffff',
  shadow: {
    offsetX: 2,
    offsetY: 2,
    blur: 8,
    color: 'rgba(0,0,0,0.3)',
  },
  stroke: {
    width: 0,
    color: '#000000',
  },
};

let decorIdCounter = 0;
const generateDecorId = () => `decor-${++decorIdCounter}`;

const createDecorElement = (shape: DecorShape): DecorElement => ({
  id: generateDecorId(),
  shape,
  size: 40,
  color: '#ff6b6b',
  x: 50,
  y: 50,
  rotation: 0,
});

export const App: React.FC = () => {
  const [textConfig, setTextConfig] = useState<TextConfigType>(defaultTextConfig);
  const [background, setBackground] = useState<BackgroundTemplate>('gradient-linear');
  const [decorations, setDecorations] = useState<DecorElement[]>([]);
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);
  const [isBgTransitioning, setIsBgTransitioning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const posterConfig: PosterConfig = {
    text: textConfig,
    background,
    decorations,
  };

  const handleBackgroundChange = useCallback((template: BackgroundTemplate) => {
    setIsBgTransitioning(true);
    setTimeout(() => {
      setBackground(template);
      setTimeout(() => {
        setIsBgTransitioning(false);
      }, 50);
    }, 150);
  }, []);

  const handleAddDecor = useCallback((shape: DecorShape) => {
    if (decorations.length >= 3) return;
    const newDecor = createDecorElement(shape);
    setDecorations((prev) => [...prev, newDecor]);
    setSelectedDecorId(newDecor.id);
  }, [decorations.length]);

  const handleUpdateDecor = useCallback((id: string, updates: Partial<DecorElement>) => {
    setDecorations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const handleRemoveDecor = useCallback((id: string) => {
    setDecorations((prev) => prev.filter((d) => d.id !== id));
    if (selectedDecorId === id) {
      setSelectedDecorId(null);
    }
  }, [selectedDecorId]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await exportToPNG(posterConfig);
      downloadPNG(blob);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, posterConfig]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#212529',
              margin: 0,
            }}
          >
            动态文字海报生成器
          </h1>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: isExporting ? '#adb5bd' : '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isExporting ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.backgroundColor = '#5a6fd6';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isExporting ? '#adb5bd' : '#667eea';
              e.currentTarget.style.boxShadow = isExporting ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.3)';
            }}
          >
            {isExporting ? '导出中...' : '导出 PNG'}
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <TemplateSelector
            selected={background}
            onChange={handleBackgroundChange}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-start',
          }}
          className="main-layout"
        >
          <div
            style={{
              flex: '0 0 68%',
              maxWidth: '68%',
            }}
            className="canvas-section"
          >
            <CanvasDisplay
              config={posterConfig}
              selectedDecorId={selectedDecorId}
              onSelectDecor={setSelectedDecorId}
              onUpdateDecor={handleUpdateDecor}
              isBgTransitioning={isBgTransitioning}
            />
            <div
              style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#adb5bd',
                textAlign: 'center',
              }}
            >
              画布尺寸 640 × 480 px · 导出 2x 高清 1280 × 960 px
            </div>
          </div>

          <div
            style={{
              flex: '1',
              minWidth: 0,
            }}
            className="config-panel"
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '16px',
              }}
            >
              <TextConfig config={textConfig} onChange={setTextConfig} />
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '16px',
                marginTop: '16px',
              }}
            >
              <DecorConfig
                decorations={decorations}
                selectedId={selectedDecorId}
                onSelect={setSelectedDecorId}
                onAdd={handleAddDecor}
                onUpdate={handleUpdateDecor}
                onRemove={handleRemoveDecor}
                maxCount={3}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .main-layout {
            flex-direction: column !important;
          }
          .canvas-section {
            flex: 1 1 auto !important;
            max-width: 100% !important;
            width: 100%;
          }
          .config-panel {
            width: 100%;
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: all 0.15s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #5a6fd6;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .canvas-wrapper:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};
