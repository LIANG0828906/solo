import { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { orderApi } from '../api';
import {
  PrintSize,
  SIZE_PRICES,
  FILTER_CSS
} from '../types';

interface OrderSummaryProps {
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function OrderSummary({ onClose, showToast }: OrderSummaryProps) {
  const {
    cart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setLoading,
    closeOrder
  } = useAppStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const totalPrice = cart.reduce(
    (sum, item) => sum + SIZE_PRICES[item.size] * item.quantity,
    0
  );

  const handleSubmit = useCallback(async () => {
    if (cart.length === 0) {
      showToast('购物车为空', 'error');
      return;
    }
    if (!customerName.trim()) {
      showToast('请填写姓名', 'error');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(customerPhone)) {
      showToast('请输入正确的手机号', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await orderApi.create({
        items: cart.map(item => ({
          photoId: item.photo.id,
          photoUrl: item.photo.originalUrl,
          size: item.size,
          quantity: item.quantity
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim()
      });

      if (result) {
        showToast(`订单提交成功！订单号：${result.id.slice(0, 8)}...`);
        clearCart();
        closeOrder();
      } else {
        showToast('提交失败，请重试', 'error');
      }
    } catch (err) {
      console.error('提交订单失败:', err);
      showToast('提交失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [cart, customerName, customerPhone, clearCart, closeOrder, setLoading, showToast]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h2 className="modal-title">🛒 订单确认</h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">
                购物车还是空的，快去挑选喜欢的照片吧！
              </div>
            </div>
          ) : (
            <>
              <table className="order-table">
                <thead>
                  <tr>
                    <th>照片</th>
                    <th>尺寸</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>小计</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => {
                    const key = `${item.photo.id}-${item.size}-${idx}`;
                    const subtotal = SIZE_PRICES[item.size] * item.quantity;
                    return (
                      <tr key={key}>
                        <td>
                          <div className="order-item-cell">
                            <img
                              className="order-item-thumb"
                              src={item.photo.thumbnailUrl}
                              alt=""
                              style={{
                                filter: FILTER_CSS[item.photo.filter]
                              }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#5D4037' }}>
                                #{item.photo.id.slice(0, 6)}
                              </div>
                              <div style={{ fontSize: 11, color: '#8D6E63' }}>
                                {item.photo.width}×{item.photo.height}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="size-select"
                            value={item.size}
                            onChange={(e) => updateCartItem(
                              item.photo.id,
                              e.target.value as PrintSize,
                              item.quantity
                            )}
                          >
                            <option value="6inch">6寸 · ¥1.50</option>
                            <option value="7inch">7寸 · ¥2.00</option>
                            <option value="8inch">8寸 · ¥3.00</option>
                          </select>
                        </td>
                        <td>
                          <div className="quantity-control">
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartItem(item.photo.id, item.size, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button
                              className="quantity-btn"
                              onClick={() => updateCartItem(item.photo.id, item.size, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                            >
                              ＋
                            </button>
                          </div>
                        </td>
                        <td>¥{SIZE_PRICES[item.size].toFixed(2)}</td>
                        <td style={{ fontWeight: 600, color: '#D35400' }}>
                          ¥{subtotal.toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="remove-btn"
                            onClick={() => removeFromCart(item.photo.id, item.size)}
                            aria-label="移除"
                            title="移除"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="order-total-row">
                    <td colSpan={3} className="order-total-label">
                      共 {cart.length} 种，{itemCount} 张
                    </td>
                    <td className="order-total-label">合计：</td>
                    <td className="order-total-value" colSpan={2}>
                      ¥{totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="customer-form">
                <div className="form-title">📝 客户信息</div>
                <div className="form-group">
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入客户姓名"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">联系电话</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="请输入11位手机号"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    maxLength={11}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={clearCart}>
                    清空购物车
                  </button>
                  <button className="btn btn-accent" onClick={handleSubmit}>
                    ✅ 确认下单（¥{totalPrice.toFixed(2)}）
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;
