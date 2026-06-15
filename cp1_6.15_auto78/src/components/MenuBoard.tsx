import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { MenuItem as MenuItemType } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface MenuBoardProps {
  menuItems: MenuItemType[];
}

type Category = 'iced' | 'hot' | 'light';

const categories: { key: Category; label: string }[] = [
  { key: 'iced', label: '冰饮' },
  { key: 'hot', label: '热饮' },
  { key: 'light', label: '轻食' },
];

export default function MenuBoard({ menuItems }: MenuBoardProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('iced');
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const itemsByCategory = categories.map((cat) => ({
    category: cat.key,
    items: menuItems.filter((item) => item.category === cat.key),
  }));

  const handleAddToCart = (item: MenuItemType, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item);
  };

  const currentIndex = categories.findIndex((c) => c.key === activeCategory);

  return (
    <div>
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="menu-container">
        <div
          className="menu-grid-wrapper"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {itemsByCategory.map(({ category, items }) => (
            <div key={category} className="menu-grid">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="menu-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => handleAddToCart(item, e)}
                    aria-label={`添加${item.name}到购物车`}
                  >
                    <Plus size={18} />
                  </button>
                  <div className="menu-card-image">
                    <img src={item.image_url} alt={item.name} loading="lazy" />
                  </div>
                  <div className="menu-card-info">
                    <h3 className="menu-card-name">{item.name}</h3>
                    <p className="menu-card-price">¥{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setSelectedItem(null)}
              aria-label="关闭"
            >
              <X size={20} />
            </button>
            <div className="modal-image">
              <img src={selectedItem.image_url} alt={selectedItem.name} />
            </div>
            <div className="modal-body">
              <h2 className="modal-title">{selectedItem.name}</h2>
              <p className="modal-price">¥{selectedItem.price}</p>
              <p className="modal-description">{selectedItem.description}</p>
              <div className="modal-actions">
                <button
                  className="modal-add-btn"
                  onClick={() => {
                    addItem(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
