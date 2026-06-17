import { usePollStore } from '../pollStore';
import { PlusOutlined, DashboardOutlined, BarChartOutlined } from '@ant-design/icons';

interface SidebarProps {
  onNavChange: (view: 'dashboard' | 'detail' | 'create') => void;
  currentView: string;
}

function Sidebar({ onNavChange, currentView }: SidebarProps) {
  const { polls, currentPoll, setCurrentPoll, fetchPolls } = usePollStore();

  const handlePollClick = (poll: typeof polls[0]) => {
    setCurrentPoll(poll);
    onNavChange('detail');
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-box">QP</div>
        </div>
        <div className="sidebar-menu">
          <div
            className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentPoll(null);
              onNavChange('dashboard');
            }}
          >
            <DashboardOutlined style={{ marginRight: 10, color: '#3F51B5' }} />
            <span className="sidebar-item-title">仪表盘</span>
          </div>
          
          <div style={{ padding: '8px 16px', fontSize: '12px', color: '#999', fontWeight: '500' }}>
            我的投票
          </div>
          
          {polls.map((poll) => (
            <div
              key={poll.id}
              className={`sidebar-item ${currentPoll?.id === poll.id ? 'active' : ''}`}
              onClick={() => handlePollClick(poll)}
            >
              <BarChartOutlined style={{ marginRight: 10, color: '#666', fontSize: 14 }} />
              <span className="sidebar-item-title">{poll.title}</span>
              <span className="sidebar-item-code">{poll.shortCode}</span>
            </div>
          ))}
          
          {polls.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: 13 }}>
              暂无投票
            </div>
          )}
        </div>
        <div className="sidebar-footer">
          <button
            className="sidebar-add-btn"
            onClick={() => onNavChange('create')}
          >
            <PlusOutlined />
            创建投票
          </button>
        </div>
      </div>

      <div className="bottom-nav">
        <div
          className={`bottom-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setCurrentPoll(null);
            onNavChange('dashboard');
          }}
        >
          <DashboardOutlined className="bottom-nav-icon" />
          <span>仪表盘</span>
        </div>
        <div
          className={`bottom-nav-item ${currentView === 'detail' ? 'active' : ''}`}
          onClick={() => {
            if (polls.length > 0) {
              setCurrentPoll(polls[0]);
              onNavChange('detail');
            }
          }}
        >
          <BarChartOutlined className="bottom-nav-icon" />
          <span>统计</span>
        </div>
        <div
          className={`bottom-nav-item ${currentView === 'create' ? 'active' : ''}`}
          onClick={() => onNavChange('create')}
        >
          <PlusOutlined className="bottom-nav-icon" />
          <span>创建</span>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
