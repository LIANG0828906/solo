import { motion } from 'framer-motion';
import SpiceJar from './SpiceJar';
import { useSpiceStore } from '../store/spiceStore';

function SpiceRack() {
  const spices = useSpiceStore(state => state.spices);
  const startDrag = useSpiceStore(state => state.startDrag);
  const endDrag = useSpiceStore(state => state.endDrag);
  const addSpice = useSpiceStore(state => state.addSpice);

  const handleDropOnScale = (spiceId: string) => {
    addSpice(spiceId, 20);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div
      className="flex flex-col items-center p-6 rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.95), rgba(92, 44, 11, 0.98))',
        border: '3px solid #DAA520',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h2
        className="text-2xl font-bold mb-6 text-center"
        style={{
          color: '#DAA520',
          fontFamily: "'Noto Serif SC', serif",
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}
        variants={itemVariants}
      >
        香 料 架
      </motion.h2>

      <div className="relative w-full">
        <div
          className="absolute inset-0 rounded-xl opacity-30"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 20px,
                rgba(139, 0, 0, 0.1) 20px,
                rgba(139, 0, 0, 0.1) 40px
              )
            `,
            pointerEvents: 'none'
          }}
        />

        <motion.div
          className="grid grid-cols-1 gap-12 p-6 relative z-10"
          variants={containerVariants}
        >
          {spices.map((spice, index) => (
            <motion.div
              key={spice.id}
              variants={itemVariants}
              className="flex flex-col items-center"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative">
                <SpiceJar
                  spice={spice}
                  onDragStart={startDrag}
                  onDragEnd={endDrag}
                  onDropOnScale={handleDropOnScale}
                />

                <div
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-2 rounded-full"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)'
                  }}
                />
              </div>

              <div className="mt-8 text-center">
                <div
                  className="text-xs px-3 py-1 rounded-full inline-block"
                  style={{
                    backgroundColor: `${spice.color}33`,
                    border: `1px solid ${spice.color}`,
                    color: '#F5DEB3'
                  }}
                >
                  {spice.origin}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div
          className="absolute bottom-0 left-0 right-0 h-4 rounded-b-xl"
          style={{
            background: 'linear-gradient(to bottom, rgba(92, 44, 11, 0.5), rgba(60, 30, 8, 0.9))',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.3)'
          }}
        />
      </div>

      <motion.p
        className="text-xs mt-4 text-center max-w-48"
        style={{ color: '#CD853F', fontFamily: "'Noto Sans SC', sans-serif" }}
        variants={itemVariants}
      >
        点击或拖拽香料罐至中央称盘
      </motion.p>
    </motion.div>
  );
}

export default SpiceRack;
