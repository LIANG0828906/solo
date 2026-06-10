import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Dice from './Dice';
import './DiceBoard.css';

const DiceBoard = () => {
  const { dice, phase } = useGameStore((state) => ({
    dice: state.dice,
    phase: state.phase,
  }));

  const isRolling = phase === 'rolling';
  const isRevealing = phase === 'revealing' || phase === 'settling';

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / 20,
        distance: 80 + Math.random() * 60,
        delay: Math.random() * 0.3,
      })),
    []
  );

  const coins = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        delay: Math.random() * 0.5,
      })),
    []
  );

  const showWinEffect = phase === 'settling' && useGameStore.getState().history[0]?.playerProfit > 0;
  const showLoseEffect = phase === 'settling' && useGameStore.getState().history[0]?.playerProfit < 0;

  return (
    <div className="dice-board">
      <div className="dice-area">
        <AnimatePresence>
          {isRolling && (
            <motion.div
              className="dice-cup"
              initial={{ y: -20, rotate: -10, opacity: 0 }}
              animate={{
                y: [0, -15, 0, -10, 0],
                rotate: [-5, 10, -8, 5, 0],
                opacity: 1,
              }}
              exit={{
                y: -150,
                opacity: 0,
                transition: { duration: 0.5, ease: 'easeIn' },
              }}
              transition={{
                duration: 3,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: 'easeInOut',
              }}
            >
              <div className="cup-body bamboo-texture" />
              <div className="cup-rim" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="dice-container">
          {dice.map((value, index) => (
            <Dice
              key={index}
              value={value}
              isRevealing={isRevealing}
              delay={index * 0.3}
            />
          ))}
        </div>

        <AnimatePresence>
          {isRevealing && (
            <>
              {particles.map((particle) => (
                <motion.div
                  key={`particle-${particle.id}`}
                  className="gold-particle"
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos(particle.angle) * particle.distance,
                    y: Math.sin(particle.angle) * particle.distance,
                    scale: [0, 1.5, 1, 0],
                    opacity: [1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showWinEffect && (
            <>
              {coins.map((coin) => (
                <motion.div
                  key={`coin-${coin.id}`}
                  className="coin"
                  initial={{ y: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    y: [0, -100, 50, 200],
                    x: coin.x,
                    opacity: [0, 1, 1, 0],
                    rotate: [0, 360, 720],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: coin.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLoseEffect && (
            <motion.div
              className="lose-mist"
              initial={{ opacity: 0, scale: 0.5, blur: 0 }}
              animate={{
                opacity: [0, 0.8, 0.6, 0],
                scale: [0.5, 1.5, 2, 2.5],
                filter: ['blur(0px)', 'blur(10px)', 'blur(20px)'],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {isRevealing && (
        <motion.div
          className="result-sum"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <span className="sum-label">点数和</span>
          <span className="sum-value">{dice.reduce((a, b) => a + b, 0)}</span>
        </motion.div>
      )}
    </div>
  );
};

export default DiceBoard;
