import React from 'react';
import { Drink, TagType } from '@/stores/menuStore';
import { Ingredient } from '@/data/ingredients';
import { buildLayers, generateCupThumbnail } from '@/renderer/cupRenderer';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';

interface DrinkCardProps {
  drink: Drink;
  onEdit: (drink: Drink) => void;
  onDelete: (drinkId: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  index: number;
}

const tagConfig: Record<TagType, { label: string; className: string }> = {
  recommended: { label: '店主推荐', className: 'bg-tag-red text-white' },
  limited: { label: '限量', className: 'bg-tag-red text-white' },
  popular: { label: '人气爆款', className: 'bg-tag-green text-white' },
};

const DrinkCard: React.FC<DrinkCardProps> = ({
  drink,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  index,
}) => {
  const thumbnail = generateCupThumbnail(
    buildLayers(drink.base, drink.syrups, drink.foamLevel, drink.garnishes)
  );

  return (
    <div
      className="bg-white rounded-xl p-3 card-shadow flex items-center gap-3 hover:shadow-card transition-shadow duration-200"
    >
      <div
        draggable="true"
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        className="cursor-grab text-coffee-light"
      >
        <GripVertical size={18} />
      </div>

      <img
        src={thumbnail}
        alt={drink.name}
        className="w-12 h-[72px] rounded-lg object-cover"
      />

      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-coffee-dark truncate">
          {drink.name}
        </div>
        <div className="text-sm text-coffee-light">
          ¥{drink.price}
        </div>
        {drink.tags && drink.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {drink.tags.map((tag) => {
              const config = tagConfig[tag];
              if (!config) return null;
              return (
                <span
                  key={tag}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${config.className}`}
                >
                  {config.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onEdit(drink)}
          className="text-coffee-mid hover:text-coffee-dark cursor-pointer"
        >
          <Edit2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(drink.id)}
          className="text-coffee-mid hover:text-tag-red cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default DrinkCard;
