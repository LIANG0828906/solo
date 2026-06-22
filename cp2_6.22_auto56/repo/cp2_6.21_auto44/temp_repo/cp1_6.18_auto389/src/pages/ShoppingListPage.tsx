import React, { useState } from 'react';
import { useRecipeStore } from '@/store/recipeStore';
import { ShoppingItem } from '@/types';

const CATEGORY_ORDER = ['蔬菜', '肉类', '调味品', '其他'];
const CATEGORY_ICONS: Record<string, string> = {
  蔬菜: '🥬',
  肉类: '🥩',
  调味品: '🧂',
  其他: '📦',
};

interface CategoryGroupProps {
  category: string;
  items: ShoppingItem[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  items,
  onToggle,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(true);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>('1000px');

  React.useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    }
  }, [items, expanded]);

  if (items.length === 0) return null;

  return (
    <div className="shopping-category">
      <div
        className="category-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="category-title">
          <span>{CATEGORY_ICONS[category] || '📦'}</span>
          <span>{category}</span>
          <span className="category-count">{items.length}</span>
        </div>
        <span className={`category-arrow ${expanded ? 'expanded' : ''}`}>▶</span>
      </div>
      <div
        ref={contentRef}
        className={`category-items ${!expanded ? 'collapsed' : ''}`}
        style={{ maxHeight: expanded ? maxHeight : '0px' }}
      >
        {items.map((item) => (
          <div
            key={item.name}
            className={`shopping-item ${item.checked ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              className="shopping-item-checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.name)}
            />
            <div className="shopping-item-content">
              <span className="shopping-item-name">{item.name}</span>
              <span className="shopping-item-quantity">{item.quantity}</span>
            </div>
            <button
              className="btn-icon btn-icon-danger"
              onClick={() => onRemove(item.name)}
              title="删除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShoppingListPage: React.FC = () => {
  const { shoppingList, toggleShoppingItem, clearShoppingList, removeShoppingItem } =
    useRecipeStore();

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    CATEGORY_ORDER.forEach((cat) => (groups[cat] = []));
    shoppingList.forEach((item) => {
      const cat = CATEGORY_ORDER.includes(item.category) ? item.category : '其他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [shoppingList]);

  return (
    <div className="container page-wrapper">
      <h1 className="page-title">🛒 购物清单</h1>

      {shoppingList.length === 0 ? (
        <div className="empty-state">
          🛒 购物清单是空的，快去食谱详情页添加吧！
        </div>
      ) : (
        <>
          {CATEGORY_ORDER.map((category) => (
            <CategoryGroup
              key={category}
              category={category}
              items={groupedItems[category] || []}
              onToggle={toggleShoppingItem}
              onRemove={removeShoppingItem}
            />
          ))}

          <div className="action-bar">
            <button className="btn btn-danger" onClick={clearShoppingList}>
              清空清单
            </button>
          </div>
        </>
      )}
    </div>
  );
};
