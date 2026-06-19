import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const handleNavClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <nav style={{
      backgroundColor: '#1A73E8',
      color: '#FFFFFF',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow)',
      flexShrink: 0
    }}>
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>🏢</span>
        <span>推荐激励系统</span>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '32px',
        height: '100%',
        alignItems: 'center'
      }}>
        <NavLink
          to="/"
          onClick={handleNavClick}
          style={({ isActive }) => ({
            color: '#FFFFFF',
            padding: '8px 4px',
            fontSize: '15px',
            fontWeight: isActive ? '600' : '400',
            borderBottom: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '100%'
          })}
        >
          <span>📋</span>
          <span>职位列表</span>
        </NavLink>
        
        <NavLink
          to="/referrals"
          onClick={handleNavClick}
          style={({ isActive }) => ({
            color: '#FFFFFF',
            padding: '8px 4px',
            fontSize: '15px',
            fontWeight: isActive ? '600' : '400',
            borderBottom: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '100%'
          })}
        >
          <span>🤝</span>
          <span>推荐跟踪</span>
        </NavLink>
        
        <NavLink
          to="/rewards"
          onClick={handleNavClick}
          style={({ isActive }) => ({
            color: '#FFFFFF',
            padding: '8px 4px',
            fontSize: '15px',
            fontWeight: isActive ? '600' : '400',
            borderBottom: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '100%'
          })}
        >
          <span>💰</span>
          <span>奖励计算</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
