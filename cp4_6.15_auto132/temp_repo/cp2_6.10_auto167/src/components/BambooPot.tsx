import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { PotDimensions } from '../types/game';

interface BambooPotProps {
  dimensions: PotDimensions;
}

export const BambooPot = ({ dimensions }: BambooPotProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const potShaking = useGameStore((state) => state.potShaking);
  const showFlash = useGameStore((state) => state.showFlash);
  const clearPotEffect = useGameStore((state) => state.clearPotEffect);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { height, mouthDiameter, earDiameter, earOffset } = dimensions;
    const centerX = canvas.width / 2;
    const potTopY = 50;
    const potBottomY = potTopY + height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(
      centerX - mouthDiameter / 2,
      potTopY,
      centerX + mouthDiameter / 2,
      potBottomY
    );
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.3, '#A0522D');
    gradient.addColorStop(0.5, '#CD853F');
    gradient.addColorStop(0.7, '#8B4513');
    gradient.addColorStop(1, '#654321');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(centerX - mouthDiameter / 2, potTopY);
    ctx.lineTo(centerX - mouthDiameter / 2 - 10, potBottomY);
    ctx.lineTo(centerX + mouthDiameter / 2 + 10, potBottomY);
    ctx.lineTo(centerX + mouthDiameter / 2, potTopY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const y = potTopY + (height / 8) * i;
      const widthAtY = mouthDiameter + (20 / height) * (y - potTopY);
      ctx.beginPath();
      ctx.moveTo(centerX - widthAtY / 2, y);
      ctx.lineTo(centerX + widthAtY / 2, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#2F1810';
    ctx.beginPath();
    ctx.ellipse(centerX, potTopY, mouthDiameter / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3D2314';
    ctx.beginPath();
    ctx.ellipse(centerX, potTopY, mouthDiameter / 2 - 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawEar = (x: number, y: number) => {
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(x, y, earDiameter / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.arc(x, y, earDiameter / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3D2314';
      ctx.beginPath();
      ctx.arc(x, y, earDiameter / 2 - 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - earDiameter / 2 - 5, y);
      ctx.lineTo(x - mouthDiameter / 2 + 5, y);
      ctx.stroke();
    };

    drawEar(centerX - earOffset, potTopY + 25);
    drawEar(centerX + earOffset, potTopY + 25);

    ctx.fillStyle = '#5D3A1A';
    ctx.beginPath();
    ctx.ellipse(centerX, potBottomY, mouthDiameter / 2 + 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }, [dimensions]);

  useEffect(() => {
    if (potShaking || showFlash) {
      const timer = setTimeout(() => {
        clearPotEffect();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [potShaking, showFlash, clearPotEffect]);

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={potShaking ? {
          x: [0, -5, 5, -5, 5, 0],
          transition: { duration: 0.4, ease: 'easeInOut' }
        } : {}}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={dimensions.height + 100}
          className="drop-shadow-2xl"
        />
        {showFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-32 h-32 rounded-full bg-yellow-400 opacity-60 blur-xl" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
