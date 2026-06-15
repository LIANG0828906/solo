import { Trash2, Minus, Plus } from 'lucide-react';
import type { Ingredient, Category } from '@/types';
import { CategoryEmoji } from '@/types';
import { getDaysRemaining, isExpiringSoon, isCritical } from '@/engine/expiryTracker';

interface IngredientCardProps {
  ingredient: Ingredient;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

const categoryStyles: Record<Category, string> = {
  '蔬菜': 'bg-category-vegetable/20 border-category-vegetable/40 border-l-category-vegetable',
  '水果': 'bg-category-fruit/20 border-category-fruit/40 border-l-category-fruit',
  '肉类': 'bg-category-meat/20 border-category-meat/40 border-l-category-meat',
  '蛋奶': 'bg-category-dairy/60 border-category-dairy border-l-category-dairy',
  '调料': 'bg-category-condiment/20 border-category-condiment/40 border-l-category-condiment',
  '其他': 'bg-cream-200 border-cream-300 border-l-cream-300',
};

function getDaysColor(days: number): string {
  if (days > 7) return 'text-green-600';
  if (days >= 4) return 'text-yellow-500';
  if (days >= 1) return 'text-orange-500';
  return 'text-red-600';
}

export default function IngredientCard({ ingredient, onUpdateQuantity, onRemove }: IngredientCardProps) {
  const days = getDaysRemaining(ingredient.expiryDate);
  const expiring = isExpiringSoon(days);
  const critical = isCritical(days);
  const style = categoryStyles[ingredient.category];
  const emoji = CategoryEmoji[ingredient.category];

  return (
    <div className={`card-flip-container relative h-[120px] ${critical ? 'animate-blink' : ''}`}>
      <div className="card-flip-inner">
        <div className={`card-flip-front flex flex-col justify-between rounded-lg border border-l-[3px] p-3 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${style}`}>
          <div className="flex items-start justify-between">
            <span className="text-xl">{emoji}</span>
            <span className={`text-xs font-medium ${getDaysColor(days)}`}>
              {days > 0 ? `${days}天` : '已过期'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate">{ingredient.name}</p>
            <p className="text-xs text-gray-500">{ingredient.quantity}{ingredient.unit}</p>
          </div>
          {expiring && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-lg bg-gradient-to-r from-expiry-warn to-expiry-danger" />
          )}
        </div>

        <div className={`card-flip-back flex flex-col justify-between rounded-lg border border-l-[3px] p-3 shadow-md ${style}`}>
          <div className="flex items-center justify-between">
            <span className="text-lg">{emoji}</span>
            <span className={`text-xs font-medium ${getDaysColor(days)}`}>
              {days > 0 ? `剩${days}天` : '已过期'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(ingredient.id, ingredient.quantity - 1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm hover:bg-white transition-colors active:scale-90"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[3rem] text-center text-sm font-semibold text-gray-800">
                {ingredient.quantity}{ingredient.unit}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(ingredient.id, ingredient.quantity + 1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm hover:bg-white transition-colors active:scale-90"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(ingredient.id);
            }}
            className="flex items-center justify-center gap-1 rounded-md bg-expiry-danger/15 px-2 py-1 text-xs font-medium text-expiry-danger hover:bg-expiry-danger/25 transition-colors"
          >
            <Trash2 size={12} />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
