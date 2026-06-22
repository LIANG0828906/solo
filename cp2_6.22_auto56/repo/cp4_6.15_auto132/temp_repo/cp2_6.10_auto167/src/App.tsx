import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BambooPot } from './components/BambooPot';
import { Arrow } from './components/Arrow';
import { PowerBar } from './components/PowerBar';
import { ScoreBoard } from './components/ScoreBoard';
import { useGameStore } from './store/useGameStore';
import { useCollision } from './hooks/useCollision';
import { Position, PotDimensions, HitArea } from './types/game';

const potDimensions: PotDimensions = {
  height: 200,
  mouthDiameter: 80,
  earDiameter: 30,
  earOffset: 60,
};

interface FlyingArrow {
  id: number;
  startPos: Position;
  endPos: Position;
  parabolaHeight: number;
  hitResult: HitArea;
}

function App() {
  const [power, setPower] = useState(0);
  const [flyingArrow, setFlyingArrow] = useState<FlyingArrow | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [arrowStartPos, setArrowStartPos] = useState<Position>({ x: 0, y: 0 });

  const isPlaying = useGameStore((state) => state.isPlaying);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const currentRound = useGameStore((state) => state.currentRound);
  const maxRounds = useGameStore((state) => state.maxRounds);
  const setAnimating = useGameStore((state) => state.setAnimating);
  const recordThrow = useGameStore((state) => state.recordThrow);
  const triggerPotEffect = useGameStore((state) => state.triggerPotEffect);
  const startGame = useGameStore((state) => state.startGame);

  const { checkHit } = useCollision();

  const isGameOver = currentRound > maxRounds;

  useEffect(() => {
    const updateArrowPos = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setArrowStartPos({
          x: rect.width * 0.15,
          y: rect.height * 0.6,
        });
      }
    };

    updateArrowPos();
    window.addEventListener('resize', updateArrowPos);
    return () => window.removeEventListener('resize', updateArrowPos);
  }, []);

  const getPotCenter = useCallback((): Position => {
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      return {
        x: rect.width * 0.5,
        y: rect.height * 0.25,
      };
    }
    return { x: 400, y: 100 };
  }, []);

  const calculateEndPosition = useCallback((powerValue: number): Position => {
    const potCenter = getPotCenter();
    const baseX = potCenter.x;
    const baseY = potCenter.y + 50;

    const accuracyFactor = 1 - Math.abs(powerValue - 70) / 100;
    const maxDeviation = 80 * (1 - accuracyFactor);

    const randomOffsetX = (Math.random() - 0.5) * maxDeviation * 2;
    const randomOffsetY = (Math.random() - 0.5) * maxDeviation;

    const powerScale = powerValue / 100;
    const distanceAdjustment = (powerScale - 0.7) * 150;

    return {
      x: baseX + randomOffsetX + distanceAdjustment,
      y: baseY + randomOffsetY,
    };
  }, [getPotCenter]);

  const handlePowerSet = useCallback((newPower: number) => {
    setPower(newPower);
  }, []);

  const handleRelease = useCallback(() => {
    if (!isPlaying || isAnimating || isGameOver || power === 0) return;

    setAnimating(true);

    const endPos = calculateEndPosition(power);
    const potCenter = getPotCenter();
    const hitResult = checkHit(endPos, potCenter, potDimensions);

    const parabolaHeight = 150 + (power / 100) * 200;

    const newArrow: FlyingArrow = {
      id: Date.now(),
      startPos: arrowStartPos,
      endPos,
      parabolaHeight,
      hitResult,
    };

    setFlyingArrow(newArrow);
  }, [isPlaying, isAnimating, isGameOver, power, calculateEndPosition, getPotCenter, checkHit, arrowStartPos, setAnimating]);

  const handleArrowComplete = useCallback(() => {
    if (!flyingArrow) return;

    if (flyingArrow.hitResult !== 'miss') {
      triggerPotEffect();
    }

    recordThrow(flyingArrow.hitResult);
    setFlyingArrow(null);
    setPower(0);
  }, [flyingArrow, triggerPotEffect, recordThrow]);

  const gameAreaVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen w-full overflow-hidden" style={{
      background: `
        radial-gradient(ellipse at 20% 80%, rgba(192, 57, 43, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
        repeating-linear-gradient(
          0deg,
          #f5e6c8 0px,
          #f2e3c5 2px,
          #f5e6c8 4px,
          #f0e0c0 6px
        ),
        repeating-linear-gradient(
          90deg,
          transparent 0px,
          rgba(139, 69, 19, 0.03) 1px,
          transparent 2px,
          transparent 5px
        ),
        linear-gradient(180deg, #f7e8d0 0%, #f0e0c0 100%)
      `,
    }}>
      <header className="text-center py-6 border-b-2 border-[#8b4513]/20">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold tracking-wider"
          style={{
            color: '#c0392b',
            textShadow: '2px 2px 4px rgba(139, 69, 19, 0.3)',
            fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
          }}
        >
          投壶雅戏
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-[#8b4513]/70 text-sm"
        >
          汉唐古风 · 宴饮雅趣
        </motion.p>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] min-h-[600px]">
          <motion.div
            variants={gameAreaVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8"
          >
            <motion.div
              variants={itemVariants}
              className="lg:w-1/2 flex items-center justify-center rounded-2xl p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                boxShadow: 'inset 0 2px 10px rgba(139, 69, 19, 0.1)',
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <BambooPot dimensions={potDimensions} />

                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-sm text-[#8b4513]/60">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>壶口 +5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>壶耳 +3</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              ref={gameAreaRef}
              className="lg:w-1/2 relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                boxShadow: 'inset 0 2px 10px rgba(139, 69, 19, 0.1)',
              }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence>
                  {flyingArrow && (
                    <Arrow
                      key={flyingArrow.id}
                      startPos={flyingArrow.startPos}
                      endPos={flyingArrow.endPos}
                      parabolaHeight={flyingArrow.parabolaHeight}
                      isFlying={true}
                      hitResult={flyingArrow.hitResult}
                      onComplete={handleArrowComplete}
                    />
                  )}
                </AnimatePresence>

                {!flyingArrow && isPlaying && !isGameOver && (
                  <Arrow
                    startPos={arrowStartPos}
                    endPos={arrowStartPos}
                    parabolaHeight={0}
                    isFlying={false}
                    hitResult="miss"
                    onComplete={() => {}}
                  />
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f5e6c8]/90 to-transparent">
                {!isPlaying ? (
                  <div className="text-center py-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startGame}
                      className="px-12 py-4 rounded-xl font-bold text-white text-xl"
                      style={{
                        background: 'linear-gradient(145deg, #c0392b, #a93226)',
                        boxShadow: '0 6px 20px rgba(192, 57, 43, 0.4)',
                      }}
                    >
                      开始投壶
                    </motion.button>
                    <p className="mt-4 text-[#8b4513]/60 text-sm">
                      共 {maxRounds} 轮，投中壶口得5分，壶耳得3分
                    </p>
                  </div>
                ) : isGameOver ? (
                  <div className="text-center py-8">
                    <p className="text-[#8b4513]/60">请查看右侧计分板查看最终成绩</p>
                  </div>
                ) : (
                  <PowerBar
                    onPowerSet={handlePowerSet}
                    disabled={isAnimating}
                    onRelease={handleRelease}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:w-80 xl:w-96 flex-shrink-0"
          >
            <ScoreBoard />
          </motion.div>
        </div>
      </main>

      <footer className="text-center py-4 text-[#8b4513]/50 text-xs border-t border-[#8b4513]/10">
        投壶源于西周，盛于汉唐，为古代宴饮之雅戏
      </footer>
    </div>
  );
}

export default App;
