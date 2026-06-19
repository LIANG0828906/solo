import React, { useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Tilt } from 'react-tilt';
import { ShakerState, GlassState, BottleData } from '../types';
import { useCartStore } from '../stores/cartStore';
import { recipeApi } from '../api/recipeApi';

interface ShakerProps {
  state: ShakerState;
  onShake: () => void;
  ingredients: string[];
}

function CocktailShaker({ state, onShake, ingredients }: ShakerProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'shaker',
  });

  const getShakerAnimation = () => {
    if (state === 'shaking') {
      return 'animate-shake';
    }
    return '';
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={setNodeRef}
        className={`relative cursor-pointer transition-all duration-100 ${getShakerAnimation()} ${
          isOver ? 'scale-110' : 'hover:scale-105'
        }`}
        onClick={onShake}
      >
        {isOver && (
          <div className="absolute -inset-4 rounded-full bg-yellow-400/20 animate-pulse" />
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
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
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
              {[...Array(12)].map((_, i) => (
                <circle
                  key={i}
                  cx={25 + (i % 4) * 10}
                  cy={30 + Math.floor(i / 4) * 20}
                  r="2"
                  fill="white"
                  opacity="0.7"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </g>
          )}
          
          <path d="M30 30 L30 70" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
          <path d="M35 25 L35 75" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
        </svg>
        
        {ingredients.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
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
    </div>
  );
}

interface JiggerProps {
  onClick: () => void;
  disabled: boolean;
}

function Jigger({ onClick, disabled }: JiggerProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative transition-all duration-100 ${
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
}

interface GlassProps {
  state: GlassState;
  fillLevel: number;
  liquidColors: string[];
  garnishes: string[];
}

function CocktailGlass({ state, fillLevel, liquidColors, garnishes }: GlassProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'glass',
  });

  const getLiquidGradient = () => {
    if (liquidColors.length === 0) return 'transparent';
    const colors = [...new Set(liquidColors)];
    if (colors.length === 1) return colors[0];
    return `linear-gradient(to top, ${colors.join(', ')})`;
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={setNodeRef}
        className={`relative transition-all duration-100 ${
          isOver ? 'scale-110' : ''
        }`}
      >
        {isOver && (
          <div className="absolute -inset-4 rounded-full bg-green-400/20 animate-pulse" />
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
                fill={liquidColors.length > 0 ? getLiquidGradient() : 'transparent'}
                opacity="0.8"
                className="transition-all duration-500"
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
}

interface IceBucketProps {
  iceCount: number;
}

function IceBucket({ iceCount }: IceBucketProps) {
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
}

interface PourAnimationProps {
  active: boolean;
  color: string;
}

function PourAnimation({ active, color }: PourAnimationProps) {
  if (!active) return null;
  
  return (
    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      <svg width="20" height="150" viewBox="0 0 20 150" className="overflow-visible">
        <defs>
          <linearGradient id="pourGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M10 0 Q8 30 10 60 Q12 90 10 120 Q9 135 10 150"
          stroke="url(#pourGrad)"
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
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
}

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
}

function ScoreModal({ visible, onClose }: ScoreModalProps) {
  const { scoreResult, clearSteps, currentRecipe } = useCartStore();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  React.useEffect(() => {
    if (visible && scoreResult) {
      const colors = ['#f4d03f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12'];
      const newParticles: ConfettiParticle[] = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          size: 8 + Math.random() * 8,
        });
      }
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setParticles([]);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, scoreResult]);

  if (!visible || !scoreResult) return null;

  const starColors = {
    gold: '#f4d03f',
    silver: '#bdc3c7',
    bronze: '#cd7f32',
  };

  const handleNewOrder = () => {
    clearSteps();
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `rotate(${p.rotation}deg)`,
            animation: 'confetti-fall 3s ease-out forwards',
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        >
          <div
            style={{
              width: p.size,
              height: p.size * 1.5,
              backgroundColor: p.color,
              borderRadius: '2px',
            }}
          />
        </div>
      ))}
      
      <div 
        className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        style={{
          animation: 'slide-up 0.5s ease-out',
        }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-transparent pointer-events-none" />
        
        <h2 className="text-3xl font-bold text-white text-center mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          调 制 完 成 ！
        </h2>
        
        <div className="text-center text-white/80 mb-6">
          {currentRecipe?.name}
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="text-6xl font-bold text-white text-center mb-4">
            {Math.round(scoreResult.accuracy)}%
          </div>
          
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={i < scoreResult.stars ? starColors[scoreResult.starColor] : 'none'}
                stroke={i < scoreResult.stars ? starColors[scoreResult.starColor] : 'rgba(255,255,255,0.3)'}
                strokeWidth="2"
                className={i < scoreResult.stars ? 'animate-pulse' : ''}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          
          <div className="text-white/90 text-center">
            {scoreResult.starColor === 'gold' && '⭐ 完美调制！你是天才调酒师！'}
            {scoreResult.starColor === 'silver' && '✨ 出色表现！继续保持！'}
            {scoreResult.starColor === 'bronze' && '👍 不错的尝试！多加练习！'}
          </div>
          
          <div className="mt-4 text-white/70 text-sm text-center">
            {scoreResult.feedback}
          </div>
          
          {scoreResult.timeBonus > 0 && (
            <div className="mt-2 text-yellow-200 text-sm text-center">
              时间奖励: +{scoreResult.timeBonus}%
            </div>
          )}
        </div>
        
        <button
          onClick={handleNewOrder}
          className="w-full py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-yellow-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          开始新订单
        </button>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(200px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}

export function MixingArea() {
  const { 
    currentRecipe, 
    mixSteps, 
    addMixStep, 
    markIngredientComplete,
    completedIngredients,
    setIsComplete,
    setScoreResult,
    startTime
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

  const handleShake = useCallback(() => {
    if (shakerState !== 'idle' || shakerIngredients.length === 0) return;
    
    setShakerState('shaking');
    
    setTimeout(() => {
      setShakerState('shaken');
    }, 2000);
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
    const interval = setInterval(() => {
      level += 5;
      setFillLevel(level);
      
      if (level >= 80) {
        clearInterval(interval);
        setIsPouring(false);
        setGlassState('filled');
        setLiquidColors(colors);
        
        shakerIngredients.forEach(id => {
          markIngredientComplete(id);
        });
      }
    }, 100);
  }, [shakerState, glassState, shakerIngredients, currentRecipe, markIngredientComplete]);

  const handleDrop = useCallback((bottle: BottleData) => {
    if (bottle.type === 'garnish') {
      if (!garnishes.includes(bottle.id)) {
        setGarnishes(prev => [...prev, bottle.id]);
        addMixStep(bottle.id, bottle.name, bottle.type);
        markIngredientComplete(bottle.id);
      }
    } else {
      if (!shakerIngredients.includes(bottle.id)) {
        setShakerIngredients(prev => [...prev, bottle.id]);
        addMixStep(bottle.id, bottle.name, bottle.type);
      }
    }
  }, [garnishes, shakerIngredients, addMixStep, markIngredientComplete]);

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

  React.useEffect(() => {
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
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <DropZone onDrop={handleDrop} />
          </div>
        </div>
      </div>
      
      <ScoreModal
        visible={showScore}
        onClose={() => setShowScore(false)}
      />
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px) rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: translateX(8px) rotate(5deg); }
        }
        
        .animate-shake {
          animation: shake 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}

interface DropZoneProps {
  onDrop: (bottle: BottleData) => void;
}

function DropZone({ onDrop }: DropZoneProps) {
  const { active } = useDroppable({
    id: 'drop-zone',
  });

  const { selectedIngredients } = useCartStore();

  React.useEffect(() => {
    if (selectedIngredients.length > 0) {
      const lastId = selectedIngredients[selectedIngredients.length - 1];
      const allBottles = [
        { id: 'whiskey', name: '波本威士忌', color: '#d4a574', abv: 40, type: 'base' as const },
        { id: 'vodka', name: '伏特加', color: '#e8e8e8', abv: 40, type: 'base' as const },
        { id: 'gin', name: '金酒', color: '#d5f5e3', abv: 37.5, type: 'base' as const },
        { id: 'rum', name: '朗姆酒', color: '#f5cba7', abv: 38, type: 'base' as const },
        { id: 'tequila', name: '龙舌兰', color: '#f9e79f', abv: 38, type: 'base' as const },
        { id: 'mint', name: '薄荷酒', color: '#82e0aa', abv: 25, type: 'mixer' as const },
        { id: 'bitters', name: '安格斯特拉苦精', color: '#7b241c', abv: 44.7, type: 'mixer' as const },
        { id: 'vermouth', name: '味美思', color: '#a93226', abv: 18, type: 'mixer' as const },
        { id: 'triple-sec', name: '橙味力娇酒', color: '#f9e79f', abv: 30, type: 'mixer' as const },
        { id: 'lime-juice', name: '青柠汁', color: '#abebc6', abv: 0, type: 'mixer' as const },
        { id: 'simple-syrup', name: '糖浆', color: '#fef9e7', abv: 0, type: 'mixer' as const },
        { id: 'cola', name: '可乐', color: '#4a235a', abv: 0, type: 'mixer' as const },
        { id: 'lemon', name: '柠檬片', color: '#f7dc6f', abv: 0, type: 'garnish' as const },
        { id: 'olive', name: '橄榄', color: '#1e8449', abv: 0, type: 'garnish' as const },
        { id: 'cherry', name: '樱桃', color: '#e74c3c', abv: 0, type: 'garnish' as const },
        { id: 'straw', name: '吸管', color: '#f1948a', abv: 0, type: 'garnish' as const },
        { id: 'mint-leaf', name: '薄荷叶', color: '#27ae60', abv: 0, type: 'garnish' as const },
      ];
      
      const bottle = allBottles.find(b => b.id === lastId);
      if (bottle && active) {
        onDrop(bottle);
      }
    }
  }, [selectedIngredients, active, onDrop]);

  return null;
}
