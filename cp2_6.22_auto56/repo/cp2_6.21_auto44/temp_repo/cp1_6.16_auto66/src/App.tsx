import React, { useRef, useState, useEffect, useCallback } from 'react';
import ControlPanel from './controlPanel';

interface StabilityBarProps {
  stability: number;
}

const StabilityBar: React.FC<StabilityBarProps> = ({ stability }) => {
  return (
    <div className="stability-bar-container">
      <div className="stability-bar">
        <div
          className="stability-indicator"
          style={{ left: `${stability * 100}%` }}
        ></div>
      </div>
      <div className="stability-label">
        稳定性: {(stability * 100).toFixed(0)}%
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const [alpha, setAlpha] = useState<number>(10);
  const [theta, setTheta] = useState<number>(6);
  const [delta, setDelta] = useState<number>(2);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stability, setStability] = useState<number>(0.85);

  const calculateStability = useCallback(() => {
    const alphaOptimal = 10;
    const thetaOptimal = 6;
    const deltaOptimal = 2.5;

    const alphaDeviation = Math.abs(alpha - alphaOptimal) / 4;
    const thetaDeviation = Math.abs(theta - thetaOptimal) / 4;
    const deltaDeviation = Math.abs(delta - deltaOptimal) / 3.5;

    const avgDeviation = (alphaDeviation + thetaDeviation + deltaDeviation) / 3;
    const calculatedStability = Math.max(0, Math.min(1, 1 - avgDeviation * 0.8));

    return calculatedStability;
  }, [alpha, theta, delta]);

  useEffect(() => {
    setStability(calculateStability());
  }, [calculateStability]);

  const drawWave = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const centerY = height / 2;
      const time = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 2
      );
      bgGradient.addColorStop(0, 'rgba(30, 30, 60, 0.3)');
      bgGradient.addColorStop(1, 'rgba(10, 10, 30, 0.9)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const waves = [
        {
          freq: alpha * 0.5,
          amplitude: 25,
          color: 'rgba(168, 85, 247, 0.7)',
          glow: 'rgba(168, 85, 247, 0.3)',
          speed: 0.02,
          yOffset: -centerY * 0.2,
        },
        {
          freq: theta * 0.8,
          amplitude: 35,
          color: 'rgba(59, 130, 246, 0.7)',
          glow: 'rgba(59, 130, 246, 0.3)',
          speed: 0.015,
          yOffset: 0,
        },
        {
          freq: delta * 1.2,
          amplitude: 45,
          color: 'rgba(34, 197, 94, 0.7)',
          glow: 'rgba(34, 197, 94, 0.3)',
          speed: 0.01,
          yOffset: centerY * 0.2,
        },
      ];

      waves.forEach((wave, index) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 2.5 - index * 0.5;
        ctx.shadowColor = wave.glow;
        ctx.shadowBlur = 15;

        for (let x = 0; x <= width; x++) {
          const normalizedX = x / width;
          const y =
            centerY +
            wave.yOffset +
            Math.sin(x * wave.freq * 0.01 + time * wave.speed) *
              wave.amplitude *
              (1 - Math.abs(normalizedX - 0.5) * 0.5);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;

      for (let i = 0; i < 30; i++) {
        const starX = ((i * 137.5) % width);
        const starY = ((i * 89.3 + time * 0.05) % height);
        const starSize = (i % 3) * 0.5 + 0.5;
        const alpha2 = 0.3 + Math.sin(time * 0.02 + i) * 0.2;

        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha2})`;
        ctx.fill();
      }
    },
    [alpha, theta, delta]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 1;

    drawWave(ctx, canvas.width, canvas.height);

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [drawWave, isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const wrapper = canvas.parentElement;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * 0.9);
        canvas.height = Math.floor(rect.height * 0.8);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawWave(ctx, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawWave]);

  useEffect(() => {
    if (isRunning) {
      timeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animate]);

  const handleToggleRun = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <ControlPanel
          alpha={alpha}
          theta={theta}
          delta={delta}
          onAlphaChange={setAlpha}
          onThetaChange={setTheta}
          onDeltaChange={setDelta}
          isRunning={isRunning}
          onToggleRun={handleToggleRun}
        />
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} />
        </div>
      </div>
      <StabilityBar stability={stability} />
    </div>
  );
};

export default App;
