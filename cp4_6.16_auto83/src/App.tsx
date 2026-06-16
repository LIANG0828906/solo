import React, { useState, useEffect } from 'react';
import { VoteCard } from './vote/VoteCard';
import { InviteCode } from './vote/InviteCode';
import { useVoteStore } from './vote/store';
import { useCanvasStore } from './canvas/store';
import { CanvasBoard } from './canvas/CanvasBoard';
import { Report } from './Report';
import { ICONS } from './canvas/icons';
import type { IconType } from './vote/types';

type Page = 'home' | 'create' | 'join' | 'vote' | 'canvas' | 'report';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#FFB347', '#87CEEB'
];

const PRESET_ICONS: IconType[] = ['sun', 'star', 'smile', 'flag', 'heart', 'rocket', 'coffee', 'music'];

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [transitionKey, setTransitionKey] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showInviteNotification, setShowInviteNotification] = useState(false);

  const {
    currentVote,
    createVote,
    joinVote,
    endVote,
    closeBroadcastChannel,
    hasVoted,
    currentUserName,
    setUserName
  } = useVoteStore();

  const { closeBroadcastChannel: closeCanvasChannel } = useCanvasStore();

  const navigateTo = (page: Page) => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      setTransitionKey((k) => k + 1);
      setAnimating(false);
    }, 150);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        useCanvasStore.getState().undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLeave = () => {
    closeBroadcastChannel();
    closeCanvasChannel();
    navigateTo('home');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff'
      }}
    >
      <InviteCode showNotification={showInviteNotification} onAnimationComplete={() => setShowInviteNotification(false)} />

      <div
        key={transitionKey}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          opacity: animating ? 0 : 1,
          transform: animating ? 'rotate(-30deg) scale(0.6)' : 'rotate(0deg) scale(1)',
          transformOrigin: 'center center',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'auto'
        }}
      >
        {currentPage === 'home' && <HomePage onNavigate={navigateTo} />}
        {currentPage === 'create' && (
          <CreateVotePage
            onNavigate={navigateTo}
            onCreated={() => {
              setShowInviteNotification(true);
              setTimeout(() => navigateTo('vote'), 2000);
            }}
          />
        )}
        {currentPage === 'join' && <JoinVotePage onNavigate={navigateTo} />}
        {currentPage === 'vote' && (
          <VotePage
            onNavigate={navigateTo}
            onVoteComplete={() => {
              setTimeout(() => navigateTo('canvas'), 1500);
            }}
            onLeave={handleLeave}
          />
        )}
        {currentPage === 'canvas' && (
          <CanvasPage
            onNavigate={navigateTo}
            onLeave={handleLeave}
          />
        )}
        {currentPage === 'report' && <ReportPage onNavigate={navigateTo} onBack={handleLeave} />}
      </div>
    </div>
  );
};

const HomePage: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => (
  <div style={homeContainerStyle}>
    <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎨 🗳️</div>
      <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>
        VoteCanvas
      </h1>
      <p style={{ fontSize: '18px', color: '#666', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
        创建投票、邀请好友、在共享画板上自由涂鸦，
        <br />
        让投票结果与创意碰撞出火花 ✨
      </p>
    </div>

    <div
      className="animate-fade-in-up"
      style={{
        display: 'flex',
        gap: '20px',
        maxWidth: '520px',
        width: '100%',
        animationDelay: '0.1s'
      }}
    >
      <button
        onClick={() => onNavigate('create')}
        style={{
          ...bigButtonStyle,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff'
        }}
      >
        <span style={{ fontSize: '24px', marginBottom: '8px' }}>✏️</span>
        <span style={{ fontSize: '18px', fontWeight: 600 }}>创建投票</span>
        <span style={{ fontSize: '13px', opacity: 0.85 }}>开始一个新的议题</span>
      </button>

      <button
        onClick={() => onNavigate('join')}
        style={{
          ...bigButtonStyle,
          background: '#fff',
          color: '#1a1a1a',
          border: '2px solid #e9ecef'
        }}
      >
        <span style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</span>
        <span style={{ fontSize: '18px', fontWeight: 600 }}>加入投票</span>
        <span style={{ fontSize: '13px', opacity: 0.7 }}>输入邀请码参与</span>
      </button>
    </div>

    <div
      className="animate-fade-in-up"
      style={{
        marginTop: '60px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        maxWidth: '720px',
        width: '100%',
        animationDelay: '0.2s'
      }}
    >
      {[
        { icon: '🗳️', title: '自由投票', desc: '创建2-4个选项，自由投票' },
        { icon: '🎨', title: '实时画板', desc: '画笔、贴纸、文字气泡创意涂鸦' },
        { icon: '📊', title: '可视化报告', desc: '投票结果+画板创意一键导出' }
      ].map((f, i) => (
        <div
          key={i}
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: '#fafafa',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: '#1a1a1a' }}>
            {f.title}
          </div>
          <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{f.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

const CreateVotePage: React.FC<{
  onNavigate: (p: Page) => void;
  onCreated: () => void;
}> = ({ onNavigate, onCreated }) => {
  const { createVote, setUserName, currentUserName } = useVoteStore();
  const [title, setTitle] = useState('下次团建去哪里？');
  const [description, setDescription] = useState('快来投票选择你最想去的团建地点！');
  const [options, setOptions] = useState<Array<{ text: string; color: string; icon: IconType }>>([
    { text: '海边度假', color: '#45B7D1', icon: 'sun' },
    { text: '山野露营', color: '#96CEB4', icon: 'star' },
    { text: '城市探索', color: '#FF6B6B', icon: 'flag' },
    { text: '主题乐园', color: '#FFB347', icon: 'smile' }
  ]);
  const [name, setName] = useState(currentUserName);

  const handleAddOption = () => {
    if (options.length >= 4) return;
    const unusedColors = PRESET_COLORS.filter((c) => !options.some((o) => o.color === c));
    const unusedIcons = PRESET_ICONS.filter((i) => !options.some((o) => o.icon === i));
    setOptions([
      ...options,
      {
        text: '',
        color: unusedColors[0] || '#999',
        icon: unusedIcons[0] || 'star'
      }
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleUpdateOption = (idx: number, changes: Partial<{ text: string; color: string; icon: IconType }>) => {
    setOptions(options.map((o, i) => (i === idx ? { ...o, ...changes } : o)));
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) return;
    if (name.trim()) setUserName(name.trim());

    createVote(title.trim(), description.trim(), validOptions);
    onCreated();
  };

  const canCreate = title.trim() && options.filter((o) => o.text.trim()).length >= 2;

  return (
    <div style={pageContainerStyle}>
      <div className="animate-fade-in-up" style={{ maxWidth: '640px', width: '100%' }}>
        <button
          onClick={() => onNavigate('home')}
          style={{ marginBottom: '24px', fontSize: '14px', color: '#666' }}
        >
          ← 返回首页
        </button>

        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0'
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>创建新投票</h1>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>你的昵称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的昵称"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>投票标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：下次团建去哪里"
              style={inputStyle}
              maxLength={50}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>投票描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加一些补充说明..."
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
              maxLength={200}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>投票选项 ({options.length}/4)</label>
              <button
                onClick={handleAddOption}
                disabled={options.length >= 4}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: options.length >= 4 ? '#f0f0f0' : '#e6f4ff',
                  color: options.length >= 4 ? '#999' : '#1890ff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: options.length >= 4 ? 'not-allowed' : 'pointer'
                }}
              >
                + 添加选项
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: `${opt.color}10`,
                    border: `2px solid ${opt.color}30`,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'all 200ms'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `${opt.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    dangerouslySetInnerHTML={{
                      __html: ICONS[opt.icon]?.(24, opt.color) || ''
                    }}
                  />

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      value={opt.text}
                      onChange={(e) => handleUpdateOption(idx, { text: e.target.value })}
                      placeholder={`选项 ${idx + 1}`}
                      style={{
                        ...inputStyle,
                        padding: '8px 12px',
                        fontSize: '14px',
                        background: '#fff'
                      }}
                      maxLength={30}
                    />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>配色:</span>
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleUpdateOption(idx, { color: c })}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: c,
                            border: opt.color === c ? '2px solid #333' : '2px solid #fff',
                            boxShadow: opt.color === c ? '0 0 0 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 150ms'
                          }}
                        />
                      ))}
                      <div style={{ width: '1px', height: '16px', background: '#e0e0e0', margin: '0 4px' }} />
                      <span style={{ fontSize: '12px', color: '#888' }}>图标:</span>
                      {PRESET_ICONS.map((ic) => (
                        <button
                          key={ic}
                          onClick={() => handleUpdateOption(idx, { icon: ic })}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: opt.icon === ic ? '#fff' : 'transparent',
                            border: opt.icon === ic ? `2px solid ${opt.color}` : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 150ms'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: ICONS[ic]?.(18, opt.color) || ''
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(idx)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#fff',
                        color: '#ff4d4f',
                        fontSize: '16px',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              background: canCreate
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#d9d9d9',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: canCreate ? 'pointer' : 'not-allowed',
              boxShadow: canCreate ? '0 4px 16px rgba(102, 126, 234, 0.35)' : 'none',
              transition: 'all 200ms'
            }}
          >
            🚀 创建投票并生成邀请码
          </button>
        </div>
      </div>
    </div>
  );
};

const JoinVotePage: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => {
  const { joinVote, setUserName, currentUserName } = useVoteStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState(currentUserName);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      setError('请输入6位邀请码');
      return;
    }
    if (name.trim()) setUserName(name.trim());

    const vote = joinVote(code.trim());
    if (!vote) {
      setError('未找到该投票，请检查邀请码');
      return;
    }
    onNavigate('vote');
  };

  return (
    <div style={pageContainerStyle}>
      <div className="animate-fade-in-up" style={{ maxWidth: '440px', width: '100%' }}>
        <button onClick={() => onNavigate('home')} style={{ marginBottom: '24px', fontSize: '14px', color: '#666' }}>
          ← 返回首页
        </button>

        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '36px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>加入投票</h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '28px' }}>
            输入邀请码即可参与投票和画板创作
          </p>

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={labelStyle}>你的昵称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的昵称"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '12px', textAlign: 'left' }}>
            <label style={labelStyle}>邀请码</label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="输入6位邀请码"
              style={{
                ...inputStyle,
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '12px',
                textAlign: 'center',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}
              maxLength={6}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#cf1322',
                marginBottom: '16px'
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={code.trim().length !== 6}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              background: code.trim().length === 6
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#d9d9d9',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: code.trim().length === 6 ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: code.trim().length === 6 ? '0 4px 16px rgba(102, 126, 234, 0.35)' : 'none'
            }}
          >
            加入投票
          </button>
        </div>
      </div>
    </div>
  );
};

const VotePage: React.FC<{
  onNavigate: (p: Page) => void;
  onVoteComplete?: () => void;
  onLeave: () => void;
}> = ({ onNavigate, onVoteComplete, onLeave }) => {
  const { currentVote, hasVoted, currentUserName, endVote } = useVoteStore();

  if (!currentVote) {
    return (
      <div style={pageContainerStyle}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', color: '#666' }}>未找到投票信息</p>
          <button onClick={onLeave} style={primaryBtnStyle}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isCreator = currentVote.creatorId === localStorage.getItem('voteCanvas_userId');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={topBarStyle}>
        <button onClick={onLeave} style={linkBtnStyle}>
          ← 离开
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <InviteCode />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>👤 {currentUserName}</span>
          {hasVoted && (
            <button
              onClick={() => onNavigate('canvas')}
              style={{ ...primaryBtnStyle, padding: '8px 18px', fontSize: '13px' }}
            >
              进入画板 →
            </button>
          )}
          {isCreator && currentVote.status === 'active' && (
            <button
              onClick={() => {
                endVote();
                onNavigate('report');
              }}
              style={{
                ...secondaryBtnStyle,
                padding: '8px 18px',
                fontSize: '13px'
              }}
            >
              结束投票
            </button>
          )}
          {currentVote.status === 'ended' && (
            <button
              onClick={() => onNavigate('report')}
              style={{ ...primaryBtnStyle, padding: '8px 18px', fontSize: '13px' }}
            >
              查看报告
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <VoteCard onVoteComplete={onVoteComplete} />
      </div>
    </div>
  );
};

const CanvasPage: React.FC<{
  onNavigate: (p: Page) => void;
  onLeave: () => void;
}> = ({ onNavigate, onLeave }) => {
  const { currentVote, currentUserName, endVote } = useVoteStore();
  const isCreator = currentVote?.creatorId === localStorage.getItem('voteCanvas_userId');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={topBarStyle}>
        <button onClick={onLeave} style={linkBtnStyle}>
          ← 离开
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>
            {currentVote?.title || '共享画板'}
          </div>
          <InviteCode />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>👤 {currentUserName}</span>
          <button onClick={() => onNavigate('vote')} style={secondaryBtnStyle}>
            投票
          </button>
          {isCreator && currentVote?.status === 'active' && (
            <button
              onClick={() => {
                endVote();
                onNavigate('report');
              }}
              style={{ ...secondaryBtnStyle, background: '#fff7e6', color: '#d48806', border: '1px solid #ffd591' }}
            >
              结束投票
            </button>
          )}
          {currentVote?.status === 'ended' && (
            <button
              onClick={() => onNavigate('report')}
              style={primaryBtnStyle}
            >
              查看报告
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CanvasBoard />
      </div>
    </div>
  );
};

const ReportPage: React.FC<{
  onNavigate: (p: Page) => void;
  onBack: () => void;
}> = ({ onBack }) => {
  return <Report onBack={onBack} />;
};

const homeContainerStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 24px',
  background: 'linear-gradient(180deg, #fafbff 0%, #ffffff 100%)'
};

const pageContainerStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px 24px',
  background: '#fafafa'
};

const bigButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px 24px',
  borderRadius: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  cursor: 'pointer'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#555',
  marginBottom: '8px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '2px solid #e9ecef',
  fontSize: '15px',
  color: '#1a1a1a',
  background: '#fafafa',
  transition: 'all 200ms'
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  background: '#fff',
  borderBottom: '1px solid #f0f0f0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  flexShrink: 0,
  zIndex: 50
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  transition: 'all 200ms',
  cursor: 'pointer'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '12px',
  background: '#fff',
  color: '#555',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid #e9ecef',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  transition: 'all 200ms',
  cursor: 'pointer'
};

const linkBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#555',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'all 200ms'
};

export default App;
