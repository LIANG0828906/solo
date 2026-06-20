import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      style={{
        backgroundColor: '#11111b',
        borderBottom: '1px solid #313244',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: '#cba6f7',
        }}
      >
        创作者作品集
      </h1>
      <nav
        style={{
          display: 'flex',
          gap: '32px',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            color: isActive('/') ? '#cba6f7' : '#cdd6f4',
            transition: 'color 0.2s ease',
          }}
        >
          首页
        </Link>
        <Link
          to="/admin"
          style={{
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            color: isActive('/admin') ? '#cba6f7' : '#cdd6f4',
            transition: 'color 0.2s ease',
          }}
        >
          统计看板
        </Link>
      </nav>
    </header>
  );
};

export default Header;
