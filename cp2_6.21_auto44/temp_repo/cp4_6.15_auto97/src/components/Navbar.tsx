import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

export default function Navbar() {
  const { cart, user, toggleCart, logout } = useStore();
  const navigate = useNavigate();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <NavLink to="/" className="navbar-logo">
            <i className="fas fa-book-open"></i> 书香阁
          </NavLink>

          <div className="navbar-links">
            <NavLink to="/" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} end>
              图书
            </NavLink>
            
            {user?.role === 'admin' && (
              <NavLink to="/admin/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                管理
              </NavLink>
            )}

            {user ? (
              <>
                <NavLink to="/orders" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                  订单
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                  个人中心
                </NavLink>
                <button className="navbar-link" onClick={handleLogout}>
                  退出
                </button>
              </>
            ) : (
              <NavLink to="/login" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
                登录
              </NavLink>
            )}

            <div className="cart-icon-wrapper" onClick={() => toggleCart(true)}>
              <i className="fas fa-shopping-cart" style={{ fontSize: '20px' }}></i>
              {cartItemCount > 0 && (
                <span className="cart-count">{cartItemCount}</span>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
