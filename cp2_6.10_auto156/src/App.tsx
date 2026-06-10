import { motion } from 'framer-motion';
import SpiceRack from './components/SpiceRack';
import Scale from './components/Scale';
import RecipeCard from './components/RecipeCard';
import ControlPanel from './components/ControlPanel';
import ParticleBurst from './components/ParticleBurst';

function App() {
  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
          linear-gradient(225deg, rgba(218, 165, 32, 0.1) 0%, transparent 50%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 69, 19, 0.03) 2px,
            rgba(139, 69, 19, 0.03) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(139, 69, 19, 0.03) 2px,
            rgba(139, 69, 19, 0.03) 4px
          ),
          linear-gradient(to bottom, #D2B48C 0%, #C4A574 50%, #B8956E 100%)
        `
      }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />

      <div className="relative z-10">
        <motion.header
          className="text-center py-8 px-4"
          variants={headerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-3"
            style={{
              color: '#8B0000',
              fontFamily: "'Noto Serif SC', serif",
              textShadow: '3px 3px 6px rgba(0,0,0,0.3), 0 0 30px rgba(218, 165, 32, 0.3)',
              letterSpacing: '0.2em'
            }}
          >
            西 市 香 坊
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl"
            style={{
              color: '#5C4033',
              fontFamily: "'Noto Sans SC', sans-serif"
            }}
          >
            大唐西市 · 胡商香料铺
          </motion.p>
          <motion.div
            className="w-48 h-1 mx-auto mt-4 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #DAA520, transparent)'
            }}
          />
        </motion.header>

        <main className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-3">
              <SpiceRack />
            </div>

            <div className="lg:col-span-6 flex flex-col items-center">
              <Scale />
              <ControlPanel />
            </div>

            <div className="lg:col-span-3">
              <RecipeCard />
            </div>
          </div>
        </main>

        <motion.footer
          className="text-center py-6 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p
            className="text-sm"
            style={{ color: '#8B4513', fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            丝路迢迢，香飘万里 · 盛唐西市，胡商云集
          </p>
        </motion.footer>
      </div>

      <ParticleBurst />
    </div>
  );
}

export default App;
