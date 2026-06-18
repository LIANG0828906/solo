import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const RoleSelect = () => {
  const navigate = useNavigate();
  const setRole = useAppStore((s) => s.setRole);

  const handleSelect = (role: 'coach' | 'client') => {
    setRole(role);
    navigate(role === 'coach' ? '/coach' : '/client');
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #121212 0%, #1a1530 100%)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '42px',
    fontWeight: 700,
    color: '#7C4DFF',
    marginBottom: '8px',
    letterSpacing: '2px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#B0B0B0',
    marginBottom: '64px'
  };

  const cardsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '32px',
    maxWidth: '800px',
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  const cardBaseStyle: React.CSSProperties = {
    flex: '1 1 300px',
    maxWidth: '360px',
    padding: '48px 32px',
    backgroundColor: '#1E1E1E',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '64px',
    marginBottom: '24px'
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: '#E0E0E0',
    marginBottom: '12px'
  };

  const cardDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#808080',
    lineHeight: '1.6'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>FitFlow</h1>
      <p style={subtitleStyle}>训练助手 · 让健身更高效</p>
      <div style={cardsContainerStyle}>
        <div
          style={cardBaseStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.borderColor = '#7C4DFF';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(124, 77, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => handleSelect('coach')}
        >
          <div style={iconStyle}>💪</div>
          <h2 style={cardTitleStyle}>我是教练</h2>
          <p style={cardDescStyle}>创建训练计划、管理学员、查看完成率统计</p>
        </div>
        <div
          style={cardBaseStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.borderColor = '#7C4DFF';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(124, 77, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => handleSelect('client')}
        >
          <div style={iconStyle}>🏃</div>
          <h2 style={cardTitleStyle}>我是学员</h2>
          <p style={cardDescStyle}>查看每日训练、记录完成情况、跟踪进步</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
