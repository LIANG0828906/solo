import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarChart3D from './StarChart3D';
import StarInfoPanel from './StarInfoPanel';
import { useStarStore } from './store';
import { constellations, Constellation } from './starsData';

export default function App() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const {
    isChartUnfolded,
    viewMode,
    searchQuery,
    searchResult,
    favorites,
    selectedConstellation,
    setIsChartUnfolded,
    toggleViewMode,
    setSearchQuery,
    setSearchResult,
    setHighlightedConstellationId,
    setSelectedConstellation,
    setIsSearching,
    removeFavorite
  } = useStarStore();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const leftWidth = isMobile ? '60%' : '70%';
  const rightWidth = isMobile ? '40%' : '30%';

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      setHighlightedConstellationId(null);
      return;
    }

    const query = searchQuery.trim();
    const found = constellations.find(c => 
      c.name.includes(query) || 
      c.chineseName === query || 
      c.id === query
    );

    if (found) {
      setSearchResult(null);
      setHighlightedConstellationId(found.id);
      setIsSearching(true);
      setSelectedConstellation(found);
    } else {
      setSearchResult('未查到此宿');
      setHighlightedConstellationId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFavoriteClick = (constellationId: string) => {
    const c = constellations.find(c => c.id === constellationId);
    if (c) {
      setHighlightedConstellationId(constellationId);
      setIsSearching(true);
      setSelectedConstellation(c);
    }
  };

  const handleFoldClick = (c: Constellation) => {
    setSelectedConstellation(c);
    setHighlightedConstellationId(c.id);
  };

  const handleClosePanel = () => {
    setSelectedConstellation(null);
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: 'rgba(62, 39, 35, 0.9)',
    border: '2px solid #ffd700',
    borderRadius: '4px',
    color: '#ffd700',
    fontSize: '14px',
    fontFamily: 'SimSun, serif',
    cursor: 'pointer',
    letterSpacing: '2px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
  } as React.CSSProperties;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div
        style={{
          width: leftWidth,
          height: '100%',
          position: 'relative',
          transition: 'width 0.3s ease'
        }}
      >
        <StarChart3D onFoldClick={handleFoldClick} />

        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10
        }}>
          <button
            onClick={() => setIsChartUnfolded(!isChartUnfolded)}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(62, 39, 35, 1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(62, 39, 35, 0.9)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            }}
          >
            {isChartUnfolded ? '收起星图' : '展开星图'}
          </button>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10
        }}>
          <button
            onClick={toggleViewMode}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(62, 39, 35, 1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(62, 39, 35, 0.9)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            }}
          >
            {viewMode === 'dome' ? '星图正面视角' : '3D穹顶视角'}
          </button>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(62, 39, 35, 0.9)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #ffd70040'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入星宿名称..."
            style={{
              width: isMobile ? '120px' : '160px',
              padding: '8px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid #ffd70040',
              borderRadius: '3px',
              color: '#f5f5dc',
              fontSize: '13px',
              fontFamily: 'SimSun, serif',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#ffd700';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#ffd70040';
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffd700',
              border: 'none',
              borderRadius: '3px',
              color: '#3e2723',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'SimSun, serif',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffe44d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffd700';
            }}
          >
            查询
          </button>
          <AnimatePresence>
            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: '#ff6b6b',
                  fontSize: '12px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap'
                }}
              >
                {searchResult}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          padding: '12px 20px',
          backgroundColor: 'rgba(62, 39, 35, 0.8)',
          borderRadius: '4px',
          border: '1px solid #ffd70040'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            color: '#ffd700',
            fontFamily: 'SimSun, serif',
            letterSpacing: '6px',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
          }}>
            敦煌星图·司天台
          </h1>
          <div style={{
            fontSize: '11px',
            color: '#f5f5dc80',
            marginTop: '4px',
            letterSpacing: '2px'
          }}>
            唐代长安司天台 · 二十八宿
          </div>
        </div>
      </div>

      <div
        style={{
          width: rightWidth,
          height: '100%',
          transition: 'width 0.3s ease'
        }}
      >
        <StarInfoPanel onClose={handleClosePanel} />
      </div>

      <AnimatePresence>
        {favorites.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderTop: '1px solid #ffd70040',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: '10px',
              zIndex: 100,
              overflowX: isMobile ? 'auto' : 'visible'
            }}
          >
            <span style={{
              color: '#ffd700',
              fontSize: '13px',
              fontFamily: 'SimSun, serif',
              letterSpacing: '2px',
              whiteSpace: 'nowrap'
            }}>
              ★ 收藏：
            </span>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: isMobile ? 'auto' : 'visible',
              padding: isMobile ? '0 10px' : 0
            }}>
              {favorites.map(favId => {
                const c = constellations.find(c => c.id === favId);
                if (!c) return null;
                return (
                  <motion.button
                    key={favId}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFavoriteClick(favId)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: selectedConstellation?.id === favId ? '#ffd70030' : '#ffd70015',
                      border: '1px solid #ffd70060',
                      borderRadius: '3px',
                      color: '#ffd700',
                      fontSize: '13px',
                      fontFamily: 'SimSun, serif',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffd70030';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedConstellation?.id === favId ? '#ffd70030' : '#ffd70015';
                    }}
                  >
                    {c.name}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(favId);
                      }}
                      style={{
                        fontSize: '10px',
                        opacity: 0.6,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLSpanElement).style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLSpanElement).style.opacity = '0.6';
                      }}
                    >
                      ×
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
