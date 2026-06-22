import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRecipeStore } from '../store/useRecipeStore';
import { RecipeCard } from './RecipeCard';
import { calculatePositions } from '../utils/layoutUtils';

export const FoodMap: React.FC = () => {
  const { getFilteredRecipes, hoveredRecipeId, searchText } = useRecipeStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const recipes = getFilteredRecipes();

  useEffect(() => {
    const updateDimensions = () => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const positions = useMemo(
    () => calculatePositions(recipes, dimensions.width, dimensions.height),
    [recipes, dimensions.width, dimensions.height]
  );

  const renderGrid = () => {
    const lines = [];
    const gridSpacing = 60;

    for (let x = gridSpacing; x < dimensions.width; x += gridSpacing) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={dimensions.height}
          stroke="#D2B48C"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.5"
        />
      );
    }
    for (let y = gridSpacing; y < dimensions.height; y += gridSpacing) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={dimensions.width}
          y2={y}
          stroke="#D2B48C"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.5"
        />
      );
    }

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const axisPadding = 40;

    lines.push(
      <line
        key="x-axis"
        x1={axisPadding}
        y1={centerY}
        x2={dimensions.width - axisPadding}
        y2={centerY}
        stroke="#8B6F47"
        strokeWidth="2"
      />,
      <line
        key="y-axis"
        x1={centerX}
        y1={axisPadding}
        x2={centerX}
        y2={dimensions.height - axisPadding}
        stroke="#8B6F47"
        strokeWidth="2"
      />,
      <polygon
        key="x-arrow"
        points={`${dimensions.width - axisPadding},${centerY} ${dimensions.width - axisPadding - 10},${centerY - 6} ${dimensions.width - axisPadding - 10},${centerY + 6}`}
        fill="#8B6F47"
      />,
      <polygon
        key="y-arrow"
        points={`${centerX},${axisPadding} ${centerX - 6},${axisPadding + 10} ${centerX + 6},${axisPadding + 10}`}
        fill="#8B6F47"
      />
    );

    return lines;
  };

  return (
    <div
      ref={mapRef}
      style={{
        position: 'relative',
        flex: 1,
        background: 'var(--color-map-bg)',
        overflow: 'hidden',
        willChange: 'transform',
      }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {renderGrid()}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: dimensions.height / 2 - 8,
          left: 10,
          fontFamily: 'var(--font-handwriting)',
          fontSize: '22px',
          color: '#8B6F47',
          fontWeight: 600,
        }}
      >
        酸
      </div>
      <div
        style={{
          position: 'absolute',
          top: dimensions.height / 2 - 8,
          right: 10,
          fontFamily: 'var(--font-handwriting)',
          fontSize: '22px',
          color: '#8B6F47',
          fontWeight: 600,
        }}
      >
        甜
      </div>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: dimensions.width / 2 - 16,
          fontFamily: 'var(--font-handwriting)',
          fontSize: '22px',
          color: '#8B6F47',
          fontWeight: 600,
        }}
      >
        浓郁
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: dimensions.width / 2 - 16,
          fontFamily: 'var(--font-handwriting)',
          fontSize: '22px',
          color: '#8B6F47',
          fontWeight: 600,
        }}
      >
        清淡
      </div>

      {recipes.map((recipe) => {
        const pos = positions.find((p) => p.recipeId === recipe.id);
        if (!pos) return null;

        return (
          <motion.div
            key={recipe.id}
            animate={{ x: pos.x - 85, y: pos.y - 100 }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            style={{ position: 'absolute' }}
          >
            <RecipeCard
              recipe={recipe}
              isHovered={hoveredRecipeId === recipe.id}
              isDimmed={hoveredRecipeId !== null && hoveredRecipeId !== recipe.id}
              searchText={searchText}
            />
          </motion.div>
        );
      })}

      {recipes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-handwriting)',
            fontSize: '32px',
            color: '#8B6F47',
            textAlign: 'center',
          }}
        >
          <div>🍽️</div>
          <div style={{ marginTop: '12px' }}>暂无匹配的食谱~</div>
          <div style={{ fontSize: '20px', marginTop: '8px', color: '#A0896C' }}>
            试试调整筛选条件或创建新食谱吧
          </div>
        </div>
      )}
    </div>
  );
};
