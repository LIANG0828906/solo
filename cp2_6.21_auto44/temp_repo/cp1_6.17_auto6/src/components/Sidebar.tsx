import React from 'react';
import { usePollStore } from '../pollStore';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const Sidebar: React.FC = () => {
  const { polls, currentPoll, setCurrentPoll } = usePollStore();
  const navigate = useNavigate();

  const handlePollClick = (poll: typeof polls[0]) => {
    setCurrentPoll(poll);
    navigate(`/poll/${poll.id}`);
  };

  const handleCreateClick = () => {
    navigate('/create');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-box">QP</div>
      </div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E0E0E0' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
          style={{ width: '100%', borderRadius: 20 }}
        >
          创建投票
        </Button>
      </div>
      <div className="sidebar-menu">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className={`sidebar-item ${currentPoll?.id === poll.id ? 'active' : ''}`}
            onClick={() => handlePollClick(poll)}
          >
            <span className="sidebar-item-code">{poll.shortCode}</span>
            <span className="sidebar-item-title">{poll.title}</span>
          </div>
        ))}
        {polls.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
            暂无投票
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
