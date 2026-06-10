import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

const StoneDoor: React.FC = () => {
  const showDoor = useGameStore((state) => state.showDoor);

  return (
    <AnimatePresence>
      {showDoor && (
        <motion.div
          className="stone-door-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            className="stone-door-left"
            initial={{ clipPath: 'inset(0 50% 0 0)' }}
            animate={{ clipPath: 'inset(0 100% 0 0)' }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #3d3d5c 0%, #2c2c3e 50%, #1a1a2e 100%)',
              borderRadius: '8px 0 0 8px',
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '40px',
                background: 'linear-gradient(90deg, #b87333, #8b6f47)',
                borderRadius: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            />
          </motion.div>

          <motion.div
            className="stone-door-right"
            initial={{ clipPath: 'inset(0 0 0 50%)' }}
            animate={{ clipPath: 'inset(0 0 0 100%)' }}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(270deg, #3d3d5c 0%, #2c2c3e 50%, #1a1a2e 100%)',
              borderRadius: '0 8px 8px 0',
              boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '40px',
                background: 'linear-gradient(270deg, #b87333, #8b6f47)',
                borderRadius: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            />
          </motion.div>

          <motion.div
            className="door-reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 2 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
              borderRadius: '8px',
            }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '60px',
                height: '60px',
                border: '3px solid #ffd700',
                borderRadius: '50%',
                borderTopColor: 'transparent',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StoneDoor;
