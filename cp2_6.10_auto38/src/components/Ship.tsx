import React from 'react';
import { motion } from 'framer-motion';
import { EnemyShip as EnemyShipType } from '../hooks/useBattleState';

interface TowerShipProps {
  angle: number;
  isHit: boolean;
  children?: React.ReactNode;
}

export const TowerShip: React.FC<TowerShipProps> = ({ angle, isHit, children }) => {
  return (
    <motion.div
      className={`tower-ship ${isHit ? 'hit' : ''}`}
      animate={{ rotate: angle }}
      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
    >
      <div className="hull" />
      <div className="bow-spur" />
      <div className="stern-spur" />
      <div className="deck deck-1">
        <div className="windows">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="window" />
          ))}
        </div>
      </div>
      <div className="deck deck-2">
        <div className="windows">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="window" />
          ))}
        </div>
      </div>
      <div className="deck deck-3">
        <div className="windows">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="window" />
          ))}
        </div>
      </div>
      <div className="flag-pole">
        <div className="flag" />
      </div>
      <div className="anchor-chain" />
      {children}
    </motion.div>
  );
};

interface EnemyShipProps {
  ship: EnemyShipType;
  onClick?: () => void;
}

export const EnemyShipComponent: React.FC<EnemyShipProps> = ({ ship, onClick }) => {
  const width = ship.type === 'mengchong' ? 100 : 130;
  const height = ship.type === 'mengchong' ? 50 : 60;

  return (
    <motion.div
      className={`enemy-ship ${ship.type} ${ship.isSinking ? 'sinking' : ''} ${ship.isGrappling ? 'grappling' : ''}`}
      style={{
        left: ship.x,
        bottom: `${18 + Math.sin(ship.x * 0.01) * 2}%`,
        transform: `scaleX(${ship.direction})`,
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="enemy-hp-bar">
        <div
          className="enemy-hp-fill"
          style={{ width: `${(ship.hp / ship.maxHp) * 100}%` }}
        />
      </div>
      <div className="enemy-hull" style={{ width, height: height * 0.6 }} />
      <div className="enemy-deck" style={{ width: width * 0.8, height: height * 0.35 }} />
      <div className="enemy-flag" />
    </motion.div>
  );
};

interface ReedBoatProps {
  x: number;
}

export const ReedBoat: React.FC<ReedBoatProps> = ({ x }) => {
  return (
    <motion.div
      className="reed-boat"
      style={{ left: x }}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="reed-hull" />
      <div className="reed-stack" />
      <div className="smoke" />
      <div className="smoke" />
      <div className="smoke" />
    </motion.div>
  );
};

interface ParticleProps {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export const ParticleComponent: React.FC<ParticleProps> = ({ x, y, vx, vy, life }) => {
  return (
    <motion.div
      className="particle"
      style={{
        left: x,
        top: y,
        opacity: life,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
      initial={{ scale: 1 }}
      animate={{
        x: vx * 30,
        y: vy * 30,
        scale: 0.5,
        opacity: 0,
      }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
};
