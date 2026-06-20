import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Home, UserOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import { Avatar, Badge } from 'antd';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore(s => s.currentUser);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (displayPoints !== currentUser.points) {
        setAnimating(true);
        const start = displayPoints;
        const end = currentUser.points;
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(start + (end - start) * progress);
          setDisplayPoints(current);
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setAnimating(false);
          }
        };
        requestAnimationFrame(animate);
      }
    }
  }, [currentUser?.points]);

  const navItems = [
    { path: '/', label: '赛事大厅', icon: <Home style={{ fontSize: 18 }} /> },
    { path: '/leaderboard', label: '排行榜', icon: <Trophy style={{ fontSize: 18 }} /> },
  ];

  return (
    <div className="nav-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #faad14, #fa8c16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Trophy style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
          竞猜竞技场
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 48, flex: 1 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                color: active ? '#faad14' : '#d9d9d9',
                background: active ? 'rgba(250, 173, 20, 0.1)' : 'transparent',
                transition: 'all 0.2s',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Badge count={currentUser?.wins || 0} style={{ backgroundColor: '#52c41a' }} offset={[-4, 4]}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 24,
          }}>
            <Avatar size={28} style={{ backgroundColor: '#1677ff', verticalAlign: 'middle' }} icon={<UserOutlined />} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>{currentUser?.name || '用户'}</span>
              <span className={animating ? 'points-counter' : ''} key={displayPoints}>
                {displayPoints.toLocaleString()} 积分
              </span>
            </div>
          </div>
        </Badge>
      </div>
    </div>
  );
}
