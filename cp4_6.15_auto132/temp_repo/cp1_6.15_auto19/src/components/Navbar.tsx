import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/')}>
        <span className="emoji">🐾</span>
        <span>宠乐园</span>
      </div>
      <ul className="navbar-nav">
        <li>
          <NavLink to="/" end>
            首页
          </NavLink>
        </li>
        <li>
          <NavLink to="/matching">找寄养家庭</NavLink>
        </li>
        <li>
          <NavLink to="/matching">我的宠物</NavLink>
        </li>
        <li>
          <NavLink to="/matching">关于我们</NavLink>
        </li>
      </ul>
      <div className="navbar-user">
        <button className="btn btn-outline" onClick={() => navigate('/matching')}>
          🔍 搜索寄养
        </button>
        <button className="btn btn-primary">
          👤 登录
        </button>
      </div>
    </nav>
  )
}
