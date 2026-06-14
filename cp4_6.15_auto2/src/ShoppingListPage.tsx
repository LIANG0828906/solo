import { useEffect } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { useStore } from './store';
import { CATEGORY_LABELS } from './data';
import type { Ingredient } from './data';

export default function ShoppingListPage() {
  const shoppingItems = useStore((s) => s.shoppingItems);
  const selectedRecipes = useStore((s) => s.selectedRecipes);
  const toggleShoppingItem = useStore((s) => s.toggleShoppingItem);
  const computeShoppingList = useStore((s) => s.computeShoppingList);

  useEffect(() => {
    computeShoppingList();
  }, [selectedRecipes, computeShoppingList]);

  const groupedItems = shoppingItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof shoppingItems>
  );

  const categoryOrder: Ingredient['category'][] = [
    'vegetables',
    'meat',
    'seasoning',
    'staple',
    'dairy',
    'fruit',
  ];

  const checkedCount = shoppingItems.filter((i) => i.checked).length;
  const totalCount = shoppingItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <div className="shopping-list-page">
      <div className="page-header">
        <h1 className="page-title">购物清单</h1>
        <p className="page-subtitle">汇总所有食谱的缺失食材</p>
      </div>

      {selectedRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p>暂无购物清单</p>
          <p className="empty-hint">在推荐页选择食谱后自动生成</p>
        </div>
      ) : shoppingItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>食材充足！</p>
          <p className="empty-hint">已有食材覆盖了所有食谱需求</p>
        </div>
      ) : (
        <>
          <div className="shopping-progress">
            <div className="progress-header">
              <span>采购进度</span>
              <span>
                {checkedCount} / {totalCount}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="selected-recipes-summary">
            <ShoppingBag size={14} />
            <span>
              来自：{selectedRecipes.map((r) => r.name).join('、')}
            </span>
          </div>

          {categoryOrder.map((category) => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;
            return (
              <div key={category} className="shopping-category">
                <h3 className="category-title">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="shopping-items">
                  {items.map((item) => (
                    <div
                      key={item.ingredientId}
                      className={`shopping-item ${item.checked ? 'shopping-item-checked' : ''}`}
                    >
                      <button
                        className={`checkbox ${item.checked ? 'checkbox-checked' : ''}`}
                        onClick={() => toggleShoppingItem(item.ingredientId)}
                      >
                        {item.checked && <Check size={12} />}
                      </button>
                      <span className="shopping-item-name">{item.name}</span>
                      <span className="shopping-item-quantity">
                        {item.quantity}
                        {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
