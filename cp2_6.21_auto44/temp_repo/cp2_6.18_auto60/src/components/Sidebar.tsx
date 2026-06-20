import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store';

export default function Sidebar() {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const isCartOpen = useStore((s) => s.isCartOpen);
  const closeCart = useStore((s) => s.closeCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const checkout = useStore((s) => s.checkout);

  const cartItems = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean) as Array<{ productId: string; quantity: number; product: import('@/types').Product }>;

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={closeCart}
      />
      <div className="fixed top-0 right-0 h-full w-[320px] max-w-[85vw] bg-white z-50 shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: '#D97706' }} />
            <h2 className="text-lg font-semibold text-stone-800">购物车</h2>
            <span className="text-xs text-stone-400">
              ({cartItems.length}件商品)
            </span>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X size={18} className="text-stone-400" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <ShoppingBag size={48} className="text-stone-200 mb-3" />
            <p className="text-stone-400 text-sm">购物车是空的</p>
            <p className="text-stone-300 text-xs mt-1">去逛逛手作好物吧</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 rounded-xl bg-stone-50"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-stone-800 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm font-bold mt-0.5" style={{ color: '#D97706' }}>
                      ¥{item.product.price}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.productId, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-stone-200 hover:bg-stone-300 transition-colors"
                        >
                          <Minus size={12} className="text-stone-600" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-stone-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.productId, item.quantity + 1)
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-stone-200 hover:bg-stone-300 transition-colors"
                        >
                          <Plus size={12} className="text-stone-600" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-stone-700">
                        ¥{item.product.price * item.quantity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="self-start p-1 rounded hover:bg-stone-200 transition-colors"
                  >
                    <X size={14} className="text-stone-400" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">合计</span>
                <span className="text-xl font-bold" style={{ color: '#D97706' }}>
                  ¥{total}
                </span>
              </div>
              <button
                onClick={() => checkout('匿名买家')}
                className="w-full py-3 rounded-lg text-white font-medium text-sm transition-colors"
                style={{ backgroundColor: '#059669' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#047857')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#059669')
                }
              >
                立即结算
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
