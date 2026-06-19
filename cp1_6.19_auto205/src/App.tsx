import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import BubbleChart from '@/modules/visualization/BubbleChart';
import EarthSphere from '@/modules/visualization/EarthSphere';
import TimelineSlider from '@/modules/simulation/TimelineSlider';
import ResultPanel from '@/modules/simulation/ResultPanel';
import { useAppStore } from '@/store/useAppStore';

const App = () => {
  const { selectedSourceId } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(180deg, #0B132B 0%, #1C2541 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          height: 48,
          background: 'rgba(15, 27, 51, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #2C3E50',
          position: 'relative',
          zIndex: 100,
        }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            color: '#A8D0E6',
            margin: 0,
          }}>
            溯源·升温2050
          </h1>
        </div>

        <div style={{
          height: 44,
          background: 'rgba(26, 39, 68, 0.9)',
          display: 'flex',
          borderBottom: '1px solid #2C3E50',
        }}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              flex: 1,
              background: showMobileMenu ? 'rgba(46, 134, 193, 0.3)' : 'transparent',
              border: 'none',
              color: showMobileMenu ? '#3498DB' : '#A8D0E6',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            排放源
          </button>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              flex: 1,
              background: drawerOpen ? 'rgba(46, 134, 193, 0.3)' : 'transparent',
              border: 'none',
              color: drawerOpen ? '#3498DB' : '#A8D0E6',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            数据面板
          </button>
        </div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: '#1A2744',
                borderBottom: '1px solid #2C3E50',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px', height: 400, overflow: 'auto' }}>
                <BubbleChart />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, position: 'relative' }}>
          <EarthSphere />
          
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '6px 10px',
            background: 'rgba(15, 27, 51, 0.8)',
            borderRadius: '6px',
            border: '1px solid #2C3E50',
            color: selectedSourceId ? '#3498DB' : '#A8D0E6',
            fontSize: '11px',
          }}>
            {selectedSourceId ? '已选排放源' : '全部排放源'}
          </div>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '60vh',
                background: '#1A2744',
                borderTop: '1px solid #2C3E50',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              <div
                onTouchStart={(e) => {
                  const startY = e.touches[0].clientY;
                  const startHeight = document.querySelector('.drawer-content')?.clientHeight || 0;
                  
                  const handleMove = (moveE: TouchEvent) => {
                    const deltaY = startY - moveE.touches[0].clientY;
                    const newHeight = Math.min(Math.max(startHeight + deltaY, 100), window.innerHeight * 0.6);
                    const drawer = document.querySelector('.drawer-wrapper') as HTMLElement;
                    if (drawer) {
                      drawer.style.height = `${newHeight}px`;
                    }
                  };
                  
                  const handleEnd = () => {
                    document.removeEventListener('touchmove', handleMove);
                    document.removeEventListener('touchend', handleEnd);
                  };
                  
                  document.addEventListener('touchmove', handleMove);
                  document.addEventListener('touchend', handleEnd);
                }}
                style={{
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                }}
              >
                <div style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: '#2C3E50',
                }} />
              </div>
              <div className="drawer-wrapper" style={{ height: 'auto', overflow: 'auto' }}>
                <div className="drawer-content" style={{ padding: '16px 20px' }}>
                  <TimelineSlider />
                  <div style={{ marginTop: '24px', height: 300 }}>
                    <ResultPanel />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ResetButton />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(180deg, #0B132B 0%, #1C2541 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 48,
        background: 'rgba(15, 27, 51, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #2C3E50',
        position: 'relative',
        zIndex: 100,
      }}>
        <h1 style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          color: '#A8D0E6',
          margin: 0,
          letterSpacing: '0.5px',
        }}>
          溯源·升温2050
        </h1>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            width: 400,
            background: '#1A2744',
            borderRight: '1px solid #2C3E50',
            padding: 20,
            overflow: 'auto',
          }}
        >
          <BubbleChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          <EarthSphere />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            width: 360,
            background: '#1A2744',
            borderLeft: '1px solid #2C3E50',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          <TimelineSlider />
          <div style={{ flex: 1, marginTop: 16, minHeight: 0 }}>
            <ResultPanel />
          </div>
        </motion.div>
      </div>

      <ResetButton />
    </div>
  );
};

const ResetButton = () => {
  const { resetToBase, isResetting } = useAppStore();

  return (
    <motion.button
      onClick={resetToBase}
      disabled={isResetting}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'rgba(44, 62, 80, 0.8)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
      }}
    >
      <motion.div
        animate={{ rotate: isResetting ? 360 : 0 }}
        transition={{ duration: 0.5, repeat: isResetting ? Infinity : 0, ease: 'linear' }}
      >
        <RotateCcw size={20} color="white" />
      </motion.div>
    </motion.button>
  );
};

export default App;
