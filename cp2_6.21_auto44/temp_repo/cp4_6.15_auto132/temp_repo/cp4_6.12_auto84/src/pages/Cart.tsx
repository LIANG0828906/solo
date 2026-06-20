import { Link } from 'react-router-dom'
import { useFlowerStore } from '../store'
import { showToast } from '../components/Toast'

function Cart() {
  const cartItems = useFlowerStore((state) => state.cartItems)
  const updateQuantity = useFlowerStore((state) => state.updateQuantity)
  const removeFromCart = useFlowerStore((state) => state.removeFromCart)
  const clearCart = useFlowerStore((state) => state.clearCart)
  const getTotalPrice = useFlowerStore((state) => state.getTotalPrice)
  const getTotalItems = useFlowerStore((state) => state.getTotalItems)

  const handleCheckout = () => {
    showToast('支付成功！感谢您的购买 💕')
    clearCart()
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>购物车是空的</h2>
        <p>去看看有什么美丽的花束吧~</p>
        <Link to="/" className="btn-primary" style={{ width: 'auto' }}>
          浏览花束
        </Link>
      </div>
    )
  }

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <div>
      <h1 className="page-title">购物车</h1>
      <p className="page-subtitle">共 {totalItems} 件商品</p>

      <div className="cart-list">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="cart-item-thumb"
            />
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <div className="cart-item-price">¥{item.price}</div>
            </div>
            <div className="cart-item-actions">
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  aria-label="减少"
                >
                  −
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label="增加"
                >
                  +
                </button>
              </div>
              <button
                className="remove-btn"
                onClick={() => removeFromCart(item.id)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span className="cart-summary-label">商品件数</span>
          <span className="cart-summary-value">{totalItems} 件</span>
        </div>
        <div className="cart-summary-row">
          <span className="cart-summary-label">商品金额</span>
          <span className="cart-summary-value">¥{totalPrice}</span>
        </div>
        <div className="cart-divider" />
        <div className="cart-summary-row cart-summary-total">
          <span className="cart-summary-label">应付总额</span>
          <span className="cart-summary-value">¥{totalPrice}</span>
        </div>
        <div style={{ marginTop: '24px' }}>
          <button className="btn-primary" onClick={handleCheckout}>
            立即结算
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
