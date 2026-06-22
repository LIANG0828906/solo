import { motion } from 'framer-motion';
import { Gift, RefreshCw } from 'lucide-react';
import { memo } from 'react';
import { useStore } from '../store/useStore';
import { EASE_ELASTIC } from '../utils/types';

interface AnimationCardProps {
  artworkId?: string;
}

const AnimationCard = memo(function AnimationCard({ artworkId }: AnimationCardProps) {
  const {
    isCardFlipped,
    currentArtwork,
    flipCard,
    unpackArtwork,
    completeUnpack,
    isTransitioning,
  } = useStore();

  const handleCardClick = () => {
    if (isTransitioning) return;
    if (!isCardFlipped) {
      flipCard();
    }
  };

  const handleUnpackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    unpackArtwork({ x: centerX, y: centerY });

    setTimeout(() => {
      completeUnpack();
    }, 400);
  };

  const frontBg = 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)';
  const backBg = currentArtwork?.thumbnail || frontBg;

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        onClick={handleCardClick}
        animate={{
          rotateY: isCardFlipped ? 180 : 0,
        }}
        transition={{
          duration: 0.6,
          ease: isCardFlipped ? EASE_ELASTIC : 'easeInOut',
        }}
        style={{
          width: 240,
          height: 320,
          position: 'relative',
          transformStyle: 'preserve-3d',
          cursor: isCardFlipped ? 'default' : 'pointer',
          willChange: 'transform',
        }}
        whileHover={!isCardFlipped ? { scale: 1.02 } : {}}
        whileTap={!isCardFlipped ? { scale: 0.95 } : {}}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 16,
            background: frontBg,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(108, 92, 231, 0.4)',
          }}
          whileHover={{
            boxShadow: '0 30px 80px rgba(253, 121, 168, 0.5), 0 0 40px rgba(108, 92, 231, 0.3)',
          }}
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              fontSize: 96,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 300,
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            ?
          </motion.div>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 14,
              marginTop: 16,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            点击抽取盲盒
          </div>
          <motion.div
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #FD79A8 0%, #6C5CE7 100%)',
              filter: 'blur(12px)',
              opacity: 0.5,
              zIndex: -1,
            }}
          />
        </motion.div>

        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 16,
            background: backBg,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              color: '#ECF0F1',
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'center',
              fontFamily: 'Space Grotesk, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {currentArtwork?.title || '作品草图'}
          </div>

          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <RefreshCw
              size={48}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            />
          </div>

          <div
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {currentArtwork?.artist || '未知艺术家'}
          </div>

          <motion.button
            onClick={handleUnpackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Gift size={20} style={{ color: '#6C5CE7' }} />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
});

export default AnimationCard;
