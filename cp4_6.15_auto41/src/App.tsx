import { useState, useEffect } from 'react';
import { StallServiceProvider, useStallService } from '@/modules/map/stallService';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { FavoritesProvider, useFavorites } from '@/context/FavoritesContext';
import MapContainer from '@/modules/map/MapContainer';
import StallList from '@/modules/market/stallList';
import StallDetail from '@/modules/market/stallDetail';
import { Category, CATEGORY_LABELS } from '@/types';

function Header() {
  const { theme } = useTheme();
  const { favorites } = useFavorites();
  const { stalls, activeCategories, toggleCategory } = useStallService();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openStalls = stalls.filter(s => s.isOpen).length;
  const totalStalls = stalls.length;

  const categories: { key: Category; icon: string }[] = [
    { key: 'handcraft', icon: '🎨' },
    { key: 'books', icon: '📚' },
    { key: 'clothing', icon: '👕' },
    { key: 'electronics', icon: '💻' },
    { key: 'food', icon: '🍪' }
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled
          ? 'rgba(255, 248, 231, 0.98)'
          : 'rgba(255, 248, 231, 0.95)',
        backdropFilter: scrolled ? 'blur(12px)' : 'blur(8px)',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'blur(8px)',
        padding: '12px 16px',
        transition: 'all 0.3s ease',
        boxShadow: scrolled
          ? '0 2px 16px rgba(139, 115, 85, 0.12)'
          : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(139, 115, 85, 0.08)'
          : 'none'
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: `0 4px 14px rgba(139, 115, 85, 0.3)`,
            transition: 'transform 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) rotate(-6deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            }}
          >
            🎪
          </div>
          <div>
            <h1 style={{
              fontSize: '19px',
              fontWeight: 800,
              color: theme.primary,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '0.5px'
            }}>
              周末集市
            </h1>
            <div style={{
              fontSize: '11px',
              color: '#999',
              marginTop: '2px',
              fontWeight: 500
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#7CB342',
                marginRight: '5px',
                animation: 'pulse 2s infinite',
                verticalAlign: 'middle'
              }} />
              {openStalls}/{totalStalls} 营业中
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div
            style={{
              position: 'relative',
              padding: '8px 14px',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <span style={{ fontSize: '15px' }}>❤️</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#E74C3C'
            }}>
              {favorites.length}
            </span>
            {favorites.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#FF6B6B',
                border: '2px solid white',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </div>

          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              cursor: 'pointer',
              boxShadow: `0 2px 8px rgba(124, 179, 66, 0.3)`,
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            👤
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '12px auto 0',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: '2px',
        scrollSnapType: 'x mandatory'
      }}>
        {categories.map(({ key, icon }) => {
          const isActive = activeCategories.has(key);
          const count = stalls.filter(s => s.category === key).length;
          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '18px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive
                  ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                  : 'rgba(255,255,255,0.8)',
                color: isActive ? 'white' : '#666',
                border: isActive ? 'none' : '1px solid rgba(139,115,85,0.15)',
                boxShadow: isActive
                  ? '0 2px 8px rgba(139,115,85,0.25)'
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                scrollSnapAlign: 'start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>{icon}</span>
              <span>{CATEGORY_LABELS[key]}</span>
              <span style={{
                fontSize: '10px',
                opacity: 0.75,
                background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                padding: '1px 5px',
                borderRadius: '10px',
                fontWeight: 500
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 768px) {
          header h1 {
            font-size: 17px !important;
          }

          header > div:first-child > div:last-child {
            gap: 8px !important;
          }
        }

        @media (max-width: 480px) {
          header {
            padding: 10px 14px !important;
          }

          header h1 {
            font-size: 16px !important;
          }

          header > div:first-child > div:first-child > div:first-child {
            width: 36px !important;
            height: 36px !important;
            font-size: 18px !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </header>
  );
}

function MapToolbar() {
  const { activeCategories, toggleCategory, stalls } = useStallService();

  const categories: { key: Category; icon: string; color: string }[] = [
    { key: 'handcraft', icon: '🎨', color: '#D4A574' },
    { key: 'books', icon: '📚', color: '#6B8E23' },
    { key: 'clothing', icon: '👕', color: '#E67E22' },
    { key: 'electronics', icon: '💻', color: '#3498DB' },
    { key: 'food', icon: '🍪', color: '#E74C3C' }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 500,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px 12px',
      background: 'rgba(255, 248, 231, 0.96)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      maxWidth: 'calc(100% - 28px)',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {categories.map(({ key, icon, color }) => {
        const isActive = activeCategories.has(key);
        const count = stalls.filter(s => s.category === key).length;
        return (
          <button
            key={key}
            onClick={() => toggleCategory(key)}
            aria-label={`${CATEGORY_LABELS[key]}筛选`}
            style={{
              padding: '6px 12px',
              borderRadius: '14px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: isActive ? color : 'rgba(255,255,255,0.9)',
              color: isActive ? 'white' : '#666',
              boxShadow: isActive ? `0 2px 8px ${color}40` : 'none',
              opacity: count === 0 ? 0.5 : 1,
              cursor: count === 0 ? 'not-allowed' : 'pointer',
              border: isActive ? 'none' : '1px solid rgba(0,0,0,0.05)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (count > 0) {
                e.currentTarget.style.transform = 'scale(1.06)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{icon}</span>
            <span style={{
              display: 'none'
            }} className="map-cat-label">
              {CATEGORY_LABELS[key]}
            </span>
            <span style={{
              fontSize: '10px',
              opacity: isActive ? 0.9 : 0.6,
              background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {count}
            </span>
          </button>
        );
      })}

      <style>{`
        @media (min-width: 480px) {
          .map-cat-label {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}

function AppContent() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-color)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />

      <main style={{ flex: 1 }}>
        <div style={{ position: 'relative' }}>
          <MapContainer />
          <MapToolbar />
        </div>

        <div style={{
          padding: '6px 0 24px'
        }}>
          <StallList />
        </div>
      </main>

      <StallDetail />

      <footer style={{
        padding: '20px 16px 32px',
        textAlign: 'center',
        color: '#aaa',
        fontSize: '12px',
        borderTop: '1px solid rgba(139, 115, 85, 0.08)',
        background: 'rgba(255, 248, 231, 0.5)'
      }}>
        <div style={{
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#888'
        }}>
          🎪 周末集市 · 发现身边的小美好
        </div>
        <div style={{ opacity: 0.7 }}>
          © 2026 Weekend Market · Made with 💚
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <StallServiceProvider>
          <AppContent />
        </StallServiceProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
