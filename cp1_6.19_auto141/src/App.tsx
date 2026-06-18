import { motion, AnimatePresence } from 'framer-motion';
import { History, RotateCcw } from 'lucide-react';
import { useStore } from './store/useStore';
import { EASE_ELASTIC } from './utils/types';

import AnimationCard from './components/AnimationCard';
import InspirationGraph from './components/InspirationGraph';
import StoryCard from './components/StoryCard';
import HistorySidebar from './components/HistorySidebar';
import ResetDialog from './components/ResetDialog';
import ParticleEffect from './components/ParticleEffect';

export default function App() {
  const {
    isTransitioning,
    particlePosition,
    showHistory,
    toggleHistory,
    showReset,
    isCardFlipped,
    flipCardBack,
  } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioning ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #2C3E50 0%, #34495E 100%)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(108, 92, 231, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(253, 121, 168, 0.15) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#FFF',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 18,
            }}
          >
            艺
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#ECF0F1',
              }}
            >
              青年艺术节
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#636E72',
              }}
            >
              草图盲盒 · 灵感关系网
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleHistory}
          style={{
            width: 120,
            height: 36,
            borderRadius: 8,
            background: '#F8E71C',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            color: '#2D3436',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: showHistory ? '0 4px 20px rgba(248, 231, 28, 0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          <History size={16} />
          过往拆解
        </motion.button>
      </header>

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 100px',
          gap: 32,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'fixed',
            left: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
          }}
          className="graph-container"
        >
          <InspirationGraph />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            marginLeft: 440,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            <h1
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: '#ECF0F1',
                margin: 0,
                background: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              草图盲盒
            </h1>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#B2BEC3',
                margin: '8px 0 0',
              }}
            >
              {isCardFlipped
                ? '点击下方宝箱按钮拆解作品'
                : '点击卡片，抽取一份艺术家草图'}
            </p>
          </div>

          <AnimationCard />

          {isCardFlipped && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3, ease: EASE_ELASTIC }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={flipCardBack}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                color: '#636E72',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                marginTop: -8,
              }}
            >
              ← 重新抽取
            </motion.button>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 320,
            }}
          >
            {['灵感源', '情绪', '主题'].map((tag, i) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.1 }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#B2BEC3',
                  fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {tag}
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          zIndex: 60,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={showReset}
          style={{
            width: 140,
            height: 40,
            borderRadius: 20,
            background: '#D63031',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(214, 48, 49, 0.4)',
          }}
        >
          <RotateCcw size={16} />
          重新布展
        </motion.button>
      </footer>

      <AnimatePresence>
        <StoryCard />
      </AnimatePresence>

      <HistorySidebar />
      <ResetDialog />
      <ParticleEffect position={particlePosition} />

      <style>{`
        @media (max-width: 768px) {
          .graph-container {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            margin-bottom: 24px;
            width: 100% !important;
          }
          .graph-container > div {
            width: 100% !important;
            height: 200px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }
          main {
            flex-direction: column !important;
            padding: 80px 16px 100px !important;
            margin-left: 0 !important;
          }
          main > div:last-child {
            margin-left: 0 !important;
          }
          header {
            padding: 12px 16px !important;
          }
          header button {
            width: 100px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
