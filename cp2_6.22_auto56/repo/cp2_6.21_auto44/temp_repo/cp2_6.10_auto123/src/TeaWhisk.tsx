import React, { useRef, useEffect, useCallback } from 'react';

interface TeaWhiskProps {
  position: { x: number; y: number };
  speed: number;
  isWhisking: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onFoamGenerated: (speed: number) => void;
}

interface Bubble {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const TeaWhisk: React.FC<TeaWhiskProps> = ({
  position,
  speed,
  isWhisking,
  canvasRef,
  onFoamGenerated,
}) => {
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<number>(0);
  const lastPosRef = useRef(position);

  const generateBubbles = useCallback(
    (centerX: number, centerY: number, velocity: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const bubbleCount = Math.min(Math.floor(velocity * 3), 10);

      for (let i = 0; i < bubbleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20 + 5;
        const bubbleSize = Math.max(1, 8 - velocity * 0.5 + Math.random() * 3);

        const bubble: Bubble = {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          radius: bubbleSize,
          opacity: 0.8 + Math.random() * 0.2,
          vx: Math.cos(angle) * (1 + Math.random() * 2),
          vy: Math.sin(angle) * (1 + Math.random() * 2) - 0.5,
          life: 1,
          maxLife: 60 + Math.random() * 60,
        };

        bubblesRef.current.push(bubble);
      }

      if (velocity > 0) {
        onFoamGenerated(velocity);
      }
    },
    [canvasRef, onFoamGenerated]
  );

  const drawBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubblesRef.current = bubblesRef.current.filter((bubble) => {
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;
      bubble.life -= 1 / bubble.maxLife;
      bubble.opacity = bubble.life * 0.9;
      bubble.radius *= 0.995;

      if (bubble.life <= 0 || bubble.radius < 0.5) return false;

      const gradient = ctx.createRadialGradient(
        bubble.x,
        bubble.y,
        0,
        bubble.x,
        bubble.y,
        bubble.radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity})`);
      gradient.addColorStop(
        0.5,
        `rgba(240, 248, 240, ${bubble.opacity * 0.7})`
      );
      gradient.addColorStop(
        1,
        `rgba(200, 230, 200, ${bubble.opacity * 0.3})`
      );

      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      return true;
    });

    if (isWhisking) {
      const whiskX = position.x;
      const whiskY = position.y;

      for (let i = 0; i < 5; i++) {
        const angle = (Date.now() / 50 + i * (Math.PI * 2) / 5) % (Math.PI * 2);
        const trailX = whiskX + Math.cos(angle) * 15;
        const trailY = whiskY + Math.sin(angle) * 15;

        const trailGradient = ctx.createRadialGradient(
          trailX,
          trailY,
          0,
          trailX,
          trailY,
          8
        );
        trailGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(trailX, trailY, 8, 0, Math.PI * 2);
        ctx.fillStyle = trailGradient;
        ctx.fill();
      }
    }

    animationRef.current = requestAnimationFrame(drawBubbles);
  }, [canvasRef, isWhisking, position]);

  useEffect(() => {
    if (isWhisking) {
      const dx = position.x - lastPosRef.current.x;
      const dy = position.y - lastPosRef.current.y;
      const velocity = Math.sqrt(dx * dx + dy * dy);

      if (velocity > 0.5) {
        generateBubbles(position.x, position.y, velocity);
      }
    }

    lastPosRef.current = position;
  }, [position, isWhisking, generateBubbles]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawBubbles);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawBubbles]);

  return (
    <div
      className="whisk-container"
      style={{
        left: position.x - 4,
        top: position.y - 40,
        transform: isWhisking ? `rotate(${Math.sin(Date.now() / 30) * 10}deg)` : 'none',
      }}
    >
      <div className="tea-whisk" />
    </div>
  );
};

export default TeaWhisk;
