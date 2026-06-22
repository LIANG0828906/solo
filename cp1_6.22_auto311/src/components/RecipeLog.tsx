import React, { memo } from 'react';
import type { Recipe, Material } from '../types';
import { RecipeCard } from './RecipeCard';

interface RecipeLogProps {
  recipeHistory: string[];
  recipes: Record<string, Recipe>;
  materials: Record<string, Material>;
  onToggleLock: (recipeId: string) => void;
}

const RecipeLogComponent: React.FC<RecipeLogProps> = ({
  recipeHistory,
  recipes,
  materials,
  onToggleLock,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📜 配方手札</h2>
        <span style={styles.count}>
          {recipeHistory.length} / 20
        </span>
      </div>
      <div style={styles.divider} />
      <div style={styles.scrollArea}>
        {recipeHistory.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>⚗️</div>
            <div style={styles.emptyText}>尚未发现任何配方</div>
            <div style={styles.emptyHint}>尝试将材料拖入炼金台吧</div>
          </div>
        ) : (
          recipeHistory.map((id) => {
            const recipe = recipes[id];
            if (!recipe) return null;
            return (
              <RecipeCard
                key={id}
                recipe={recipe}
                materials={materials}
                onToggleLock={onToggleLock}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 300,
    height: '100%',
    background: 'linear-gradient(180deg, #0f0f1e 0%, #14142b 100%)',
    borderRight: '1px solid #3a3a5a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#ffd54f',
    margin: 0,
    letterSpacing: 1,
  },
  count: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 13,
    color: '#7a7aaa',
    background: '#1e1e3e',
    padding: '3px 10px',
    borderRadius: 12,
    border: '1px solid #3a3a5a',
  },
  divider: {
    height: 1,
    background: '#3a3a5a',
    margin: '0 16px 12px',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 16px 16px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#3a3a5a transparent',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 16px',
    color: '#5a5a7a',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
  },
  emptyHint: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    opacity: 0.8,
  },
};

export const RecipeLog = memo(RecipeLogComponent);
