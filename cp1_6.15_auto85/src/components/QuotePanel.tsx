import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, FileText, Copy, Check } from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../api';
import type { QuoteItem } from '../types';

const QuotePanel: React.FC = () => {
  const {
    quotePanelOpen,
    quoteItems,
    products,
    setQuotePanelOpen,
    updateQuoteItemQuantity,
    removeQuoteItem,
    addOrder,
    decrementStock,
    clearSelection,
  } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  const total = quoteItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const formatQuoteText = () => {
    const lines = quoteItems.map(
      (item) => `${item.name}x${item.quantity} - ¥${item.unitPrice.toFixed(2)}`
    );
    lines.push(`总价：¥${total.toFixed(2)}`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatQuoteText());
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 1500);
    } catch {
      showToast('error', '复制失败，请手动复制');
    }
  };

  const handleSubmit = async () => {
    if (quoteItems.length === 0) {
      showToast('error', '请先选择商品');
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await api.createOrder(quoteItems);
      addOrder(order);
      decrementStock(quoteItems.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      clearSelection();
      setQuotePanelOpen(false, []);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '创建订单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quotePanelOpen) return null;

  return (
    <>
      <style>{`
        @keyframes quoteSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div
        onClick={() => setQuotePanelOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          animation: 'fadeInOverlay 0.3s ease-out',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100vw)',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          animation: 'quoteSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid #F3F4F6',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText style={{ width: '18px', height: '18px', color: '#059669' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>
                报价单
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                共 {quoteItems.length} 种商品
              </p>
            </div>
          </div>
          <button
            onClick={() => setQuotePanelOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
          >
            <X style={{ width: '18px', height: '18px', color: '#6B7280' }} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 22px',
          }}
        >
          {quoteItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9CA3AF',
                gap: '12px',
              }}
            >
              <ShoppingCart style={{ width: '56px', height: '56px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>暂无选中商品</p>
              <p style={{ fontSize: '12px', margin: 0 }}>请在商品管理中勾选商品</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quoteItems.map((item) => (
                <QuoteItemRow
                  key={item.productId}
                  item={item}
                  product={products.find((p) => p.id === item.productId)}
                  onQtyChange={(q) => updateQuoteItemQuantity(item.productId, q)}
                  onRemove={() => removeQuoteItem(item.productId)}
                />
              ))}
            </div>
          )}
        </div>

        {quoteItems.length > 0 && (
          <div
            style={{
              padding: '16px 22px 22px',
              borderTop: '1px solid #F3F4F6',
              backgroundColor: '#FAFAFA',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#6B7280' }}>合计金额</span>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#EF4444',
                }}
              >
                ¥{total.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: '0 0 auto',
                  padding: '12px 18px',
                  backgroundColor: copied ? '#10B981' : '#fff',
                  color: copied ? '#ffffff' : '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!copied) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                  }
                }}
              >
                {copied ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                {copied ? '已复制' : '复制文本'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.25)';
                }}
              >
                <ShoppingCart style={{ width: '18px', height: '18px' }} />
                {isSubmitting ? '提交中...' : '确认生成订单'}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            zIndex: 200,
            animation: 'toastSlideDown 0.3s ease-out',
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

interface QuoteItemRowProps {
  item: QuoteItem;
  product?: { image?: string } | undefined;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}

const QuoteItemRow: React.FC<QuoteItemRowProps> = ({ item, product, onQtyChange, onRemove }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #F3F4F6',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: '#F3F4F6',
        }}
      >
        {product?.image && (
          <img
            src={product.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>
          ¥{item.unitPrice.toFixed(2)}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onQtyChange(item.quantity - 1)}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E7EB')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
        >
          <Minus style={{ width: '14px', height: '14px' }} />
        </button>
        <span
          style={{
            minWidth: '32px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {item.quantity}
        </span>
        <button
          onClick={() => onQtyChange(item.quantity + 1)}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E7EB')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      <div style={{ flexShrink: 0, minWidth: '60px', textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
          ¥{(item.unitPrice * item.quantity).toFixed(2)}
        </p>
      </div>

      <button
        onClick={onRemove}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#9CA3AF',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FEE2E2';
          (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
        }}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
};

export default QuotePanel;
