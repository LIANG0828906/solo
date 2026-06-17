import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Rarity, Recipe } from '../../types';
import { easeTransition } from './AnimationManager';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#A0A0A0',
  rare: '#4A90D9',
  epic: '#9B59B6',
  legendary: '#F1C40F',
};

const RARITY_NAMES: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isMobile?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardWidth = isMobile ? 130 : 140;
  const cardHeight = isMobile ? 170 : 180;

  const cardStyle: React.CSSProperties = {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 12,
    backgroundColor: '#2D2D44',
    border: `2px solid ${RARITY_COLORS[recipe.rarity]}`,
    boxShadow: isHovered && recipe.unlocked
      ? `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${RARITY_COLORS[recipe.rarity]}50`
      : '0 2px 8px rgba(0,0,0,0.3)',
    transform: isHovered && recipe.unlocked ? 'translateY(-4px)' : 'translateY(0)',
    cursor: recipe.unlocked ? 'pointer' : 'default',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    ...easeTransition(['transform', 'box-shadow']),
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: 48,
    lineHeight: 1,
    filter: recipe.unlocked ? 'none' : 'grayscale(1) opacity(0.3)',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: recipe.unlocked ? '#FFFFFF' : '#4A4A6A',
  };

  const rarityTagStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: RARITY_COLORS[recipe.rarity] + '80',
    borderRadius: 10,
  };

  const lockedMaskStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  };

  const questionMarkStyle: React.CSSProperties = {
    fontSize: 64,
    color: '#3A3A5C',
    fontWeight: 700,
  };

  return (
    <div
      style={cardStyle}
      onClick={recipe.unlocked ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={rarityTagStyle}>{RARITY_NAMES[recipe.rarity]}</span>
      <span style={emojiStyle}>{recipe.unlocked ? recipe.emoji : recipe.emoji}</span>
      <span style={nameStyle}>{recipe.unlocked ? recipe.name : '???'}</span>
      {!recipe.unlocked && (
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
  const { getMaterial } = useGameStore();

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
    maxWidth: 360,
    backgroundColor: '#1E1E32',
    borderRadius: 16,
    padding: 24,
    boxShadow: `0 0 40px ${RARITY_COLORS[recipe.rarity]}40, 0 16px 48px rgba(0,0,0,0.5)`,
    border: `2px solid ${RARITY_COLORS[recipe.rarity]}`,
    animation: 'scaleIn 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: 56,
    lineHeight: 1,
  };

  const titleSectionStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
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
    backgroundColor: RARITY_COLORS[recipe.rarity],
    borderRadius: 12,
    width: 'fit-content',
  };

  const descStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#888888',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const ingredientsListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
  };

  const ingredientRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
  };

  const ingEmojiStyle: React.CSSProperties = {
    fontSize: 24,
  };

  const ingNameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 14,
    color: '#E0E0E0',
  };

  const ingCountStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: RARITY_COLORS[recipe.rarity],
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
            <span style={emojiStyle}>{recipe.emoji}</span>
            <div style={titleSectionStyle}>
              <h2 style={titleStyle}>{recipe.name}</h2>
              <span style={rarityBadgeStyle}>{RARITY_NAMES[recipe.rarity]}</span>
            </div>
          </div>
          <p style={descStyle}>{recipe.description}</p>
          <h3 style={sectionTitleStyle}>合成材料</h3>
          <div style={ingredientsListStyle}>
            {recipe.ingredients.map((ing, idx) => {
              const material = getMaterial(ing.materialId);
              return (
                <div key={idx} style={ingredientRowStyle}>
                  <span style={ingEmojiStyle}>{material?.emoji || '?'}</span>
                  <span style={ingNameStyle}>{material?.name || '未知材料'}</span>
                  <span style={ingCountStyle}>× {ing.count}</span>
                </div>
              );
            })}
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
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
  const { recipes } = useGameStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const unlockedCount = recipes.filter((r) => r.unlocked).length;

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0F0F1A',
    padding: isMobile ? 16 : 24,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    maxWidth: 1000,
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? 20 : 28,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)',
    gap: isMobile ? 10 : 16,
    maxWidth: 1000,
    margin: '0 auto',
    justifyItems: 'center',
  };

  const leftHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={leftHeaderStyle}>
          <h1 style={titleStyle}>📖 炼金图鉴</h1>
          <span style={subtitleStyle}>
            已解锁 {unlockedCount} / {recipes.length}
          </span>
        </div>
        {onNavigate && (
          <button style={backBtnStyle} onClick={() => onNavigate('game')}>
            ← 返回实验室
          </button>
        )}
      </div>
      <div style={gridStyle}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => setSelectedRecipe(recipe)}
            isMobile={isMobile}
          />
        ))}
      </div>
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
