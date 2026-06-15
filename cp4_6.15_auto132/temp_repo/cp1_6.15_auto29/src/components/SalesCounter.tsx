import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, X, Sparkles } from 'lucide-react';
import { api, Product, Sale } from '../services/api';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  justAdded?: boolean;
  bouncing?: boolean;
}

interface Props {
  products: Product[];
  refreshProducts: () => void;
  refreshAlerts: () => void;
}

export default function SalesCounter({ products, refreshProducts, refreshAlerts }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const starsRef = useRef<{ id: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const results = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      ).slice(0, 10);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      alert(`${product.name} 库存不足`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`${product.name} 库存不足，最多可购买 ${product.stock} 件`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice, bouncing: true }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          subtotal: product.sellingPrice,
          justAdded: true
        }
      ];
    });
    setSearchQuery('');
    inputRef.current?.focus();
    setTimeout(() => {
      setCart((prev) => prev.map((item) => ({ ...item, justAdded: false, bouncing: false })));
    }, 500);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = Math.max(1, item.quantity + delta);
          const product = products.find((p) => p.id === productId);
          if (product && newQty > product.stock) {
            alert(`${item.productName} 库存不足`);
            return item;
          }
          return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice, bouncing: true };
        })
    );
    setTimeout(() => {
      setCart((prev) => prev.map((item) => ({ ...item, bouncing: false })));
    }, 300);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const sale = await api.createSale({
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      });
      setLastSale(sale);
      setShowSuccess(true);
      starsRef.current = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        delay: Math.random() * 0.3
      }));
      setCart([]);
      refreshProducts();
      refreshAlerts();
      setTimeout(() => {
        setShowSuccess(false);
        setLastSale(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && searchResults.length > 0) {
      addToCart(searchResults[0]);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--wood-dark)' }}>
          销售收银
        </h2>
        <p className="text-sm" style={{ color: '#8B7355' }}>
          扫码或搜索商品添加到购物车
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8B7355', width: 20, height: 20 }} />
            <input
              ref={inputRef}
              type="text"
              className="input-field pl-12 text-lg"
              placeholder="输入条码或商品名称，按回车快速添加..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--wood-dark)' }}>
                      {product.name}
                    </h4>
                    <p className="text-sm" style={{ color: '#8B7355' }}>
                      {product.category} · 条码: {product.barcode} · 库存: {product.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold" style={{ color: 'var(--wood-primary)' }}>
                      ¥{product.sellingPrice.toFixed(2)}
                    </span>
                    <button className="btn-primary px-3 py-1.5 flex items-center gap-1">
                      <Plus style={{ width: 16, height: 16 }} />
                      添加
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-bold mb-3" style={{ color: 'var(--wood-dark)' }}>
              快捷商品
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {products.slice(0, 10).map((product) => (
                <button
                  key={product.id}
                  className="p-3 rounded-lg text-center transition-all hover:scale-105"
                  style={{
                    background: product.stock > 0 ? 'var(--cream-dark)' : '#f0f0f0',
                    opacity: product.stock > 0 ? 1 : 0.5,
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => product.stock > 0 && addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart style={{ width: 20, height: 20, margin: '0 auto 6px', color: 'var(--wood-primary)' }} />
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--wood-dark)' }}>
                    {product.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--wood-primary)' }}>
                    ¥{product.sellingPrice.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            className="p-4 flex items-center justify-between"
            style={{ background: 'var(--wood-dark)', color: '#fff' }}
          >
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart style={{ width: 20, height: 20 }} />
              购物车
            </h3>
            <span className="text-sm opacity-80">{cart.length} 件商品</span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="p-12 text-center" style={{ color: '#8B7355' }}>
                <ShoppingCart style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
                <p>购物车为空</p>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className={`cart-item ${item.justAdded ? 'animate-slide-in' : ''}`}
                  >
                    <div>
                      <p className="font-medium" style={{ color: 'var(--wood-dark)' }}>
                        {item.productName}
                      </p>
                      <p className="text-xs" style={{ color: '#8B7355' }}>
                        ¥{item.unitPrice.toFixed(2)} / 件
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--cream-dark)' }}
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus style={{ width: 14, height: 14, color: 'var(--wood-dark)' }} />
                      </button>
                      <span
                        className={`w-8 text-center font-bold ${item.bouncing ? 'animate-number-bounce' : ''}`}
                        style={{ color: 'var(--wood-dark)' }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--wood-primary)', color: '#fff' }}
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                    <span
                      className={`font-bold min-w-20 text-right ${item.bouncing ? 'animate-number-bounce' : ''}`}
                      style={{ color: 'var(--wood-primary)' }}
                    >
                      ¥{item.subtotal.toFixed(2)}
                    </span>
                    <button
                      className="p-1.5 rounded-lg hover:bg-red-50"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 style={{ width: 16, height: 16, color: 'var(--alert-red)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4" style={{ borderColor: 'var(--wood-light)' }}>
              <div className="flex justify-between items-center">
                <span style={{ color: '#8B7355' }}>商品总数</span>
                <span className="font-bold" style={{ color: 'var(--wood-dark)' }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} 件
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#8B7355' }}>应付金额</span>
                <span className="text-3xl font-bold" style={{ color: 'var(--wood-primary)' }}>
                  ¥{totalAmount.toFixed(2)}
                </span>
              </div>
              <button
                className="w-full btn-secondary py-4 text-lg flex items-center justify-center gap-2"
                onClick={handleCheckout}
                disabled={loading}
              >
                <CreditCard style={{ width: 20, height: 20 }} />
                {loading ? '处理中...' : '立即结账'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-90 text-center animate-fade-up">
            {starsRef.current.map((star) => (
              <span
                key={star.id}
                className="star"
                style={{ left: `${star.left}%`, animationDelay: `${star.delay}s` }}
              >
                ✦
              </span>
            ))}
            <Sparkles
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                color: 'var(--gold-accent)',
                animation: 'number-bounce 0.5s ease-out'
              }}
            />
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--wood-dark)' }}>
              结账成功！
            </h3>
            {lastSale && (
              <>
                <p className="mb-4" style={{ color: '#8B7355' }}>
                  {new Date(lastSale.createdAt).toLocaleString('zh-CN')}
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: 'var(--wood-primary)' }}>
                  ¥{lastSale.totalAmount.toFixed(2)}
                </p>
                <p className="text-sm" style={{ color: '#8B7355' }}>
                  共 {lastSale.items.reduce((sum, i) => sum + i.quantity, 0)} 件商品
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
