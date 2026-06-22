import { NavLink } from 'react-router-dom'
import { Coffee, FileText, Package } from 'react-feather'

export default function Sidebar() {
  const menuItems = [
    { to: '/beans', label: '咖啡豆浏览', icon: Coffee },
    { to: '/recipes', label: '烘焙配方', icon: FileText },
    { to: '/green-beans', label: '生豆库存', icon: Package },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Coffee size={24} />
        <span>咖啡烘焙工作室</span>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <span>© 2024 咖啡烘焙工作室</span>
      </div>
    </aside>
  )
}
