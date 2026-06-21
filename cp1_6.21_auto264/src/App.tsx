import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Paintbrush, Menu, X } from 'lucide-react';
import CodeEditor from './modules/editor/CodeEditor';
import StylePalette from './modules/palette/StylePalette';
import ScreenshotExporter from './modules/exporter/ScreenshotExporter';

const MIN_EDITOR_WIDTH = 400;
const MIN_PALETTE_WIDTH = 320;
const DEFAULT_PALETTE_WIDTH = 400;
const MOBILE_BREAKPOINT = 768;

const App: React.FC = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paletteWidth, setPaletteWidth] = useState<number>(DEFAULT_PALETTE_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) {
        setShowMobilePalette(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) return;
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = paletteWidth;
    const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      let newWidth = startWidth + deltaX;
      const maxPaletteWidth = containerWidth - MIN_EDITOR_WIDTH - 4;
      newWidth = Math.max(MIN_PALETTE_WIDTH, Math.min(newWidth, maxPaletteWidth));
      setPaletteWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [paletteWidth, isMobile]);

  const editorFlexBasis = isMobile ? '100%' : `calc(100% - ${paletteWidth}px - 4px)`;

  return (
    <div className="h-screen w-screen flex flex-col bg-app-bg text-text-primary overflow-hidden">
      <nav
        className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{
          height: '56px',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Paintbrush size={18} className="text-white" />
          </div>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: '20px',
              color: '#F8FAFC',
            }}
          >
            代码调色板
          </h1>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-panel-bg text-text-secondary border border-border-primary">
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isMobile && (
            <button
              onClick={() => setShowMobilePalette(!showMobilePalette)}
              className="md:hidden p-2 rounded-lg bg-panel-bg border border-border-primary text-text-primary hover:border-accent transition-colors"
            >
              {showMobilePalette ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
          <ScreenshotExporter targetRef={exportRef as React.RefObject<HTMLElement | null>} />
        </div>
      </nav>

      <div
        ref={containerRef}
        className="flex-1 flex relative overflow-hidden"
        style={{
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <div
          style={{
            flexBasis: editorFlexBasis,
            flexShrink: 0,
            flexGrow: isMobile ? 1 : 0,
            minHeight: isMobile && showMobilePalette ? '50%' : '0',
            overflow: 'hidden',
          }}
        >
          <CodeEditor forwardRef={exportRef as React.RefObject<HTMLDivElement | null>} />
        </div>

        {!isMobile && (
          <div
            onMouseDown={handleDividerMouseDown}
            className={`divider-handle flex-shrink-0 relative group ${
              isDragging ? 'dragging' : ''
            }`}
            style={{
              width: '4px',
              backgroundColor: isDragging ? '#3B82F6' : '#475569',
              cursor: 'col-resize',
              transition: isDragging ? 'none' : 'background-color 0.2s ease',
            }}
          >
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
                isDragging ? 'bg-accent scale-110' : 'bg-border-secondary group-hover:bg-accent group-hover:scale-110'
              }`}
              style={{
                width: '20px',
                height: '36px',
                boxShadow: isDragging ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                <div
                  className="w-0.5 rounded-full"
                  style={{
                    height: '16px',
                    backgroundColor: isDragging ? '#F8FAFC' : '#94A3B8',
                  }}
                />
                <div
                  className="w-0.5 rounded-full"
                  style={{
                    height: '16px',
                    backgroundColor: isDragging ? '#F8FAFC' : '#94A3B8',
                  }}
                />
                <div
                  className="w-0.5 rounded-full"
                  style={{
                    height: '16px',
                    backgroundColor: isDragging ? '#F8FAFC' : '#94A3B8',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            flexBasis: isMobile ? (showMobilePalette ? '50%' : '0px') : `${paletteWidth}px`,
            flexShrink: 0,
            flexGrow: 0,
            overflow: 'hidden',
            transition: isMobile ? 'flex-basis 0.3s ease' : 'none',
            borderLeft: isMobile ? 'none' : undefined,
            borderTop: isMobile && showMobilePalette ? '1px solid #334155' : 'none',
          }}
        >
          <StylePalette />
        </div>
      </div>
    </div>
  );
};

export default App;
