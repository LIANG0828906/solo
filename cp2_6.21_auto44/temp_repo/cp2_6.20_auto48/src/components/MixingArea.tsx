import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Tilt } from 'react-tilt';
import { ShakerState, GlassState, BottleData } from '../types';
import { useCartStore } from '../stores/cartStore';
import { recipeApi } from '../api/recipeApi';

interface ShakerProps {
  state: ShakerState;
  onShake: () => void;
  ingredients: string[];
  onDropIngredient: (ingredientId: string, ingredientName: string, type: 'base' | 'mixer' | 'garnish') => void;
}

const CocktailShaker = memo(function CocktailShaker({ state, onShake, ingredients, onDropIngredient }: ShakerProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'shaker',
  });
  const droppedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (active && isOver) {
      const data = active.data.current as BottleData | undefined;
      if (data && (data.type === 'base' || data.type === 'mixer')) {
        const key = `${data.id}-${Date.now()}`;
        if (!droppedRef.current.has(data.id)) {
          droppedRef.current.add(data.id);
          onDropIngredient(data.id, data.name, data.type);
        }
        setTimeout(() => droppedRef.current.delete(data.id), 500);
      }
    }
  }, [active, isOver, onDropIngredient]);

  const animationClass = useMemo(() => {
    if (state === 'shaking') return 'shaker-shake-animation';
    return '';
  }, [state]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={setNodeRef}
        className={`relative cursor-pointer select-none transition-all duration-100 ${animationClass} ${
          isOver ? 'scale-110 ring-4 ring-yellow-400/50 rounded-full' : 'hover:scale-105'
        }`}
        onClick={onShake}
      >
        {isOver && (
          <div className="absolute -inset-6 rounded-full bg-yellow-400/20 animate-pulse" />
        )}

        <svg width="80" height="120" viewBox="0 0 80 120" className="drop-shadow-2xl">
          <defs>
            <linearGradient id="shakerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="30%" stopColor="#8a8a8a" />
              <stop offset="50%" stopColor="#c0c0c0" />
              <stop offset="70%" stopColor="#8a8a8a" />
              <stop offset="100%" stopColor="#4a4a4a" />
            </linearGradient>
            <linearGradient id="capGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3a3a3a" />
              <stop offset="100%" stopColor="#5a5a5a" />
            </linearGradient>
            <radialGradient id="condensationGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          <path d="M25 0 L55 0 L58 8 L58 15 Q58 18 55 18 L25 18 Q22 18 22 15 L22 8 Z"
                fill="url(#capGrad)" />

          <ellipse cx="40" cy="0" rx="15" ry="4" fill="#2a2a2a" />

          <path d="M22 18 Q22 20 20 22 L15 40 L15 90 Q15 105 40 105 Q65 105 65 90 L65 40 L60 22 Q58 20 58 18 Z"
                fill="url(#shakerGrad)"
                stroke="#3a3a3a"
                strokeWidth="1" />

          <ellipse cx="40" cy="105" rx="25" ry="6" fill="#3a3a3a" />

          {ingredients.length > 0 && (
            <ellipse cx="40" cy="90" rx="22" ry="5" fill="#d4a574" opacity="0.6" />
          )}

          {state === 'shaken' && (
            <g>
              {[
                { cx: 28, cy: 35, r: 3 }, { cx: 52, cy: 40, r: 2.5 },
                { cx: 35, cy: 55, r: 3.5 }, { cx: 48, cy: 60, r: 2 },
                { cx: 25, cy: 70, r: 2.8 }, { cx: 55, cy: 75, r: 3 },
                { cx: 40, cy: 45, r: 2.2 }, { cx: 32, cy: 85, r: 2.6 },
                { cx: 45, cy: 80, r: 2.4 }, { cx: 58, cy: 50, r: 2.8 },
                { cx: 22, cy: 50, r: 2.5 }, { cx: 38, cy: 70, r: 3 },
              ].map((drop, i) => (
                <ellipse
                  key={i}
                  cx={drop.cx}
                  cy={drop.cy}
                  rx={drop.r}
                  ry={drop.r * 0.6}
                  fill="url(#condensationGrad)"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.08}s`, animationDuration: '2s' }}
                />
              ))}
              {[
                { cx: 30, cy: 30 }, { cx: 50, cy: 35 }, { cx: 40, cy: 50 },
                { cx: 25, cy: 65 }, { cx: 55, cy: 70 }, { cx: 35, cy: 80 },
              ].map((pos, i) => (
                <path
                  key={`s-${i}`}
                  d={`M${pos.cx} ${pos.cy} q3 -2 6 0 q3 2 0 5 q-3 2 -6 0 q-3 -2 0 -5`}
                  fill="rgba(255,255,255,0.5)"
                  opacity="0.6"
                />
              ))}
            </g>
          )}

          <path d="M30 30 L30 70" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
          <path d="M35 25 L35 75" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
        </svg>

        {ingredients.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shadow-lg">
            {ingredients.length}
          </div>
        )}
      </div>

      <span className="text-xs text-gray-400 mt-2">
        {state === 'idle' && ingredients.length === 0 && '拖拽酒水到此处'}
        {state === 'idle' && ingredients.length > 0 && '点击摇匀'}
        {state === 'shaking' && '摇匀中...'}
        {state === 'shaken' && '已摇匀 ✓'}
      </span>

      <style>{`
        @keyframes shaker-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          8% { transform: translateX(-12px) rotate(-8deg); }
          16% { transform: translateX(12px) rotate(8deg); }
          24% { transform: translateX(-10px) rotate(-6deg); }
          32% { transform: translateX(10px) rotate(6deg); }
          40% { transform: translateX(-8px) rotate(-5deg); }
          48% { transform: translateX(8px) rotate(5deg); }
          56% { transform: translateX(-6px) rotate(-4deg); }
          64% { transform: translateX(6px) rotate(4deg); }
          72% { transform: translateX(-4px) rotate(-3deg); }
          80% { transform: translateX(4px) rotate(3deg); }
          88% { transform: translateX(-2px) rotate(-1deg); }
          94% { transform: translateX(2px) rotate(1deg); }
        }
        .shaker-shake-animation {
          animation: shaker-shake 2s ease-in-out;
        }
      `}</style>
    </div>
  );
});

interface JiggerProps {
  onClick: () => void;
  disabled: boolean;
}

const Jigger = memo(function Jigger({ onClick, disabled }: JiggerProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative transition-all duration-100 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
        }`}
        onClick={disabled ? undefined : onClick}
      >
        <svg width="60" height="80" viewBox="0 0 60 80" className="drop-shadow-lg">
          <defs>
            <linearGradient id="jiggerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5a5a5a" />
              <stop offset="50%" stopColor="#a0a0a0" />
              <stop offset="100%" stopColor="#5a5a5a" />
            </linearGradient>
          </defs>

          <path d="M10 0 L50 0 Q52 2 50 5 L32 30 L28 30 L10 5 Q8 2 10 0 Z"
                fill="url(#jiggerGrad)"
                stroke="#4a4a4a"
                strokeWidth="1" />

          <ellipse cx="30" cy="0" rx="20" ry="3" fill="#3a3a3a" />

          <path d="M20 30 L40 30 L45 50 L45 70 Q45 75 30 75 Q15 75 15 70 L15 50 Z"
                fill="url(#jiggerGrad)"
                stroke="#4a4a4a"
                strokeWidth="1" />

          <ellipse cx="30" cy="75" rx="15" ry="4" fill="#3a3a3a" />

          <path d="M22 40 L22 60" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
        </svg>
      </div>

      <span className="text-xs text-gray-400 mt-2">
        {disabled ? '请先摇匀' : '点击量取'}
      </span>
    </div>
  );
});

interface GlassProps {
  state: GlassState;
  fillLevel: number;
  liquidColors: string[];
  garnishes: string[];
  onDropGarnish: (garnishId: string, garnishName: string) => void;
}

const CocktailGlass = memo(function CocktailGlass({ state, fillLevel, liquidColors, garnishes, onDropGarnish }: GlassProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'glass',
  });
  const droppedGarnishRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (active && isOver) {
      const data = active.data.current as BottleData | undefined;
      if (data && data.type === 'garnish') {
        if (!droppedGarnishRef.current.has(data.id)) {
          droppedGarnishRef.current.add(data.id);
          onDropGarnish(data.id, data.name);
        }
        setTimeout(() => droppedGarnishRef.current.delete(data.id), 500);
      }
    }
  }, [active, isOver, onDropGarnish]);

  const getLiquidGradient = useMemo(() => {
    if (liquidColors.length === 0) return 'transparent';
    const colors = [...new Set(liquidColors)];
    if (colors.length === 1) return colors[0];
    return `linear-gradient(to top, ${colors.join(', ')})`;
  }, [liquidColors]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={setNodeRef}
        className={`relative transition-all duration-100 ${
          isOver ? 'scale-110 ring-4 ring-green-400/50 rounded-full' : ''
        }`}
      >
        {isOver && (
          <div className="absolute -inset-6 rounded-full bg-green-400/20 animate-pulse" />
        )}

        <Tilt options={{ max: 10, scale: 1.02, speed: 300 }}>
          <svg width="100" height="140" viewBox="0 0 100 140" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                <stop offset="30%" stopColor="white" stopOpacity="0.05" />
                <stop offset="50%" stopColor="white" stopOpacity="0.15" />
                <stop offset="70%" stopColor="white" stopOpacity="0.05" />
                <stop offset="100%" stopColor="white" stopOpacity="0.1" />
              </linearGradient>
              <clipPath id="glassClip">
                <path d="M15 30 L25 110 L75 110 L85 30 Q85 20 50 20 Q15 20 15 30 Z" />
              </clipPath>
            </defs>

            <path d="M15 30 L25 110 L75 110 L85 30 Q85 20 50 20 Q15 20 15 30 Z"
                  fill="url(#glassGrad)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5" />

            <ellipse cx="50" cy="25" rx="35" ry="8" fill="white" fillOpacity="0.1" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

            <g clipPath="url(#glassClip)">
              <rect
                x="15"
                y={30 + (80 - fillLevel * 0.8)}
                width="70"
                height={fillLevel * 0.8}
                fill={liquidColors.length > 0 ? getLiquidGradient : 'transparent'}
                opacity="0.8"
                style={{ transition: 'all 0.5s ease-out' }}
              />

              {state === 'filling' && (
                <g>
                  {[...Array(8)].map((_, i) => (
                    <circle
                      key={i}
                      cx={30 + (i % 3) * 20}
                      cy={60 + Math.floor(i / 3) * 15}
                      r="3"
                      fill="white"
                      opacity="0.5"
                      className="animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </g>
              )}
            </g>

            <path d="M25 110 L30 115 L70 115 L75 110"
                  fill="rgba(255,255,255,0.2)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1" />

            <rect x="45" y="115" width="10" height="15" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

            <ellipse cx="50" cy="130" rx="20" ry="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

            <path d="M20 35 L22 100" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <path d="M78 35 L76 100" stroke="white" strokeWidth="1" strokeOpacity="0.2" />

            {state === 'filled' && (
              <g transform="translate(70, 5)">
                {garnishes.includes('lemon') && (
                  <g transform="translate(0, -5)">
                    <circle cx="0" cy="0" r="10" fill="#f7dc6f" fillOpacity="0.7" stroke="#d4ac0d" strokeWidth="1" />
                    <circle cx="0" cy="0" r="5" fill="none" stroke="#d4ac0d" strokeWidth="0.5" />
                  </g>
                )}
                {garnishes.includes('cherry') && (
                  <g transform="translate(5, 5)">
                    <circle cx="0" cy="0" r="6" fill="#e74c3c" stroke="#922b21" strokeWidth="1" />
                    <path d="M0 -6 Q2 -12 5 -15" fill="none" stroke="#27ae60" strokeWidth="1.5" />
                  </g>
                )}
                {garnishes.includes('olive') && (
                  <g transform="translate(-5, 0)">
                    <ellipse cx="0" cy="0" rx="5" ry="7" fill="#1e8449" stroke="#145a32" strokeWidth="1" />
                  </g>
                )}
                {garnishes.includes('mint-leaf') && (
                  <g transform="translate(-8, -3)">
                    <path d="M0 0 Q-5 5 -3 10 Q0 12 3 10 Q5 5 0 0" fill="#27ae60" stroke="#1e8449" strokeWidth="0.5" />
                  </g>
                )}
                {garnishes.includes('straw') && (
                  <rect x="8" y="-20" width="3" height="30" fill="#f1948a" rx="1" />
                )}
              </g>
            )}
          </svg>
        </Tilt>
      </div>

      <span className="text-xs text-gray-400 mt-2">
        {state === 'empty' && '空酒杯'}
        {state === 'filling' && '倒酒中...'}
        {state === 'filled' && '已完成 ✓'}
      </span>
    </div>
  );
});

interface IceBucketProps {
  iceCount: number;
}

const IceBucket = memo(function IceBucket({ iceCount }: IceBucketProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="70" height="60" viewBox="0 0 70 60" className="drop-shadow-lg">
          <defs>
            <linearGradient id="bucketGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="50%" stopColor="#7a7a7a" />
              <stop offset="100%" stopColor="#4a4a4a" />
            </linearGradient>
          </defs>

          <path d="M8 5 Q5 5 5 10 L10 50 Q10 55 35 55 Q60 55 60 50 L65 10 Q65 5 62 5 Z"
                fill="url(#bucketGrad)"
                stroke="#3a3a3a"
                strokeWidth="1" />

          <ellipse cx="35" cy="5" rx="30" ry="4" fill="#3a3a3a" />

          {[...Array(Math.min(iceCount, 6))].map((_, i) => (
            <polygon
              key={i}
              points={`${15 + (i % 3) * 18},${15 + Math.floor(i / 3) * 12} ${23 + (i % 3) * 18},${13 + Math.floor(i / 3) * 12} ${27 + (i % 3) * 18},${20 + Math.floor(i / 3) * 12} ${20 + (i % 3) * 18},${25 + Math.floor(i / 3) * 12} ${13 + (i % 3) * 18},${22 + Math.floor(i / 3) * 12}`}
              fill="#e8f4f8"
              stroke="#b8d4e3"
              strokeWidth="0.5"
              opacity="0.9"
            />
          ))}

          <path d="M10 50 L60 50" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
        </svg>
      </div>
      <span className="text-xs text-gray-400 mt-2">冰桶</span>
    </div>
  );
});

interface PourAnimationProps {
  active: boolean;
  color: string;
}

const PourAnimation = memo(function PourAnimation({ active, color }: PourAnimationProps) {
  if (!active) return null;

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      <svg width="20" height="150" viewBox="0 0 20 150" className="overflow-visible">
        <defs>
          <linearGradient id="pourGradAnim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M10 0 Q8 30 10 60 Q12 90 10 120 Q9 135 10 150"
          stroke="url(#pourGradAnim)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          className="animate-pulse"
        />
        {[...Array(5)].map((_, i) => (
          <circle
            key={i}
            cx="10"
            cy={30 + i * 25}
            r="2"
            fill={color}
            opacity="0.6"
            className="animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </svg>
    </div>
  );
});

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
  shape: 'rect' | 'circle' | 'triangle';
  delay: number;
}

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
}

const ScoreModal = memo(function ScoreModal({ visible, onClose }: ScoreModalProps) {
  const { scoreResult, clearSteps, currentRecipe } = useCartStore();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [show, setShow] = useState(false);
  const cleanupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible && scoreResult) {
      setShow(true);
      const colors = ['#f4d03f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#e91e63', '#00bcd4'];
      const shapes: ('rect' | 'circle' | 'triangle')[] = ['rect', 'circle', 'triangle'];
      const newParticles: ConfettiParticle[] = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          size: 6 + Math.random() * 10,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          delay: Math.random() * 0.8,
        });
      }
      setParticles(newParticles);

      if (cleanupTimerRef.current) {
        window.clearTimeout(cleanupTimerRef.current);
      }
      cleanupTimerRef.current = window.setTimeout(() => {
        setParticles([]);
      }, 3000);

      return () => {
        if (cleanupTimerRef.current) {
          window.clearTimeout(cleanupTimerRef.current);
        }
      };
    } else {
      setShow(false);
    }
  }, [visible, scoreResult]);

  if (!show || !scoreResult) return null;

  const starColors = {
    gold: '#f4d03f',
    silver: '#bdc3c7',
    bronze: '#cd7f32',
  };

  const handleNewOrder = useCallback(() => {
    clearSteps();
    onClose();
    window.location.reload();
  }, [clearSteps, onClose]);

  const renderParticle = useCallback((p: ConfettiParticle) => {
    if (p.shape === 'circle') {
      return (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `paper-fall 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      );
    }
    if (p.shape === 'triangle') {
      return (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 0,
            height: 0,
            borderLeft: `${p.size / 2}px solid transparent`,
            borderRight: `${p.size / 2}px solid transparent`,
            borderBottom: `${p.size}px solid ${p.color}`,
            animation: `paper-fall 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      );
    }
    return (
      <div
        key={p.id}
        className="absolute pointer-events-none"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size * 1.5,
          backgroundColor: p.color,
          borderRadius: '2px',
          animation: `paper-fall 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          animationDelay: `${p.delay}s`,
          transform: `rotate(${p.rotation}deg)`,
        }}
      />
    );
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-end z-50 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(renderParticle)}
      </div>

      <div
        className="relative mx-4 w-full max-w-md shadow-2xl overflow-hidden"
        style={{
          animation: 'modal-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          marginBottom: '10vh',
        }}
      >
        <div
          className="rounded-2xl p-8 relative"
          style={{
            background: 'linear-gradient(135deg, #f4d03f 0%, #f39c12 30%, #e67e22 60%, #d35400 100%)',
          }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
               style={{
                 background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)',
               }} />

          <h2 className="text-3xl font-bold text-white text-center mb-2 relative z-10" style={{ fontFamily: "'Playfair Display', serif" }}>
            调 制 完 成 ！
          </h2>

          <div className="text-center text-white/80 mb-6 relative z-10">
            {currentRecipe?.name}
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6 relative z-10 border border-white/20">
            <div className="text-6xl font-bold text-white text-center mb-4 drop-shadow-lg">
              {Math.round(scoreResult.accuracy)}%
            </div>

            <div className="flex justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill={i < scoreResult.stars ? starColors[scoreResult.starColor] : 'none'}
                  stroke={i < scoreResult.stars ? starColors[scoreResult.starColor] : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2"
                  className={i < scoreResult.stars ? 'drop-shadow-md' : ''}
                  style={{
                    animation: i < scoreResult.stars ? `star-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards` : undefined,
                    animationDelay: `${0.3 + i * 0.1}s`,
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>

            <div className="text-white/95 text-center font-semibold">
              {scoreResult.starColor === 'gold' && '⭐ 完美调制！你是天才调酒师！'}
              {scoreResult.starColor === 'silver' && '✨ 出色表现！继续保持！'}
              {scoreResult.starColor === 'bronze' && '👍 不错的尝试！多加练习！'}
            </div>

            <div className="mt-4 text-white/80 text-sm text-center">
              {scoreResult.feedback}
            </div>

            {scoreResult.timeBonus > 0 && (
              <div className="mt-3 text-yellow-100 text-sm text-center font-medium bg-yellow-500/20 rounded-lg py-1.5">
                ⏱ 时间奖励: +{scoreResult.timeBonus}%
              </div>
            )}
          </div>

          <button
            onClick={handleNewOrder}
            className="w-full py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-yellow-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] relative z-10"
          >
            🎉 开始新订单
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-slide-up {
          0% {
            opacity: 0;
            transform: translateY(100vh) scale(0.9);
          }
          60% {
            transform: translateY(-10px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes paper-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
          }
          25% {
            transform: translateY(25vh) translateX(30px) rotate(180deg) scale(0.9);
          }
          50% {
            transform: translateY(50vh) translateX(-20px) rotate(360deg) scale(0.85);
            opacity: 0.9;
          }
          75% {
            transform: translateY(75vh) translateX(25px) rotate(540deg) scale(0.8);
            opacity: 0.7;
          }
          100% {
            opacity: 0;
            transform: translateY(110vh) translateX(-10px) rotate(720deg) scale(0.7);
          }
        }

        @keyframes star-pop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.3) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
});

export const MixingArea = memo(function MixingArea() {
  const {
    currentRecipe,
    mixSteps,
    addMixStep,
    markIngredientComplete,
    completedIngredients,
    setIsComplete,
    setScoreResult,
    startTime,
  } = useCartStore();

  const [shakerState, setShakerState] = useState<ShakerState>('idle');
  const [glassState, setGlassState] = useState<GlassState>('empty');
  const [fillLevel, setFillLevel] = useState(0);
  const [liquidColors, setLiquidColors] = useState<string[]>([]);
  const [garnishes, setGarnishes] = useState<string[]>([]);
  const [isPouring, setIsPouring] = useState(false);
  const [pourColor, setPourColor] = useState('#d4a574');
  const [showScore, setShowScore] = useState(false);
  const [shakerIngredients, setShakerIngredients] = useState<string[]>([]);

  const debounceRef = useRef<{ lastCall: number; timer: number | null }>({ lastCall: 0, timer: null });

  const debouncedAddMixStep = useCallback((ingredientId: string, ingredientName: string, type: 'base' | 'mixer' | 'garnish') => {
    const now = Date.now();
    if (now - debounceRef.current.lastCall < 50) return;
    debounceRef.current.lastCall = now;
    addMixStep(ingredientId, ingredientName, type);
  }, [addMixStep]);

  const handleShake = useCallback(() => {
    if (shakerState !== 'idle' || shakerIngredients.length === 0) return;
    setShakerState('shaking');
    const timer = window.setTimeout(() => {
      setShakerState('shaken');
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [shakerState, shakerIngredients.length]);

  const handlePour = useCallback(() => {
    if (shakerState !== 'shaken' || glassState !== 'empty') return;

    setGlassState('filling');
    setIsPouring(true);

    const colors = shakerIngredients.map(id => {
      const ingredient = currentRecipe?.ingredients.find(i => i.id === id);
      return ingredient?.color || '#d4a574';
    });
    setPourColor(colors[0] || '#d4a574');

    let level = 0;
    const interval = window.setInterval(() => {
      level += 5;
      setFillLevel(level);

      if (level >= 80) {
        window.clearInterval(interval);
        setIsPouring(false);
        setGlassState('filled');
        setLiquidColors(colors);

        shakerIngredients.forEach(id => {
          markIngredientComplete(id);
        });
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [shakerState, glassState, shakerIngredients, currentRecipe, markIngredientComplete]);

  const handleDropToShaker = useCallback((ingredientId: string, ingredientName: string, type: 'base' | 'mixer' | 'garnish') => {
    if (!shakerIngredients.includes(ingredientId)) {
      setShakerIngredients(prev => [...prev, ingredientId]);
      debouncedAddMixStep(ingredientId, ingredientName, type);
    }
  }, [shakerIngredients, debouncedAddMixStep]);

  const handleDropToGlass = useCallback((garnishId: string, garnishName: string) => {
    if (!garnishes.includes(garnishId)) {
      setGarnishes(prev => [...prev, garnishId]);
      debouncedAddMixStep(garnishId, garnishName, 'garnish');
      markIngredientComplete(garnishId);
    }
  }, [garnishes, debouncedAddMixStep, markIngredientComplete]);

  const checkCompletion = useCallback(async () => {
    if (!currentRecipe || !startTime) return;

    const allIngredientsComplete = currentRecipe.ingredients.every(
      ing => completedIngredients.has(ing.id)
    );

    if (allIngredientsComplete && glassState === 'filled' && !showScore) {
      setIsComplete(true);

      const totalTime = (Date.now() - startTime) / 1000;

      try {
        const result = await recipeApi.submitScore(currentRecipe.id, mixSteps, totalTime);
        setScoreResult(result);
        setShowScore(true);
      } catch (error) {
        console.error('评分失败:', error);
        const accuracy = Math.min(100, 70 + Math.random() * 30);
        setScoreResult({
          accuracy,
          stars: accuracy >= 90 ? 5 : accuracy >= 70 ? 4 : 3,
          starColor: accuracy >= 90 ? 'gold' : accuracy >= 70 ? 'silver' : 'bronze',
          feedback: '调制完成！继续努力！',
          timeBonus: totalTime < 30 ? 10 : totalTime < 60 ? 5 : 0,
        });
        setShowScore(true);
      }
    }
  }, [currentRecipe, startTime, completedIngredients, glassState, showScore, mixSteps, setIsComplete, setScoreResult]);

  useEffect(() => {
    checkCompletion();
  }, [completedIngredients, glassState, checkCompletion]);

  return (
    <div className="relative flex flex-col h-full">
      <div className="px-4 py-3 bg-gradient-to-b from-amber-900/50 to-transparent">
        <h3 className="text-yellow-400 font-semibold text-sm tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
          调 酒 操 作 区
        </h3>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl">
          <div className="grid grid-cols-4 gap-6 items-end">
            <div className="col-span-1">
              <IceBucket iceCount={6} />
            </div>

            <div className="col-span-1">
              <CocktailShaker
                state={shakerState}
                onShake={handleShake}
                ingredients={shakerIngredients}
                onDropIngredient={handleDropToShaker}
              />
            </div>

            <div className="col-span-1">
              <Jigger
                onClick={handlePour}
                disabled={shakerState !== 'shaken' || glassState !== 'empty'}
              />
            </div>

            <div className="col-span-1 relative">
              <PourAnimation active={isPouring} color={pourColor} />
              <CocktailGlass
                state={glassState}
                fillLevel={fillLevel}
                liquidColors={liquidColors}
                garnishes={garnishes}
                onDropGarnish={handleDropToGlass}
              />
            </div>
          </div>
        </div>
      </div>

      <ScoreModal
        visible={showScore}
        onClose={() => setShowScore(false)}
      />
    </div>
  );
});
