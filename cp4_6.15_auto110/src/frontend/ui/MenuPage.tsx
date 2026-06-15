import { useState, useRef, useEffect, useCallback } from 'react';
import { MenuItem, MenuCategory, BookingItem } from '../../types';
import { useMenuStore } from '../store/menuStore';
import { fetchMenuItems } from '../api/menuApi';

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

function useCountUp(target: number, duration: number = 600) {
  const [current, setCurrent] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + (end - start) * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        prevRef.current = end;
      }
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  return Math.round(current);
}

function RemainingBar({ remaining, dailyLimit }: { remaining: number; dailyLimit: number }) {
  const percentage = dailyLimit > 0 ? Math.round((remaining / dailyLimit) * 100) : 0;
  const isLow = remaining < 5;
  const animatedPercent = useCountUp(percentage, 500);

  return (
    <div className="progress-container">
      <div className="progress-label">
        <span>剩余份数</span>
        <span className={isLow ? 'progress-low-text' : ''}>
          {remaining}/{dailyLimit} 份 ({animatedPercent}%)
        </span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${isLow ? 'low' : ''}`}
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
      {isLow && (
        <div className="progress-warning">
          ⚠️ 份数紧张，建议尽快预订
        </div>
      )}
    </div>
  );
}

function DishCard({
  item,
  onSelect,
  index,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  index: number;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current && !imgRef.current.src) {
          imgRef.current.src = item.imageUrl;
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [item.imageUrl]);

  return (
    <div
      className={`dish-card ${visible ? 'dish-card-visible' : 'dish-card-hidden'}`}
      onClick={() => onSelect(item)}
    >
      <img
        ref={imgRef}
        className="dish-image"
        alt={item.name}
        data-src={item.imageUrl}
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
        <RemainingBar remaining={item.remaining} dailyLimit={item.dailyLimit} />
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

  const percentage = item.dailyLimit > 0 ? Math.round((item.remaining / item.dailyLimit) * 100) : 0;
  const isLow = item.remaining < 5;

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

          <div className="modal-section">
            <div className="modal-section-title">剩余份数</div>
            <RemainingBar remaining={item.remaining} dailyLimit={item.dailyLimit} />
          </div>

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
          <div className="menu-grid">
            {items.map((item, index) => (
              <DishCard
                key={item.id}
                item={item}
                onSelect={onSelectDish}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MenuPage({ onGoToBooking }: MenuPageProps) {
  const menuItems = useMenuStore((state) => state.menuItems);
  const selectedBookingItems = useMenuStore((state) => state.selectedBookingItems);
  const addBookingItem = useMenuStore((state) => state.addBookingItem);
  const setMenuItems = useMenuStore((state) => state.setMenuItems);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  const loadMenu = useCallback(async () => {
    try {
      const items = await fetchMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error('刷新菜单失败:', err);
    }
  }, [setMenuItems]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const groupedItems = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = menuItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<MenuCategory, MenuItem[]>);

  const handleAddToCart = (bookingItem: BookingItem) => {
    addBookingItem(bookingItem);
  };

  const cartCount = selectedBookingItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <h1 className="menu-hero-title">今日菜单</h1>
        <p className="menu-hero-subtitle">新鲜食材 · 当日现做 · 限量供应</p>
        {cartCount > 0 && (
          <button className="btn btn-primary menu-hero-cart" onClick={onGoToBooking}>
            查看预订 ({cartCount} 件)
          </button>
        )}
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
