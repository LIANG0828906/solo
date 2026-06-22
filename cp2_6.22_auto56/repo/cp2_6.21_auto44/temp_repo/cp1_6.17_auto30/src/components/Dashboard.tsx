import { usePollStore } from '../pollStore';
import { PlusOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface DashboardProps {
  onViewDetail: () => void;
  onCreatePoll: () => void;
}

function Dashboard({ onViewDetail, onCreatePoll }: DashboardProps) {
  const { polls, setCurrentPoll } = usePollStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCardClick = (poll: typeof polls[0]) => {
    setCurrentPoll(poll);
    onViewDetail();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <div className="page-actions">
          <button className="btn-primary" onClick={onCreatePoll}>
            <PlusOutlined />
            新建投票
          </button>
        </div>
      </div>

      <div className="card-grid">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="poll-card"
            onClick={() => handleCardClick(poll)}
          >
            <div className="poll-card-title">{poll.title}</div>
            <div className="poll-card-meta">
              <div className="poll-card-count">
                <UserOutlined />
                {poll.voteCount || 0} 人参与
              </div>
              <span className={`poll-card-status ${poll.closed ? 'closed' : 'active'}`}>
                {poll.closed ? '已结束' : '进行中'}
              </span>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ClockCircleOutlined style={{ fontSize: 12 }} />
              {formatDate(poll.createdAt)}
            </div>
          </div>
        ))}
        
        {polls.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>还没有投票</div>
            <div style={{ fontSize: 13 }}>点击右上角按钮创建你的第一个投票</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
