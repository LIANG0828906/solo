import { useState, useRef, useEffect } from 'react';
import { MenuItem, MenuCategory, BookingItem } from '../../types';
import { useMenuStore } from '../store/menuStore';

interface MenuPageProps {
  onGoToBooking: () => void;
}

const CATEGORY_INFO: Record<MenuCategory, { label: string; emoji: string }> = {
  appetizer: { label: '前菜', emoji: '🥗' },
  main: { label: '主菜', emoji: '🍽️' },
  dessert: { label: '甜点', emoji: '🍰' },
  drink: { label: '饮品', emoji: '☕' },
};

const CATEGORY_ORDER: MenuCategory[] = ['appetizer', 'main', 'dessert', 'drink'];

function DishCard({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const percentage = Math.round((item.remaining / item.dailyLimit) * 100);
  const isLow = item.remaining < 5;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = item.imageUrl;
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [item.imageUrl]);

  return (
    <div className="dish-card" onClick={() => onSelect(item)}>
      <img
        ref={imgRef}
        className="dish-image"
        alt={item.name}
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 300ms ease' }}
        loading="lazy"
      />
      <div className="dish-content">
        <div className="dish-header">
          <h3 className="dish-name">{item.name}</h3>
          <span className="dish-price">¥{item.price}</span>
        </div>
        <p className="dish-desc">{item.description}</p>
        <div className="progress-container">
          <div className="progress-label">
            <span>今日剩余</span>
            <span>
              {item.remaining}/{item.dailyLimit} 份
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${isLow ? 'low' : ''}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DishModal({
  item,
  onClose,
  onAddToCart,
}: {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (bookingItem: BookingItem) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) => {
      if (prev.includes(topping)) {
        return prev.filter((t) => t !== topping);
      }
      if (prev.length >= 3) return prev;
      return [...prev, topping];
    });
  };

  const handleAdd = () => {
    onAddToCart({
      menuItemId: item.id,
      menuItemName: item.name,
      quantity,
      selectedToppings,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={item.imageUrl}
          alt={item.name}
          className="modal-image"
          loading="lazy"
        />
        <div className="modal-body">
          <h2 className="modal-title">{item.name}</h2>
          <div className="modal-price">¥{item.price}</div>
          <p className="modal-description">{item.description}</p>

          {item.optionalToppings.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">可选配料（最多3种）</div>
              <div className="topping-options">
                {item.optionalToppings.map((topping) => (
                  <button
                    key={topping}
                    className={`topping-tag ${
                      selectedToppings.includes(topping) ? 'selected' : ''
                    }`}
                    onClick={() => toggleTopping(topping)}
                  >
                    {topping}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">数量</div>
            <div className="quantity-control">
              <button
                className="quantity-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button
                className="quantity-btn"
                onClick={() =>
                  setQuantity((q) => Math.min(item.remaining, q + 1))
                }
              >
                +
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={item.remaining === 0}
            >
              加入预订 · ¥{item.price * quantity}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  items,
  onSelectDish,
}: {
  category: MenuCategory;
  items: MenuItem[];
  onSelectDish: (item: MenuItem) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>('none');

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(collapsed ? '0px' : `${contentRef.current.scrollHeight}px`);
    }
  }, [collapsed, items.length]);

  const info = CATEGORY_INFO[category];

  return (
    <section className="category-section">
      <div
        className="category-header"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{info.emoji}</span>
          <h2 className="category-title">{info.label}</h2>
          <span className="category-count">({items.length} 道)</span>
        </div>
        <span className={`category-toggle ${collapsed ? 'collapsed' : ''}`}>
          ▾
        </span>
      </div>
      <div
        className="category-content"
        style={{ maxHeight }}
      >
        <div ref={contentRef}>
          <div className="menu-grid" style={{ paddingTop: collapsed ? 0 : 0 }}>
            {items.map((item) => (
              <DishCard key={item.id} item={item} onSelect={onSelectDish} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MenuPage({ onGoToBooking }: MenuPageProps) {
  const menuItems = useMenuStore((state) => state.menuItems);
  const addBookingItem = useMenuStore((state) => state.addBookingItem);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  const groupedItems = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = menuItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<MenuCategory, MenuItem[]>);

  const handleAddToCart = (bookingItem: BookingItem) => {
    addBookingItem(bookingItem);
  };

  return (
    <div className="menu-page">
      <div
        style={{
          textAlign: 'center',
          marginBottom: 48,
          padding: '32px 0',
        }}
      >
        <h1 style={{ fontSize: 42, marginBottom: 8, color: 'var(--color-terracotta)' }}>
          今日菜单
        </h1>
        <p style={{ color: 'var(--color-gray)', fontSize: 16 }}>
          新鲜食材 · 当日现做 · 限量供应
        </p>
      </div>

      {CATEGORY_ORDER.map(
        (cat) =>
          groupedItems[cat].length > 0 && (
            <CategorySection
              key={cat}
              category={cat}
              items={groupedItems[cat]}
              onSelectDish={setSelectedDish}
            />
          )
      )}

      {selectedDish && (
        <DishModal
          item={selectedDish}
          onClose={() => setSelectedDish(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

export default MenuPage;
