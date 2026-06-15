import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLampStore, getOrderedScreens } from '../store/lampStore';
import { ScreenArt } from './ScreenArt';

export const LampBody: React.FC = () => {
  const { screens, screenOrder, speed, currentRotation, updateRotation } = useLampStore();
  const orderedScreens = getOrderedScreens(screens, screenOrder);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const rotationSpeed = (speed / 10) * 36;
      const delta = rotationSpeed * deltaTime;
      updateRotation(delta);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, updateRotation]);

  const panelWidth = 120;
  const panelHeight = 160;
  const radius = (panelWidth / 2) / Math.tan(Math.PI / 6);

  return (
    <div
      style={{
        perspective: '1000px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <motion.div
        style={{
          width: panelWidth,
          height: panelHeight,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${currentRotation}deg)`,
          willChange: 'transform'
        }}
      >
        {orderedScreens.map((screen, index) => {
          const angle = (index * 360) / 6;
          return (
            <div
              key={screen.id}
              style={{
                position: 'absolute',
                width: panelWidth,
                height: panelHeight,
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#3e2723',
                border: '3px solid #5d4037',
                borderRadius: '4px',
                boxShadow: '0 0 30px rgba(255, 183, 77, 0.4), inset 0 0 20px rgba(0,0,0,0.3)',
                willChange: 'transform'
              }}
            >
              <div
                style={{
                  width: panelWidth - 16,
                  height: panelHeight - 16,
                  overflow: 'hidden',
                  borderRadius: '2px',
                  border: '1px solid #4e342e'
                }}
              >
                <ScreenArt screen={screen} width={panelWidth - 16} height={panelHeight - 16} showFrame={false} />
              </div>
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            width: panelWidth,
            height: panelWidth,
            transform: `rotateX(90deg) translateZ(${panelHeight / 2}px)`,
            background: 'linear-gradient(135deg, #5d4037 0%, #3e2723 100%)',
            border: '2px solid #4e342e',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(255, 183, 77, 0.3)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: panelWidth,
            height: panelWidth,
            transform: `rotateX(-90deg) translateZ(${panelHeight / 2}px)`,
            background: 'linear-gradient(135deg, #3e2723 0%, #5d4037 100%)',
            border: '2px solid #4e342e',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(255, 183, 77, 0.3)'
          }}
        />
      </motion.div>
    </div>
  );
};
