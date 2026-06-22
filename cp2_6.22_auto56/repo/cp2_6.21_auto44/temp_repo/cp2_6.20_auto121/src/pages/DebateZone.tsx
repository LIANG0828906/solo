import React, { useState, useRef, useEffect } from 'react';
import { useDebateStore } from '../stores/debateStore';
import { useUserStore } from '../stores/userStore';

interface DebateMessage {
  id: string;
  author: string;
  authorId: string;
  content: string;
  side: 'pro' | 'con';
  timestamp: number;
}

interface Debate {
  id: string;
  title: string;
  starter: string;
  participants: number;
  lastReply: string;
  proMessages: DebateMessage[];
  conMessages: DebateMessage[];
}

const DebateZone: React.FC = () => {
  const { debates, addMessage } = useDebateStore();
  const user = useUserStore((s) => s.user);
  const [activeDebate, setActiveDebate] = useState<string | null>(null);
  const [joinedSide, setJoinedSide] = useState<'pro' | 'con' | null>(null);
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const proMessagesRef = useRef<HTMLDivElement>(null);
  const conMessagesRef = useRef<HTMLDivElement>(null);

  const debate = debates.find((d) => d.id === activeDebate);

  useEffect(() => {
    if (proMessagesRef.current) {
      proMessagesRef.current.scrollTop = proMessagesRef.current.scrollHeight;
    }
    if (conMessagesRef.current) {
      conMessagesRef.current.scrollTop = conMessagesRef.current.scrollHeight;
    }
  }, [debate]);

  const handleSend = (side: 'pro' | 'con') => {
    const input = side === 'pro' ? proInput : conInput;
    if (!input.trim() || !activeDebate) return;
    addMessage(activeDebate, {
      id: `msg-${Date.now()}`,
      author: user?.nickname || '匿名',
      authorId: user?.id || '',
      content: input.trim(),
      side,
      timestamp: Date.now(),
    });
    if (side === 'pro') setProInput('');
    else setConInput('');
  };

  const renderMentions = (text: string) => {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="mention-highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (debate) {
    const proMessages = debate.proMessages;
    const conMessages = debate.conMessages;

    return (
      <div>
        <button className="back-btn" onClick={() => { setActiveDebate(null); setJoinedSide(null); }}>
          ← 返回辩论列表
        </button>
        <h2 style={{ fontSize: 20, color: '#2c3e50', marginBottom: 16, textAlign: 'center' }}>
          {debate.title}
        </h2>
        <div className="debate-room">
          <div className="debate-side debate-side-pro">
            <div className="debate-side-header" style={{ color: '#2980b9' }}>
              🛡️ 正方观点
              {!joinedSide && (
                <button className="debate-join-btn debate-join-pro" style={{ marginLeft: 12 }} onClick={() => setJoinedSide('pro')}>
                  加入正方
                </button>
              )}
            </div>
            <div className="debate-messages" ref={proMessagesRef}>
              {proMessages.map((msg) => (
                <div key={msg.id} className="debate-bubble debate-bubble-pro">
                  <div className="debate-bubble-author">{msg.author}</div>
                  <div>{renderMentions(msg.content)}</div>
                </div>
              ))}
            </div>
            {joinedSide && (
              <div className="debate-input-area">
                <input
                  className="debate-input"
                  value={proInput}
                  onChange={(e) => setProInput(e.target.value)}
                  placeholder="输入正方观点（@提及用户）..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend('pro')}
                />
                <button className="debate-send-btn" onClick={() => handleSend('pro')}>
                  发送
                </button>
              </div>
            )}
          </div>
          <div className="debate-divider" />
          <div className="debate-side debate-side-con">
            <div className="debate-side-header" style={{ color: '#c0392b' }}>
              ⚔️ 反方观点
              {!joinedSide && (
                <button className="debate-join-btn debate-join-con" style={{ marginLeft: 12 }} onClick={() => setJoinedSide('con')}>
                  加入反方
                </button>
              )}
            </div>
            <div className="debate-messages" ref={conMessagesRef}>
              {conMessages.map((msg) => (
                <div key={msg.id} className="debate-bubble debate-bubble-con">
                  <div className="debate-bubble-author">{msg.author}</div>
                  <div>{renderMentions(msg.content)}</div>
                </div>
              ))}
            </div>
            {joinedSide && (
              <div className="debate-input-area">
                <input
                  className="debate-input"
                  value={conInput}
                  onChange={(e) => setConInput(e.target.value)}
                  placeholder="输入反方观点（@提及用户）..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend('con')}
                />
                <button className="debate-send-btn" onClick={() => handleSend('con')}>
                  发送
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">辩论区</h1>
      </div>
      <div className="debate-list">
        {debates.map((d) => (
          <div key={d.id} className="debate-card" onClick={() => setActiveDebate(d.id)}>
            <div className="debate-card-title">{d.title}</div>
            <div className="debate-card-meta">
              <span>发起人: {d.starter}</span>
              <span>👥 {d.participants}人参与</span>
              <span>🕐 {d.lastReply}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebateZone;
