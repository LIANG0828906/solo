import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutEngine, type LayoutParams, type CharInfo } from '../modules/LayoutEngine';
import ControlPanel from './ControlPanel';

interface TypographyEditorProps {
  params: LayoutParams;
  onParamsChange: (params: Partial<LayoutParams>) => void;
  isMobile: boolean;
}

type PreviewMode = 'canvas' | 'dom';

const TypographyEditor: React.FC<TypographyEditorProps> = ({ params, onParamsChange, isMobile }) => {
  const [mode, setMode] = useState<PreviewMode>('canvas');
  const [hoveredChar, setHoveredChar] = useState<CharInfo | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const layoutEngineRef = useRef<LayoutEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      layoutEngineRef.current = new LayoutEngine();
      layoutEngineRef.current.setCanvas(canvasRef.current);
      layoutEngineRef.current.loadFont(params.fontFamily);
    }

    return () => {
      if (layoutEngineRef.current) {
        layoutEngineRef.current.destroy();
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
        console.warn(`Canvas render took ${renderTime.toFixed(2)}ms, target is <8ms`);
      }
    }
  }, [params, mode]);

  const handleModeChange = useCallback((newMode: PreviewMode) => {
    if (newMode === mode) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);
    }, 150);
  }, [mode]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'canvas' || !layoutEngineRef.current) return;
    
    const charInfo = layoutEngineRef.current.getCharAtPosition(e.clientX, e.clientY);
    setHoveredChar(charInfo);
    
    if (charInfo) {
      layoutEngineRef.current.render(params);
    } else {
      layoutEngineRef.current.clearHover();
      layoutEngineRef.current.render(params);
    }
  }, [mode, params]);

  const handleCanvasMouseLeave = useCallback(() => {
    if (layoutEngineRef.current) {
      layoutEngineRef.current.clearHover();
      layoutEngineRef.current.render(params);
      setHoveredChar(null);
    }
  }, [params]);

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 60,
    padding: '12px 16px',
    fontSize: 14,
    fontFamily: 'inherit',
    border: '1px solid #d1d9e6',
    borderRadius: 6,
    resize: 'none',
    backgroundColor: 'white',
    color: '#1e3a5f',
    marginBottom: 16
  };

  const fontFamily = params.fontFamily.includes(' ') 
    ? `"${params.fontFamily}"` 
    : params.fontFamily;

  const canvasContainerStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isTransitioning ? 0 : 1
  };

  return (
    <div ref={containerRef} style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? 16 : 24,
      paddingBottom: isMobile ? 100 : 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <button
            onClick={() => handleModeChange('canvas')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              backgroundColor: mode === 'canvas' ? '#4a6fa5' : 'transparent',
              color: mode === 'canvas' ? 'white' : '#4a6fa5',
              transition: 'all 0.2s'
            }}
          >
            Canvas 模式
          </button>
          <button
            onClick={() => handleModeChange('dom')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              backgroundColor: mode === 'dom' ? '#4a6fa5' : 'transparent',
              color: mode === 'dom' ? 'white' : '#4a6fa5',
              transition: 'all 0.2s'
            }}
          >
            DOM 模式
          </button>
        </div>

        <div style={{
          fontSize: 13,
          color: '#6b7c93'
        }}>
          当前字体: <span style={{ fontWeight: 600, color: '#1e3a5f' }}>{params.fontFamily}</span>
        </div>
      </div>

      {!isMobile && (
        <textarea
          ref={textareaRef}
          value={params.text}
          onChange={(e) => onParamsChange({ text: e.target.value })}
          placeholder="输入您的文本..."
          style={textareaStyle}
        />
      )}

      <div style={canvasContainerStyle}>
        {mode === 'canvas' ? (
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              padding: 40,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="fade-in"
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
                userSelect: 'text'
              }}
            >
              {params.text}
            </p>
          </div>
        )}

        {hoveredChar && (
          <div
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              padding: '6px 12px',
              backgroundColor: 'rgba(30, 58, 95, 0.95)',
              color: 'white',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <span style={{ marginRight: 8 }}>{hoveredChar.char}</span>
            <span style={{ opacity: 0.8 }}>{hoveredChar.unicode}</span>
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
