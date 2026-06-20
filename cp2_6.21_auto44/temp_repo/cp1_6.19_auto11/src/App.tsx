import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CreateVote } from '@/components/CreateVote';
import { VoteRoom } from '@/components/VoteRoom';
import { VoteCard } from '@/components/VoteCard';
import { Toast } from '@/components/Toast';

function HomePage({ ws }: { ws: ReturnType<typeof useWebSocket> }) {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      navigate(`/vote/${joinRoomId.trim().toUpperCase()}`);
      setJoinRoomId('');
    }
  };

  return (
    <div style={homeContainerStyle}>
      <header className="app-header" style={headerStyle}>
        <div style={logoAreaStyle}>
          <span style={logoIconStyle}>📊</span>
          <div>
            <h1 style={appTitleStyle}>实时课堂投票</h1>
            <p style={appSubtitleStyle}>互动课堂 · 实时反馈 · 数据可视化</p>
          </div>
        </div>

        <div style={headerActionsStyle}>
          <div style={joinFormStyle}>
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="输入房间ID..."
              style={roomInputStyle}
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button onClick={handleJoinRoom} style={joinBtnStyle}>
              加入投票
            </button>
          </div>

          <div style={connectionBadgeStyle}>
            <span
              style={{
                ...statusDotBigStyle,
                background: ws.connected ? '#4ade80' : '#ef4444',
                animation: ws.connected ? 'none' : 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={connectionTextStyle}>
              {ws.connected ? '服务已连接' : '连接中...'}
            </span>
          </div>
        </div>
      </header>

      <main className="app-main" style={mainContentStyle}>
        <section style={topSectionStyle}>
          <div style={topSectionHeaderStyle}>
            <h2 style={sectionHeadingStyle}>
              {showCreateForm ? '✏️ 创建新投票' : '🚀 开始互动'}
            </h2>
            {!showCreateForm && (
              <button onClick={() => setShowCreateForm(true)} style={createBtnStyle}>
                <span style={btnIconStyle}>+</span>
                创建投票
              </button>
            )}
            {showCreateForm && (
              <button onClick={() => setShowCreateForm(false)} style={cancelBtnStyle}>
                ✕ 取消
              </button>
            )}
          </div>

          {showCreateForm ? (
            <CreateVote
              onCreate={(data) => {
                ws.sendCreateVote(data);
                setShowCreateForm(false);
              }}
            />
          ) : (
            <div style={welcomeCardStyle}>
              <div style={welcomeContentStyle}>
                <div style={welcomeIconStyle}>🎯</div>
                <h3 style={welcomeTitleStyle}>提升课堂互动体验</h3>
                <p style={welcomeDescStyle}>
                  讲师可以快速创建投票，学生通过房间ID加入，结果实时呈现并可视化展示。
                  每轮投票独立计时，支持多轮投票同时进行。
                </p>
                <div style={featureListStyle}>
                  <div style={featureItemStyle}>
                    <span style={featureEmojiStyle}>⚡</span>
                    <div>
                      <span style={featureTitleStyle}>实时反馈</span>
                      <span style={featureDescStyle}>结果100ms内同步显示</span>
                    </div>
                  </div>
                  <div style={featureItemStyle}>
                    <span style={featureEmojiStyle}>📊</span>
                    <div>
                      <span style={featureTitleStyle}>数据可视化</span>
                      <span style={featureDescStyle}>柱状图 + 圆环图动画</span>
                    </div>
                  </div>
                  <div style={featureItemStyle}>
                    <span style={featureEmojiStyle}>🔒</span>
                    <div>
                      <span style={featureTitleStyle}>防重复投票</span>
                      <span style={featureDescStyle}>IP + Session双重校验</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section style={listSectionStyle}>
          <div style={listHeaderStyle}>
            <h2 style={sectionHeadingStyle}>📋 投票列表</h2>
            <span style={voteCountStyle}>
              共 {ws.votes.length} 个投票
            </span>
          </div>

          {ws.votes.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>📭</div>
              <h3 style={emptyTitleStyle}>暂无投票</h3>
              <p style={emptyDescStyle}>
                点击上方"创建投票"按钮开始创建第一个投票吧！
              </p>
            </div>
          ) : (
            <div className="vote-grid" style={voteGridStyle}>
              {ws.votes.map((vote) => (
                <VoteCard key={vote.roomId} vote={vote} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer style={footerStyle}>
        <span style={footerTextStyle}>© 2026 实时课堂投票系统 · 让每节课都更精彩</span>
      </footer>
    </div>
  );
}

export default function App() {
  const ws = useWebSocket();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage ws={ws} />} />
        <Route path="/vote/:roomId" element={<VoteRoom ws={ws} />} />
      </Routes>
      <Toast toasts={ws.toasts} onDismiss={ws.dismissToast} />
    </Router>
  );
}

const homeContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  animation: 'fadeIn 0.3s ease-out',
};

const headerStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  padding: '16px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
  borderBottom: '1px solid var(--border-color)',
  flexWrap: 'wrap',
  gap: '16px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const logoAreaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
};

const logoIconStyle: React.CSSProperties = {
  fontSize: '40px',
  filter: 'drop-shadow(0 2px 8px rgba(233, 69, 96, 0.3))',
};

const appTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  letterSpacing: '-0.5px',
  lineHeight: 1.2,
};

const appSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginTop: '2px',
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

const joinFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '6px',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
};

const roomInputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  width: '120px',
  textTransform: 'uppercase',
};

const joinBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const connectionBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '8px 14px',
  borderRadius: '20px',
  border: '1px solid var(--border-color)',
};

const statusDotBigStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
};

const connectionTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px',
  maxWidth: '1600px',
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const topSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const topSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const createBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '10px 20px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s ease',
};

const btnIconStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  lineHeight: 1,
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  fontSize: '13px',
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const welcomeCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  overflow: 'hidden',
  position: 'relative',
};

const welcomeContentStyle: React.CSSProperties = {
  padding: '40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '20px',
  background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.08) 0%, rgba(22, 33, 62, 0) 60%)',
};

const welcomeIconStyle: React.CSSProperties = {
  fontSize: '56px',
  filter: 'drop-shadow(0 4px 12px rgba(233, 69, 96, 0.3))',
};

const welcomeTitleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  letterSpacing: '-0.5px',
};

const welcomeDescStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  maxWidth: '560px',
  lineHeight: 1.6,
};

const featureListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: '8px',
};

const featureItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '14px 20px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  minWidth: '240px',
};

const featureEmojiStyle: React.CSSProperties = {
  fontSize: '28px',
};

const featureTitleStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const featureDescStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginTop: '2px',
};

const listSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  flex: 1,
};

const listHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
};

const voteCountStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '6px 14px',
  borderRadius: '20px',
};

const emptyStateStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: '64px 32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  boxShadow: 'var(--shadow)',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '64px',
  opacity: 0.5,
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const emptyDescStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-muted)',
  textAlign: 'center',
};

const voteGridStyle: React.CSSProperties = {
  gap: '20px',
};

const footerStyle: React.CSSProperties = {
  padding: '20px 32px',
  borderTop: '1px solid var(--border-color)',
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
};
