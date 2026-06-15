import { useState, useEffect, useCallback } from 'react';
import MenuList from './MenuList';
import Cart from './Cart';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Dish {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  isRecommended: boolean;
}

interface CartItem extends Dish {
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
  visible: boolean;
}

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('recommended');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message, visible: true });
    setTimeout(() => {
      setToast(prev => (prev && prev.id === id ? { ...prev, visible: false } : prev));
      setTimeout(() => {
        setToast(prev => (prev && prev.id === id ? null : prev));
      }, 300);
    }, 3000);
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadDishes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dishes?categoryId=${activeCategory}`);
        const data = await res.json();
        setDishes(data);
      } catch (error) {
        console.error('Failed to load dishes:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 100);
      }
    };
    loadDishes();
  }, [activeCategory]);

  const handleToggleFavorite = useCallback((dishId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(dishId)) {
        newFavorites.delete(dishId);
      } else {
        newFavorites.add(dishId);
      }
      return newFavorites;
    });
  }, []);

  const handleAddToCart = useCallback((dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
    showToast(`已添加 ${dish.name} 到购物车`);
  }, [showToast]);

  const handleUpdateQuantity = useCallback((dishId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item =>
          item.id === dishId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter(item => item.quantity > 0);
    });
  }, []);

  const handleRemoveFromCart = useCallback((dishId: string) => {
    setCart(prev => prev.filter(item => item.id !== dishId));
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (cart.length === 0) {
      showToast('购物车为空，请先添加菜品');
      return;
    }

    const items = cart.map(item => ({
      dishId: item.id,
      quantity: item.quantity
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`下单成功，订单号：${data.orderId}，等待时间：${data.waitTime}分钟`);
        setCart([]);
        setCartOpen(false);
      } else {
        const error = await res.json();
        showToast(error.error || '下单失败，请重试');
      }
    } catch (error) {
      showToast('网络错误，请稍后重试');
    }
  }, [cart, showToast]);

  const filteredDishes = searchTerm.trim()
    ? dishes.filter(
        d =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : dishes;

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">美食餐厅</span>
          </div>
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索菜品..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="cart-toggle-btn"
            onClick={() => setCartOpen(!cartOpen)}
          >
            🛒 购物车
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </button>
        </div>
      </nav>

      <div className="main-container">
        <main className="menu-section">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-name">{cat.name}</span>
              </button>
            ))}
          </div>

          <MenuList
            dishes={filteredDishes}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            isLoading={isLoading}
          />
        </main>

        <aside className={`cart-section ${cartOpen ? 'open' : ''}`}>
          <Cart
            items={cart}
            totalPrice={totalPrice}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
            onSubmit={handleSubmitOrder}
            onClose={() => setCartOpen(false)}
          />
        </aside>
      </div>

      {toast && (
        <div className={`toast ${toast.visible ? 'visible' : ''}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
