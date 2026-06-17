import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { MaterialRegistry } from './modules/engine/MaterialRegistry';
import { Rarity, Material, Recipe } from './types';
import RecipeBook from './modules/ui/RecipeBook';

const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#9E9E9E',
  [Rarity.RARE]: '#4FC3F7',
  [Rarity.EPIC]: '#CE93D8',
  [Rarity.LEGENDARY]: '#FFD54F',
};

const RARITY_NAMES: Record<Rarity, string> = {
  [Rarity.COMMON]: '普通',
  [Rarity.RARE]: '稀有',
  [Rarity.EPIC]: '史诗',
  [Rarity.LEGENDARY]: '传说',
};

const OUTPUT_MATERIALS: Record<string, Material> = {
  healing_potion: { id: 'healing_potion', name: '治疗药水', rarity: Rarity.COMMON, type: 'mystical', color: '#81C784', description: '恢复生命值的神奇药剂。' },
  fire_elixir: { id: 'fire_elixir', name: '火焰药剂', rarity: Rarity.RARE, type: 'energy', color: '#FF7043', description: '投掷后产生剧烈爆炸。' },
  storm_bottle: { id: 'storm_bottle', name: '风暴之瓶', rarity: Rarity.RARE, type: 'energy', color: '#7E57C2', description: '释放强烈风暴能量。' },
  moonlight_essence: { id: 'moonlight_essence', name: '月光精华', rarity: Rarity.EPIC, type: 'energy', color: '#9FA8DA', description: '浓缩的月光能量结晶。' },
  dragon_breath: { id: 'dragon_breath', name: '龙息药剂', rarity: Rarity.LEGENDARY, type: 'energy', color: '#E91E63', description: '传说中的终极火焰药剂。' },
  earth_shield: { id: 'earth_shield', name: '大地护盾', rarity: Rarity.COMMON, type: 'mineral', color: '#8D6E63', description: '提供临时防护的符咒。' },
  void_portal: { id: 'void_portal', name: '虚空之门', rarity: Rarity.EPIC, type: 'mystical', color: '#5E35B1', description: '通往未知维度的裂缝。' },
  steam_automaton: { id: 'steam_automaton', name: '蒸汽机械', rarity: Rarity.EPIC, type: 'mechanical', color: '#546E7A', description: '自动运转的精密机械。' },
  philosopher_stone: { id: 'philosopher_stone', name: '贤者之石', rarity: Rarity.LEGENDARY, type: 'mystical', color: '#FFD54F', description: '炼金术的终极追求。' },
  life_elixir: { id: 'life_elixir', name: '生命药剂', rarity: Rarity.LEGENDARY, type: 'biological', color: '#1B5E20', description: '赋予永恒生命的神药。' },
  amber_charm: { id: 'amber_charm', name: '琥珀护符', rarity: Rarity.RARE, type: 'mineral', color: '#FFB300', description: '抵御邪恶的护身符。' },
  poison_vial: { id: 'poison_vial', name: '剧毒小瓶', rarity: Rarity.RARE, type: 'biological', color: '#9CCC65', description: '致命的浓缩毒素。' },
};

function getMaterialById(id: string): Material | null {
  return MaterialRegistry.getMaterialById(id) ?? OUTPUT_MATERIALS[id] ?? null;
}

const App: React.FC = () => {
  const {
    inventory,
    crucible,
    unlockedRecipes,
    discoveredMaterials,
    toastMessage,
    showHintPanel,
    showSettingsMenu,
    showResetConfirm,
    recipes,
    crucibleShaking,
    lastCraftResult,
    newlyUnlockedMaterial,
    addRandomMaterial,
    addToCrucible,
    removeFromCrucible,
    clearCrucible,
    performCraft,
    hideToast,
    toggleHintPanel,
    toggleSettingsMenu,
    closeSettingsMenu,
    showResetDialog,
    hideResetDialog,
    resetGame,
    setCrucibleShaking,
    clearLastCraftResult,
    clearNewlyUnlocked,
  } = useGameStore();

  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [currentPage, setCurrentPage] = useState<'game' | 'recipeBook'>('game');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; angle: number }>>([]);
  const [mistParticles, setMistParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const particleIdRef = useRef<number>(0);
  const crucibleRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const craftResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      addRandomMaterial();
    }, 8000);
    return () => clearInterval(interval);
  }, [addRandomMaterial]);

  useEffect(() => {
    if (toastMessage) {
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => hideToast(), 400);
      }, 2000);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toastMessage, hideToast]);

  useEffect(() => {
    if (lastCraftResult === 'success' && crucibleRef.current) {
      const rect = crucibleRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newParticles = Array.from({ length: 24 }, (_, i) => ({
        id: particleIdRef.current++,
        x: centerX,
        y: centerY,
        color: ['#6C63FF', '#FFD54F', '#FF6584', '#36D399', '#4FC3F7'][i % 5],
        angle: (i / 24) * Math.PI * 2,
      }));
      setParticles(newParticles);
      if (craftResultTimerRef.current) clearTimeout(craftResultTimerRef.current);
      craftResultTimerRef.current = setTimeout(() => {
        setParticles([]);
        clearLastCraftResult();
      }, 1000);
    } else if (lastCraftResult === 'failure' && crucibleRef.current) {
      const rect = crucibleRef.current.getBoundingClientRect();
      const newMist = Array.from({ length: 5 }, (_, i) => ({
        id: particleIdRef.current++,
        x: rect.width / 2 + (i - 2) * 15,
        y: rect.height / 2,
      }));
      setMistParticles(newMist);
      if (craftResultTimerRef.current) clearTimeout(craftResultTimerRef.current);
      craftResultTimerRef.current = setTimeout(() => {
        setMistParticles([]);
        clearLastCraftResult();
      }, 1500);
    }
    return () => {
      if (craftResultTimerRef.current) clearTimeout(craftResultTimerRef.current);
    };
  }, [lastCraftResult, clearLastCraftResult]);

  useEffect(() => {
    if (newlyUnlockedMaterial) {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => clearNewlyUnlocked(), 1200);
    }
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, [newlyUnlockedMaterial, clearNewlyUnlocked]);

  const progressPercent = useMemo(() => {
    return recipes.length > 0 ? (unlockedRecipes.size / recipes.length) * 100 : 0;
  }, [unlockedRecipes.size, recipes.length]);

  const rarityDistribution = useMemo(() => {
    const dist: Record<Rarity, number> = {
      [Rarity.COMMON]: 0,
      [Rarity.RARE]: 0,
      [Rarity.EPIC]: 0,
      [Rarity.LEGENDARY]: 0,
    };
    discoveredMaterials.forEach((mid) => {
      const mat = getMaterialById(mid);
      if (mat) dist[mat.rarity]++;
    });
    return dist;
  }, [discoveredMaterials]);

  const maxRarityCount = useMemo(() => {
    return Math.max(...Object.values(rarityDistribution), 1);
  }, [rarityDistribution]);

  const availableRecipes = useMemo(() => {
    return recipes.filter((r) => {
      return r.materials.every((mid) => discoveredMaterials.has(mid));
    });
  }, [recipes, discoveredMaterials]);

  const handleAddToCrucible = useCallback((materialId: string) => {
    const success = addToCrucible(materialId);
    if (!success && crucible.length >= 6) {
      setCrucibleShaking(true);
      setTimeout(() => setCrucibleShaking(false), 900);
    }
  }, [addToCrucible, crucible.length, setCrucibleShaking]);

  const handleCraft = useCallback(() => {
    performCraft();
  }, [performCraft]);

  const handleReset = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const renderMaterialCard = (materialId: string, count?: number, onClick?: () => void, small = false) => {
    const mat = getMaterialById(materialId);
    if (!mat) return null;
    const isNewlyUnlocked = newlyUnlockedMaterial === materialId;
    const size = small ? 36 : 52;

    return (
      <div
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${mat.color}40, ${mat.color}15)`,
          border: `2px solid ${mat.color}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: `0 0 8px ${mat.color}50`,
          transformStyle: 'preserve-3d',
          animation: isNewlyUnlocked ? 'flipUnlock 0.5s ease-in-out' : undefined,
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px ${mat.color}80`;
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 8px ${mat.color}50`;
          }
        }}
      >
        <span style={{
          fontSize: small ? 14 : 20,
          fontWeight: 'bold',
          color: '#fff',
          textShadow: `0 0 6px ${mat.color}`,
          lineHeight: 1,
        }}>
          {mat.name[0]}
        </span>
        {count !== undefined && count > 0 && (
          <span style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            background: '#1E1E2E',
            color: mat.color,
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 4px',
            borderRadius: 6,
            border: `1px solid ${mat.color}60`,
            minWidth: 16,
            textAlign: 'center',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
    );
  };

  const baseStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0F0F23',
    color: '#E8EAF6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: isMobile ? 12 : 24,
    position: 'relative',
    overflowX: 'hidden',
  };

  return (
    <div style={baseStyle}>
      <style>{`
        @keyframes shakeCrucible {
          0%, 100% { border-color: #3A3A5C; }
          25% { border-color: #FF6B6B; box-shadow: 0 0 20px #FF6B6B80; }
          75% { border-color: #FF6B6B; box-shadow: 0 0 20px #FF6B6B80; }
        }
        @keyframes flipUnlock {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes particleBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
        }
        @keyframes mistRise {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          40% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-50px) scale(2); }
        }
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 20 : 28,
            background: 'linear-gradient(135deg, #6C63FF, #4FC3F7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            letterSpacing: 1,
          }}>
            ⚗️ AlchemyForge
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#9E9E9E' }}>配方进度</span>
            <div style={{
              width: isMobile ? 150 : 240,
              height: 12,
              background: '#2D2D44',
              borderRadius: 6,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6C63FF, #9C97FF)',
                borderRadius: 6,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 8px #6C63FF80',
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#6C63FF', fontWeight: 700, minWidth: 40 }}>
              {unlockedRecipes.size}/{recipes.length}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          <button
            onClick={() => setCurrentPage(currentPage === 'game' ? 'recipeBook' : 'game')}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: currentPage === 'recipeBook' ? '#6C63FF' : '#3A3A5C',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = currentPage === 'recipeBook' ? '#6C63FF' : '#3A3A5C'; }}
            title="炼金图鉴"
          >
            📖
          </button>

          <button
            onClick={toggleHintPanel}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: showHintPanel ? '#6C63FF' : '#3A3A5C',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = showHintPanel ? '#6C63FF' : '#3A3A5C'; }}
          >
            🔍
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleSettingsMenu}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#3A3A5C',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0deg)';
              }}
            >
              ⚙️
            </button>

            {showSettingsMenu && (
              <div style={{
                position: 'absolute',
                top: 52,
                right: 0,
                background: '#2D2D44',
                borderRadius: 8,
                padding: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 100,
                minWidth: 160,
              }}>
                <button
                  onClick={showResetDialog}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FF6B6B',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#3A3A5C'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  🔄 重置游戏
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 24,
      }}>
        <div style={{
          width: isMobile ? '100%' : 220,
          flexShrink: 0,
          background: 'linear-gradient(180deg, #1E1E2E 0%, #181828 100%)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #2D2D44',
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: 16,
            color: '#B39DDB',
            fontWeight: 700,
          }}>
            📊 稀有度分布
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY] as Rarity[]).map((rarity) => {
              const count = rarityDistribution[rarity];
              const height = isMobile ? 20 : 24;
              return (
                <div key={rarity} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: RARITY_COLORS[rarity], fontWeight: 600 }}>
                      {RARITY_NAMES[rarity]}
                    </span>
                    <span style={{ fontSize: 12, color: '#9E9E9E' }}>{count}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height,
                    background: '#2D2D44',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(count / maxRarityCount) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${RARITY_COLORS[rarity]}, ${RARITY_COLORS[rarity]}80)`,
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                      minWidth: count > 0 ? 8 : 0,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #2D2D44',
          }}>
            <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 6 }}>仓库容量</div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: inventory.length >= 20 ? '#FF6B6B' : '#6C63FF',
            }}>
              {inventory.length} / 20
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}>
          <div
            ref={crucibleRef}
            style={{
              width: isMobile ? 280 : 360,
              minHeight: 200,
              background: 'radial-gradient(ellipse at center, #2D2D44 0%, #1E1E2E 100%)',
              borderRadius: '0 0 180px 180px',
              border: `3px solid ${crucibleShaking ? '#FF6B6B' : '#3A3A5C'}`,
              padding: 24,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: crucibleShaking ? 'shakeCrucible 0.3s ease 3' : undefined,
              transition: 'border-color 0.2s ease',
            }}
          >
            {crucible.length === 0 ? (
              <span style={{ color: '#666', fontSize: 14 }}>拖拽或点击材料放入坩埚（最多6份）</span>
            ) : (
              crucible.map((mid, idx) => (
                <div key={`${mid}-${idx}`} onClick={() => removeFromCrucible(idx)}>
                  {renderMaterialCard(mid, undefined, undefined, false)}
                </div>
              ))
            )}

            {particles.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: p.color,
                  boxShadow: `0 0 12px ${p.color}`,
                  pointerEvents: 'none',
                  '--dx': `${Math.cos(p.angle) * 120}px`,
                  '--dy': `${Math.sin(p.angle) * 120}px`,
                  animation: 'particleBurst 1s ease-out forwards',
                } as React.CSSProperties}
              />
            ))}

            {mistParticles.map((m, i) => (
              <div
                key={m.id}
                style={{
                  position: 'absolute',
                  left: m.x - 20,
                  top: m.y - 20,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${['#6C63FF', '#FF6584', '#36D399'][i % 3]}50 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  animation: 'mistRise 1.5s ease-out forwards',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={clearCrucible}
              style={{
                padding: '12px 28px',
                background: '#2D2D44',
                border: '1px solid #3A3A5C',
                color: '#B39DDB',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#3A3A5C';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#6C63FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#2D2D44';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#3A3A5C';
              }}
            >
              🗑️ 清空
            </button>
            <button
              onClick={handleCraft}
              disabled={crucible.length === 0}
              style={{
                padding: '12px 36px',
                background: crucible.length === 0
                  ? '#2D2D44'
                  : 'linear-gradient(135deg, #6C63FF, #4FC3F7)',
                border: 'none',
                color: crucible.length === 0 ? '#666' : '#fff',
                borderRadius: 10,
                cursor: crucible.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: 15,
                fontWeight: 700,
                transition: 'all 0.2s ease',
                boxShadow: crucible.length === 0 ? 'none' : '0 4px 16px #6C63FF50',
              }}
              onMouseEnter={(e) => {
                if (crucible.length > 0) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              🔥 合成
            </button>
          </div>
        </div>

        <div style={{
          width: isMobile ? '100%' : 280,
          flexShrink: 0,
          background: 'linear-gradient(180deg, #1E1E2E 0%, #181828 100%)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #2D2D44',
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: 16,
            color: '#B39DDB',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>🎒 材料仓库</span>
            <span style={{ fontSize: 12, color: '#9E9E9E', fontWeight: 500 }}>
              {inventory.length}/20
            </span>
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            maxHeight: isMobile ? 240 : 400,
            overflowY: 'auto',
            paddingRight: 4,
          }}>
            {inventory.map((item) => (
              <div
                key={item.materialId}
                title={`${getMaterialById(item.materialId)?.name ?? item.materialId} - ${getMaterialById(item.materialId)?.description ?? ''}`}
              >
                {renderMaterialCard(
                  item.materialId,
                  item.count,
                  () => handleAddToCrucible(item.materialId),
                  false
                )}
              </div>
            ))}
            {inventory.length === 0 && (
              <span style={{ color: '#666', fontSize: 13, padding: 8 }}>等待材料生成...</span>
            )}
          </div>
        </div>
      </div>

      {showHintPanel && (
        <div
          onClick={toggleHintPanel}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#00000099',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? '90%' : 600,
              height: isMobile ? '80vh' : 400,
              background: '#1E1E2E',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              animation: 'toastFadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#B39DDB' }}>📜 配方线索</h2>
              <button
                onClick={toggleHintPanel}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9E9E9E',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
              {availableRecipes.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
                  收集更多材料以解锁配方线索...
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {availableRecipes.map((recipe: Recipe) => {
                    const isUnlocked = unlockedRecipes.has(recipe.id);
                    const outputMat = getMaterialById(recipe.output);
                    return (
                      <div
                        key={recipe.id}
                        style={{
                          background: isUnlocked ? `${outputMat?.color ?? '#6C63FF'}15` : '#2D2D44',
                          borderRadius: 10,
                          padding: 14,
                          border: `1px solid ${isUnlocked ? `${outputMat?.color ?? '#6C63FF'}50` : '#3A3A5C'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{
                            fontWeight: 700,
                            color: isUnlocked ? (outputMat?.color ?? '#fff') : '#E8EAF6',
                          }}>
                            {isUnlocked ? `✅ ${recipe.name}` : '❓ 未知配方'}
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: '#9E9E9E',
                            background: '#1E1E2E',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}>
                            成功率 {Math.round(recipe.probability * 100)}%
                          </span>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: 13,
                          color: '#B39DDB',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}>
                          「{recipe.hint}」
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div
          onClick={hideResetDialog}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#00000099',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? '85%' : 360,
              background: '#1E1E2E',
              borderRadius: 16,
              padding: 28,
              animation: 'toastFadeIn 0.2s ease',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#E8EAF6', fontSize: 18 }}>⚠️ 确认重置</h3>
            <p style={{ margin: '0 0 24px 0', color: '#9E9E9E', fontSize: 14, lineHeight: 1.6 }}>
              重置将清除所有进度，包括已解锁配方、已发现材料和仓库库存。此操作无法撤销！
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={hideResetDialog}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #666',
                  color: '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#666'; }}
              >
                取消
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 20px',
                  background: '#FF6B6B',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FF5252'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FF6B6B'; }}
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 2000,
          pointerEvents: 'none',
          animation: toastVisible ? 'toastFadeIn 0.3s ease forwards' : 'toastFadeOut 0.4s ease forwards',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {toastMessage}
        </div>
      )}

      {showSettingsMenu && (
        <div
          onClick={closeSettingsMenu}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
};

export default App;
