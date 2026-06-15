import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lantern } from '../utils/riddleData';
import { lanternColors } from '../utils/riddleData';
import RiddleCard from './RiddleCard';

interface LanternDisplayProps {
  lantern: Lantern;
  slotIndex: number;
  onClick: () => void;
  isFlashing?: boolean;
}

const ParticleExplosion = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const angle = (i / 30) * Math.PI * 2;
      const distance = 80 + Math.random() * 70;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 4 + Math.random() * 4,
        delay: Math.random() * 0.1,
      };
    });
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 5, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: -30,
          left: -30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: '#ffeaa7',
          boxShadow: '0 0 40px #ffeaa7, 0 0 80px #fdcb6e',
        }}
      />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: 1,
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            delay: p.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: '#ffd93d',
            boxShadow: '0 0 8px #ffd93d',
          }}
        />
      ))}
    </div>
  );
};

const RoundLanternSVG = ({ color }: { color: string }) => (
  <svg width="80" height="120" viewBox="0 0 80 120" style={{ display: 'block' }}>
    <line x1="40" y1="0" x2="40" y2="15" stroke="#d4a373" strokeWidth="2" />
    <ellipse cx="40" cy="60" rx="35" ry="45" fill={color} />
    <ellipse cx="40" cy="60" rx="35" ry="45" fill="url(#roundGlow)" />
    <ellipse cx="40" cy="60" rx="30" ry="40" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    <ellipse cx="40" cy="60" rx="20" ry="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <rect x="25" y="10" width="30" height="8" fill="#b8860b" rx="2" />
    <rect x="25" y="102" width="30" height="8" fill="#b8860b" rx="2" />
    <line x1="40" y1="110" x2="40" y2="120" stroke="#d4a373" strokeWidth="2" />
    <ellipse cx="35" cy="55" rx="8" ry="12" fill="rgba(255,255,255,0.2)" />
    <defs>
      <radialGradient id="roundGlow" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
  </svg>
);

const WalkingLanternSVG = ({ color }: { color: string }) => (
  <svg width="80" height="120" viewBox="0 0 80 120" style={{ display: 'block' }}>
    <line x1="40" y1="0" x2="40" y2="12" stroke="#d4a373" strokeWidth="2" />
    <polygon points="40,12 10,30 10,90 40,108 70,90 70,30" fill={color} />
    <polygon points="40,12 10,30 10,90 40,108 70,90 70,30" fill="url(#walkingGlow)" />
    <polygon points="40,18 15,34 15,86 40,102 65,86 65,34" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    <rect x="20" y="35" width="40" height="25" fill="rgba(255,255,255,0.3)" rx="2" />
    <circle cx="30" cy="47" r="3" fill="#2d3436" />
    <circle cx="50" cy="47" r="3" fill="#2d3436" />
    <path d="M30 55 Q40 62 50 55" stroke="#2d3436" strokeWidth="2" fill="none" />
    <rect x="25" y="8" width="30" height="6" fill="#b8860b" rx="1" />
    <rect x="25" y="106" width="30" height="6" fill="#b8860b" rx="1" />
    <line x1="40" y1="112" x2="40" y2="120" stroke="#d4a373" strokeWidth="2" />
    <defs>
      <linearGradient id="walkingGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
      </linearGradient>
    </defs>
  </svg>
);

const SilkLanternSVG = ({ color }: { color: string }) => (
  <svg width="80" height="120" viewBox="0 0 80 120" style={{ display: 'block' }}>
    <line x1="40" y1="0" x2="40" y2="12" stroke="#d4a373" strokeWidth="2" />
    <path
      d="M40 12 
         C15 20 10 50 10 65 
         C10 80 15 100 40 108 
         C65 100 70 80 70 65 
         C70 50 65 20 40 12 Z"
      fill={color}
    />
    <path
      d="M40 12 
         C15 20 10 50 10 65 
         C10 80 15 100 40 108 
         C65 100 70 80 70 65 
         C70 50 65 20 40 12 Z"
      fill="url(#silkGlow)"
    />
    <path
      d="M40 18 
         C20 25 15 50 15 65 
         C15 78 20 95 40 102 
         C60 95 65 78 65 65 
         C65 50 60 25 40 18 Z"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1"
    />
    <line x1="40" y1="25" x2="40" y2="95" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <line x1="25" y1="40" x2="55" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <line x1="22" y1="65" x2="58" y2="65" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <line x1="25" y1="90" x2="55" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <rect x="25" y="8" width="30" height="6" fill="#b8860b" rx="1" />
    <rect x="25" y="106" width="30" height="6" fill="#b8860b" rx="1" />
    <line x1="40" y1="112" x2="40" y2="120" stroke="#d4a373" strokeWidth="2" />
    <ellipse cx="30" cy="45" rx="6" ry="10" fill="rgba(255,255,255,0.3)" />
    <defs>
      <radialGradient id="silkGlow" cx="35%" cy="25%" r="60%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
  </svg>
);

const LanternDisplay = memo(function LanternDisplay({
  lantern,
  slotIndex,
  onClick,
  isFlashing = false,
}: LanternDisplayProps) {
  const color = lanternColors[lantern.type];

  const renderLanternSVG = () => {
    switch (lantern.type) {
      case 'round':
        return <RoundLanternSVG color={color} />;
      case 'walking':
        return <WalkingLanternSVG color={color} />;
      case 'silk':
        return <SilkLanternSVG color={color} />;
      default:
        return <RoundLanternSVG color={color} />;
    }
  };

  return (
    <motion.div
      style={{
        position: 'relative',
        width: 80,
        height: 120,
        cursor: 'pointer',
        transformOrigin: 'top center',
        willChange: 'transform',
        filter: lantern.isDimming ? 'brightness(0.3)' : isFlashing ? 'brightness(1.5)' : 'brightness(1)',
      }}
      initial={{ y: -200, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        rotate: lantern.isSwinging ? [5, -5, 5] : 0,
      }}
      transition={{
        y: { duration: 0.8, ease: 'easeOut' },
        opacity: { duration: 0.8, ease: 'easeOut' },
        rotate: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        filter: { duration: 0.3 },
      }}
      whileHover={{ scale: 1.05, y: -4 }}
      onClick={onClick}
    >
      <AnimatePresence>{lantern.isExploding && <ParticleExplosion />}</AnimatePresence>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          filter: `drop-shadow(0 4px 8px ${color}66)`,
        }}
      >
        {renderLanternSVG()}
      </div>

      {lantern.riddle && (
        <div
          style={{
            position: 'absolute',
            top: 125,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
          }}
        >
          <RiddleCard riddle={lantern.riddle} mode="display" />
        </div>
      )}
    </motion.div>
  );
});

export default LanternDisplay;
