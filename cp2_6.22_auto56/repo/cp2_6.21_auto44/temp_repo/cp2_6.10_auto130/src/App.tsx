import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './store';
import { MaterialPanel } from './components/MaterialPanel';
import { PaperCanvas } from './components/PaperCanvas';
import { ColorSchemePanel } from './components/ColorSchemePanel';
import { StatusBar } from './components/StatusBar';
import { ExportButton } from './components/ExportButton';
import { playDropSound } from './utils/audioUtils';

function App() {
  const { toggleGrid, gridVisible, paperSize, setPaperSize, loadFromStorage, clearAll } =
    useAppStore();

  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setIsLoaded(true);
  }, [loadFromStorage]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (viewportWidth < 768) {
      setPaperSize(350, 250);
    } else if (viewportWidth > 1200) {
      setPaperSize(750, 500);
    } else {
      setPaperSize(600, 400);
    }
  }, [viewportWidth, setPaperSize]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        toggleGrid();
        playDropSound();
      }
      if (e.key.toLowerCase() === 'c' && e.ctrlKey) {
        e.preventDefault();
      }
    },
    [toggleGrid]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const thumbnailSize = viewportWidth < 768 ? 35 : 50;
  const gridSize = viewportWidth < 768 ? 30 : 50;
  const snapDistance = 10;
  const materialColumns = viewportWidth > 1200 ? 2 : 1;
  const isMobile = viewportWidth < 768;

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%)',
        }}
      >
        <div
          className="text-2xl"
          style={{
            fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
            color: '#f5e6c8',
          }}
        >
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: `
          linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )
        `,
        backgroundBlendMode: 'multiply',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6">
          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{
              fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
              color: '#f5e6c8',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.2em',
            }}
          >
            花草笺
          </h1>
          <p
            className="text-sm opacity-80"
            style={{
              fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
              color: '#d7ccc8',
            }}
          >
            花样排版与配色推演
          </p>
        </header>

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 items-start`}>
          <aside className={`${isMobile ? 'w-full' : 'w-48 xl:w-64'} flex-shrink-0`}>
            <MaterialPanel thumbnailSize={thumbnailSize} columns={materialColumns} />
          </aside>

          <main className="flex-1 flex flex-col items-center gap-4">
            <div className="relative">
              <PaperCanvas
                width={paperSize.width}
                height={paperSize.height}
                gridSize={gridSize}
                snapDistance={snapDistance}
              />

              {!isMobile && (
                <div className="absolute top-0 right-0 transform translate-x-full ml-4">
                  <ColorSchemePanel layout="vertical" />
                </div>
              )}
            </div>

            {isMobile && (
              <div className="w-full">
                <ColorSchemePanel layout="horizontal" />
              </div>
            )}

            <div className="flex gap-4 items-center">
              <ExportButton />
              <button
                onClick={clearAll}
                className="px-4 py-2 rounded text-sm transition-all duration-200"
                style={{
                  fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
                  color: '#f5e6c8',
                  background: 'rgba(62, 39, 35, 0.8)',
                  border: '1px solid #f5e6c8',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(1px)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                清空
              </button>
            </div>

            <div className="text-xs text-center opacity-70" style={{ color: '#d7ccc8' }}>
              快捷键：F 键切换网格 | Delete 键删除选中素材 | 拖拽素材至笺纸放置
            </div>
          </main>
        </div>

        <footer className="mt-6 flex justify-center">
          <StatusBar />
        </footer>
      </div>
    </div>
  );
}

export default App;
