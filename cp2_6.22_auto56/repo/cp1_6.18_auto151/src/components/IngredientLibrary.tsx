import React, { useState } from 'react';
import {
  BASES,
  SYRUPS,
  GARNISHES,
  CATEGORY_LABELS,
  type Ingredient,
} from '@/data/ingredients';

interface IngredientLibraryProps {
  onAddIngredient: (ingredient: Ingredient) => void;
}

const CATEGORY_CONFIG: {
  key: 'base' | 'syrup' | 'garnish';
  items: Ingredient[];
  color: string;
}[] = [
  { key: 'base', items: BASES, color: '#D4A574' },
  { key: 'syrup', items: SYRUPS, color: '#A8C0A8' },
  { key: 'garnish', items: GARNISHES, color: '#6B3A2E' },
];

export default function IngredientLibrary({
  onAddIngredient,
}: IngredientLibraryProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    ingredient: Ingredient,
  ) => {
    e.dataTransfer.setData('ingredientId', ingredient.id);
    e.dataTransfer.setData('ingredientType', ingredient.category);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingId(ingredient.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <div className="w-full md:w-[280px] bg-white rounded-xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {CATEGORY_CONFIG.map(({ key, items, color }) => (
        <div key={key} className="mb-5 last:mb-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-display text-sm font-semibold text-coffee-dark">
              {CATEGORY_LABELS[key]}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((ingredient) => (
              <button
                key={ingredient.id}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, ingredient)}
                onDragEnd={handleDragEnd}
                onClick={() => onAddIngredient(ingredient)}
                className={
                  'flex items-center gap-2 px-2 py-1.5 bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#FFF8EE] ' +
                  (draggingId === ingredient.id ? 'opacity-50' : '')
                }
                style={{
                  borderColor: '#D4A574',
                  borderRadius: '8px',
                }}
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: ingredient.color }}
                />
                <span
                  className="text-xs leading-tight truncate"
                  style={{ color: '#3E2723' }}
                >
                  {ingredient.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
