import { Snowflake, Refrigerator } from 'lucide-react';
import type { Ingredient, Category } from '@/types';
import { getDaysRemaining } from '@/engine/expiryTracker';
import IngredientCard from '@/components/IngredientCard';

interface StoragePanelProps {
  ingredients: Ingredient[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

const categoryOrder: Record<Category, number> = {
  '蔬菜': 0,
  '水果': 1,
  '蛋奶': 2,
  '调料': 3,
  '其他': 4,
  '肉类': 5,
};

function sortColdZone(items: Ingredient[]): Ingredient[] {
  return [...items].sort((a, b) => {
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (catDiff !== 0) return catDiff;
    return getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate);
  });
}

function sortFreezeZone(items: Ingredient[]): Ingredient[] {
  return [...items].sort(
    (a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate),
  );
}

export default function StoragePanel({ ingredients, onUpdateQuantity, onRemove }: StoragePanelProps) {
  const coldItems = sortColdZone(
    ingredients.filter((i) => i.zone === '冷藏' && i.category !== '肉类'),
  );
  const freezeItems = sortFreezeZone(
    ingredients.filter((i) => i.zone === '冷冻' || i.category === '肉类'),
  );

  return (
    <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-cream-200 bg-cream-100/60">
        <Refrigerator size={20} className="text-blue-400" />
        <h2 className="font-serif text-lg font-semibold text-gray-800">🧊 我的冰箱</h2>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 lg:border-r border-cream-200">
          <div className="px-4 py-3 bg-fridge-cold border-b border-blue-100/60">
            <div className="flex items-center gap-2">
              <Snowflake size={16} className="text-blue-400" />
              <span className="font-medium text-blue-700">❄️ 冷藏区</span>
              <span className="text-xs text-blue-400 ml-1">({coldItems.length})</span>
            </div>
          </div>
          <div className="p-4 min-h-[320px]">
            {coldItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {coldItems.map((item) => (
                  <IngredientCard
                    key={item.id}
                    ingredient={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] rounded-xl border-2 border-dashed border-blue-200/50 bg-fridge-cold/40">
                <span className="text-blue-300 text-sm">暂无食材</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="px-4 py-3 bg-fridge-freeze border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <Refrigerator size={16} className="text-slate-400" />
              <span className="font-medium text-slate-600">🧊 冷冻区</span>
              <span className="text-xs text-slate-400 ml-1">({freezeItems.length})</span>
            </div>
          </div>
          <div className="p-4 min-h-[320px]">
            {freezeItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {freezeItems.map((item) => (
                  <IngredientCard
                    key={item.id}
                    ingredient={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] rounded-xl border-2 border-dashed border-slate-300/50 bg-fridge-freeze/40">
                <span className="text-slate-300 text-sm">暂无食材</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
