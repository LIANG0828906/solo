import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, Tag } from 'lucide-react';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/menu', label: '菜品管理', icon: UtensilsCrossed },
  { path: '/orders', label: '订单管理', icon: ShoppingCart },
  { path: '/promotions', label: '优惠活动', icon: Tag },
];

export default function Header() {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 240,
        height: '100vh',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        paddingTop: 24,
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          padding: '0 20px 24px',
          borderBottom: '1px solid #334155',
        }}
      >
        餐厅管理系统
      </div>
      <div style={{ marginTop: 16 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              backgroundColor: isActive ? '#334155' : 'transparent',
              color: '#ffffff',
              textDecoration: 'none',
              borderLeft: isActive ? '3px solid #ffffff' : '3px solid transparent',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              gap: 10,
            })}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
