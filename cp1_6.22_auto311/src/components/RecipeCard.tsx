import React, { memo } from 'react';
import type { Recipe, Material } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  materials: Record<string, Material>;
  onToggleLock: (recipeId: string) => void;
}

const RecipeCardComponent: React.FC<RecipeCardProps> = ({ recipe, materials, onToggleLock }) => {
  const inputA = materials[recipe.input[0]];
  const inputB = materials[recipe.input[1]];
  const output = materials[recipe.output];

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.emojiRow}>
          <span style={styles.emoji}>{inputA?.emoji || '?'}</span>
          <span style={styles.plus}>+</span>
          <span style={styles.emoji}>{inputB?.emoji || '?'}</span>
          <span style={styles.arrow}>→</span>
          <span style={{ ...styles.emoji, color: '#ffd54f' }}>{output?.emoji || '?'}</span>
        </div>
        <button
          style={{
            ...styles.lockBtn,
            color: recipe.isLocked ? '#ffd54f' : '#5a5a7a',
          }}
          onClick={() => onToggleLock(recipe.id)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          title={recipe.isLocked ? '解锁配方' : '锁定配方（永不被覆盖）'}
        >
          {recipe.isLocked ? '★' : '☆'}
        </button>
      </div>
      <div style={styles.name}>{recipe.name}</div>
      <div style={styles.desc}>{recipe.description}</div>
      {recipe.isNewDiscovery && <div style={styles.newBadge}>新发现！</div>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: 220,
    background: '#1e1e2e',
    border: '1px solid #4a4a6a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
    cursor: 'default',
    position: 'relative',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emojiRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 18,
  },
  emoji: {
    display: 'inline-block',
    fontSize: 22,
  },
  plus: {
    color: '#7a7aaa',
    fontSize: 14,
    fontWeight: 600,
  },
  arrow: {
    color: '#ffd54f',
    fontSize: 14,
    fontWeight: 700,
    margin: '0 2px',
  },
  lockBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    padding: 0,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease-out, color 0.3s',
  },
  name: {
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#ffd54f',
    marginBottom: 4,
  },
  desc: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#b8b8d0',
    lineHeight: 1.4,
  },
  newBadge: {
    marginTop: 8,
    display: 'inline-block',
    background: '#2e7d32',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    letterSpacing: 0.5,
  },
};

export const RecipeCard = memo(RecipeCardComponent);
