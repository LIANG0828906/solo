import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CartModal({ open, onClose }: CartModalProps) {
  const items = useStore((s) => s.cartItems);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successState, setSuccessState] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const [particles, setParticles] = useState<{ x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (successState.show) {
      const ps = Array.from({ length: 18 }).map(() => ({
        x: (Math.random() - 0.5) * 260,
        y: (Math.random() - 0.5) * 260,
        delay: Math.random() * 0.25
      }));
      setParticles(ps);
    }
  }, [successState.show]);

  if (!open) return null;

  const handleCheckout = async () => {
    setShowConfirm(false);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          bookId: i.bookId,
          title: i.title,
          price: i.price,
          quantity: i.quantity
        })),
        total: getCartTotal()
      })
    });
    const data = await res.json();
    if (data.success) {
      setSuccessState({ show: true, msg: data.message });
      setTimeout(() => {
        setSuccessState({ show: false, msg: '' });
        clearCart();
        onClose();
      }, 2400);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/50 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-cream-50 rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalPanelEnter 300ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <style>{`
          @keyframes modalPanelEnter {
            0% { opacity: 0; transform: scale(0.92) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes cartGlow {
            0% { transform: scale(0.4); opacity: 0.75; }
            100% { transform: scale(2.4); opacity: 0; }
          }
        `}</style>

        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-white/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-accent-500" size={22} />
            <h2 className="text-xl font-extrabold text-brown-800">我的购物车</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream-200 text-brown-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brown-600">
              <ShoppingBag size={64} className="opacity-30 mb-4" />
              <p className="font-semibold">购物车空空如也</p>
              <p className="text-sm mt-1 opacity-70">去逛逛，挑选心仪的好书吧</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.bookId} className="flex gap-3 p-3 bg-white rounded-2xl shadow-sm">
                  <img src={it.cover} alt={it.title} className="w-16 h-20 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-brown-800 text-sm line-clamp-1">{it.title}</h4>
                    <p className="text-accent-600 font-bold mt-0.5">¥{it.price.toFixed(0)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-cream-100 rounded-full px-1 py-1">
                        <button
                          onClick={() => updateQuantity(it.bookId, it.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm text-brown-700 hover:bg-accent-500 hover:text-white transition-all active:scale-90"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center font-bold text-brown-800 text-sm">{it.quantity}</span>
                        <button
                          onClick={() => updateQuantity(it.bookId, it.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm text-brown-700 hover:bg-accent-500 hover:text-white transition-all active:scale-90"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-extrabold text-brown-800">¥{(it.price * it.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(it.bookId)}
                    className="self-start p-1.5 text-brown-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-4 bg-white border-t border-cream-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-brown-600 font-semibold">合计</span>
              <span className="text-2xl font-extrabold text-accent-600">¥{getCartTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-2xl shadow-lg shadow-accent-500/30 transition-all active:scale-98"
            >
              结算下单
            </button>
          </div>
        )}

        {showConfirm && (
          <div className="absolute inset-0 bg-brown-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-10">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-extrabold text-brown-800 mb-2">确认订单</h3>
              <p className="text-brown-600 text-sm mb-4">
                共 {items.reduce((s, i) => s + i.quantity, 0)} 件商品，应付 <span className="font-bold text-accent-600">¥{getCartTotal().toFixed(2)}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cream-200 text-brown-700 font-bold hover:bg-cream-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-bold hover:bg-accent-600 transition-colors"
                >
                  确认支付
                </button>
              </div>
            </div>
          </div>
        )}

        {successState.show && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <div className="relative flex items-center justify-center w-32 h-32">
              <div className="absolute inset-0 rounded-full bg-accent-400/40" style={{ animation: 'cartGlow 1.2s ease-out forwards' }} />
              <div className="absolute inset-4 rounded-full bg-accent-300/40" style={{ animation: 'cartGlow 1.2s ease-out 0.1s forwards' }} />
              <div className="relative w-20 h-20 rounded-full bg-accent-500 flex items-center justify-center shadow-2xl shadow-accent-500/50" style={{ animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                <Check className="text-white" size={44} strokeWidth={3} />
              </div>
              {particles.map((p, i) => (
                <Sparkles
                  key={i}
                  size={14}
                  className="absolute text-accent-500"
                  style={{
                    transform: `translate(${p.x}px, ${p.y}px)`,
                    animation: `particle 1s ease-out ${p.delay}s forwards`,
                    opacity: 0
                  }}
                />
              ))}
            </div>
            <p className="mt-6 text-xl font-extrabold text-brown-800">下单成功！</p>
            <p className="mt-1 text-brown-600 text-sm">{successState.msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
