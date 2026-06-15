import { useMemo } from 'react';
import { motion, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';
import { calculateParabola } from '../hooks/useCollision';
import { Position, HitArea } from '../types/game';

interface ArrowProps {
  startPos: Position;
  endPos: Position;
  parabolaHeight: number;
  isFlying: boolean;
  hitResult: HitArea;
  onComplete: () => void;
}

export const Arrow = ({
  startPos,
  endPos,
  parabolaHeight,
  isFlying,
  hitResult,
  onComplete,
}: ArrowProps) => {
  const t = useMotionValue(0);
  const controls = useMemo(() => {
    if (isFlying) {
      return {
        animate: { t: 1 },
        transition: { duration: 1.2, ease: 'linear' },
      };
    }
    return { animate: { t: 0 }, transition: { duration: 0 } };
  }, [isFlying]);

  const x = useTransform(t, (value) => {
    const pos = calculateParabola(
      startPos.x,
      startPos.y,
      endPos.x,
      endPos.y,
      parabolaHeight,
      value
    );
    return pos.x;
  });

  const y = useTransform(t, (value) => {
    const pos = calculateParabola(
      startPos.x,
      startPos.y,
      endPos.x,
      endPos.y,
      parabolaHeight,
      value
    );
    return pos.y;
  });

  const rotate = useTransform(t, (value) => {
    const pos = calculateParabola(
      startPos.x,
      startPos.y,
      endPos.x,
      endPos.y,
      parabolaHeight,
      value
    );
    return pos.rotation;
  });

  useAnimationFrame(() => {
    if (isFlying && t.get() >= 0.99) {
      onComplete();
    }
  });

  const ArrowVisual = () => (
    <div className="relative w-24 h-3">
      <div className="absolute inset-0 flex items-center">
        <div className="absolute right-0 w-4 h-0 border-l-8 border-l-[#c0392b] border-y-4 border-y-transparent" />
        <div
          className="flex-1 h-2 mr-3 rounded-r-sm"
          style={{
            background: 'linear-gradient(to right, #2ecc71 0%, #27ae60 50%, #2ecc71 100%)',
          }}
        >
          <div className="h-full w-full opacity-50" style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #219a52 2px, #219a52 4px)'
          }} />
        </div>
        <div className="absolute left-0 w-2 h-3 bg-[#8b4513] rounded-l-sm" />
      </div>
    </div>
  );

  if (!isFlying) {
    return (
      <motion.div
        style={{
          x: startPos.x,
          y: startPos.y,
          rotate: -15,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute z-10"
      >
        <ArrowVisual />
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        style={{ x, y, rotate, translateX: '-50%', translateY: '-50%' }}
        className="absolute z-20"
        animate={controls.animate}
        transition={controls.transition}
        onAnimationComplete={() => {
          if (hitResult === 'miss') {
            setTimeout(onComplete, 800);
          }
        }}
      >
        <ArrowVisual />
      </motion.div>

      {hitResult === 'miss' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, 20],
            rotate: [-75, -80],
          }}
          transition={{ duration: 0.8, delay: 1.2 }}
          style={{
            x: endPos.x,
            y: endPos.y,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="absolute z-10"
        >
          <ArrowVisual />
        </motion.div>
      )}
    </>
  );
};
