import { motion, AnimatePresence } from 'framer-motion';
import { useTavernStore } from './store';
import BartenderStation from './components/BartenderStation';
import CustomerBubble from './components/CustomerBubble';
import CocktailVisualizer from './components/CocktailVisualizer';
import CocktailRecipeCard from './components/CocktailRecipeCard';

export default function App() {
  const showRecipeBook = useTavernStore(s => s.showRecipeBook);
  const toggleRecipeBook = useTavernStore(s => s.toggleRecipeBook);
  const recipeBook = useTavernStore(s => s.recipeBook);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #0F0220 0%, #1A0A3E 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Orbitron', 'ZCOOL KuaiLe', sans-serif",
        color: '#E0C3FF',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(179,136,255,0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(224,64,251,0.06) 0%, transparent 45%),
            radial-gradient(circle at 50% 100%, rgba(0,229,255,0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(179,136,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(179,136,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      <CustomerBubble />

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          display: 'flex',
          gap: 12,
          zIndex: 20,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRecipeBook}
          style={{
            padding: '10px 20px',
            background: 'rgba(42,26,74,0.8)',
            border: '1px solid rgba(179,136,255,0.5)',
            borderRadius: 8,
            color: '#B388FF',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 1,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(179,136,255,0.2)',
          }}
        >
          ◇ 酒谱 ({recipeBook.length})
        </motion.button>
      </div>

      <BartenderStation />
      <CocktailVisualizer />

      <AnimatePresence>
        {showRecipeBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,2,32,0.95)',
              backdropFilter: 'blur(20px)',
              zIndex: 50,
              padding: '60px 40px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 36, color: '#B388FF', letterSpacing: 3, textShadow: '0 0 20px rgba(179,136,255,0.5)' }}>
                  赛博酒谱
                </h2>
                <p style={{ margin: '8px 0 0', color: '#6B4F9E', fontSize: 13, letterSpacing: 1 }}>
                  CYBER RECIPE ARCHIVE · {recipeBook.length} ENTRIES
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleRecipeBook}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(224,64,251,0.2)',
                  border: '1px solid #E040FB',
                  color: '#E040FB',
                  fontSize: 22,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(224,64,251,0.3)',
                }}
              >
                ✕
              </motion.button>
            </div>

            {recipeBook.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B4F9E' }}>
                <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.5 }}>🍸</div>
                <p style={{ fontSize: 18, letterSpacing: 2 }}>尚未调出任何鸡尾酒</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>回到工作台，开始调制你的第一杯赛博佳酿</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, 220px)',
                  gap: 24,
                  justifyContent: 'center',
                }}
              >
                {recipeBook.map((card) => (
                  <CocktailRecipeCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(179,136,255,0.3)',
          fontSize: 11,
          letterSpacing: 3,
          pointerEvents: 'none',
        }}
      >
        NEON TAVERN · CYBER MIXOLOGIST v0.1
      </div>
    </div>
  );
}
