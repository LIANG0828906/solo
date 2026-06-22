import React from 'react';
import { motion } from 'framer-motion';
import { Horse, HorseSpeed } from '../types';

interface HorseAnimationProps {
  horse: Horse;
  isRunning?: boolean;
  style?: React.CSSProperties;
}

const HorseAnimation: React.FC<HorseAnimationProps> = ({ horse, isRunning = false, style }) => {
  const getHorseColor = (speed: HorseSpeed) => {
    switch (speed) {
      case HorseSpeed.THREE_HUNDRED: return '#8b2500';
      case HorseSpeed.FIVE_HUNDRED: return '#b85a0a';
      case HorseSpeed.EIGHT_HUNDRED: return '#e8e8e8';
    }
  };

  const getAnimationDuration = (speed: HorseSpeed, stamina: number) => {
    const baseDuration = speed === HorseSpeed.THREE_HUNDRED ? 0.8 :
                         speed === HorseSpeed.FIVE_HUNDRED ? 0.5 : 0.3;
    return stamina < 30 ? baseDuration * 2 : baseDuration;
  };

  const horseColor = getHorseColor(horse.speed);
  const animationDuration = getAnimationDuration(horse.speed, horse.stamina);

  if (horse.isExhausted) {
    return (
      <div style={{ ...style, position: 'relative' }}>
        <motion.div
          animate={{
            rotate: [0, -10, -10, -10, -10, -10, -10],
            y: [0, 0, 0, 0, 0, 0, 0]
          }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            width: '40px',
            height: '30px',
            position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute',
            width: '30px',
            height: '15px',
            backgroundColor: horseColor,
            borderRadius: '50% 50% 30% 30%',
            top: '10px',
            left: '5px',
            transform: 'rotate(-90deg)',
            boxShadow: horse.speed === HorseSpeed.EIGHT_HUNDRED ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none'
          }} />
          <div style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            backgroundColor: horseColor,
            borderRadius: '50%',
            top: '5px',
            left: '-2px'
          }} />
          <motion.div
            animate={{ rotate: [0, 20, -10, 20, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '8px',
              backgroundColor: horseColor,
              top: '15px',
              left: '10px',
              borderRadius: '2px'
            }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ ...style, position: 'relative' }}>
      <motion.div
        animate={isRunning ? {
          y: [0, -3, 0, -3, 0]
        } : {}}
        transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '40px',
          height: '30px',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          width: '28px',
          height: '14px',
          backgroundColor: horseColor,
          borderRadius: '40% 40% 30% 30%',
          top: '8px',
          left: '6px',
          boxShadow: horse.speed === HorseSpeed.EIGHT_HUNDRED ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '12px',
          height: '12px',
          backgroundColor: horseColor,
          borderRadius: '50%',
          top: '3px',
          left: '0px'
        }} />
        <div style={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          backgroundColor: '#000',
          borderRadius: '50%',
          top: '5px',
          left: '3px'
        }} />
        <div style={{
          position: 'absolute',
          width: '8px',
          height: '4px',
          backgroundColor: horseColor,
          top: '6px',
          left: '-4px',
          borderRadius: '50% 0 0 50%'
        }} />
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '3px',
          backgroundColor: '#333',
          top: '15px',
          right: '2px',
          borderRadius: '0 50% 50% 0'
        }} />
        <motion.div
          animate={isRunning ? {
            height: ['10px', '6px', '10px', '6px', '10px'],
            y: [0, '2px', 0, '2px', 0]
          } : {}}
          transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '10px',
            backgroundColor: horseColor,
            bottom: '0px',
            left: '10px',
            borderRadius: '2px'
          }}
        />
        <motion.div
          animate={isRunning ? {
            height: ['6px', '10px', '6px', '10px', '6px'],
            y: ['2px', 0, '2px', 0, '2px']
          } : {}}
          transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '10px',
            backgroundColor: horseColor,
            bottom: '0px',
            left: '16px',
            borderRadius: '2px'
          }}
        />
        <motion.div
          animate={isRunning ? {
            height: ['10px', '6px', '10px', '6px', '10px'],
            y: [0, '2px', 0, '2px', 0]
          } : {}}
          transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '10px',
            backgroundColor: horseColor,
            bottom: '0px',
            right: '10px',
            borderRadius: '2px'
          }}
        />
        <motion.div
          animate={isRunning ? {
            height: ['6px', '10px', '6px', '10px', '6px'],
            y: ['2px', 0, '2px', 0, '2px']
          } : {}}
          transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '10px',
            backgroundColor: horseColor,
            bottom: '0px',
            right: '4px',
            borderRadius: '2px'
          }}
        />
      </motion.div>
    </div>
  );
};

export default HorseAnimation;
