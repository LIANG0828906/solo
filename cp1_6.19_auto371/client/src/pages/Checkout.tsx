import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useStore } from '../store';
import { Order } from '../types';

interface AddressSuggestion {
  name: string;
  lat: number;
  lng: number;
}

const Checkout: React.FC = () => {
  const { cart, clearCart, addOrder, setCurrentPage } = useStore();
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [timeSlot, setTimeSlot] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  const totalPrice = cart.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    axios.get<AddressSuggestion[]>('/api/addresses', { params: { q } }).then((res) => {
      setSuggestions(res.data);
      setShowSuggestions(res.data.length > 0);
    });
  }, []);

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setLat(0);
    setLng(0);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  const selectAddress = (s: AddressSuggestion) => {
    setAddress(s.name);
    setLat(s.lat);
    setLng(s.lng);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!recipientName || !phone || !address || !timeSlot) return;
    if (cart.length === 0) return;

    const items = cart.map((item) => ({
      bouquetId: item.bouquet.id,
      bouquetName: item.bouquet.name,
      quantity: item.quantity,
      price: item.bouquet.price,
    }));

    try {
      const res = await axios.post<Order>('/api/orders', {
        items,
        recipientName,
        phone,
        address,
        lat: lat || undefined,
        lng: lng || undefined,
        timeSlot,
      });
      addOrder(res.data);
      setOrderId(res.data.id);
      clearCart();
      setShowSuccess(true);
    } catch {
      alert('订单提交失败，请重试');
    }
  };

  if (showSuccess) {
    return (
      <div className="success-overlay">
        <div className="success-check">✓</div>
        <div className="success-text">下单成功！</div>
        <div className="success-sub">订单号：{orderId}</div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setCurrentPage('catalog')}>
            继续选购
          </button>
          <button className="btn btn-outline" onClick={() => setCurrentPage('admin')}>
            查看配送
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>购物车是空的</div>
        <div style={{ color: '#999', marginBottom: 24 }}>先去挑选花束吧~</div>
        <button className="btn btn-primary" onClick={() => setCurrentPage('catalog')}>
          浏览花束
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">📝 确认订单</h1>
      <p className="page-subtitle">填写配送信息，送出你的心意</p>

      <div className="order-summary">
        <h3>订单明细</h3>
        {cart.map((item) => (
          <div className="order-summary-item" key={item.bouquet.id}>
            <span>{item.bouquet.emoji} {item.bouquet.name} × {item.quantity}</span>
            <span>¥{(item.bouquet.price * item.quantity).toFixed(1)}</span>
          </div>
        ))}
        <div className="order-summary-total">
          <span>总计</span>
          <span style={{ color: 'var(--accent)' }}>¥{totalPrice.toFixed(1)}</span>
        </div>
      </div>

      <div className="checkout-form">
        <div className="form-group">
          <label className="form-label">收花人姓名</label>
          <input
            className="form-input"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="请输入收花人姓名"
          />
          <div className="form-input-underline" />
        </div>

        <div className="form-group">
          <label className="form-label">手机号</label>
          <input
            className="form-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            type="tel"
          />
          <div className="form-input-underline" />
        </div>

        <div className="form-group" ref={addressRef}>
          <label className="form-label">配送地址</label>
          <input
            className="form-input"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="输入街道名称搜索"
            autoComplete="off"
          />
          <div className="form-input-underline" />
          {showSuggestions && (
            <div className="address-suggestions">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="address-suggestion"
                  onClick={() => selectAddress(s)}
                >
                  📍 {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">期望配送时段</label>
          <div className="time-slot-group">
            {[
              { value: '上午 9:00-12:00', label: '🌞 上午 9-12点' },
              { value: '下午 14:00-17:00', label: '🌤️ 下午 2-5点' },
              { value: '晚间 18:00-21:00', label: '🌙 晚间 6-9点' },
            ].map((slot) => (
              <button
                key={slot.value}
                className={`time-slot ${timeSlot === slot.value ? 'active' : ''}`}
                onClick={() => setTimeSlot(slot.value)}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-accent btn-block"
          style={{ marginTop: 8, padding: '14px 20px', fontSize: 16 }}
          onClick={handleSubmit}
          disabled={!recipientName || !phone || !address || !timeSlot}
        >
          提交订单
        </button>
      </div>
    </div>
  );
};

export default Checkout;
