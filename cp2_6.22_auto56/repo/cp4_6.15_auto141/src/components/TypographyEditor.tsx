import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutEngine, type LayoutParams, type CharInfo } from '../modules/LayoutEngine';
import ControlPanel from './ControlPanel';

interface TypographyEditorProps {
  params: LayoutParams;
  onParamsChange: (params: Partial<LayoutParams>) => void;
  isMobile: boolean;
}

type PreviewMode = 'canvas' | 'dom';

interface TooltipPosition {
  x: number;
  y: number;
  charInfo: CharInfo;
}

const TypographyEditor: React.FC<TypographyEditorProps> = ({ params, onParamsChange, isMobile }) => {
  const [mode, setMode] = useState<PreviewMode>('canvas');
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const [showCanvas, setShowCanvas] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [showMobileTextInput, setShowMobileTextInput] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutEngineRef = useRef<LayoutEngine | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const prevHoveredRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      layoutEngineRef.current = new LayoutEngine();
      layoutEngineRef.current.setCanvas(canvasRef.current);
      layoutEngineRef.current.loadFont(params.fontFamily);
    }

    return () => {
      if (layoutEngineRef.current) {
        layoutEngineRef.current.destroy();
        layoutEngineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (layoutEngineRef.current) {
      layoutEngineRef.current.loadFont(params.fontFamily);
    }
  }, [params.fontFamily]);

  useEffect(() => {
    if (mode === 'canvas' && layoutEngineRef.current) {
      const renderTime = layoutEngineRef.current.render(params);
      if (renderTime > 8) {
        console.debug(`Canvas render took ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [params, mode]);

  const triggerCanvasRender = useCallback(() => {
    if (layoutEngineRef.current) {
      layoutEngineRef.current.render(params);
    }
  }, [params]);

  const handleModeChange = useCallback((newMode: PreviewMode) => {
    if (newMode === mode) return;
    
    setOpacity(0);
    
    setTimeout(() => {
      setMode(newMode);
      setShowCanvas(newMode === 'canvas');
      requestAnimationFrame(() => {
        setTimeout(() => {
          setOpacity(1);
        }, 20);
      });
    }, 150);
  }, [mode]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layoutEngineRef.current || !editorContainerRef.current) return;
    
    const charInfo = layoutEngineRef.current.getCharAtPosition(e.clientX, e.clientY);
    const currentHovered = layoutEngineRef.current.getHoveredCharIndex();
    
    if (prevHoveredRef.current !== currentHovered) {
      prevHoveredRef.current = currentHovered;
      triggerCanvasRender();
    }
    
    if (charInfo && editorContainerRef.current) {
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      setTooltip({
        x: e.clientX - containerRect.left + 15,
        y: e.clientY - containerRect.top - 45,
        charInfo
      });
    } else {
      if (tooltip !== null) {
        setTooltip(null);
      }
    }
  }, [tooltip, triggerCanvasRender]);

  const handleCanvasMouseLeave = useCallback(() => {
    if (layoutEngineRef.current) {
      layoutEngineRef.current.clearHover();
      prevHoveredRef.current = null;
      triggerCanvasRender();
    }
    setTooltip(null);
  }, [triggerCanvasRender]);

  const fontFamily = params.fontFamily.includes(' ') 
    ? `"${params.fontFamily}"` 
    : params.fontFamily;

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 72,
    maxHeight: 150,
    padding: '12px 16px',
    fontSize: 14,
    fontFamily: 'inherit',
    border: '2px solid #e8edf3',
    borderRadius: 10,
    resize: 'vertical',
    backgroundColor: 'white',
    color: '#1e3a5f',
    marginBottom: 16,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    lineHeight: 1.6
  };

  const previewAreaStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    overflow: 'hidden',
    borderRadius: 12,
    minHeight: 200,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: opacity
  };

  const modeButtonBase: React.CSSProperties = {
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  };

  return (
    <div 
      ref={editorContainerRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? 12 : 20,
        paddingBottom: isMobile ? 100 : 20,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f7f9fc'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          backgroundColor: 'white',
          padding: 5,
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          width: isMobile ? '100%' : 'auto'
        }}>
          <button
            onClick={() => handleModeChange('canvas')}
            style={{
              ...modeButtonBase,
              flex: isMobile ? 1 : 'auto',
              justifyContent: 'center',
              backgroundColor: mode === 'canvas' ? '#4a6fa5' : 'transparent',
              color: mode === 'canvas' ? 'white' : '#4a6fa5',
              boxShadow: mode === 'canvas' ? '0 2px 6px rgba(74, 111, 165, 0.3)' : 'none'
            }}
          >
            <span>🎨</span>
            <span>Canvas</span>
          </button>
          <button
            onClick={() => handleModeChange('dom')}
            style={{
              ...modeButtonBase,
              flex: isMobile ? 1 : 'auto',
              justifyContent: 'center',
              backgroundColor: mode === 'dom' ? '#4a6fa5' : 'transparent',
              color: mode === 'dom' ? 'white' : '#4a6fa5',
              boxShadow: mode === 'dom' ? '0 2px 6px rgba(74, 111, 165, 0.3)' : 'none'
            }}
          >
            <span>📝</span>
            <span>DOM</span>
          </button>
        </div>

        <div style={{
          fontSize: 12,
          color: '#6b7c93',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          backgroundColor: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
        }}>
          <span>🔤</span>
          <span style={{ fontWeight: 600, color: '#1e3a5f', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.fontFamily}
          </span>
          <span style={{ color: '#d1d9e6' }}>|</span>
          <span style={{ color: '#4a6fa5', fontWeight: 500 }}>{params.fontSize}px</span>
        </div>
      </div>

      {isMobile ? (
        <button
          onClick={() => setShowMobileTextInput(!showMobileTextInput)}
          style={{
            marginBottom: showMobileTextInput ? 12 : 16,
            padding: '10px 14px',
            backgroundColor: 'white',
            border: '2px solid #e8edf3',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            color: '#4a6fa5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
          }}
        >
          <span>✏️ 编辑文本</span>
          <span style={{ fontSize: 18 }}>{showMobileTextInput ? '−' : '+'}</span>
        </button>
      ) : null}

      {(!isMobile || showMobileTextInput) && (
        <textarea
          value={params.text}
          onChange={(e) => onParamsChange({ text: e.target.value })}
          placeholder="在此输入您要预览的文本内容...支持中英文混合排版。"
          style={textareaStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#4a6fa5';
            e.target.style.boxShadow = '0 0 0 3px rgba(74, 111, 165, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e8edf3';
            e.target.style.boxShadow = 'none';
          }}
        />
      )}

      <div style={previewAreaStyle}>
        {showCanvas ? (
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 200,
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(30, 58, 95, 0.04)',
              cursor: mode === 'canvas' ? 'crosshair' : 'default'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: 200,
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(30, 58, 95, 0.04)',
              padding: isMobile ? 24 : 48,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}
          >
            <p
              style={{
                fontFamily,
                fontSize: params.fontSize,
                lineHeight: params.lineHeight,
                letterSpacing: `${params.letterSpacing}em`,
                color: params.color,
                margin: 0,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text',
                cursor: 'text'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {params.text}
            </p>
          </div>
        )}

        {tooltip && showCanvas && (
          <div
            style={{
              position: 'absolute',
              left: Math.max(8, Math.min(tooltip.x, (editorContainerRef.current?.clientWidth ?? 800) - 150)),
              top: Math.max(8, tooltip.y),
              pointerEvents: 'none',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.98), rgba(74, 111, 165, 0.98))',
              color: 'white',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(30, 58, 95, 0.3)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 100
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <span style={{ 
                fontSize: 24, 
                fontFamily,
                lineHeight: 1,
                padding: '4px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 6
              }}>
                {tooltip.charInfo.char === ' ' ? '␣' : tooltip.charInfo.char}
              </span>
              <span style={{ 
                fontSize: 11, 
                opacity: 0.9, 
                fontFamily: 'monospace',
                padding: '2px 6px',
                backgroundColor: 'rgba(255, 107, 107, 0.3)',
                borderRadius: 4
              }}>
                {tooltip.charInfo.unicode}
              </span>
            </div>
            <div style={{
              fontSize: 10,
              opacity: 0.75,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>宽: {Math.round(tooltip.charInfo.width)}px</span>
              <span>高: {Math.round(tooltip.charInfo.height)}px</span>
            </div>
            <div style={{
              position: 'absolute',
              bottom: -5,
              left: 20,
              width: 10,
              height: 10,
              backgroundColor: 'rgba(74, 111, 165, 0.98)',
              transform: 'rotate(45deg)',
              zIndex: -1
            }} />
          </div>
        )}

        {showCanvas && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '4px 10px',
            backgroundColor: 'rgba(30, 58, 95, 0.85)',
            color: 'white',
            fontSize: 11,
            borderRadius: 6,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ 
              width: 8, 
              height: 2, 
              backgroundColor: 'rgba(255, 0, 0, 0.5)' 
            }}></span>
            <span>Baseline</span>
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              {layoutEngineRef.current?.getCharCount() ?? 0} chars
            </span>
          </div>
        )}

        {!showCanvas && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '4px 10px',
            backgroundColor: 'rgba(39, 174, 96, 0.85)',
            color: 'white',
            fontSize: 11,
            borderRadius: 6,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>📋</span>
            <span>DOM模式 - 文本可选中复制</span>
          </div>
        )}
      </div>

      {!isMobile && (
        <ControlPanel
          params={params}
          onChange={onParamsChange}
          isMobile={isMobile}
        />
      )}

      {isMobile && (
        <ControlPanel
          params={params}
          onChange={onParamsChange}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default TypographyEditor;
