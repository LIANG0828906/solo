import React, { useEffect } from 'react';
import { usePollStore } from '../pollStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useState } from 'react';

const Dashboard: React.FC = () => {
  const { polls, fetchPolls, setCurrentPoll } = usePollStore();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleCardClick = (poll: typeof polls[0]) => {
    setCurrentPoll(poll);
    navigate(`/poll/${poll.id}`);
  };

  const handleCopyCode = async (e: React.MouseEvent, shortCode: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shortCode);
      setCopiedCode(shortCode);
      message.success('短码已复制到剪贴板');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      message.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>我的投票</h2>
        <p style={{ color: '#666', margin: 0 }}>管理和查看所有投票问卷的实时结果</p>
      </div>
      <div className="dashboard-grid">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="poll-card"
            onClick={() => handleCardClick(poll)}
          >
            <div style={{ marginBottom: '12px' }}>
              <span
                className="short-code-badge"
                onClick={(e) => handleCopyCode(e, poll.shortCode)}
                title="点击复制"
              >
                {copiedCode === poll.shortCode ? (
                  <CheckOutlined style={{ fontSize: '12px' }} />
                ) : (
                  <CopyOutlined style={{ fontSize: '12px', marginRight: '4px' }} />
                )}
                <span style={{ marginLeft: copiedCode === poll.shortCode ? '4px' : '4px' }}>
                  {poll.shortCode}
                </span>
              </span>
            </div>
            <div className="poll-card-title">{poll.title}</div>
            <div className="poll-card-meta">
              <span>{poll.votes.length} 人参与</span>
              <span>{dayjs(poll.createdAt).format('MM-DD HH:mm')}</span>
            </div>
            {poll.closed && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#F44336',
                  fontWeight: 500,
                }}
              >
                已结束
              </div>
            )}
          </div>
        ))}
      </div>
      {polls.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p>还没有投票，点击左上角按钮创建一个吧</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
