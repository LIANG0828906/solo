
import { useEffect, useRef } from 'react';
import { Walnut } from '../types';
import { drawWalnutPair } from '../utils/walnutRenderer';
import { getGradeColor } from '../utils/gradeCalculator';
import './WalnutCard.css';

interface WalnutCardProps {
  walnut: Walnut;
  onClick?: () => void;
  showPrice?: boolean;
  showGrade?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function WalnutCard({ walnut, onClick, showPrice = false, showGrade = true, size = 'medium' }: WalnutCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const rotationRef = useRef(0);

  const sizes = {
    small: 80,
    medium: 120,
    large: 180,
  };

  const canvasSize = sizes[size] * 1.4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      rotationRef.current += 0.3;
      if (rotationRef.current >= 360) rotationRef.current = 0;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWalnutPair(ctx, {
        rotationY: rotationRef.current,
        rotationX: 10,
        scale: 1,
        textureSeed: walnut.textureSeed,
        size: sizes[size],
        spacing: sizes[size] * 0.3,
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [walnut.textureSeed, size]);

  return (
    <div 
      className={`walnut-card walnut-card-${size}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="walnut-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
        />
      </div>
      <div className="walnut-info">
        <h3 className="walnut-name">{walnut.name}</h3>
        <p className="walnut-variety">{walnut.variety}</p>
        {showGrade && (
          <span 
            className="walnut-grade"
            style={{ color: getGradeColor(walnut.grade) }}
          >
            {walnut.grade}
          </span>
        )}
        {showPrice && (
          <span className="walnut-price">{walnut.price} 文钱</span>
        )}
      </div>
    </div>
  );
}
