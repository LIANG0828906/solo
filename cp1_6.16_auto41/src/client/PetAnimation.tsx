import { memo, useMemo } from 'react';
import type { PetStats } from './types';
import './PetAnimation.css';

interface PetAnimationProps {
  name: string;
  color: string;
  stats: PetStats;
  isSick: boolean;
  animationType?: 'feed' | 'clean' | 'play' | null;
}

const PetAnimation = memo(function PetAnimation({
  name,
  color,
  stats,
  isSick,
  animationType = null,
}: PetAnimationProps) {
  const stateClass = useMemo(() => {
    if (isSick) return 'animate-sick';
    
    const classes: string[] = [];
    
    if (stats.hunger < 20) classes.push('animate-ear-droop');
    if (stats.happiness > 70) classes.push('animate-spin-slow');
    if (stats.cleanliness > 80) classes.push('animate-sparkle');
    if (stats.energy < 20) classes.push('animate-sleep');
    
    if (animationType === 'feed') classes.push('animate-mouth');
    if (animationType === 'play') classes.push('animate-jump');
    if (animationType === 'clean') classes.push('animate-clean');
    
    return classes.join(' ');
  }, [stats, isSick, animationType]);

  const hasWarning = stats.hunger < 20 || stats.happiness < 20 || stats.cleanliness < 20 || stats.energy < 20;

  return (
    <div className={`pet-container ${hasWarning && !isSick ? 'warning-border' : ''}`}>
      <div className={`pet ${stateClass}`} style={{ ['--pet-color' as string]: color }}>
        <div className="pet-body">
          <div className="pet-ears">
            <div className="pet-ear left" />
            <div className="pet-ear right" />
          </div>
          
          <div className="pet-face">
            <div className="pet-eyes">
              <div className="pet-eye left">
                <div className="pupil" />
              </div>
              <div className="pet-eye right">
                <div className="pupil" />
              </div>
            </div>
            
            <div className="pet-nose" />
            <div className="pet-mouth" />
            
            <div className="pet-cheeks">
              <div className="cheek left" />
              <div className="cheek right" />
            </div>
          </div>
        </div>
        
        <div className="pet-tail" />
        
        {animationType === 'clean' && (
          <div className="water-effects">
            <span className="water-drop d1">💧</span>
            <span className="water-drop d2">💦</span>
            <span className="water-drop d3">💧</span>
            <span className="water-drop d4">✨</span>
          </div>
        )}
        
        {isSick && (
          <div className="sick-effect">
            <span className="sick-icon">💤</span>
          </div>
        )}
        
        {stats.energy < 20 && !isSick && (
          <div className="sleep-z">
            <span>Z</span>
            <span className="z2">z</span>
            <span className="z3">z</span>
          </div>
        )}
      </div>
      
      <div className="pet-name">{name}</div>
    </div>
  );
});

export default PetAnimation;
