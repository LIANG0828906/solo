import React, { useState, useCallback } from 'react';
import { Ingredient, CATEGORY_LABELS, ALL_INGREDIENTS, getIngredientById } from '@/data/ingredients';
import CupPreview from '@/components/CupPreview';

interface AssemblyAreaProps {
  base: Ingredient | null;
  syrups: Ingredient[];
  foamLevel: number;
  garnishes: Ingredient[];
  onSetBase: (base: Ingredient | null) => void;
  onAddSyrup: (syrup: Ingredient) => void;
  onRemoveSyrup: (index: number) => void;
  onSetFoamLevel: (level: number) => void;
  onAddGarnish: (garnish: Ingredient) => void;
  onRemoveGarnish: (index: number) => void;
  onClearAll: () => void;
}

const AssemblyArea: React.FC<AssemblyAreaProps> = ({
  base,
  syrups,
  foamLevel,
  garnishes,
  onSetBase,
  onAddSyrup,
  onRemoveSyrup,
  onSetFoamLevel,
  onAddGarnish,
  onRemoveGarnish,
  onClearAll,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const hasIngredients = base !== null || syrups.length > 0 || garnishes.length > 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const ingredientId = e.dataTransfer.getData('ingredientId');
      const ingredient = getIngredientById(ingredientId);
      if (!ingredient) return;

      switch (ingredient.category) {
        case 'base':
          onSetBase(ingredient);
          break;
        case 'syrup':
          onAddSyrup(ingredient);
          break;
        case 'garnish':
          onAddGarnish(ingredient);
          break;
      }
    },
    [onSetBase, onAddSyrup, onAddGarnish],
  );

  return (
    <div className="flex-1 w-full flex flex-col gap-4">
      <div
        className="min-h-[200px] rounded-xl p-4"
        style={{
          border: '2px dashed #D4A574',
          background: dragActive ? '#F5EBD9' : '#FFF8EE',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!hasIngredients ? (
          <p
            className="font-body italic text-center"
            style={{ color: '#D4A574' }}
          >
            拖拽配料到这里开始组合配方
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {base && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white" style={{ border: `1px solid ${base.color}` }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: base.color }} />
                  {base.name}
                  <button
                    className="ml-1 cursor-pointer border-none bg-transparent"
                    style={{ color: '#8B7355' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E74C3C')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#8B7355')}
                    onClick={() => onSetBase(null)}
                  >
                    ×
                  </button>
                </span>
              </div>
            )}

            {syrups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {syrups.map((syrup, index) => (
                  <span
                    key={`${syrup.id}-${index}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white"
                    style={{ border: `1px solid ${syrup.color}` }}
                  >
                    <span className="w-2 h-2 rounded-sm" style={{ background: syrup.color }} />
                    {syrup.name}
                    <button
                      className="ml-1 cursor-pointer border-none bg-transparent"
                      style={{ color: '#8B7355' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#E74C3C')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8B7355')}
                      onClick={() => onRemoveSyrup(index)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#8B7355' }}>
                奶泡厚度 {foamLevel}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={foamLevel}
                onChange={(e) => onSetFoamLevel(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #D4A574 ${foamLevel}%, #F0E6D3 ${foamLevel}%)`,
                }}
              />
            </div>

            {garnishes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {garnishes.map((garnish, index) => (
                  <span
                    key={`${garnish.id}-${index}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white"
                    style={{ border: `1px solid ${garnish.color}` }}
                  >
                    <span className="w-2 h-2 rounded-sm" style={{ background: garnish.color }} />
                    {garnish.name}
                    <button
                      className="ml-1 cursor-pointer border-none bg-transparent"
                      style={{ color: '#8B7355' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#E74C3C')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8B7355')}
                      onClick={() => onRemoveGarnish(index)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="text-right">
              <button
                className="text-xs cursor-pointer border-none bg-transparent"
                style={{ color: '#8B7355' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E74C3C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8B7355')}
                onClick={onClearAll}
              >
                清空
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <CupPreview
          base={base}
          syrups={syrups}
          foamLevel={foamLevel}
          garnishes={garnishes}
        />
      </div>
    </div>
  );
};

export default AssemblyArea;
