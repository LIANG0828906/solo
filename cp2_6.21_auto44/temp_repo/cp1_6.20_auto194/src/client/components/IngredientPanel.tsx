import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import type { ShoppingListItem } from '../../shared/types';
import { CATEGORY_LABELS, type CategoryKey } from '../../shared/types';
import { apiService } from '../services/apiService';

interface IngredientPanelProps {
  recipeIds: string[];
  onClose?: () => void;
}

export const IngredientPanel = ({ recipeIds, onClose }: IngredientPanelProps) => {
  const [shoppingList, setShoppingList] = useState<{ [category: string]: ShoppingListItem[] }>({});
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (recipeIds.length === 0) return;
    setLoading(true);
    try {
      const { shoppingList } = await apiService.generateShoppingList(recipeIds);
      setShoppingList(shoppingList);
      setGenerated(true);
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePurchased = (category: string, index: number) => {
    const updated = { ...shoppingList };
    updated[category] = [...updated[category]];
    const item = { ...updated[category][index] };
    item.isPurchased = !item.isPurchased;
    updated[category][index] = item;
    setShoppingList(updated);
  };

  const adjustQuantity = (category: string, index: number, delta: number) => {
    const updated = { ...shoppingList };
    updated[category] = [...updated[category]];
    const item = { ...updated[category][index] };
    item.totalQuantity = Math.max(0, item.totalQuantity + delta);
    updated[category][index] = item;
    setShoppingList(updated);
  };

  if (!generated) {
    return (
      <div className="card p-6 text-center">
        <ShoppingCart size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
        <p className="mb-4 text-lg">已选择 {recipeIds.length} 个食谱</p>
        <button
          className="btn btn-primary w-full"
          onClick={handleGenerate}
          disabled={loading || recipeIds.length === 0}
        >
          {loading ? '生成中...' : '生成购物清单'}
        </button>
        {onClose && (
          <button className="btn btn-outline w-full mt-3" onClick={onClose}>
            继续选择
          </button>
        )}
      </div>
    );
  }

  const categories = Object.keys(shoppingList).filter(cat => shoppingList[cat].length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        购物清单
      </h2>
      <div className="shopping-list-grid">
        {categories.map(category => (
          <div key={category} className="card p-5">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ borderColor: 'var(--primary)', color: 'var(--text)' }}>
              {CATEGORY_LABELS[category as CategoryKey] || category}
            </h3>
            <ul className="space-y-3">
              {shoppingList[category].map((item, index) => (
                <li
                  key={item.ingredientId}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    item.isPurchased ? 'fade-out-left purchased bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={item.isPurchased}
                      onChange={() => togglePurchased(category, index)}
                      className="w-5 h-5 rounded cursor-pointer"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="flex-1">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() => adjustQuantity(category, index, -1)}
                      disabled={item.totalQuantity <= 0}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-16 text-center font-medium">
                      {item.totalQuantity} {item.unit}
                    </span>
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() => adjustQuantity(category, index, 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {categories.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>
          购物清单为空
        </div>
      )}
    </div>
  );
};
