import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SynthesisResult, Recipe } from '../types';
import { MATERIAL_INFO } from '../data/recipes';

interface PotionPreviewProps {
  result: SynthesisResult | null;
  onClose: () => void;
}

const SuccessAnimation: React.FC<{ recipe: Recipe; onClose: () => void }> = ({
  recipe,
  onClose,
}) => {
  const particles = Array.from({ length: 15 }, (_, i) => i);
  const bubbleParticles = Array.from({ length: 5 }, (_, i) => i);

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.5,
      }}
    >
      <motion.div
        className="relative"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="relative rounded-b-full rounded-t-lg overflow-hidden border-2 border-white/40"
          style={{
            width: 80,
            height: 120,
            background: recipe.potionGradient,
            boxShadow: `0 0 30px ${recipe.potionColor}60, inset 0 -20px 40px rgba(0,0,0,0.2)`,
          }}
        >
          <div className="absolute top-4 left-3 w-3 h-16 rounded-full bg-white/30" />
          {bubbleParticles.map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/40"
              style={{
                width: 6 + i * 2,
                height: 6 + i * 2,
                bottom: 10,
                left: `${20 + i * 15}%`,
              }}
              animate={{
                y: [0, -80],
                opacity: [0.6, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-6 bg-white/20 rounded-t border-2 border-white/40 border-b-0" />
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-10 h-4 bg-amber-700 rounded-t-lg shadow" />
      </motion.div>

      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            background: recipe.potionColor,
            boxShadow: `0 0 10px ${recipe.potionColor}`,
            left: '50%',
            top: '50%',
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 200],
            y: [0, -50 - Math.random() * 100, -100 - Math.random() * 150],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <h2 className="text-3xl font-bold text-amber-400 mb-2">
          合成成功！
        </h2>
        <h3 className="text-xl text-white mb-2">{recipe.name}</h3>
        <p className="text-white/70 mb-1">{recipe.effect}</p>
        <p className="text-white/50 text-sm">{recipe.description}</p>
      </motion.div>

      <motion.div
        className="mt-4 flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        {recipe.materials.map((mat, i) => {
          const info = MATERIAL_INFO[mat];
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full border border-white/30"
                style={{
                  background: info.gradient,
                  boxShadow: `0 0 10px ${info.color}40`,
                }}
              />
              <span className="text-xs text-white/60">{info.name}</span>
            </div>
          );
        })}
      </motion.div>

      <motion.button
        className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        太棒了！
      </motion.button>
    </motion.div>
  );
};

const FailureAnimation: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const shards = Array.from({ length: 20 }, (_, i) => i);

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,50,0,0.4) 40%, transparent 70%)',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {shards.map((i) => {
        const angle = (i / shards.length) * Math.PI * 2;
        const distance = 80 + Math.random() * 80;
        const size = 8 + Math.random() * 12;
        const colors = ['#FF5722', '#FF9800', '#FFEB3B', '#F44336'];
        const color = colors[i % colors.length];

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: size,
              height: size,
              background: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              left: '50%',
              top: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + 50,
              opacity: 0,
              scale: 1,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{
              duration: 1 + Math.random() * 0.5,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`smoke-${i}`}
          className="absolute rounded-full"
          style={{
            width: 60 + Math.random() * 40,
            height: 60 + Math.random() * 40,
            background:
              'radial-gradient(circle, rgba(100,100,100,0.6) 0%, transparent 70%)',
            left: '50%',
            top: '50%',
          }}
          initial={{ x: -30, y: 0, scale: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 100 - 30,
            y: -30 - Math.random() * 60,
            scale: 1.5 + Math.random(),
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: 0.3 + i * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}

      <motion.div
        className="mt-48 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-red-500 mb-2">
          💥 爆炸了！
        </h2>
        <p className="text-white/70">操作失误，材料都浪费了...</p>
      </motion.div>

      <motion.button
        className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        再试一次
      </motion.button>
    </motion.div>
  );
};

const SideEffectAnimation: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => {
  return (
    <motion.div
      className="relative z-10 flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-6xl mb-4">🧪</div>
      <h2 className="text-2xl font-bold text-purple-400 mb-2">
        奇怪的副产品
      </h2>
      <p className="text-white/70 text-center max-w-xs">
        {message}
      </p>
      <motion.button
        className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
      >
        好吧
      </motion.button>
    </motion.div>
  );
};

export const PotionPreview: React.FC<PotionPreviewProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  const isSuccess = result.type === 'success';
  const isFailure = result.type === 'failure';

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {isSuccess && result.recipe && (
            <SuccessAnimation recipe={result.recipe} onClose={onClose} />
          )}

          {isFailure && <FailureAnimation onClose={onClose} />}

          {result.type === 'sideEffect' && (
            <SideEffectAnimation message={result.message} onClose={onClose} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
