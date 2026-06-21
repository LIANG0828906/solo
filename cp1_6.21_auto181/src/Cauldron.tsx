import React, { useEffect, useRef, useState } from 'react';
import { getElementById, type Element } from './RecipeManager';

interface CauldronProps {
  isShaking: boolean;
  resultElementId: string | null;
  particleColors: string[];
  triggerParticles: boolean;
  onParticleComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const Cauldron: React.FC<CauldronProps> = ({
  isShaking,
  resultElementId,
  particleColors,
  triggerParticles,
  onParticleComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const resultElement: Element | undefined = resultElementId
    ? getElementById(resultElementId)
    : undefined;

  useEffect(() => {
    if (triggerParticles && particleColors.length > 0) {
      spawnParticles();
    }
  }, [triggerParticles, particleColors]);

  useEffect(() => {
    if (resultElementId) {
      setShowResult(false);
      setBounceKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setShowResult(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [resultElementId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateParticles(ctx, canvas.width, canvas.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const spawnParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = 60;
    const newParticles: Particle[] = [];
    const colors = particleColors.length > 0 ? particleColors : ['#22C55E', '#4ADE80', '#86EFAC'];

    for (let i = 0; i < count; i++) {
      const size = 3 + Math.random() * 5;
      newParticles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.65,
        vx: (Math.random() - 0.5) * 2,
        vy: -(1 + Math.random() * 2),
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.8 + Math.random() * 0.2,
        life: 0,
        maxLife: 60 + Math.random() * 40
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];

    if (onParticleComplete) {
      setTimeout(onParticleComplete, 2000);
    }
  };

  const updateParticles = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const particles = particlesRef.current;
    const activeParticles: Particle[] = [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.02;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life < p.maxLife && p.y > -20 && p.y < height && p.x > -20 && p.x < width + 20) {
        activeParticles.push(p);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    particlesRef.current = activeParticles;
  };

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        width={250}
        height={300}
        style={styles.canvas}
      />

      <div
        className={`cauldron-wrapper ${isShaking ? 'shake' : ''}`}
        style={{
          ...styles.cauldronWrapper,
          animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
        }}
      >
        <div style={styles.cauldronBase} />

        <div style={styles.cauldronBody}>
          <div style={styles.liquid}>
            <div style={styles.bubble1} className="bubble" />
            <div style={styles.bubble2} className="bubble" />
            <div style={styles.bubble3} className="bubble" />
            <div style={styles.liquidSurface} />
          </div>
        </div>

        <div style={styles.cauldronRim} />
        <div style={styles.handleLeft} />
        <div style={styles.handleRight} />
      </div>

      {showResult && resultElement && (
        <div
          key={bounceKey}
          className="result-bounce"
          style={{
            ...styles.resultElement,
            animation: 'bounceIn 0.6s ease-out forwards'
          }}
        >
          <span style={{ fontSize: '48px' }}>{resultElement.icon}</span>
          <span style={{ ...styles.resultName, color: resultElement.color }}>
            {resultElement.name}
          </span>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(5px) rotate(1deg); }
        }

        @keyframes bounceIn {
          0% { transform: translateY(60px) scale(0); opacity: 0; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
          70% { transform: translateY(5px) scale(0.95); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes bubbleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
        }

        @keyframes liquidWave {
          0%, 100% { transform: translateY(0) scaleX(1); }
          25% { transform: translateY(-2px) scaleX(1.02); }
          50% { transform: translateY(0) scaleX(1); }
          75% { transform: translateY(2px) scaleX(0.98); }
        }

        .bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          animation: bubbleRise 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: 250,
    height: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    pointerEvents: 'none'
  },
  cauldronWrapper: {
    position: 'relative',
    width: 200,
    height: 200,
    zIndex: 5
  },
  cauldronBase: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 20,
    background: '#4A3728',
    borderRadius: '4px 4px 8px 8px',
    boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.3)'
  },
  cauldronBody: {
    position: 'absolute',
    bottom: 15,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 160,
    height: 130,
    background: 'linear-gradient(180deg, #9CA3AF 0%, #6B7280 50%, #4B5563 100%)',
    borderRadius: '0 0 80px 80px',
    overflow: 'hidden',
    boxShadow: `
      inset -8px 0 0 rgba(0,0,0,0.2),
      inset 8px 0 0 rgba(255,255,255,0.1),
      0 4px 8px rgba(0,0,0,0.4)
    `
  },
  liquid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    background: 'linear-gradient(180deg, #4ADE80 0%, #22C55E 50%, #16A34A 100%)',
    overflow: 'hidden'
  },
  liquidSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
    animation: 'liquidWave 3s infinite ease-in-out'
  },
  bubble1: {
    width: 8,
    height: 8,
    left: '20%',
    bottom: 10,
    animationDelay: '0s'
  },
  bubble2: {
    width: 6,
    height: 6,
    left: '50%',
    bottom: 5,
    animationDelay: '0.7s'
  },
  bubble3: {
    width: 10,
    height: 10,
    left: '70%',
    bottom: 15,
    animationDelay: '1.4s'
  },
  cauldronRim: {
    position: 'absolute',
    top: 50,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 170,
    height: 16,
    background: 'linear-gradient(180deg, #D1D5DB 0%, #9CA3AF 50%, #6B7280 100%)',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  handleLeft: {
    position: 'absolute',
    top: 75,
    left: 5,
    width: 20,
    height: 30,
    border: '4px solid #6B7280',
    borderRadius: '10px 0 0 10px',
    borderRight: 'none'
  },
  handleRight: {
    position: 'absolute',
    top: 75,
    right: 5,
    width: 20,
    height: 30,
    border: '4px solid #6B7280',
    borderRadius: '0 10px 10px 0',
    borderLeft: 'none'
  },
  resultElement: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    zIndex: 20
  },
  resultName: {
    fontSize: '14px',
    fontWeight: 'bold',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    fontFamily: "'Courier New', monospace"
  }
};

export default Cauldron;
