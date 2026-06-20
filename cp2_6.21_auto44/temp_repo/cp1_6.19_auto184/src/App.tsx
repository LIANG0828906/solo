import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecipeModule } from './modules/recipes/RecipeModule';
import { ShoppingModule } from './modules/shopping/ShoppingModule';
import { useAppStore } from './store/useAppStore';

function App() {
  const { activeModule, setActiveModule, searchQuery, setSearchQuery } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'recipes', label: '我的菜谱', icon: '📖' },
    { id: 'shopping', label: '购物清单', icon: '🛒' },
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FFF8F0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <motion.header
        initial={{ y: -56 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          height: 56,
          backgroundColor: '#E67E22',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          boxShadow: '0 2px 8px rgba(230, 126, 34, 0.3)',
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: 20,
              cursor: 'pointer',
              marginRight: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
        )}
        
        <h1 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 22 }}>🍳</span>
          家庭菜谱
        </h1>

        {activeModule === 'recipes' && !isMobile && (
          <div style={{
            marginLeft: 'auto',
            position: 'relative',
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索菜谱或食材..."
              style={{
                width: 280,
                height: 36,
                padding: '0 16px 0 36px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                fontSize: 14,
                color: '#2C3E50',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.3), inset 0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            />
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: '#95A5A6',
              pointerEvents: 'none',
            }}>
              🔍
            </span>
          </div>
        )}
      </motion.header>

      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
      }}>
        {!isMobile && (
          <motion.aside
            initial={{ x: -200 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              width: 200,
              backgroundColor: '#FFFFFF',
              padding: '20px 0',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
              flexShrink: 0,
              overflowY: 'auto',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveModule(item.id as 'recipes' | 'shopping')}
                  style={{
                    textAlign: 'left',
                    padding: '12px 20px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 14,
                    fontWeight: activeModule === item.id ? 600 : 500,
                    color: activeModule === item.id ? '#E67E22' : '#2C3E50',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {activeModule === item.id && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: '60%',
                        backgroundColor: '#E67E22',
                        borderRadius: '0 2px 2px 0',
                      }}
                    />
                  )}
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                </motion.button>
              ))}
            </nav>

            <div style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid #F0F0F0',
              paddingLeft: 20,
              paddingRight: 20,
            }}>
              <p style={{
                margin: '0 0 10px 0',
                fontSize: 12,
                color: '#95A5A6',
                fontWeight: 500,
              }}>
                快捷操作
              </p>
              <button
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px dashed #E67E22',
                  backgroundColor: '#FFF8F0',
                  color: '#E67E22',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FDEBD0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF8F0';
                }}
              >
                🏠 家庭设置
              </button>
            </div>
          </motion.aside>
        )}

        <AnimatePresence mode="wait">
          <motion.main
            key={activeModule}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={{
              flex: 1,
              minWidth: isMobile ? 0 : 900,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {activeModule === 'recipes' && <RecipeModule />}
            {activeModule === 'shopping' && <ShoppingModule />}
          </motion.main>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 56,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 99,
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 56,
                left: 0,
                width: 240,
                height: 'calc(100vh - 56px)',
                backgroundColor: '#FFFFFF',
                padding: '20px 0',
                zIndex: 100,
                boxShadow: '4px 0 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <nav style={{ display: 'flex', flexDirection: 'column' }}>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id as 'recipes' | 'shopping');
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '14px 24px',
                      border: 'none',
                      backgroundColor: activeModule === item.id ? '#FFF8F0' : 'transparent',
                      fontSize: 15,
                      fontWeight: activeModule === item.id ? 600 : 500,
                      color: activeModule === item.id ? '#E67E22' : '#2C3E50',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      position: 'relative',
                    }}
                  >
                    {activeModule === item.id && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: '60%',
                        backgroundColor: '#E67E22',
                        borderRadius: '0 2px 2px 0',
                      }} />
                    )}
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
