import { useEffect, useCallback, useRef, useState } from 'react';
import { useStore, MONTHS, type Bookmark } from './store';
import SceneView from './components/SceneView';
import InfoPanel from './components/InfoPanel';

const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, sans-serif; overflow: hidden; background: #0A0A2E; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #1A1A2E; }
  ::-webkit-scrollbar-thumb { background: #2D2D44; border-radius: 2px; }
`;

export default function App() {
  const currentTime = useStore((s) => s.currentTime);
  const depthMode = useStore((s) => s.depthMode);
  const bookmarks = useStore((s) => s.bookmarks);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const toggleDepthMode = useStore((s) => s.toggleDepthMode);
  const addBookmark = useStore((s) => s.addBookmark);
  const removeBookmark = useStore((s) => s.removeBookmark);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = globalStyles;
    document.head.appendChild(styleEl);
    return () => { document.head.removeChild(styleEl); };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      toggleDepthMode();
    }
  }, [toggleDepthMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleAddBookmark = useCallback(() => {
    const canvas = sceneContainerRef.current?.querySelector('canvas');
    let thumbnail = '';
    if (canvas) {
      try {
        thumbnail = canvas.toDataURL('image/jpeg', 0.3);
      } catch {
        thumbnail = '';
      }
    }
    const store = useStore.getState();
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      cameraPosition: [0, 40, 60] as [number, number, number],
      cameraTarget: [0, 0, 0] as [number, number, number],
      time: store.currentTime,
      depthMode: store.depthMode,
      thumbnail,
    };
    addBookmark(bookmark);
  }, [addBookmark]);

  const handleBookmarkClick = useCallback((bookmark: Bookmark) => {
    setCurrentTime(bookmark.time);
    if (bookmark.depthMode !== depthMode) {
      toggleDepthMode();
    }
  }, [setCurrentTime, depthMode, toggleDepthMode]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0A0A2E',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div
        ref={sceneContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <SceneView />
      </div>

      {!isMobile && <InfoPanel />}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        background: '#2D2D44',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 10,
        gap: 4,
      }}>
        <span style={{
          color: '#B0B0D0',
          fontSize: 11,
          whiteSpace: 'nowrap',
          marginRight: 8,
          fontWeight: 600,
        }}>
          时间轴
        </span>
        <div style={{
          flex: 1,
          position: 'relative',
          height: 40,
          display: 'flex',
          alignItems: 'center',
        }}>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            style={{
              width: '100%',
              height: 6,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #6BCB77 ${((currentTime - 1) / 11) * 100}%, #1A1A2E ${((currentTime - 1) / 11) * 100}%)`,
              borderRadius: 3,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 2px',
            pointerEvents: 'none',
          }}>
            {MONTHS.map((m, i) => (
              <div key={i} style={{
                fontSize: 8,
                color: i + 1 === currentTime ? '#6BCB77' : '#666',
                textAlign: 'center',
                transform: 'translateX(-50%)',
                position: 'absolute',
                left: `${(i / 11) * 100}%`,
                top: -2,
                fontWeight: i + 1 === currentTime ? 700 : 400,
              }}>
                {m.slice(0, 1)}
              </div>
            ))}
          </div>
        </div>
        <span style={{
          color: '#6BCB77',
          fontSize: 13,
          fontWeight: 700,
          marginLeft: 8,
          whiteSpace: 'nowrap',
          minWidth: 50,
          textAlign: 'right',
        }}>
          {MONTHS[currentTime - 1]}
        </span>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6BCB77;
          cursor: pointer;
          border: 2px solid #0A0A2E;
          transition: background 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #8DDF8D;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6BCB77;
          cursor: pointer;
          border: 2px solid #0A0A2E;
        }
        input[type="range"]::-moz-range-thumb:hover {
          background: #8DDF8D;
        }
      `}</style>

      <div style={{
        position: 'absolute',
        right: isMobile ? 8 : 16,
        top: isMobile ? 8 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}>
        <button
          onClick={toggleDepthMode}
          style={{
            width: isMobile ? 36 : 120,
            height: isMobile ? 36 : 40,
            background: depthMode ? '#6BCB77' : '#2D2D44',
            color: depthMode ? '#0A0A2E' : '#B0B0D0',
            border: '1px solid ' + (depthMode ? '#6BCB77' : '#3D3D5C'),
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: isMobile ? 16 : 13,
            fontWeight: 600,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          title="切换深度剖面 (空格键)"
        >
          {isMobile ? '⬇' : depthMode ? '退出深度模式' : '深度剖面'}
        </button>

        <button
          onClick={() => setShowBookmarkPanel(!showBookmarkPanel)}
          style={{
            width: isMobile ? 36 : 120,
            height: isMobile ? 36 : 40,
            background: showBookmarkPanel ? '#FF6B6B' : '#2D2D44',
            color: showBookmarkPanel ? '#FFFFFF' : '#B0B0D0',
            border: '1px solid ' + (showBookmarkPanel ? '#FF6B6B' : '#3D3D5C'),
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: isMobile ? 16 : 13,
            fontWeight: 600,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          title="书签管理"
        >
          {isMobile ? '🔖' : '书签'}
        </button>

        {showBookmarkPanel && (
          <div style={{
            background: '#1A1A2E',
            borderRadius: 16,
            border: '1px solid #2D2D44',
            padding: 12,
            width: 220,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600 }}>
                视角书签
              </span>
              <span style={{ color: '#B0B0D0', fontSize: 11 }}>
                {bookmarks.length}/5
              </span>
            </div>

            <button
              onClick={handleAddBookmark}
              disabled={bookmarks.length >= 5}
              style={{
                width: '100%',
                height: 40,
                background: bookmarks.length >= 5 ? '#3D3D5C' : '#FF6B6B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                cursor: bookmarks.length >= 5 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 10,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (bookmarks.length < 5) e.currentTarget.style.background = '#FF8E8E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = bookmarks.length >= 5 ? '#3D3D5C' : '#FF6B6B';
              }}
            >
              + 添加书签
            </button>

            {bookmarks.length === 0 && (
              <div style={{
                color: '#666',
                fontSize: 12,
                textAlign: 'center',
                padding: '12px 0',
              }}>
                暂无书签
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 280,
              overflowY: 'auto',
            }}>
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: 6,
                    background: '#0A0A2E',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleBookmarkClick(bm)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A3E'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0A0A2E'; }}
                >
                  <div style={{
                    width: 80,
                    height: 60,
                    borderRadius: 4,
                    border: '1px solid #4A4A6A',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#0A0A2E',
                  }}>
                    {bm.thumbnail && (
                      <img
                        src={bm.thumbnail}
                        alt="bookmark"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: 0.8,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}>
                      {MONTHS[bm.time - 1]}
                    </div>
                    <div style={{ color: '#B0B0D0', fontSize: 10 }}>
                      {bm.depthMode ? '深度模式' : '标准视角'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmark(bm.id);
                      }}
                      style={{
                        marginTop: 4,
                        padding: '1px 6px',
                        background: 'transparent',
                        border: '1px solid #FF6B6B',
                        borderRadius: 4,
                        color: '#FF6B6B',
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <div style={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '6px 0',
          background: 'rgba(26,26,46,0.9)',
          borderRadius: '12px 12px 0 0',
          zIndex: 10,
        }}>
          <button
            onClick={toggleDepthMode}
            style={{
              padding: '6px 12px',
              background: depthMode ? '#6BCB77' : '#2D2D44',
              color: depthMode ? '#0A0A2E' : '#B0B0D0',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {depthMode ? '标准' : '深度'}
          </button>
          <button
            onClick={() => setShowBookmarkPanel(!showBookmarkPanel)}
            style={{
              padding: '6px 12px',
              background: '#2D2D44',
              color: '#B0B0D0',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔖 书签
          </button>
        </div>
      )}

      {isTablet && (
        <div style={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '8px 16px',
          background: 'rgba(26,26,46,0.9)',
          zIndex: 10,
        }}>
          <button
            onClick={toggleDepthMode}
            style={{
              padding: '8px 16px',
              background: depthMode ? '#6BCB77' : '#2D2D44',
              color: depthMode ? '#0A0A2E' : '#B0B0D0',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {depthMode ? '退出深度剖面' : '深度剖面模式'}
          </button>
          <button
            onClick={() => setShowBookmarkPanel(!showBookmarkPanel)}
            style={{
              padding: '8px 16px',
              background: '#2D2D44',
              color: '#B0B0D0',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            书签管理
          </button>
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#FFFFFF',
        fontSize: isMobile ? 14 : 18,
        fontWeight: 700,
        letterSpacing: 2,
        zIndex: 5,
        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}>
        全球洋流三维动态探索系统
      </div>
    </div>
  );
}
