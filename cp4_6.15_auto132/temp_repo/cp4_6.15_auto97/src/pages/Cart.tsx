import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, submitOrder, user } = useStore();
  
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [address, setAddress] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const total = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    if (!address.name || !address.phone || !address.address) {
      setError('请填写完整的配送信息');
      return;
    }

    setSubmitting(true);
    const response = await submitOrder(address, paymentMethod, user.id);
    
    if (response.success && response.data) {
      setOrderSuccess(response.data.id);
      setTimeout(() => {
        navigate(`/order/${response.data!.id}`);
      }, 2000);
    } else {
      setError(response.error || '提交订单失败');
    }
    setSubmitting(false);
  };

  if (orderSuccess) {
    return (
      <div className="container">
        <div className="form-container" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'checkFadeIn 0.5s ease',
          }}>
            <i className="fas fa-check" style={{ fontSize: '40px', color: 'white' }}></i>
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--color-text)' }}>订单提交成功！</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '16px' }}>正在跳转到订单详情...</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>订单号：{orderSuccess}</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>
            <i className="fas fa-shopping-cart"></i>
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--color-text)' }}>购物车是空的</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>快去挑选心仪的图书吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            去逛逛
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">{step === 'cart' ? '购物车' : '确认订单'}</h1>
        <p className="page-subtitle">
          {step === 'cart' ? `共 ${cart.length} 件商品` : '请填写配送信息'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div>
          {step === 'cart' ? (
            <div className="card" style={{ padding: '24px' }}>
              {cart.map((item) => (
                <div 
                  key={item.bookId} 
                  style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    padding: '16px 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <img 
                    src={item.book.coverUrl} 
                    alt={item.book.title} 
                    style={{ width: '80px', height: '106px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text)' }}>
                      {item.book.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                      {item.book.author}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateCartQuantity(item.bookId, item.quantity - 1)}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateCartQuantity(item.bookId, item.quantity + 1)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>
                          ¥{(item.book.price * item.quantity).toFixed(2)}
                        </span>
                        <button 
                          className="quantity-btn"
                          style={{ color: '#F44336' }}
                          onClick={() => removeFromCart(item.bookId)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: '100%' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--color-text)' }}>配送信息</h2>
              
              <div className="form-group">
                <label className="form-label">收货人姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  placeholder="请输入收货人姓名"
                />
              </div>

              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="tel"
                  className="form-input"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  placeholder="请输入联系电话"
                />
              </div>

              <div className="form-group">
                <label className="form-label">详细地址</label>
                <textarea
                  className="form-input"
                  value={address.address}
                  onChange={(e) => setAddress({ ...address, address: e.target.value })}
                  placeholder="请输入详细地址"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--color-text)' }}>支付方式</h2>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <label style={{ 
                  flex: 1, 
                  padding: '16px', 
                  border: `2px solid ${paymentMethod === 'wechat' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="wechat"
                    checked={paymentMethod === 'wechat'}
                    onChange={() => setPaymentMethod('wechat')}
                    style={{ marginRight: '8px' }}
                  />
                  <i className="fab fa-weixin" style={{ color: '#07C160', marginRight: '8px' }}></i>
                  微信支付
                </label>
                <label style={{ 
                  flex: 1, 
                  padding: '16px', 
                  border: `2px solid ${paymentMethod === 'alipay' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="alipay"
                    checked={paymentMethod === 'alipay'}
                    onChange={() => setPaymentMethod('alipay')}
                    style={{ marginRight: '8px' }}
                  />
                  <i className="fab fa-alipay" style={{ color: '#1677FF', marginRight: '8px' }}></i>
                  支付宝
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={() => setStep('cart')}
                >
                  返回购物车
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '提交订单'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div>
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text)' }}>订单摘要</h3>
            
            <div style={{ marginBottom: '16px' }}>
              {cart.map((item) => (
                <div key={item.bookId} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0',
                  fontSize: '14px',
                }}>
                  <span style={{ color: 'var(--color-text-light)' }}>
                    {item.book.title} x{item.quantity}
                  </span>
                  <span style={{ fontWeight: '500' }}>
                    ¥{(item.book.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-light)' }}>商品小计</span>
                <span>¥{total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-light)' }}>运费</span>
                <span style={{ color: 'var(--color-stock-green)' }}>免运费</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
                marginTop: '16px',
              }}>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>应付总额</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                  ¥{total.toFixed(2)}
                </span>
              </div>
            </div>

            {step === 'cart' && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '24px' }}
                onClick={() => setStep('checkout')}
                disabled={!user}
              >
                {user ? '去结算' : '登录后结算'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
