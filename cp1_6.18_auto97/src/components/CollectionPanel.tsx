import { useState, useRef } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { useRecipeStore, type FavoriteRecipe } from '../stores/recipeStore';
import { StarRating } from './StarRating';

interface CollectionPanelProps {
  recipeId: string;
}

export function CollectionPanel({ recipeId }: CollectionPanelProps) {
  const favorites = useRecipeStore((state) => state.favorites);
  const reorderFavorites = useRecipeStore((state) => state.reorderFavorites);
  const toggleFavorite = useRecipeStore((state) => state.toggleFavorite);
  const updateRating = useRecipeStore((state) => state.updateRating);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartTime = useRef<number>(0);

  const sortedFavorites = [...favorites].sort((a, b) => a.order - b.order);
  const currentIndex = sortedFavorites.findIndex((f) => f.recipeId === recipeId);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragStartTime.current = performance.now();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const elapsed = performance.now() - dragStartTime.current;
      if (elapsed < 100) {
        requestAnimationFrame(() => {
          reorderFavorites(draggedIndex, dragOverIndex);
        });
      } else {
        reorderFavorites(draggedIndex, dragOverIndex);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemove = (recipeIdToRemove: string) => {
    toggleFavorite(recipeIdToRemove);
  };

  if (sortedFavorites.length === 0) {
    return (
      <div className="text-center py-6 rounded-xl" style={{ backgroundColor: '#FFF7ED' }}>
        <p className="text-sm" style={{ color: '#B8A48C' }}>
          还没有收藏的菜谱
        </p>
        <p className="text-xs mt-1" style={{ color: '#CCBBA8' }}>
          点击爱心收藏你喜欢的节气美食
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: '#FFF7ED',
        borderRadius: '16px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: '#6B5344' }}>
          我的收藏 ({sortedFavorites.length})
        </p>
        <p className="text-xs" style={{ color: '#B8A48C' }}>
          拖拽排序
        </p>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {sortedFavorites.map((fav: FavoriteRecipe, index: number) => (
          <div
            key={fav.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={() => setDragOverIndex(null)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : ''
            } ${dragOverIndex === index && draggedIndex !== index ? 'transform scale-105' : ''}`}
            style={{
              backgroundColor: dragOverIndex === index ? 'rgba(229,107,93,0.1)' : '#FFFAF5',
              border: fav.recipeId === recipeId ? '1px solid #E56B5D' : '1px solid transparent',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
          >
            <GripVertical size={16} style={{ color: '#D4C9B8' }} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#F5EDE3', color: '#8B7355' }}
                >
                  {fav.solarTerm}
                </span>
              </div>
              <p
                className="text-sm font-medium truncate"
                style={{ color: '#5D4E37', fontFamily: '"Noto Serif SC", serif' }}
              >
                {fav.dishName}
              </p>
              <div className="mt-1">
                <StarRating rating={fav.rating} size={12} readonly />
              </div>
            </div>

            <button
              onClick={() => handleRemove(fav.recipeId)}
              className="p-1.5 rounded-full transition-colors hover:bg-red-50"
              style={{ color: '#CCBBA8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E56B5D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#CCBBA8';
              }}
              aria-label="移除收藏"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      
      {currentIndex >= 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E8DDD0' }}>
          <p className="text-xs mb-2" style={{ color: '#B8A48C' }}>
            调整这道菜的评分
          </p>
          <StarRating
            rating={sortedFavorites[currentIndex]?.rating || 0}
            onChange={(rating) => updateRating(recipeId, rating)}
            size={20}
          />
        </div>
      )}
    </div>
  );
}
