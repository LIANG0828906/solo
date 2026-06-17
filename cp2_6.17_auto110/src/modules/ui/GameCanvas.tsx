import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Rarity, Recipe } from '../../types';
import InventoryPanel from './InventoryPanel';
import { easeTransition } from './AnimationManager';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#A0A0A0',
  rare: '#4A90D9',
  epic: '#9B59B6',
  legendary: '#F1C40F',
};

const MIST_COLORS = ['#6C63FF', '#FF6584', '#36D399', '#F1C40F', '#9B59B6', '#3498DB'];

interface MistParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
}

interface ProductCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ recipe, onClick }) => {
  const cardStyle: React.CSSProperties = {
    width: 100,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#2D2D44',
    border: `2px solid ${RARITY_COLORS[recipe.rarity]}`,
    boxShadow: `0 0 16px ${RARITY_COLORS[recipe.rarity]}60, 0 4px 12px rgba(0,0,0,0.4)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: onClick ? 'pointer' : 'default',
    animation: 'productGlow 2s ease-in-out infinite',
    ...easeTransition('transform'),
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: 40,
    lineHeight: 1,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#FFFFFF',
  };

  return (
    <div style={cardStyle} onClick={onClick}>
      <span style={emojiStyle}>{recipe.emoji}</span>
      <span style={nameStyle}>{recipe.name}</span>
    </div>
  );
};

interface GameCanvasProps {
  onNavigate?: (page: 'game' | 'recipeBook') => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onNavigate }) => {
  const {
    crucibleMaterials,
    products,
    addToCrucible,
    removeFromCrucible,
    clearCrucible,
    synthesize,
    getMaterial,
    getRecipe,
  } = useGameStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mistParticles, setMistParticles] = useState<MistParticle[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const mistIdCounter = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (crucibleMaterials.length === 0) {
      setMistParticles([]);
      return;
    }

    const existingIds = new Set(mistParticles.map((p) => p.id));
    const particlesPerMaterial = 2;
    const totalNeeded = crucibleMaterials.length * particlesPerMaterial;

    if (mistParticles.length < totalNeeded) {
      const newParticles: MistParticle[] = [];
      for (let i = mistParticles.length; i < totalNeeded; i++) {
        const id = mistIdCounter.current++;
        newParticles.push({
          id,
          x: 20 + Math.random() * 60,
          color: MIST_COLORS[Math.floor(Math.random() * MIST_COLORS.length)],
          delay: Math.random() * 2,
        });
        existingIds.add(id);
      }
      setMistParticles([...mistParticles, ...newParticles]);
    } else if (mistParticles.length > totalNeeded) {
      setMistParticles(mistParticles.slice(0, totalNeeded));
    }
  }, [crucibleMaterials]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const materialId = e.dataTransfer.getData('materialId');
    if (materialId) {
      addToCrucible(materialId);
    }
  };

  const handleSynthesize = () => {
    if (crucibleMaterials.length === 0 || isSynthesizing) return;
    setIsSynthesizing(true);
    setTimeout(() => {
      synthesize();
      setIsSynthesizing(false);
    }, 600);
  };

  const crucibleSize = isMobile ? 160 : 200;
  const crucibleInnerSize = crucibleSize - 16;

  const crucibleStyle: React.CSSProperties = {
    width: crucibleSize,
    height: crucibleSize,
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)',
    border: isDragOver ? '2px solid #6C63FF' : '2px dashed #6C63FF',
    boxShadow: isDragOver
      ? `0 0 24px #6C63FF80, inset 0 0 30px rgba(108, 99, 255, 0.15)`
      : `inset 0 4px 12px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    ...easeTransition(['border', 'box-shadow']),
  };

  const crucibleInnerStyle: React.CSSProperties = {
    width: crucibleInnerSize,
    height: crucibleInnerSize,
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  };

  const mistStyle = (p: MistParticle): React.CSSProperties => ({
    position: 'absolute',
    bottom: '10%',
    left: `${p.x}%`,
    width: 40,
    height: 40,
    borderRadius: '50%',
    pointerEvents: 'none',
    animation: `mistFloat 3s ease-in-out ${p.delay}s infinite`,
    background: `radial-gradient(circle, ${p.color}50 0%, transparent 70%)`,
  });

  const materialSlotStyle = (index: number): React.CSSProperties => {
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(crucibleMaterials.length))));
    const row = Math.floor(index / cols);
    const col = index % cols;
    const totalRows = Math.ceil(crucibleMaterials.length / cols);
    const spacing = 38;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((totalRows - 1) * spacing) / 2;
    return {
      position: 'absolute',
      left: `calc(50% + ${startX + col * spacing}px)`,
      top: `calc(50% + ${startY + row * spacing}px)`,
      transform: 'translate(-50%, -50%)',
      fontSize: 24,
      cursor: 'pointer',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
      ...easeTransition('transform'),
    };
  };

  const emptyTextStyle: React.CSSProperties = {
    color: '#6C63FF',
    fontSize: isMobile ? 12 : 14,
    textAlign: 'center',
    opacity: 0.7,
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: crucibleMaterials.length === 0 ? '#3A3A5C' : '#6C63FF',
    border: 'none',
    borderRadius: 8,
    cursor: crucibleMaterials.length === 0 ? 'not-allowed' : 'pointer',
    ...easeTransition(['background-color', 'transform']),
  };

  const clearBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 500,
    color: '#CCCCCC',
    backgroundColor: 'transparent',
    border: '1px solid #3A3A5C',
    borderRadius: 6,
    cursor: crucibleMaterials.length === 0 ? 'not-allowed' : 'pointer',
    ...easeTransition(['color', 'border-color']),
  };

  const slotContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  };

  const slotTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#FFFFFF',
    margin: 0,
  };

  const productsGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxHeight: 280,
    overflowY: 'auto',
    padding: 4,
  };

  const mainLayoutStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#0F0F1A',
      }
    : {
        display: 'flex',
        gap: 24,
        padding: 24,
        minHeight: '100vh',
        backgroundColor: '#0F0F1A',
        alignItems: 'flex-start',
      };

  const centerAreaStyle: React.CSSProperties = isMobile
    ? {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 20,
      }
    : {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      };

  const crucibleSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  };

  const buttonsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
  };

  const navBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#2D2D44',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    ...easeTransition('background-color'),
  };

  const latestProducts = useMemo(() => {
    return [...products].reverse().slice(0, 6);
  }, [products]);

  return (
    <>
      <style>
        {`
          @keyframes mistFloat {
            0% {
              opacity: 0;
              transform: translateY(0) scale(0.5);
            }
            50% {
              opacity: 0.7;
              transform: translateY(-30px) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(-60px) scale(1.5);
            }
          }
          @keyframes productGlow {
            0%, 100% {
              filter: brightness(1);
            }
            50% {
              filter: brightness(1.2);
            }
          }
        `}
      </style>
      <div style={mainLayoutStyle}>
        {!isMobile && <InventoryPanel />}
        <div style={centerAreaStyle}>
          <div style={headerStyle}>
            <h1 style={titleStyle}>炼金实验室</h1>
            {onNavigate && (
              <button style={navBtnStyle} onClick={() => onNavigate('recipeBook')}>
                📖 炼金图鉴
              </button>
            )}
          </div>
          <div style={crucibleSectionStyle}>
            <div
              style={crucibleStyle}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div style={crucibleInnerStyle}>
                {mistParticles.map((p) => (
                  <div key={p.id} style={mistStyle(p)} />
                ))}
                {crucibleMaterials.length === 0 ? (
                  <span style={emptyTextStyle}>
                    {isMobile ? '点击材料或拖放到此处' : '拖拽材料到此处'}
                  </span>
                ) : (
                  crucibleMaterials.map((mid, index) => {
                    const material = getMaterial(mid);
                    return (
                      <span
                        key={`${mid}-${index}`}
                        style={materialSlotStyle(index)}
                        onClick={() => removeFromCrucible(index)}
                        title={material?.name || ''}
                      >
                        {material?.emoji || '?'}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div style={buttonsRowStyle}>
              <button style={buttonStyle} onClick={handleSynthesize}>
                {isSynthesizing ? '合成中...' : '⚗️ 开始合成'}
              </button>
              <button style={clearBtnStyle} onClick={clearCrucible}>
                清空坩埚
              </button>
            </div>
          </div>
          <div style={slotContainerStyle}>
            <h3 style={slotTitleStyle}>合成产物 ({products.length})</h3>
            {latestProducts.length === 0 ? (
              <span style={{ color: '#666666', fontSize: 13 }}>尚未合成任何产物</span>
            ) : (
              <div style={productsGridStyle}>
                {latestProducts.map((p) => {
                  const recipe = getRecipe(p.recipeId);
                  if (!recipe) return null;
                  return <ProductCard key={p.id} recipe={recipe} />;
                })}
              </div>
            )}
          </div>
        </div>
        {isMobile && <InventoryPanel isMobile />}
      </div>
    </>
  );
};

export default GameCanvas;
