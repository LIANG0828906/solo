import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Spice, WeighedSpice, GroundPowder, MoldedProduct } from '@/types';

interface MixingTableProps {
  selectedSpices: WeighedSpice[];
  groundPowder: GroundPowder | null;
  moldedProduct: MoldedProduct | null;
  grindProgress: number;
  draggedSpice: Spice | null;
  onWeigh: (spice: WeighedSpice) => void;
  onGrind: () => void;
  onMold: (moldType: 'plum' | 'ruyi' | 'stick') => void;
  onIgnite: () => void;
  onReset: () => void;
  onUpdateGrindProgress: (progress: number) => void;
}

interface SmokeParticle {
  id: string;
  x: number;
  delay: number;
}

interface GrindParticle {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface DustParticle {
  id: string;
  x: number;
  y: number;
}

const MixingTable: React.FC<MixingTableProps> = ({
  selectedSpices,
  groundPowder,
  moldedProduct,
  grindProgress,
  draggedSpice,
  onWeigh,
  onGrind,
  onMold,
  onIgnite,
  onReset,
  onUpdateGrindProgress,
}) => {
  const [weight, setWeight] = useState(3);
  const [selectedMold, setSelectedMold] = useState<'plum' | 'ruyi' | 'stick'>('plum');
  const [isGrinding, setIsGrinding] = useState(false);
  const [isDraggingOverScale, setIsDraggingOverScale] = useState(false);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);
  const [grindParticles, setGrindParticles] = useState<GrindParticle[]>([]);
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const [isPressing, setIsPressing] = useState(false);
  const [aromaDescription, setAromaDescription] = useState<string | null>(null);
  const [isDraggingMortar, setIsDraggingMortar] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const mortarRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smokeIntervalRef = useRef<number | null>(null);
  const dustIntervalRef = useRef<number | null>(null);

  const getPowderColor = useCallback((): string => {
    if (selectedSpices.length === 0 && !groundPowder) return '#8B7355';
    
    const spices = groundPowder ? groundPowder.spices : selectedSpices;
    if (spices.length === 0) return '#8B7355';
    
    const totalWeight = spices.reduce((sum, s) => sum + s.weight, 0);
    let r = 0, g = 0, b = 0;
    
    spices.forEach((spice) => {
      const ratio = spice.weight / totalWeight;
      const color = spice.color;
      r += parseInt(color.slice(1, 3), 16) * ratio;
      g += parseInt(color.slice(3, 5), 16) * ratio;
      b += parseInt(color.slice(5, 7), 16) * ratio;
    });
    
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }, [selectedSpices, groundPowder]);

  const getMixedColorSegments = useCallback(() => {
    const spices = groundPowder ? groundPowder.spices : selectedSpices;
    if (spices.length === 0) return [];
    
    const totalWeight = spices.reduce((sum, s) => sum + s.weight, 0);
    return spices.map((spice) => ({
      color: spice.color,
      width: `${(spice.weight / totalWeight) * 100}%`,
      name: spice.name,
    }));
  }, [selectedSpices, groundPowder]);

  const generateAromaDescription = useCallback(() => {
    const spices = groundPowder?.spices || selectedSpices;
    if (spices.length === 0) return;
    
    const descriptions: string[] = [];
    spices.forEach((spice) => {
      descriptions.push(`${spice.name}${spice.aroma}`);
    });
    
    const fullDescription = descriptions.join('，');
    setAromaDescription(fullDescription);
  }, [selectedSpices, groundPowder]);

  const handleDropOnScale = useCallback((e: React.DragEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingOverScale(false);
    
    if (!draggedSpice) return;
    
    const weighedSpice: WeighedSpice = {
      spiceId: draggedSpice.id,
      name: draggedSpice.name,
      color: draggedSpice.color,
      weight: weight,
      property: draggedSpice.property,
      aroma: draggedSpice.aroma,
    };
    
    onWeigh(weighedSpice);
  }, [draggedSpice, weight, onWeigh]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverScale(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOverScale(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDraggingMortar && mortarRef.current) {
      const rect = mortarRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const newParticles: GrindParticle[] = [];
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: uuidv4(),
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            color: getPowderColor(),
          });
        }
        
        if (grindParticles.length < 20) {
          setGrindParticles((prev) => [...prev, ...newParticles].slice(-20));
        }
        
        const dx = clientX - lastMousePos.x;
        const dy = clientY - lastMousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          onUpdateGrindProgress(Math.min(100, grindProgress + distance * 0.1));
          setLastMousePos({ x: clientX, y: clientY });
        }
      }
    }
    
    if (draggedSpice) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const dust: DustParticle = {
        id: uuidv4(),
        x: clientX,
        y: clientY,
      };
      setDustParticles((prev) => [...prev.slice(-5), dust]);
    }
  }, [isDraggingMortar, lastMousePos, grindProgress, onUpdateGrindProgress, getPowderColor, draggedSpice, grindParticles.length]);

  const handleMortarMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!groundPowder || selectedSpices.length === 0) return;
    if (grindProgress >= 100) return;
    
    e.preventDefault();
    setIsDraggingMortar(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setLastMousePos({ x: clientX, y: clientY });
  }, [groundPowder, selectedSpices.length, grindProgress]);

  const handleMortarMouseUp = useCallback(() => {
    setIsDraggingMortar(false);
  }, []);

  const handleGrindClick = useCallback(() => {
    if (selectedSpices.length === 0 || grindProgress >= 100) return;
    onGrind();
    setIsGrinding(true);
    
    let progress = grindProgress;
    const grind = () => {
      progress += 2;
      onUpdateGrindProgress(progress);
      
      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(grind);
      } else {
        setIsGrinding(false);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(grind);
  }, [selectedSpices.length, grindProgress, onGrind, onUpdateGrindProgress]);

  const handleMoldClick = useCallback((moldType: 'plum' | 'ruyi' | 'stick') => {
    setSelectedMold(moldType);
    if (grindProgress >= 100 && groundPowder) {
      setIsPressing(true);
      setTimeout(() => {
        onMold(moldType);
        setIsPressing(false);
      }, 500);
    }
  }, [grindProgress, groundPowder, onMold]);

  const handleIgnite = useCallback(() => {
    if (!moldedProduct || moldedProduct.isIgnited) return;
    onIgnite();
    generateAromaDescription();
    
    const generateSmoke = () => {
      const newParticle: SmokeParticle = {
        id: uuidv4(),
        x: (Math.random() - 0.5) * 30,
        delay: Math.random() * 0.5,
      };
      setSmokeParticles((prev) => [...prev.slice(-10), newParticle]);
    };
    
    for (let i = 0; i < 10; i++) {
      setTimeout(generateSmoke, i * 200);
    }
    
    smokeIntervalRef.current = window.setInterval(generateSmoke, 500);
    
    setTimeout(() => {
      if (smokeIntervalRef.current) {
        clearInterval(smokeIntervalRef.current);
      }
    }, 10000);
  }, [moldedProduct, onIgnite, generateAromaDescription]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('mouseup', handleMortarMouseUp);
    window.addEventListener('touchend', handleMortarMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMortarMouseUp);
      window.removeEventListener('touchend', handleMortarMouseUp);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (smokeIntervalRef.current) {
        clearInterval(smokeIntervalRef.current);
      }
      if (dustIntervalRef.current) {
        clearInterval(dustIntervalRef.current);
      }
    };
  }, [handleMouseMove, handleMortarMouseUp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDustParticles((prev) => prev.slice(1));
      setGrindParticles((prev) => prev.slice(1));
    }, 200);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSmokeParticles((prev) => prev.slice(1));
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);

  const ratioSegments = getMixedColorSegments();
  const powderColor = getPowderColor();
  const powderHeight = selectedSpices.length > 0 || groundPowder ? 30 - (grindProgress / 100) * 10 : 0;
  const blurAmount = 2 - (grindProgress / 100) * 1.5;

  const renderMoldIcon = (type: string) => {
    switch (type) {
      case 'plum':
        return (
          <svg width="35" height="35" viewBox="0 0 40 40">
            <circle cx="20" cy="12" r="6" fill="#d4a574" />
            <circle cx="12" cy="22" r="6" fill="#d4a574" />
            <circle cx="28" cy="22" r="6" fill="#d4a574" />
            <circle cx="16" cy="30" r="6" fill="#d4a574" />
            <circle cx="24" cy="30" r="6" fill="#d4a574" />
            <circle cx="20" cy="22" r="4" fill="#c62828" />
          </svg>
        );
      case 'ruyi':
        return (
          <svg width="35" height="35" viewBox="0 0 40 40">
            <path d="M20 8 Q10 8 10 18 Q10 28 20 32 Q30 28 30 18 Q30 8 20 8" fill="#d4a574" />
            <path d="M20 12 Q14 12 14 18 Q14 24 20 28 Q26 24 26 18 Q26 12 20 12" fill="#c62828" opacity="0.3" />
            <circle cx="20" cy="20" r="3" fill="#c62828" />
          </svg>
        );
      case 'stick':
        return (
          <svg width="35" height="35" viewBox="0 0 40 40">
            <rect x="18" y="5" width="4" height="30" rx="2" fill="#d4a574" />
            <circle cx="20" cy="5" r="3" fill="#c62828" />
            <rect x="17" y="15" width="6" height="2" fill="#8B4513" />
            <rect x="17" y="22" width="6" height="2" fill="#8B4513" />
            <rect x="17" y="29" width="6" height="2" fill="#8B4513" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderIncenseProduct = () => {
    if (!moldedProduct) return null;
    
    const shape = moldedProduct.moldType;
    
    return (
      <motion.div
        className={`incense-product ${isPressing ? 'pressing' : ''}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {shape === 'plum' && (
          <svg width="80" height="80" viewBox="0 0 80 80">
            <defs>
              <pattern id="plumPattern" patternUnits="userSpaceOnUse" width="10" height="10">
                <circle cx="5" cy="5" r="1" fill="#8B4513" opacity="0.3" />
              </pattern>
            </defs>
            <circle cx="40" cy="25" r="14" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <circle cx="25" cy="42" r="14" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <circle cx="55" cy="42" r="14" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <circle cx="32" cy="58" r="14" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <circle cx="48" cy="58" r="14" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <circle cx="40" cy="42" r="10" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <circle cx="40" cy="25" r="14" fill="url(#plumPattern)" />
            <circle cx="25" cy="42" r="14" fill="url(#plumPattern)" />
            <circle cx="55" cy="42" r="14" fill="url(#plumPattern)" />
            <circle cx="32" cy="58" r="14" fill="url(#plumPattern)" />
            <circle cx="48" cy="58" r="14" fill="url(#plumPattern)" />
            <circle cx="40" cy="42" r="10" fill="url(#plumPattern)" />
            {moldedProduct.isIgnited && <circle cx="40" cy="20" r="5" className="spark" />}
          </svg>
        )}
        {shape === 'ruyi' && (
          <svg width="100" height="60" viewBox="0 0 100 60">
            <defs>
              <pattern id="ruyiPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                <path d="M0 4 Q2 0 4 4 Q6 8 8 4" stroke="#8B4513" strokeWidth="0.5" fill="none" opacity="0.3" />
              </pattern>
            </defs>
            <path 
              d="M50 10 Q25 10 20 25 Q15 40 35 50 Q50 55 65 50 Q85 40 80 25 Q75 10 50 10" 
              fill={powderColor} 
              stroke="#8B4513" 
              strokeWidth="1.5"
            />
            <path 
              d="M50 10 Q25 10 20 25 Q15 40 35 50 Q50 55 65 50 Q85 40 80 25 Q75 10 50 10" 
              fill="url(#ruyiPattern)"
            />
            <path 
              d="M50 18 Q35 18 32 28 Q30 38 45 45 Q50 47 55 45 Q70 38 68 28 Q65 18 50 18" 
              fill="none" 
              stroke="#c62828" 
              strokeWidth="1"
              opacity="0.5"
            />
            <circle cx="50" cy="32" r="5" fill="#c62828" opacity="0.6" />
            {moldedProduct.isIgnited && <circle cx="50" cy="15" r="5" className="spark" />}
          </svg>
        )}
        {shape === 'stick' && (
          <svg width="30" height="120" viewBox="0 0 30 120">
            <defs>
              <pattern id="stickPattern" patternUnits="userSpaceOnUse" width="5" height="5">
                <line x1="0" y1="2.5" x2="5" y2="2.5" stroke="#8B4513" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect x="10" y="15" width="10" height="100" rx="3" fill={powderColor} stroke="#8B4513" strokeWidth="1" />
            <rect x="10" y="15" width="10" height="100" rx="3" fill="url(#stickPattern)" />
            <rect x="9" y="35" width="12" height="3" fill="#8B4513" opacity="0.4" />
            <rect x="9" y="55" width="12" height="3" fill="#8B4513" opacity="0.4" />
            <rect x="9" y="75" width="12" height="3" fill="#8B4513" opacity="0.4" />
            <rect x="9" y="95" width="12" height="3" fill="#8B4513" opacity="0.4" />
            {moldedProduct.isIgnited && <circle cx="15" cy="12" r="5" className="spark" />}
          </svg>
        )}
        
        {moldedProduct.isIgnited && (
          <div className="smoke-container">
            <AnimatePresence>
              {smokeParticles.map((particle, index) => (
                <motion.div
                  key={particle.id}
                  className="smoke-particle"
                  initial={{ 
                    opacity: 0.6, 
                    y: 0, 
                    scale: 1,
                    x: particle.x,
                    backgroundColor: '#f5f5dc'
                  }}
                  animate={{ 
                    opacity: 0, 
                    y: -150, 
                    scale: 2,
                    x: particle.x + Math.sin(index) * 20,
                    backgroundColor: '#e8d8c8'
                  }}
                  transition={{ 
                    duration: 3, 
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                  style={{
                    width: `${4 + index * 0.4}px`,
                    height: `${4 + index * 0.4}px`,
                    left: '50%',
                    top: 0,
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="mixing-table">
      <h2 style={{ 
        color: '#f5f0e8', 
        marginBottom: '10px',
        fontSize: '20px',
        fontWeight: 700
      }}>
        合香工坊
      </h2>
      
      <div className="incense-table">
        <div
          className="balance-scale"
          onDrop={handleDropOnScale}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            transform: isDraggingOverScale ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <div className="scale-markings">
            <span>0</span>
            <span>3钱</span>
            <span>6钱</span>
            <span>10钱</span>
          </div>
          <div className="scale-slider">
            <input
              type="range"
              min="0"
              max="10"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              onClick={(e) => {
                (e.target as HTMLInputElement).style.transform = 'scale(1.02)';
                setTimeout(() => {
                  (e.target as HTMLInputElement).style.transform = 'scale(1)';
                }, 150);
              }}
            />
          </div>
          <div className="scale-pan">
            {selectedSpices.length > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  color: '#e8c68a',
                }}
              >
                {weight}钱
              </div>
            )}
          </div>
        </div>

        <div
          ref={mortarRef}
          className="mortar-container"
          onMouseDown={handleMortarMouseDown}
          onTouchStart={handleMortarMouseDown}
          onMouseMove={(e) => {
            if (isDraggingMortar) {
              handleMouseMove(e.nativeEvent);
            }
          }}
        >
          <div className="mortar">
            {powderHeight > 0 && (
              <div
                className="mortar-powder"
                style={{
                  backgroundColor: powderColor,
                  height: `${powderHeight}px`,
                  filter: `blur(${blurAmount}px)`,
                }}
              />
            )}
            {grindParticles.map((particle) => (
              <div
                key={particle.id}
                className="grind-particle"
                style={{
                  left: particle.x,
                  top: particle.y,
                  backgroundColor: particle.color,
                  '--tx': `${(Math.random() - 0.5) * 30}px`,
                  '--ty': `${(Math.random() - 0.5) * 30}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <span style={{ fontSize: '10px', color: '#e8c68a' }}>
            {grindProgress > 0 ? `研磨 ${Math.round(grindProgress)}%` : '铜臼'}
          </span>
        </div>
      </div>

      {ratioSegments.length > 0 && (
        <div className="ratio-bar">
          {ratioSegments.map((segment, index) => (
            <div
              key={index}
              className="ratio-segment"
              style={{
                width: segment.width,
                backgroundColor: segment.color,
              }}
              title={`${segment.name}: ${segment.width}`}
            />
          ))}
        </div>
      )}

      <div className="molds-container">
        {(['plum', 'ruyi', 'stick'] as const).map((moldType) => (
          <div
            key={moldType}
            className={`mold ${selectedMold === moldType ? 'selected' : ''}`}
            onClick={() => handleMoldClick(moldType)}
          >
            {renderMoldIcon(moldType)}
          </div>
        ))}
      </div>

      <div className="btn-group">
        <button
          className="action-btn"
          onClick={handleGrindClick}
          disabled={selectedSpices.length === 0 || grindProgress >= 100 || isGrinding}
        >
          {isGrinding ? '研磨中...' : grindProgress >= 100 ? '已研磨' : '开始研磨'}
        </button>
        
        <button
          className="action-btn"
          onClick={handleIgnite}
          disabled={!moldedProduct || moldedProduct.isIgnited}
        >
          点燃
        </button>
        
        <button
          className="action-btn"
          onClick={onReset}
          style={{ background: 'linear-gradient(135deg, #6d4c41 0%, #3e2723 100%)' }}
        >
          重置
        </button>
      </div>

      {renderIncenseProduct()}

      <AnimatePresence>
        {aromaDescription && (
          <motion.div
            className="aroma-description"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <strong>香韵：</strong>
            <p>{aromaDescription}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {dustParticles.map((particle) => (
        <div
          key={particle.id}
          className="dust-particle"
          style={{
            left: particle.x,
            top: particle.y,
          }}
        />
      ))}
    </div>
  );
};

export default MixingTable;
