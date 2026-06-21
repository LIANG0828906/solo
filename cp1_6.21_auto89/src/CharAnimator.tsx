import { motion } from 'framer-motion';

export type AnimationType = 'fadeIn' | 'bounce' | 'rotate' | 'flip' | 'slideIn' | 'scale';

interface CharAnimatorProps {
  char: string;
  animationType: AnimationType;
  delay: number;
  duration: number;
  isPlaying: boolean;
  animationKey: number;
}

const getAnimationVariants = (type: AnimationType, duration: number) => {
  const baseTransition = {
    duration,
    ease: 'easeOut',
  };

  switch (type) {
    case 'fadeIn':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: baseTransition,
      };
    case 'bounce':
      return {
        initial: { y: -80, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: {
          type: 'spring',
          damping: 10,
          stiffness: 100,
          duration,
        },
      };
    case 'rotate':
      return {
        initial: { rotateY: 0, opacity: 0 },
        animate: { rotateY: 360, opacity: 1 },
        transition: {
          ...baseTransition,
          duration: duration * 2,
        },
      };
    case 'flip':
      return {
        initial: { scaleX: -1, opacity: 0 },
        animate: { scaleX: 1, opacity: 1 },
        transition: baseTransition,
      };
    case 'slideIn':
      return {
        initial: { x: -120, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: baseTransition,
      };
    case 'scale':
      return {
        initial: { scale: 0.2, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: baseTransition,
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: baseTransition,
      };
  }
};

export default function CharAnimator({
  char,
  animationType,
  delay,
  duration,
  isPlaying,
  animationKey,
}: CharAnimatorProps) {
  const variants = getAnimationVariants(animationType, duration);

  return (
    <motion.span
      key={animationKey}
      initial="initial"
      animate={isPlaying ? 'animate' : 'initial'}
      variants={{
        initial: variants.initial,
        animate: {
          ...variants.animate,
          transition: {
            ...variants.transition,
            delay,
          },
        },
      }}
      style={{
        display: 'inline-block',
        fontSize: '48px',
        fontWeight: 700,
        color: '#1F2937',
        fontFamily: 'Georgia, serif',
        willChange: 'transform, opacity',
        whiteSpace: 'pre',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}
