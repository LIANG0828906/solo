import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { RoomEntry } from './modules/RoomEntry';
import { BrainstormBoard } from './modules/brainstorm/BrainstormBoard';
import { VotingPanel } from './modules/voting/VotingPanel';
import { useIdeasStore } from './store/ideasStore';

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { ideas, currentUser, cleanup } = useIdeasStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!currentUser && roomId) {
      navigate('/');
    }
  }, [currentUser, roomId, navigate]);

  const handleGenerateReport = () => {
    navigate(`/room/${roomId}/report`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="room-layout">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          height: '52px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px' }}>💡</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              房间: {roomId}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2px solid rgba(249, 115, 22, 0.5)',
            }}
          />
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{currentUser.name}</span>
          <button
            onClick={() => {
              cleanup();
              navigate('/');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
              marginLeft: '8px',
            }}
          >
            退出
          </button>
        </div>
      </div>

      <div className="room-content" style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div
          className="room-main"
          style={{
            width: isMobile ? '100%' : '70%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <BrainstormBoard />
        </div>

        {!isMobile && (
          <div
            style={{
              width: '1px',
              background: 'rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          />
        )}

        {!isMobile && (
          <div
            className="room-sidebar"
            style={{
              width: '30%',
              height: '100%',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <VotingPanel onGenerateReport={handleGenerateReport} />
          </div>
        )}

        {isMobile && (
          <>
            <button
              className="mobile-vote-fab"
              onClick={() => setShowMobilePanel(true)}
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
                zIndex: 99,
              }}
            >
              📊
            </button>

            {showMobilePanel && (
              <div
                className="mobile-drawer-overlay"
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  onClick={() => setShowMobilePanel(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.5)',
                  }}
                />
                <div
                  className="mobile-drawer"
                  style={{
                    maxHeight: '75vh',
                    background: '#111827',
                    borderRadius: '20px 20px 0 0',
                    overflow: 'hidden',
                    animation: 'slideUpDown 0.3s ease-out',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '4px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '2px',
                      margin: '10px auto',
                    }}
                  />
                  <VotingPanel
                    onGenerateReport={() => {
                      setShowMobilePanel(false);
                      handleGenerateReport();
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ReportPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { ideas, currentUser } = useIdeasStore();

  const top3 = [...ideas]
    .sort((a, b) => b.votes.agree + b.votes.neutral - (a.votes.agree + a.votes.neutral))
    .slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];

  const ADMIN_COMMENTS = [
    '此方案具备较高的可行性，建议优先推进落地。',
    '创意新颖，市场潜力大，可作为下一阶段重点项目。',
    '思路清晰，落地路径明确，建议进一步完善细节。',
  ];

  const totalVotes = ideas.reduce(
    (acc, i) => acc + i.votes.agree + i.votes.disagree + i.votes.neutral,
    0
  );

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
        padding: '24px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#cbd5e1',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ← 返回房间
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
            }}
          >
            🖨️ 打印报告
          </button>
        </div>

        <div
          id="report-content"
          style={{
            background: '#fdf6e3',
            borderRadius: '16px',
            padding: '48px 56px',
            color: '#334155',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '24px', borderBottom: '2px solid #d97706' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                头脑风暴 TOP 3 创意报告
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                房间号: {roomId} · 共 {ideas.length} 个点子 · {totalVotes} 票
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                生成时间: {new Date().toLocaleString('zh-CN')}
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, padding: '16px 20px', background: 'rgba(217, 119, 6, 0.08)', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.15)' }}>
                <strong style={{ color: '#92400e' }}>评审概述：</strong>
                本次头脑风暴共收集到 {ideas.length} 个创意方案，经过团队成员 {totalVotes} 次投票评选，
                以下三个方案凭借较高的认可度脱颖而出，建议作为后续迭代的重点方向。
              </div>
            </div>

            {top3.map((idea, idx) => {
              const total = idea.votes.agree + idea.votes.disagree + idea.votes.neutral;
              const agreeRate = total > 0 ? Math.round((idea.votes.agree / total) * 100) : 0;
              return (
                <div
                  key={idea.id}
                  style={{
                    marginBottom: '32px',
                    padding: '24px',
                    borderRadius: '16px',
                    background: idx === 0
                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))'
                      : idx === 1
                      ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(100, 116, 139, 0.05))'
                      : 'linear-gradient(135deg, rgba(180, 83, 9, 0.1), rgba(146, 64, 14, 0.05))',
                    border: `1px solid ${
                      idx === 0 ? 'rgba(245, 158, 11, 0.3)' : idx === 1 ? 'rgba(148, 163, 184, 0.3)' : 'rgba(180, 83, 9, 0.3)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '44px' }}>{medals[idx]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '4px' }}>第 {idx + 1} 名</div>
                      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{idea.title}</h2>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <img src={idea.author.avatar} alt={idea.author.name} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #d97706' }} />
                    <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>作者：{idea.author.name}</span>
                    {idea.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                        {idea.tags.map((t) => (
                          <span key={t} style={{ fontSize: '11px', color: '#92400e', background: 'rgba(217, 119, 6, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7, marginBottom: '16px' }}>
                    {idea.description || '暂无详细描述'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.12)', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#15803d', marginBottom: '4px' }}>👍 赞成</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#166534' }}>{idea.votes.agree}</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.12)', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#a16207', marginBottom: '4px' }}>🍉 吃瓜</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#854d0e' }}>{idea.votes.neutral}</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#b91c1c', marginBottom: '4px' }}>👎 反对</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#991b1b' }}>{idea.votes.disagree}</div>
                    </div>
                  </div>

                  {total > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                        <span>赞成率</span>
                        <span style={{ fontWeight: 600, color: '#166534' }}>{agreeRate}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${agreeRate}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600, marginBottom: '6px' }}>💼 管理员评语</div>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: 0 }}>{ADMIN_COMMENTS[idx]}</p>
                  </div>
                </div>
              );
            })}

            {top3.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <p>暂无足够数据生成报告</p>
              </div>
            )}

            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #d97706', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              本报告由创意头脑风暴系统自动生成 · {currentUser?.name || '管理员'} 审阅
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoomEntry />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="/room/:roomId/report" element={<ReportPage />} />
    </Routes>
  );
}
