import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ShoppingListItem } from '../../shared/types';
import { CATEGORY_LABELS, type CategoryKey } from '../../shared/types';
import { apiService } from '../services/apiService';
import { recipeService } from '../services/recipeService';

interface ShoppingListPageProps {
  selectedRecipes: string[];
}

export const ShoppingListPage = ({ selectedRecipes }: ShoppingListPageProps) => {
  const navigate = useNavigate();
  const [shoppingList, setShoppingList] = useState<{ [category: string]: ShoppingListItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);

  const pendingIds = recipeService.getSelectedRecipeIds();
  const hasPending = pendingIds.length > 0;

  useEffect(() => {
    const loadShoppingList = async () => {
      if (hasPending) {
        setLoading(true);
        try {
          const { shoppingList } = await apiService.generateShoppingList(pendingIds);
          setShoppingList(shoppingList);
          setGenerated(true);
          recipeService.clearSelectedRecipes();
          recipeService.setShoppingList(shoppingList);
        } catch (error) {
          console.error('Failed to generate shopping list:', error);
        } finally {
          setLoading(false);
        }
      } else {
        const cached = recipeService.getShoppingList();
        if (Object.keys(cached).length > 0) {
          setShoppingList(cached);
          setGenerated(true);
        }
        setLoading(false);
      }
    };
    loadShoppingList();
  }, [hasPending, pendingIds]);

  const togglePurchased = (category: string, index: number) => {
    const updated = { ...shoppingList };
    updated[category] = [...updated[category]];
    const item = { ...updated[category][index] };
    item.isPurchased = !item.isPurchased;
    updated[category][index] = item;
    setShoppingList(updated);
    recipeService.setShoppingList(updated);
  };

  const adjustQuantity = (category: string, index: number, delta: number) => {
    const updated = { ...shoppingList };
    updated[category] = [...updated[category]];
    const item = { ...updated[category][index] };
    item.totalQuantity = Math.max(0, item.totalQuantity + delta);
    updated[category][index] = item;
    setShoppingList(updated);
    recipeService.setShoppingList(updated);
  };

  const handleGenerateFromSelected = async () => {
    if (selectedRecipes.length === 0) return;
    setLoading(true);
    try {
      const { shoppingList } = await apiService.generateShoppingList(selectedRecipes);
      setShoppingList(shoppingList);
      setGenerated(true);
      recipeService.setShoppingList(shoppingList);
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(shoppingList).filter(cat => shoppingList[cat].length > 0);

  const totalItems = categories.reduce((sum, cat) => sum + shoppingList[cat].length, 0);
  const purchasedItems = categories.reduce(
    (sum, cat) => sum + shoppingList[cat].filter(item => item.isPurchased).length,
    0
  );

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            className="btn mb-4"
            style={{ backgroundColor: 'white', boxShadow: 'var(--card-shadow)' }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} className="mr-2" />
            返回
          </button>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text)' }}>
            <ShoppingCart size={32} style={{ color: 'var(--secondary)' }} />
            购物清单
          </h1>
          {generated && (
            <p className="text-lg" style={{ color: 'var(--text-light)' }}>
              共 {totalItems} 项食材，已购买 {purchasedItems} 项
            </p>
          )}
        </div>

        {loading ? (
          <div className="shopping-list-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/2" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !generated ? (
          <div className="card p-8 text-center">
            <ShoppingCart size={64} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              还没有购物清单
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-light)' }}>
              去首页选择食谱，然后生成购物清单吧
            </p>
            {selectedRecipes.length > 0 && (
              <div className="mb-4">
                <p className="mb-2">已选择 {selectedRecipes.length} 个食谱</p>
                <button className="btn btn-primary" onClick={handleGenerateFromSelected}>
                  生成购物清单
                </button>
              </div>
            )}
            <button className="btn btn-outline" onClick={() => navigate('/')}>
              浏览食谱
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-light)' }}>
            <p className="text-xl">购物清单为空</p>
          </div>
        ) : (
          <div className="shopping-list-grid">
            {categories.map(category => (
              <div key={category} className="card p-5">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ borderColor: 'var(--primary)', color: 'var(--text)' }}>
                  {CATEGORY_LABELS[category as CategoryKey] || category}
                  <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-light)' }}>
                    ({shoppingList[category].filter(i => !i.isPurchased).length}/{shoppingList[category].length})
                  </span>
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
                          className="w-5 h-5 rounded cursor-pointer flex-shrink-0"
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{item.name}</span>
                          {item.fromRecipes.length > 0 && (
                            <span className="text-xs block truncate" style={{ color: 'var(--text-light)' }}>
                              来自: {item.fromRecipes.join('、')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          className="p-1 rounded hover:bg-gray-100"
                          onClick={() => adjustQuantity(category, index, -1)}
                          disabled={item.totalQuantity <= 0}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-14 text-center font-medium text-sm">
                          {item.totalQuantity} {item.unit}
                        </span>
                        <button
                          className="p-1 rounded hover:bg-gray-100"
                          onClick={() => adjustQuantity(category, index, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
