import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  Ingredient,
  Seasoning,
  FoodInPot,
  FlavorProfile,
  DishEvaluation,
  INGREDIENTS,
  SEASONINGS,
  getDonenessColor,
  getHeatLevelName,
  getFlameHeight,
} from './CookingEngine';

interface KitchenProps {
  selectedIngredients: Ingredient[];
  onSelectIngredient: (ingredient: Ingredient) => void;
  foodsInPot: FoodInPot[];
  onAddFoodToPot: (ingredient: Ingredient) => void;
  heatLevel: number;
  onHeatChange: (heat: number) => void;
  onCycleHeatPreset: () => void;
  seasonings: FlavorProfile;
  onAddSeasoning: (seasoning: Seasoning) => void;
  evaluation: DishEvaluation;
  onPlate: () => void;
  isCooking: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'steam' | 'seasoning';
}

const Kitchen: React.FC<KitchenProps> = ({
  selectedIngredients,
  onSelectIngredient,
  foodsInPot,
  onAddFoodToPot,
  heatLevel,
  onHeatChange,
  onCycleHeatPreset,
  onAddSeasoning,
  evaluation,
  onPlate,
  isCooking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const potRef = useRef<HTMLDivElement>(null);
  const [hoveredIngredient, setHoveredIngredient] = useState<string | null>(null);
  const [draggedIngredient, setDraggedIngredient] = useState<Ingredient | null>(null);
  const seasoningBottleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const MAX_PARTICLES = 100;

  const createSteamParticle = useCallback((potRect: DOMRect) => {
    if (particlesRef.current.length >= MAX_PARTICLES) return;
    const particle: Particle = {
      id: uuidv4(),
      x: potRect.left + potRect.width / 2 + (Math.random() - 0.5) * 60,
      y: potRect.top + 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 2 - 1,
      life: 1,
      maxLife: 60 + Math.random() * 40,
      color: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`,
      size: 8 + Math.random() * 8,
      type: 'steam',
    };
    particlesRef.current.push(particle);
  }, []);

  const createSeasoningParticles = useCallback((seasoning: Seasoning, startX: number, startY: number, potRect: DOMRect) => {
    const targetX = potRect.left + potRect.width / 2;
    const targetY = potRect.top + potRect.height / 2;
    const count = 15;
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break;
      const angle = Math.atan2(targetY - startY, targetX - startX) + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 3;
      const particle: Particle = {
        id: uuidv4(),
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 50 + Math.random() * 20,
        color: seasoning.color,
        size: 4 + Math.random() * 4,
        type: 'seasoning',
      };
      particlesRef.current.push(particle);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;

        if (p.type === 'steam') {
          p.size *= 1.01;
          p.vy *= 0.99;
        }

        if (p.life > 0) {
          ctx.beginPath();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          return true;
        }
        return false;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCooking || foodsInPot.length === 0) return;

    const interval = setInterval(() => {
      const pot = potRef.current;
      if (pot) {
        const rect = pot.getBoundingClientRect();
        const steamCount = Math.ceil(heatLevel / 25);
        for (let i = 0; i < steamCount; i++) {
          setTimeout(() => createSteamParticle(rect), i * 100);
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isCooking, foodsInPot.length, heatLevel, createSteamParticle]);

  const handleSeasoningClick = (seasoning: Seasoning) => {
    const bottle = seasoningBottleRefs.current[seasoning.id];
    const pot = potRef.current;
    if (bottle && pot) {
      const bottleRect = bottle.getBoundingClientRect();
      const potRect = pot.getBoundingClientRect();
      createSeasoningParticles(
        seasoning,
        bottleRect.left + bottleRect.width / 2,
        bottleRect.top,
        potRect
      );
    }
    onAddSeasoning(seasoning);
  };

  const handleDragEnd = (ingredient: Ingredient, event: MouseEvent | TouchEvent | PointerEvent) => {
    const pot = potRef.current;
    if (!pot) return;

    const potRect = pot.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      const touch = (event as TouchEvent).touches[0] || (event as TouchEvent).changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    }

    if (
      clientX >= potRect.left &&
      clientX <= potRect.right &&
      clientY >= potRect.top &&
      clientY <= potRect.bottom
    ) {
      onAddFoodToPot(ingredient);
    }

    setDraggedIngredient(null);
  };

  const flameHeight = getFlameHeight(heatLevel);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '绝味':
        return '#ffd700';
      case '刚好':
        return '#81c784';
      case '焦糊':
        return '#e57373';
      default:
        return '#ffb74d';
    }
  };

  const renderFlavorGauge = (value: number, label: string, color: string) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
        </svg>
        <span style={{ color: '#d7ccc8', fontSize: 12, fontFamily: 'system-ui' }}>
          {label}
        </span>
        <span style={{ color: '#d4a373', fontSize: 14, fontWeight: 'bold' }}>
          {Math.round(value)}
        </span>
      </div>
    );
  };

  const renderIngredientIcon = (type: string, size: number = 60) => {
    const icons: { [key: string]: JSX.Element } = {
      chicken: (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <defs>
            <filter id={`ink-${type}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale="2" />
            </filter>
          </defs>
          <g filter={`url(#ink-${type})`}>
            <ellipse cx="30" cy="35" rx="18" ry="16" fill="#f5deb3" stroke="#8d6e63" strokeWidth="1.5" />
            <circle cx="42" cy="22" r="10" fill="#f5deb3" stroke="#8d6e63" strokeWidth="1.5" />
            <circle cx="45" cy="20" r="2" fill="#3e2723" />
            <path d="M50 22 L56 20 L50 24 Z" fill="#e57373" />
            <path d="M15 30 Q10 25 12 40 Q18 42 20 38" fill="#d7ccc8" stroke="#8d6e63" strokeWidth="1" />
          </g>
        </svg>
      ),
      fish: (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <defs>
            <filter id={`ink-${type}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale="2" />
            </filter>
          </defs>
          <g filter={`url(#ink-${type})`}>
            <ellipse cx="30" cy="30" rx="22" ry="12" fill="#e0e0e0" stroke="#6d4c41" strokeWidth="1.5" />
            <path d="M52 30 L60 20 L60 40 Z" fill="#bdbdbd" stroke="#6d4c41" strokeWidth="1.5" />
            <circle cx="18" cy="27" r="3" fill="#3e2723" />
            <path d="M25 28 Q28 35 31 28 Q34 35 37 28" fill="none" stroke="#9e9e9e" strokeWidth="1" />
            <ellipse cx="35" cy="22" rx="8" ry="4" fill="#78909c" opacity="0.5" />
          </g>
        </svg>
      ),
      vegetable: (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <defs>
            <filter id={`ink-${type}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale="2" />
            </filter>
          </defs>
          <g filter={`url(#ink-${type})`}>
            <ellipse cx="30" cy="40" rx="18" ry="12" fill="#81c784" stroke="#558b2f" strokeWidth="1.5" />
            <path d="M30 28 Q25 15 20 10" fill="none" stroke="#33691e" strokeWidth="2" />
            <path d="M30 28 Q35 18 40 12" fill="none" stroke="#33691e" strokeWidth="2" />
            <path d="M30 28 Q30 20 30 8" fill="none" stroke="#33691e" strokeWidth="2" />
            <ellipse cx="18" cy="12" rx="6" ry="3" fill="#a5d6a7" transform="rotate(-30 18 12)" />
            <ellipse cx="42" cy="10" rx="6" ry="3" fill="#a5d6a7" transform="rotate(30 42 10)" />
            <ellipse cx="30" cy="6" rx="5" ry="3" fill="#a5d6a7" />
          </g>
        </svg>
      ),
      spice: (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <defs>
            <filter id={`ink-${type}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale="2" />
            </filter>
          </defs>
          <g filter={`url(#ink-${type})`}>
            <ellipse cx="30" cy="38" rx="16" ry="14" fill="#a1887f" stroke="#5d4037" strokeWidth="1.5" />
            <ellipse cx="30" cy="25" rx="12" ry="8" fill="#8d6e63" stroke="#5d4037" strokeWidth="1.5" />
            <rect x="26" y="12" width="8" height="10" fill="#6d4c41" />
            <ellipse cx="30" cy="12" rx="6" ry="3" fill="#8d6e63" />
            <circle cx="24" cy="35" r="3" fill="#ffcc80" />
            <circle cx="36" cy="38" r="2.5" fill="#ffab91" />
            <circle cx="28" cy="44" r="2" fill="#ffcc80" />
            <circle cx="34" cy="42" r="2" fill="#ffab91" />
          </g>
        </svg>
      ),
    };
    return icons[type] || null;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        '@media (max-width: 1024px)': {
          flexDirection: 'column',
        },
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '25%',
          background: `
            repeating-linear-gradient(
              90deg,
              #6d4c41 0px,
              #6d4c41 80px,
              #5d4037 80px,
              #5d4037 82px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 40px,
              rgba(0,0,0,0.1) 40px,
              rgba(0,0,0,0.1) 42px
            )
          `,
          boxShadow: 'inset 0 20px 40px rgba(0,0,0,0.3)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '3%',
          width: '18%',
          height: '60%',
          background: 'linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%)',
          borderRadius: 8,
          padding: 16,
          boxShadow: '4px 4px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          '@media (max-width: 1024px)': {
            position: 'relative',
            width: '94%',
            height: '25%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '3%',
          },
        }}
      >
        <h2
          style={{
            color: '#d7ccc8',
            fontSize: 24,
            textAlign: 'center',
            marginBottom: 8,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            '@media (max-width: 1024px)': {
              display: 'none',
            },
          }}
        >
          菜架
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            '@media (max-width: 1024px)': {
              flexDirection: 'row',
              gap: 16,
            },
          }}
        >
          {INGREDIENTS.map((ingredient) => (
            <motion.div
              key={ingredient.id}
              style={{
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                border: selectedIngredients.some((i) => i.id === ingredient.id)
                  ? '2px solid #d4a373'
                  : '2px solid transparent',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => onSelectIngredient(ingredient)}
              onMouseEnter={() => setHoveredIngredient(ingredient.id)}
              onMouseLeave={() => setHoveredIngredient(null)}
            >
              {renderIngredientIcon(ingredient.type, 56)}
              <AnimatePresence>
                {hoveredIngredient === ingredient.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      left: '110%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(62, 39, 35, 0.95)',
                      padding: '12px 16px',
                      borderRadius: 8,
                      whiteSpace: 'nowrap',
                      zIndex: 100,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      '@media (max-width: 1024px)': {
                        left: '50%',
                        top: '110%',
                        transform: 'translateX(-50%)',
                      },
                    }}
                  >
                    <div style={{ color: '#d4a373', fontSize: 18, marginBottom: 4 }}>
                      {ingredient.name}
                    </div>
                    <div style={{ color: '#bdbdbd', fontSize: 12 }}>
                      最佳火候：{getHeatLevelName(ingredient.optimalHeat)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '3%',
          width: '70%',
          height: '85%',
          display: 'flex',
          flexDirection: 'column',
          '@media (max-width: 1024px)': {
            position: 'relative',
            width: '94%',
            margin: '0 3%',
          },
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '280px',
            background: 'rgba(62, 39, 35, 0.9)',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 5,
            '@media (max-width: 1024px)': {
              position: 'relative',
              width: '100%',
              marginBottom: 16,
            },
          }}
        >
          <h3
            style={{
              color: '#d4a373',
              fontSize: 22,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            菜品评价
          </h3>
          <motion.div
            key={evaluation.rating}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center', marginBottom: 12 }}
          >
            <span
              style={{
                fontSize: 36,
                color: getRatingColor(evaluation.rating),
                textShadow: `0 0 20px ${getRatingColor(evaluation.rating)}40`,
              }}
            >
              {evaluation.rating}
            </span>
          </motion.div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ color: '#bdbdbd', fontSize: 14 }}>品质分数</span>
            <div style={{ color: '#ffd700', fontSize: 32, fontWeight: 'bold' }}>
              {evaluation.quality}
              <span style={{ fontSize: 16, color: '#9e9e9e' }}>/100</span>
            </div>
          </div>
          <p
            style={{
              color: '#d7ccc8',
              fontSize: 14,
              lineHeight: 1.6,
              textAlign: 'center',
              fontFamily: 'system-ui',
            }}
          >
            {evaluation.comment}
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '320px',
            display: 'flex',
            gap: 8,
            background: 'rgba(62, 39, 35, 0.8)',
            padding: '12px 16px',
            borderRadius: 12,
            '@media (max-width: 1024px)': {
              position: 'relative',
              right: 0,
              top: 0,
              justifyContent: 'center',
              marginBottom: 16,
            },
          }}
        >
          {renderFlavorGauge(evaluation.quality > 0 ? 30 : 0, '咸', '#d4a373')}
          {renderFlavorGauge(evaluation.quality > 0 ? 25 : 0, '酸', '#d4a373')}
          {renderFlavorGauge(evaluation.quality > 0 ? 35 : 0, '鲜', '#d4a373')}
          {renderFlavorGauge(evaluation.quality > 0 ? 20 : 0, '甜', '#d4a373')}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '75%',
            display: 'flex',
            flexDirection: 'row',
            gap: 24,
            '@media (max-width: 1024px)': {
              flexDirection: 'column',
              height: 'auto',
              position: 'relative',
            },
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%)',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 0,
                right: 0,
                textAlign: 'center',
                color: '#d7ccc8',
                fontSize: 20,
              }}
            >
              灶台
            </div>

            <div style={{ position: 'relative', marginTop: 30 }}>
              <motion.div
                ref={potRef}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: `
                    radial-gradient(ellipse at 30% 30%, #5d4037 0%, #3e2723 50%, #1b1b1b 100%)
                  `,
                  boxShadow: `
                    inset 0 -10px 30px rgba(0,0,0,0.8),
                    inset 0 5px 15px rgba(255,255,255,0.1),
                    0 8px 25px rgba(0,0,0,0.6)
                  `,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                animate={{
                  boxShadow: isCooking
                    ? [
                        'inset 0 -10px 30px rgba(0,0,0,0.8), inset 0 5px 15px rgba(255,255,255,0.1), 0 8px 25px rgba(0,0,0,0.6)',
                        'inset 0 -10px 30px rgba(0,0,0,0.8), inset 0 5px 15px rgba(255,150,50,0.2), 0 8px 35px rgba(255,100,0,0.4)',
                      ]
                    : 'inset 0 -10px 30px rgba(0,0,0,0.8), inset 0 5px 15px rgba(255,255,255,0.1), 0 8px 25px rgba(0,0,0,0.6)',
                }}
                transition={{
                  duration: 1,
                  repeat: isCooking ? Infinity : 0,
                  repeatType: 'reverse',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    right: 10,
                    bottom: 10,
                    borderRadius: '50%',
                    background:
                      foodsInPot.length > 0
                        ? `radial-gradient(ellipse at center, ${foodsInPot
                            .map((f) => getDonenessColor(f.doneness, f.ingredient.color))
                            .join(', ')})`
                        : 'radial-gradient(ellipse at center, #2d2d2d 0%, #1a1a1a 100%)',
                    opacity: 0.9,
                  }}
                />
                {foodsInPot.map((food, index) => {
                  const angle = (index / foodsInPot.length) * Math.PI * 2;
                  const radius = 35;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  return (
                    <motion.div
                      key={`${food.ingredient.id}-${index}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, x, y }}
                      transition={{ duration: 0.3 }}
                      style={{
                        position: 'absolute',
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: getDonenessColor(food.doneness, food.ingredient.color),
                        boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
                      }}
                    />
                  );
                })}
              </motion.div>

              <div
                style={{
                  position: 'absolute',
                  bottom: -40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: 4,
                  height: 120,
                }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [flameHeight * 0.6, flameHeight, flameHeight * 0.7],
                      scaleY: [1, 1.1, 0.95],
                      opacity: isCooking ? [0.8, 1, 0.9] : 0,
                    }}
                    transition={{
                      duration: 0.3 + i * 0.05,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }}
                    style={{
                      width: 15 - Math.abs(i - 2) * 2,
                      background: `
                        linear-gradient(
                          180deg,
                          #ffeb3b 0%,
                          #ff9800 30%,
                          #f44336 70%,
                          transparent 100%
                        )
                      `,
                      borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                      filter: 'blur(2px)',
                      opacity: 0,
                    }}
                  />
                ))}
              </div>

              <motion.div
                style={{
                  position: 'absolute',
                  left: -60,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #5d4037 0%, #3e2723 100%)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCycleHeatPreset}
              >
                <span
                  style={{
                    color: '#d4a373',
                    fontSize: 12,
                    fontFamily: 'system-ui',
                  }}
                >
                  鼓风
                </span>
              </motion.div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 30,
                left: 20,
                right: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#bdbdbd',
                  fontSize: 12,
                  marginBottom: 4,
                  fontFamily: 'system-ui',
                }}
              >
                <span>低火</span>
                <span style={{ color: '#d4a373', fontSize: 14 }}>
                  {getHeatLevelName(heatLevel)} {Math.round(heatLevel)}
                </span>
                <span>高火</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={heatLevel}
                onChange={(e) => onHeatChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #4caf50 0%, #ff9800 50%, #f44336 100%)',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          <div
            style={{
              width: '35%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              '@media (max-width: 1024px)': {
                width: '100%',
              },
            }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #d4a373 0%, #b8860b 100%)',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  color: '#5d4037',
                  fontSize: 20,
                  marginBottom: 12,
                }}
              >
                案板
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  alignContent: 'flex-start',
                  padding: 12,
                  background: 'rgba(93, 64, 55, 0.1)',
                  borderRadius: 8,
                  minHeight: 120,
                }}
              >
                {selectedIngredients.map((ingredient, index) => (
                  <motion.div
                    key={`${ingredient.id}-${index}`}
                    drag
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragStart={() => setDraggedIngredient(ingredient)}
                    onDragEnd={(_, info) => {
                      handleDragEnd(ingredient, info.point as unknown as MouseEvent);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      cursor: 'grab',
                      activeCursor: 'grabbing',
                      zIndex: draggedIngredient?.id === ingredient.id ? 20 : 1,
                    }}
                  >
                    {renderIngredientIcon(ingredient.type, 50)}
                  </motion.div>
                ))}
                {selectedIngredients.length === 0 && (
                  <span
                    style={{
                      color: '#8d6e63',
                      fontSize: 14,
                      alignSelf: 'center',
                      fontFamily: 'system-ui',
                    }}
                  >
                    从菜架选择食材
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%)',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  color: '#d7ccc8',
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                调味架
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'flex-end',
                }}
              >
                {SEASONINGS.map((seasoning) => (
                  <motion.div
                    key={seasoning.id}
                    ref={(el) => {
                      seasoningBottleRefs.current[seasoning.id] = el;
                    }}
                    whileHover={{ scale: 1.15, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={() => handleSeasoningClick(seasoning)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width="36" height="60" viewBox="0 0 36 60">
                      <rect
                        x="6"
                        y="15"
                        width="24"
                        height="40"
                        rx="4"
                        fill={seasoning.color}
                        stroke="#5d4037"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="10"
                        y="5"
                        width="16"
                        height="12"
                        rx="2"
                        fill="#6d4c41"
                        stroke="#3e2723"
                        strokeWidth="1"
                      />
                      <ellipse
                        cx="18"
                        cy="35"
                        rx="8"
                        ry="12"
                        fill={seasoning.color}
                        opacity="0.5"
                      />
                    </svg>
                    <span
                      style={{
                        color: '#d7ccc8',
                        fontSize: 12,
                        fontFamily: 'system-ui',
                      }}
                    >
                      {seasoning.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={onPlate}
              disabled={foodsInPot.length === 0}
              style={{
                padding: '16px 24px',
                fontSize: 20,
                background: foodsInPot.length > 0
                  ? 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
                  : 'linear-gradient(135deg, #757575 0%, #424242 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: foodsInPot.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <ellipse
                  cx="20"
                  cy="28"
                  rx="18"
                  ry="10"
                  fill="none"
                  stroke="#90caf9"
                  strokeWidth="3"
                />
                <ellipse
                  cx="20"
                  cy="28"
                  rx="14"
                  ry="7"
                  fill="none"
                  stroke="#bbdefb"
                  strokeWidth="1"
                />
                <ellipse
                  cx="20"
                  cy="20"
                  rx="16"
                  ry="6"
                  fill="none"
                  stroke="#64b5f6"
                  strokeWidth="2"
                />
                <path
                  d="M4 20 Q4 12 20 8 Q36 12 36 20"
                  fill="none"
                  stroke="#90caf9"
                  strokeWidth="2"
                />
                <circle cx="12" cy="16" r="2" fill="#bbdefb" />
                <circle cx="20" cy="14" r="1.5" fill="#bbdefb" />
                <circle cx="28" cy="17" r="2" fill="#bbdefb" />
              </svg>
              <span>装盘</span>
            </motion.button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="@media (max-width: 1024px)"] {
            flex-direction: column !important;
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #d4a373;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #d4a373;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
};

export default Kitchen;
