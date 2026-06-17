import { useLocation, useNavigate } from 'react-router-dom';
import { usePollStore, Poll } from '../pollStore';
import { DashboardOutlined, PlusOutlined, MenuOutlined } from '@ant-design/icons';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) => {
  const polls = usePollStore(s => s.polls);
  const setCurrentPoll = usePollStore(s => s.setCurrentPoll);
  const location = useLocation();
  const navigate = useNavigate();

  const handlePollClick = (poll: Poll) => {
    setCurrentPoll(poll);
    navigate(`/poll/${poll.id}`);
    setMobileMenuOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const sidebarContent = (
    <>
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <div
          style={{
            background: '#673AB7',
            borderRadius: 8,
            padding: '6px 16px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 1,
          }}
        >
          PV
        </div>
      </div>

      <div style={{ padding: '12px 0', overflowY: 'auto', flex: 1 }}>
        <div
          onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            cursor: 'pointer',
            background: location.pathname === '/' ? '#E8EAF6' : 'transparent',
            borderLeft: location.pathname === '/' ? '3px solid #3F51B5' : '3px solid transparent',
            transition: 'background 0.2s',
            fontWeight: location.pathname === '/' ? 600 : 400,
            color: location.pathname === '/' ? '#3F51B5' : '#333',
          }}
          onMouseOver={(e) => { if (location.pathname !== '/') e.currentTarget.style.background = '#ECEFF1'; }}
          onMouseOut={(e) => { if (location.pathname !== '/') e.currentTarget.style.background = 'transparent'; }}
        >
          <DashboardOutlined style={{ marginRight: 12, fontSize: 18 }} />
          仪表盘
        </div>

        <div
          onClick={() => { navigate('/create'); setMobileMenuOpen(false); }}
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            cursor: 'pointer',
            background: location.pathname === '/create' ? '#E8EAF6' : 'transparent',
            borderLeft: location.pathname === '/create' ? '3px solid #3F51B5' : '3px solid transparent',
            transition: 'background 0.2s',
            fontWeight: location.pathname === '/create' ? 600 : 400,
            color: location.pathname === '/create' ? '#3F51B5' : '#333',
          }}
          onMouseOver={(e) => { if (location.pathname !== '/create') e.currentTarget.style.background = '#ECEFF1'; }}
          onMouseOut={(e) => { if (location.pathname !== '/create') e.currentTarget.style.background = 'transparent'; }}
        >
          <PlusOutlined style={{ marginRight: 12, fontSize: 18 }} />
          创建投票
        </div>

        <div style={{ padding: '16px 16px 8px', fontSize: 12, color: '#999', fontWeight: 600 }}>
          我的投票
        </div>

        {polls.map((poll) => {
          const isActive = location.pathname === `/poll/${poll.id}`;
          return (
            <div
              key={poll.id}
              onClick={() => handlePollClick(poll)}
              style={{
                height: 48,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 16px 0 16px',
                paddingLeft: isActive ? 13 : 16,
                cursor: 'pointer',
                background: isActive ? '#E8EAF6' : 'transparent',
                borderLeft: isActive ? '3px solid #3F51B5' : '3px solid transparent',
                transition: 'background 0.2s',
                position: 'relative',
              }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = '#ECEFF1'; }}
              onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#3F51B5' : '#333',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {poll.title}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                <span style={{
                  background: poll.isClosed ? '#F44336' : '#4CAF50',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  marginRight: 6,
                }}>
                  {poll.shortCode}
                </span>
                {formatDate(poll.createdAt)} · {poll.voteCount ?? 0}人参与
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <div
        style={{
          width: 240,
          background: '#FFFFFF',
          borderRight: '1px solid #E0E0E0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 10,
        }}
        className="sidebar-desktop"
      >
        {sidebarContent}
      </div>

      <div
        className="sidebar-mobile"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: '#FFFFFF',
          borderTop: '1px solid #E0E0E0',
          zIndex: 100,
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
        }}
      >
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 6,
            color: location.pathname === '/' ? '#3F51B5' : '#666',
          }}
        >
          <DashboardOutlined style={{ fontSize: 20 }} />
          <span style={{ fontSize: 11, marginTop: 2 }}>仪表盘</span>
        </div>
        <div
          onClick={() => navigate('/create')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 6,
            color: location.pathname === '/create' ? '#3F51B5' : '#666',
          }}
        >
          <PlusOutlined style={{ fontSize: 20 }} />
          <span style={{ fontSize: 11, marginTop: 2 }}>创建</span>
        </div>
        {polls.slice(0, 2).map((poll) => (
          <div
            key={poll.id}
            onClick={() => handlePollClick(poll)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 6,
              color: location.pathname === `/poll/${poll.id}` ? '#3F51B5' : '#666',
            }}
          >
            <div style={{
              background: poll.isClosed ? '#F44336' : '#4CAF50',
              color: '#fff',
              width: 22,
              height: 22,
              borderRadius: 4,
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}>
              {poll.shortCode.slice(0, 2)}
            </div>
            <span style={{ fontSize: 10, marginTop: 2, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {poll.title.slice(0, 4)}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
