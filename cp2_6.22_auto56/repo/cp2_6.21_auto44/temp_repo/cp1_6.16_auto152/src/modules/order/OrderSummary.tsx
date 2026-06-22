import { useState, useEffect, useRef } from 'react';
import { useBouquetStore } from '@/modules/store/useBouquetStore';
import { FLOWERS, WRAPPING_PRICE, RIBBON_PRICE, WRAPPING_OPTIONS, RIBBON_OPTIONS } from '@/data/flowers';
import { ShoppingCart, CheckCircle, RotateCcw } from 'lucide-react';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(Math.round(current * 100) / 100);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [value]);

  return <span>¥{display.toFixed(0)}</span>;
}

export default function OrderSummary() {
  const selectedFlowers = useBouquetStore((s) => s.selectedFlowers);
  const wrappingStyle = useBouquetStore((s) => s.wrappingStyle);
  const ribbonColor = useBouquetStore((s) => s.ribbonColor);
  const orders = useBouquetStore((s) => s.orders);
  const submitOrder = useBouquetStore((s) => s.submitOrder);
  const calculateSubtotal = useBouquetStore((s) => s.calculateSubtotal);
  const calculateTotal = useBouquetStore((s) => s.calculateTotal);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  const handleSubmit = () => {
    if (selectedFlowers.length === 0) return;
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    const order = submitOrder();
    if (order) {
      setShowConfirm(false);
      setLastOrderId(order.orderId);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div
      className="sticky top-4 p-5 rounded-xl space-y-4"
      style={{
        background: '#F0F4EC',
        border: '1px solid #D8E0D0',
      }}
    >
      <h3
        className="text-lg font-semibold"
        style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}
      >
        <ShoppingCart size={18} className="inline mr-1.5" />
        价格清单
      </h3>

      <div className="space-y-2">
        {selectedFlowers.map((sf) => {
          const flower = FLOWERS.find((f) => f.id === sf.flowerId);
          if (!flower) return null;
          return (
            <div key={sf.flowerId} className="flex justify-between text-sm" style={{ color: '#2E4A2E' }}>
              <span>{flower.name} × {sf.quantity}</span>
              <span>¥{flower.price * sf.quantity}</span>
            </div>
          );
        })}

        {selectedFlowers.length > 0 && (
          <div
            className="pt-2 mt-2"
            style={{ borderTop: '1px dashed #C8D0C0' }}
          >
            <div className="flex justify-between text-sm" style={{ color: '#5A5A4A' }}>
              <span>花材小计</span>
              <span>¥{subtotal}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between text-sm" style={{ color: '#5A5A4A' }}>
          <span>包装纸 ({WRAPPING_OPTIONS.find((w) => w.id === wrappingStyle)?.name})</span>
          <span>¥{WRAPPING_PRICE}</span>
        </div>

        <div className="flex justify-between text-sm" style={{ color: '#5A5A4A' }}>
          <span>丝带 ({RIBBON_OPTIONS.find((r) => r.id === ribbonColor)?.name})</span>
          <span>¥{RIBBON_PRICE}</span>
        </div>
      </div>

      <div
        className="pt-3 mt-1"
        style={{ borderTop: '2px solid #6B8E4E' }}
      >
        <div className="flex justify-between items-baseline">
          <span className="font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E', fontSize: '16px' }}>
            总计
          </span>
          <span className="font-bold text-xl" style={{ color: '#6B8E4E', fontFamily: 'Georgia, serif' }}>
            <AnimatedNumber value={total} />
          </span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedFlowers.length === 0}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 ease-in-out"
        style={{
          background: selectedFlowers.length === 0
            ? '#C0C0B0'
            : 'linear-gradient(135deg, #6B8E4E, #4A7C4A)',
          transform: 'scale(1)',
          cursor: selectedFlowers.length === 0 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (selectedFlowers.length > 0) {
            (e.target as HTMLElement).style.filter = 'brightness(1.1)';
            (e.target as HTMLElement).style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.filter = 'brightness(1)';
          (e.target as HTMLElement).style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (selectedFlowers.length > 0) {
            (e.target as HTMLElement).style.transform = 'translateY(2px) scale(1)';
          }
        }}
        onMouseUp={(e) => {
          if (selectedFlowers.length > 0) {
            (e.target as HTMLElement).style.transform = 'scale(1.02)';
          }
        }}
      >
        提交定制
      </button>

      {showSuccess && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ background: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' }}
        >
          <CheckCircle size={16} />
          <span>订单 <strong>{lastOrderId}</strong> 已提交成功！</span>
        </div>
      )}

      {orders.length > 0 && (
        <div className="pt-3 mt-2 space-y-2" style={{ borderTop: '1px solid #D8E0D0' }}>
          <h4
            className="text-sm font-medium"
            style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}
          >
            <RotateCcw size={14} className="inline mr-1" />
            最近订单
          </h4>
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.orderId}
              className="p-2.5 rounded-lg text-xs space-y-1"
              style={{ background: '#FFFFFF', border: '1px solid #E0E8D8' }}
            >
              <div className="flex justify-between" style={{ color: '#2E4A2E' }}>
                <span className="font-mono font-medium">{order.orderId}</span>
                <span style={{ color: '#6B8E4E' }}>¥{order.totalPrice}</span>
              </div>
              <div style={{ color: '#8B8B7A' }}>
                {order.flowers.map((f) => `${f.name}×${f.quantity}`).join('、')}
              </div>
              <div style={{ color: '#A0A090' }}>{order.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="p-6 rounded-xl max-w-sm w-full mx-4 space-y-4"
            style={{ background: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#2E4A2E' }}>
              确认提交
            </h3>
            <p className="text-sm" style={{ color: '#5A5A4A' }}>
              您的花束包含 {selectedFlowers.reduce((s, f) => s + f.quantity, 0)} 支花材，
              总价 <strong style={{ color: '#6B8E4E' }}>¥{total}</strong>，确认提交吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: '#F0F0E8', color: '#5A5A4A' }}
              >
                取消
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #6B8E4E, #4A7C4A)' }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
