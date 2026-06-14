import { useState, useEffect } from 'react';
import { StallServiceProvider, useStallService } from '@/modules/map/stallService';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { FavoritesProvider, useFavorites } from '@/context/FavoritesContext';
import MapContainer from '@/modules/map/MapContainer';
import StallList from '@/modules/market/stallList';
import StallDetail from '@/modules/market/stallDetail';

function Header() {
  const { theme } = useTheme();
  const { favorites } = useFavorites();
  const { stalls } = useStallService();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openStalls = stalls.filter(s => s.isOpen).length;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(255, 248, 231, 0.98)' : 'rgba(255, 248, 231, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '14px 20px',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 2px 12px rgba(139, 115, 85, 0.15)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(139, 115, 85, 0.1)' : 'none'
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
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: `0 4px 12px rgba(139, 115, 85, 0.3)`
          }}>
            🎪
          </div>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: theme.primary,
              margin: 0,
              lineHeight: 1.2
            }}>
              周末集市
            </h1>
            <div style={{
              fontSize: '12px',
              color: '#999'
            }}>
              {openStalls}/{stalls.length} 摊位营业中
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            position: 'relative',
            padding: '8px 14px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '16px' }}>❤️</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#E74C3C'
            }}>
              {favorites.length}
            </span>
            {favorites.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#E74C3C',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </div>

          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: `0 2px 8px rgba(124, 179, 66, 0.3)`,
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            👤
          </div>
        </div>
      </div>
    </header>
  );
}

function MapToolbar() {
  const { activeCategories, toggleCategory, filteredStalls } = useStallService();
  const { theme } = useTheme();

  const categories = [
    { key: 'handcraft', label: '手工艺品', icon: '🎨' },
    { key: 'books', label: '二手书籍', icon: '📚' },
    { key: 'clothing', label: '衣物', icon: '👕' },
    { key: 'electronics', label: '电子小物', icon: '💻' },
    { key: 'food', label: '食品', icon: '🍪' }
  ] as const;

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 500,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px 12px',
      background: 'rgba(255, 248, 231, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      maxWidth: 'calc(100% - 32px)'
    }}>
      {categories.map(cat => {
        const isActive = activeCategories.has(cat.key);
        const count = filteredStalls.filter(s => s.category === cat.key).length;
        return (
          <button
            key={cat.key}
            onClick={() => toggleCategory(cat.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '14px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.25s ease',
              background: isActive ? theme.primary : 'rgba(255,255,255,0.8)',
              color: isActive ? 'white' : '#666',
              boxShadow: isActive ? `0 2px 8px rgba(139,115,85,0.3)` : 'none',
              opacity: count === 0 ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (count > 0) e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span style={{
              fontSize: '10px',
              opacity: 0.8
            }}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AppContent() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-color)'
    }}>
      <Header />

      <main>
        <div style={{ position: 'relative' }}>
          <MapContainer />
          <MapToolbar />
        </div>

        <div style={{
          padding: '8px 0 20px'
        }}>
          <StallList />
        </div>
      </main>

      <StallDetail />

      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        color: '#999',
        fontSize: '12px',
        borderTop: '1px solid rgba(139, 115, 85, 0.1)'
      }}>
        <div style={{ marginBottom: '8px' }}>🎪 周末集市 · 发现身边的美好</div>
        <div>© 2026 Weekend Market. Made with 💚</div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          header {
            padding: 12px 16px !important;
          }
          header h1 {
            font-size: 18px !important;
          }
        }

        @media (max-width: 768px) {
          [style*="grid-template-columns: repeat(auto-fill"] {
            grid-template-columns: 1fr !important;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        .custom-stall-marker {
          background: transparent !important;
          border: none !important;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 115, 85, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 115, 85, 0.5);
        }
      `}</style>
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
