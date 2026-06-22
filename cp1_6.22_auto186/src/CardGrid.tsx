import React from 'react';
import FoodCard from './FoodCard';
import type { FoodItem } from './types';

interface CardGridProps {
  foods: FoodItem[];
  visibleIds: Set<string>;
  onEdit: (food: FoodItem) => void;
  onDelete: (id: string) => void;
}

const CardGrid: React.FC<CardGridProps> = ({ foods, visibleIds, onEdit, onDelete }) => {
  return (
    <div style={styles.grid}>
      {foods.map((food, index) => (
        <FoodCard
          key={food.id}
          food={food}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          isVisible={visibleIds.has(food.id)}
        />
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 240px)',
    gap: '20px',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
};

export default CardGrid;
