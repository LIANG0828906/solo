import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MaterialRegistry } from '../../modules/engine/MaterialRegistry';
import { Rarity, MaterialType } from '../../types';
import type { Recipe, Material } from '../../types';
import { easeTransition } from './AnimationManager';

const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#A0A0A0',
  [Rarity.RARE]: '#4A90D9',
  [Rarity.EPIC]: '#9B59B6',
  [Rarity.LEGENDARY]: '#F1C40F',
};

const RARITY_NAMES: Record<Rarity, string> = {
  [Rarity.COMMON]: '普通',
  [Rarity.RARE]: '稀有',
  [Rarity.EPIC]: '史诗',
  [Rarity.LEGENDARY]: '传说',
};

const RARITY_ORDER: Record<Rarity, number> = {
  [Rarity.LEGENDARY]: 4,
  [Rarity.EPIC]: 3,
  [Rarity.RARE]: 2,
  [Rarity.COMMON]: 1,
};

const TYPE_NAMES: Record<MaterialType, string> = {
  element: '元素',
  biological: '生物',
  mineral: '矿物',
  energy: '能量',
  mechanical: '机械',
  mystical: '神秘',
};

const TYPE_COLORS: Record<MaterialType, string> = {
  element: '#4FC3F7',
  biological: '#81C784',
  mineral: '#FFB74D',
  energy: '#CE93D8',
  mechanical: '#90A4AE',
  mystical: '#FFD54F',
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

function getMaterial(id: string): Material | null {
  return MaterialRegistry.getMaterialById(id) ?? OUTPUT_MATERIALS[id] ?? null;
}

interface MaterialIconProps {
  material: Material;
  size?: number;
  showBadge?: number;
  showTooltip?: boolean;
}

const MaterialIcon: React.FC<MaterialIconProps> = ({ material, size = 24, showBadge, showTooltip = true }) => {
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.max(4, size / 6),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.max(10, size / 2),
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 0 4px rgba(0,0,0,0.6)',
    background: `linear-gradient(135deg, ${material.color}CC 0%, ${material.color}66 100%)`,
    border: `1.5px solid ${material.color}`,
    boxShadow: `0 0 ${size / 6}px ${material.color}40, inset 0 0 ${size / 4}px rgba(255,255,255,0.1)`,
    position: 'relative',
    ...easeTransition(['transform', 'box-shadow']),
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: '#1A1A2E',
    border: `1px solid ${material.color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  const icon = (
    <div
      style={iconStyle}
      title={showTooltip ? `${material.name} (${RARITY_NAMES[material.rarity]})` : undefined}
    >
      {material.name[0]}
      {showBadge !== undefined && showBadge > 1 && (
        <span style={badgeStyle}>×{showBadge}</span>
      )}
    </div>
  );

  return icon;
};

interface RecipeCardProps {
  recipe: Recipe;
  isUnlocked: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isUnlocked, onClick, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const outputMat = getMaterial(recipe.output);

  const cardWidth = isMobile ? 130 : 140;
  const cardHeight = isMobile ? 210 : 220;

  const cardStyle: React.CSSProperties = {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 12,
    backgroundColor: '#2D2D44',
    border: `2px solid ${outputMat ? RARITY_COLORS[outputMat.rarity] : '#3A3A5C'}`,
    boxShadow: isHovered && isUnlocked
      ? `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${outputMat ? RARITY_COLORS[outputMat.rarity] : '#6C63FF'}50`
      : '0 2px 8px rgba(0,0,0,0.3)',
    transform: isHovered && isUnlocked ? 'translateY(-4px)' : 'translateY(0)',
    cursor: isUnlocked ? 'pointer' : 'default',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px 10px 8px',
    position: 'relative',
    overflow: 'hidden',
    ...easeTransition(['transform', 'box-shadow']),
  };

  const rarityTagStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: outputMat ? RARITY_COLORS[outputMat.rarity] + 'CC' : '#3A3A5CCC',
    borderRadius: 10,
    zIndex: 2,
  };

  const iconContainerStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: isUnlocked && outputMat
      ? `radial-gradient(circle, ${outputMat.color}40 0%, ${outputMat.color}15 100%)`
      : 'radial-gradient(circle, #3A3A5C40 0%, #1A1A2E15 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    border: `2px solid ${isUnlocked && outputMat ? outputMat.color : '#3A3A5C'}`,
    boxShadow: isUnlocked && outputMat ? `0 0 12px ${outputMat.color}40` : 'none',
    ...easeTransition(['border-color', 'box-shadow']),
  };

  const iconCharStyle: React.CSSProperties = {
    fontSize: 28,
    lineHeight: 1,
    filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.3)',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: isUnlocked ? '#FFFFFF' : '#4A4A6A',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 6,
  };

  const ingredientsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 'auto',
    minHeight: 32,
    padding: '4px 2px',
    borderTop: '1px solid #3A3A5C',
    width: '100%',
  };

  const lockedMaskStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    zIndex: 3,
  };

  const questionMarkStyle: React.CSSProperties = {
    fontSize: 56,
    color: '#3A3A5C',
    fontWeight: 700,
  };

  const renderIngredients = () => {
    if (!isUnlocked) {
      return <span style={{ fontSize: 18, color: '#4A4A6A', letterSpacing: 4 }}>???</span>;
    }

    const matCounts: Record<string, number> = {};
    recipe.materials.forEach(mid => {
      matCounts[mid] = (matCounts[mid] || 0) + 1;
    });

    return Object.entries(matCounts).map(([mid, count]) => {
      const mat = getMaterial(mid);
      if (!mat) return null;
      return (
        <MaterialIcon
          key={mid}
          material={mat}
          size={22}
          showBadge={count}
        />
      );
    });
  };

  return (
    <div
      style={cardStyle}
      onClick={isUnlocked ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={rarityTagStyle}>
        {isUnlocked && outputMat ? RARITY_NAMES[outputMat.rarity] : '???'}
      </span>

      <div style={iconContainerStyle}>
        <span style={iconCharStyle}>
          {isUnlocked && outputMat ? outputMat.name[0] : '?'}
        </span>
      </div>

      <span style={nameStyle}>{isUnlocked ? recipe.name : '???'}</span>

      <div style={ingredientsContainerStyle}>
        {renderIngredients()}
      </div>

      {!isUnlocked && (
        <div style={lockedMaskStyle}>
          <span style={questionMarkStyle}>?</span>
        </div>
      )}
    </div>
  );
};

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const outputMat = getMaterial(recipe.output);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
    animation: 'fadeIn 0.2s ease',
  };

  const modalStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1E32',
    borderRadius: 16,
    padding: 24,
    boxShadow: `0 0 40px ${outputMat ? RARITY_COLORS[outputMat.rarity] : '#6C63FF'}40, 0 16px 48px rgba(0,0,0,0.5)`,
    border: `2px solid ${outputMat ? RARITY_COLORS[outputMat.rarity] : '#6C63FF'}`,
    animation: 'scaleIn 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  };

  const titleSectionStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
  };

  const rarityBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: outputMat ? RARITY_COLORS[outputMat.rarity] : '#6C63FF',
    borderRadius: 12,
    width: 'fit-content',
  };

  const descStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#888888',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const ingredientsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
    marginBottom: 20,
  };

  const ingredientRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
  };

  const ingNameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 13,
    color: '#E0E0E0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const ingCountStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: outputMat?.color || '#6C63FF',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#6C63FF',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    ...easeTransition('background-color'),
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#B39DDB',
    fontStyle: 'italic',
    padding: '10px 14px',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    borderLeft: `3px solid ${outputMat?.color || '#6C63FF'}`,
    marginBottom: 16,
    lineHeight: 1.5,
  };

  const matCounts: Record<string, number> = {};
  recipe.materials.forEach(mid => {
    matCounts[mid] = (matCounts[mid] || 0) + 1;
  });

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            {outputMat && (
              <MaterialIcon material={outputMat} size={56} showTooltip={false} />
            )}
            <div style={titleSectionStyle}>
              <h2 style={titleStyle}>{recipe.name}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={rarityBadgeStyle}>
                  {outputMat ? RARITY_NAMES[outputMat.rarity] : '未知'}
                </span>
                {outputMat && (
                  <span style={{
                    ...rarityBadgeStyle,
                    backgroundColor: TYPE_COLORS[outputMat.type] + 'CC',
                  }}>
                    {TYPE_NAMES[outputMat.type]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p style={descStyle}>{outputMat?.description || '神秘的炼金产物。'}</p>

          <div style={hintStyle}>
            💡 谜语线索：「{recipe.hint}」
          </div>

          <h3 style={sectionTitleStyle}>合成材料</h3>
          <div style={ingredientsGridStyle}>
            {Object.entries(matCounts).map(([mid, count]) => {
              const material = getMaterial(mid);
              return (
                <div key={mid} style={ingredientRowStyle}>
                  {material && <MaterialIcon material={material} size={28} />}
                  <span style={ingNameStyle}>{material?.name || '未知材料'}</span>
                  <span style={ingCountStyle}>× {count}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#888' }}>成功概率</span>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: recipe.probability >= 0.8 ? '#4CAF50' : recipe.probability >= 0.5 ? '#FFC107' : '#FF6B6B',
            }}>
              {Math.round(recipe.probability * 100)}%
            </span>
          </div>

          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A52D9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF'; }}
          >
            关闭
          </button>
        </div>
      </div>
    </>
  );
};

interface RecipeBookProps {
  onNavigate?: (page: 'game' | 'recipeBook') => void;
}

const RecipeBook: React.FC<RecipeBookProps> = ({ onNavigate }) => {
  const {
    recipes,
    unlockedRecipes,
    recipeUnlockTimes,
    recipeBookFilterRarity,
    recipeBookFilterType,
    recipeBookFilterMaterial,
    recipeBookSort,
    setRecipeBookFilterRarity,
    setRecipeBookFilterType,
    setRecipeBookFilterMaterial,
    setRecipeBookSort,
    resetRecipeBookFilters,
  } = useGameStore();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allMaterialTypes = useMemo((): MaterialType[] => {
    return ['element', 'biological', 'mineral', 'energy', 'mechanical', 'mystical'];
  }, []);

  const availableMaterials = useMemo(() => {
    const matIds = new Set<string>();
    recipes.forEach(r => r.materials.forEach(m => matIds.add(m)));
    return Array.from(matIds)
      .map(id => getMaterial(id))
      .filter((m): m is Material => m !== null)
      .sort((a, b) => {
        const rarityDiff = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        return rarityDiff !== 0 ? rarityDiff : a.name.localeCompare(b.name, 'zh-CN');
      });
  }, [recipes]);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];

    if (recipeBookFilterRarity !== 'all') {
      result = result.filter(r => {
        const outputMat = getMaterial(r.output);
        return outputMat?.rarity === recipeBookFilterRarity;
      });
    }

    if (recipeBookFilterType !== 'all') {
      result = result.filter(r => {
        const outputMat = getMaterial(r.output);
        return outputMat?.type === recipeBookFilterType;
      });
    }

    if (recipeBookFilterMaterial !== 'all') {
      result = result.filter(r => r.materials.includes(recipeBookFilterMaterial));
    }

    result.sort((a, b) => {
      const aUnlocked = unlockedRecipes.has(a.id);
      const bUnlocked = unlockedRecipes.has(b.id);

      if (aUnlocked !== bUnlocked) {
        return aUnlocked ? -1 : 1;
      }

      switch (recipeBookSort) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN');

        case 'rarity': {
          const aMat = getMaterial(a.output);
          const bMat = getMaterial(b.output);
          const aOrder = aMat ? RARITY_ORDER[aMat.rarity] : 0;
          const bOrder = bMat ? RARITY_ORDER[bMat.rarity] : 0;
          if (bOrder !== aOrder) return bOrder - aOrder;
          return a.name.localeCompare(b.name, 'zh-CN');
        }

        case 'unlockTime': {
          if (!aUnlocked) {
            return a.name.localeCompare(b.name, 'zh-CN');
          }
          const aTime = recipeUnlockTimes.get(a.id) ?? 0;
          const bTime = recipeUnlockTimes.get(b.id) ?? 0;
          if (bTime !== aTime) return bTime - aTime;
          return a.name.localeCompare(b.name, 'zh-CN');
        }

        default:
          return 0;
      }
    });

    return result;
  }, [
    recipes,
    recipeBookFilterRarity,
    recipeBookFilterType,
    recipeBookFilterMaterial,
    recipeBookSort,
    unlockedRecipes,
    recipeUnlockTimes,
  ]);

  const unlockedCount = unlockedRecipes.size;

  const hasActiveFilters =
    recipeBookFilterRarity !== 'all' ||
    recipeBookFilterType !== 'all' ||
    recipeBookFilterMaterial !== 'all';

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0F0F1A',
    padding: isMobile ? 12 : 24,
    color: '#E8EAF6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    maxWidth: 1200,
    marginLeft: 'auto',
    marginRight: 'auto',
    flexWrap: 'wrap',
    gap: 12,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? 20 : 28,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
    background: 'linear-gradient(135deg, #6C63FF, #4FC3F7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#888888',
    marginTop: 4,
  };

  const backBtnStyle: React.CSSProperties = {
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

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    maxWidth: 1200,
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #2D2D44',
  };

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  };

  const filterLabelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#888',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: isMobile ? 'auto' : 48,
  };

  const filterBtnBaseStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 16,
    border: '1px solid #3A3A5C',
    background: 'transparent',
    color: '#B0B0C0',
    cursor: 'pointer',
    ...easeTransition(['background-color', 'border-color', 'color']),
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: '1px solid #3A3A5C',
    background: '#2D2D44',
    color: '#E0E0E0',
    cursor: 'pointer',
    maxWidth: 180,
    ...easeTransition('border-color'),
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: isMobile ? 10 : 16,
    maxWidth: 1200,
    margin: '0 auto',
    justifyItems: 'center',
  };

  const resultCountStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#888',
    marginLeft: 'auto',
  };

  const leftHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const clearFilterBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: '1px solid #FF6B6B',
    background: 'transparent',
    color: '#FF6B6B',
    cursor: 'pointer',
    ...easeTransition(['background-color', 'color']),
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={leftHeaderStyle}>
          <h1 style={titleStyle}>📖 炼金图鉴</h1>
          <span style={subtitleStyle}>
            已解锁 {unlockedCount} / {recipes.length} 个配方
          </span>
        </div>
        {onNavigate && (
          <button
            style={backBtnStyle}
            onClick={() => onNavigate('game')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3A3A5C'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2D2D44'; }}
          >
            ← 返回实验室
          </button>
        )}
      </div>

      <div style={filterBarStyle}>
        <div style={filterRowStyle}>
          <span style={filterLabelStyle}>稀有度</span>
          <button
            style={{
              ...filterBtnBaseStyle,
              backgroundColor: recipeBookFilterRarity === 'all' ? '#6C63FF' : 'transparent',
              borderColor: recipeBookFilterRarity === 'all' ? '#6C63FF' : '#3A3A5C',
              color: recipeBookFilterRarity === 'all' ? '#fff' : '#B0B0C0',
            }}
            onClick={() => setRecipeBookFilterRarity('all')}
          >
            全部
          </button>
          {([Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON] as Rarity[]).map(rarity => (
            <button
              key={rarity}
              style={{
                ...filterBtnBaseStyle,
                backgroundColor: recipeBookFilterRarity === rarity ? RARITY_COLORS[rarity] : 'transparent',
                borderColor: recipeBookFilterRarity === rarity ? RARITY_COLORS[rarity] : '#3A3A5C',
                color: recipeBookFilterRarity === rarity ? '#fff' : '#B0B0C0',
              }}
              onClick={() => setRecipeBookFilterRarity(rarity)}
            >
              {RARITY_NAMES[rarity]}
            </button>
          ))}
        </div>

        <div style={filterRowStyle}>
          <span style={filterLabelStyle}>类型</span>
          <select
            style={selectStyle}
            value={recipeBookFilterType}
            onChange={(e) => setRecipeBookFilterType(e.target.value as MaterialType | 'all')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = '#6C63FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = '#3A3A5C'; }}
          >
            <option value="all">全部类型</option>
            {allMaterialTypes.map(type => (
              <option key={type} value={type}>
                {TYPE_NAMES[type]}
              </option>
            ))}
          </select>

          <span style={{ ...filterLabelStyle, marginLeft: isMobile ? 0 : 10 }}>材料</span>
          <select
            style={selectStyle}
            value={recipeBookFilterMaterial}
            onChange={(e) => setRecipeBookFilterMaterial(e.target.value)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = '#6C63FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = '#3A3A5C'; }}
          >
            <option value="all">全部材料</option>
            {availableMaterials.map(mat => (
              <option key={mat.id} value={mat.id}>
                {mat.name} ({RARITY_NAMES[mat.rarity]})
              </option>
            ))}
          </select>

          <span style={{ ...filterLabelStyle, marginLeft: isMobile ? 0 : 10 }}>排序</span>
          <select
            style={selectStyle}
            value={recipeBookSort}
            onChange={(e) => setRecipeBookSort(e.target.value as 'name' | 'rarity' | 'unlockTime')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = '#6C63FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = '#3A3A5C'; }}
          >
            <option value="name">按名称排序</option>
            <option value="rarity">按稀有度从高到低</option>
            <option value="unlockTime">按解锁时间排序</option>
          </select>

          {hasActiveFilters && (
            <button
              style={clearFilterBtnStyle}
              onClick={resetRecipeBookFilters}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FF6B6B';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#FF6B6B';
              }}
            >
              ✕ 清除筛选
            </button>
          )}

          <span style={resultCountStyle}>
            显示 {filteredAndSortedRecipes.length} / {recipes.length} 个配方
          </span>
        </div>
      </div>

      <div style={gridStyle}>
        {filteredAndSortedRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isUnlocked={unlockedRecipes.has(recipe.id)}
            onClick={() => setSelectedRecipe(recipe)}
            isMobile={isMobile}
          />
        ))}
      </div>

      {filteredAndSortedRecipes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#666',
        }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>没有找到匹配的配方</p>
          <p style={{ fontSize: 12 }}>试试调整筛选条件吧</p>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
};

export default RecipeBook;
