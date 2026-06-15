import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, Tag, Check, MinusCircle } from 'lucide-react';
import { useBooksStore } from '@/store/booksStore';
import styles from '@/styles/CartDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ANIMATION_DURATION = 450;

export function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountMsg, setDiscountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bounceMap, setBounceMap] = useState<Record<string, boolean>>({});
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cart = useBooksStore((s) => s.cart);
  const discount = useBooksStore((s) => s.discount);
  const applyDiscount = useBooksStore((s) => s.applyDiscount);
  const updateCartItemQty = useBooksStore((s) => s.updateCartItemQty);
  const removeFromCart = useBooksStore((s) => s.removeFromCart);
  const getBookFromCartItem = useBooksStore((s) => s.getBookFromCartItem);
  const getCartTotalCount = useBooksStore((s) => s.getCartTotalCount);
  const getCartSubtotal = useBooksStore((s) => s.getCartSubtotal);
  const getCartDiscountAmount = useBooksStore((s) => s.getCartDiscountAmount);
  const getCartTotal = useBooksStore((s) => s.getCartTotal);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(true);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(t);
    } else if (mounted) {
      setVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, ANIMATION_DURATION);
    }
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, mounted]);

  useEffect(() => {
    if (open) {
      setDiscountMsg(null);
    }
  }, [open]);

  useEffect(() => {
    if (mounted) {
      setDiscountCode(discount.code);
    }
  }, [discount.code, mounted]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountMsg({ type: 'error', text: '请输入优惠码' });
      return;
    }
    const result = applyDiscount(discountCode);
    setDiscountMsg({ type: result.success ? 'success' : 'error', text: result.message });
  };

  const triggerBounce = useCallback((id: string) => {
    setBounceMap((m) => ({ ...m, [id]: true }));
    setTimeout(() => setBounceMap((m) => ({ ...m, [id]: false })), 260);
  }, []);

  const handleQtyChange = (itemId: string, currentQty: number, delta: number, maxStock: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1 || newQty > maxStock) return;
    updateCartItemQty(itemId, newQty);
    triggerBounce(itemId);
  };

  const totalCount = getCartTotalCount();
  const subtotal = getCartSubtotal();
  const discountAmount = getCartDiscountAmount();
  const total = getCartTotal();

  if (!mounted) return null;

  return (
    <>
      <div
        className={`${styles.overlay} ${visible ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${visible ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="购物车"
      >
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <ShoppingBag size={22} strokeWidth={1.8} />
            <h2 className={styles.headerTitle}>购物车</h2>
            {totalCount > 0 && (
              <span className={styles.itemCount}>{totalCount} 件商品</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭购物车">
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className={styles.body}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <ShoppingBag size={56} strokeWidth={1} color="var(--color-wood-light)" />
              <p className={styles.emptyTitle}>书架空空如也</p>
              <p className={styles.emptyText}>去挑几本喜欢的书吧～</p>
              <button
                className={styles.shopBtn}
                onClick={() => { onClose(); navigate('/'); }}
              >
                开始选购
              </button>
            </div>
          ) : (
            <>
              <div className={styles.cartList}>
                {cart.map((item) => {
                  const book = getBookFromCartItem(item);
                  if (!book) return null;
                  return (
                    <div className={styles.cartItem} key={item.id}>
                      <div className={styles.itemThumb}>
                        <img src={book.cover} alt={book.title} />
                      </div>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemTitle}>{book.title}</h4>
                        <span className={styles.itemAuthor}>{book.author}</span>
                        <div className={styles.itemBottom}>
                          <div className={styles.itemQty}>
                            <button
                              className={styles.qtyBtn}
                              disabled={item.quantity <= 1}
                              onClick={() => handleQtyChange(item.id, item.quantity, -1, book.stock)}
                              aria-label="减少数量"
                            >
                              <Minus size={13} strokeWidth={2.2} />
                            </button>
                            <span className={`${styles.qtyNum} ${bounceMap[item.id] ? 'quantity-bounce' : ''}`}>
                              {item.quantity}
                            </span>
                            <button
                              className={styles.qtyBtn}
                              disabled={item.quantity >= book.stock}
                              onClick={() => handleQtyChange(item.id, item.quantity, 1, book.stock)}
                              aria-label="增加数量"
                            >
                              <Plus size={13} strokeWidth={2.2} />
                            </button>
                          </div>
                          <span className={styles.itemPrice}>
                            {(book.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            className={styles.removeBtn}
                            onClick={() => removeFromCart(item.id)}
                            aria-label="移除商品"
                          >
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.discountSection}>
                <label className={styles.discountLabel}>
                  <Tag size={13} /> 优惠码
                  {discount.applied && (
                    <span className={styles.appliedTag}>
                      <Check size={12} /> {discount.code} 已应用
                    </span>
                  )}
                </label>
                <div className={styles.discountRow}>
                  <input
                    className={styles.discountInput}
                    type="text"
                    placeholder="输入 BOOK10 享九折"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      if (discountMsg) setDiscountMsg(null);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount(); }}
                    autoComplete="off"
                  />
                  <button className={styles.applyBtn} onClick={handleApplyDiscount}>
                    应用
                  </button>
                </div>
                {discountMsg && (
                  <div className={`${styles.discountMsg} ${discountMsg.type === 'success' ? styles.success : styles.error}`}>
                    {discountMsg.text}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <footer className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>商品小计</span>
              <span className="value">¥{subtotal.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.discount}`}>
              <span>
                优惠折扣
                {discount.applied && (
                  <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--color-success)' }}>
                    ({(discount.rate * 10).toFixed(0)}折)
                  </span>
                )}
              </span>
              <span className="value">
                {discountAmount > 0 ? '-' : ''}¥{discountAmount.toFixed(2)}
                {!discount.applied && discountAmount === 0 && (
                  <MinusCircle size={12} style={{ marginLeft: 6, verticalAlign: -2, opacity: 0.5 }} />
                )}
              </span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>应付金额</span>
              <span className={styles.totalValue}>¥{total.toFixed(2)}</span>
            </div>
            <button className={styles.checkoutBtn} disabled={cart.length === 0}>
              确认下单
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
