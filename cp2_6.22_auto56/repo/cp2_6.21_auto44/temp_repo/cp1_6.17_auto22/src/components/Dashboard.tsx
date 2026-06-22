import { useNavigate } from 'react-router-dom';
import { usePollStore, Poll } from '../pollStore';
import { UserOutlined, CalendarOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const Dashboard = () => {
  const polls = usePollStore(s => s.polls);
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {polls.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: '#999',
          }}
        >
          <QuestionCircleOutlined style={{ fontSize: 64, marginBottom: 16, color: '#ccc' }} />
          <div style={{ fontSize: 18, marginBottom: 8 }}>还没有创建投票</div>
          <div style={{ fontSize: 14 }}>点击右上角"创建投票"按钮开始</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {polls.map((poll: Poll, index: number) => (
            <div
              key={poll.id}
              onClick={() => navigate(`/poll/${poll.id}`)}
              style={{
                background: '#FFFFFF',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                padding: 20,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                animation: `fadeIn 0.5s ease ${index * 0.05}s both`,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#333', lineHeight: 1.4, flex: 1 }}>
                  {poll.title}
                </div>
                <div
                  style={{
                    background: poll.isClosed ? '#F44336' : '#4CAF50',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    marginLeft: 12,
                    letterSpacing: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {poll.shortCode}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: 13 }}>
                  <UserOutlined style={{ marginRight: 6, color: '#3F51B5' }} />
                  <span style={{ fontWeight: 600, color: '#333' }}>{poll.voteCount ?? 0}</span>
                  <span style={{ marginLeft: 4 }}>人参与</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: 13 }}>
                  <QuestionCircleOutlined style={{ marginRight: 6, color: '#FF4081' }} />
                  {poll.questionCount ?? poll.questions?.length ?? 0} 题
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#999', fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 6 }} />
                {formatDate(poll.createdAt)}
              </div>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 10px',
                    borderRadius: 10,
                    background: poll.isClosed ? '#FFEBEE' : '#E8F5E9',
                    color: poll.isClosed ? '#F44336' : '#4CAF50',
                    fontWeight: 500,
                  }}
                >
                  {poll.isClosed ? '已结束' : '进行中'}
                </span>
                <span style={{ color: '#3F51B5', fontSize: 13, fontWeight: 500 }}>
                  查看详情 →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
