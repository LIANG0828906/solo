import { useEffect, useRef, useState } from 'react';
import type { User, ChatMessage } from './types';

interface Props {
  users: User[];
  messages: ChatMessage[];
  chatInput: string;
  onChatInput: (v: string) => void;
  onChatSend: () => void;
  userId: string;
  open: boolean;
  onToggle: () => void;
}

export default function ChatPanel({
  users,
  messages,
  chatInput,
  onChatInput,
  onChatSend,
  userId,
  open,
  onToggle,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sortedUsers = [...users].sort((a, b) => b.wordCount - a.wordCount);

  const panelContent = (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>在线诗友</h3>
        <div style={styles.userList}>
          {sortedUsers.map(u => (
            <div key={u.id} style={styles.userRow}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: u.online ? '#4ade80' : 'transparent',
                  border: u.online ? 'none' : '2px solid #888',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: u.id === userId ? '#a78bfa' : '#ccc', fontSize: 13 }}>
                {u.nickname}
              </span>
              <span style={{ color: '#888', fontSize: 11, marginLeft: 'auto' }}>
                {u.wordCount}词
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.section, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <h3 style={styles.sectionTitle}>诗友畅聊</h3>
        <div style={styles.chatList}>
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                ...styles.chatMsg,
                animation: 'chatSlideIn 0.2s ease-out',
              }}
            >
              <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>
                {m.nickname}
              </span>
              <span style={{ color: '#ddd', fontSize: 13, marginLeft: 6 }}>
                {m.text}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={styles.chatInputRow}>
          <input
            style={styles.chatInput}
            value={chatInput}
            onChange={e => onChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onChatSend()}
            placeholder="说点什么..."
          />
          <button style={styles.chatSendBtn} onClick={onChatSend}>
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes chatSlideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            bottom: open ? 0 : undefined,
            right: 0,
            left: 0,
            height: open ? '55vh' : 0,
            background: 'rgba(15,12,41,0.95)',
            backdropFilter: 'blur(10px)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            transition: 'height 0.3s ease',
            overflow: 'hidden',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            padding: open ? 12 : 0,
          }}
        >
          {panelContent}
        </div>
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            bottom: 12,
            right: 12,
            zIndex: 11,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124,92,252,0.4)',
          }}
        >
          💬
        </button>
      </>
    );
  }

  return (
    <div
      style={{
        width: 260,
        height: '100%',
        background: 'rgba(15,12,41,0.6)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {panelContent}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    letterSpacing: 2,
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingRight: 4,
    minHeight: 0,
  },
  chatMsg: {
    padding: '4px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  chatInputRow: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  chatInput: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 13,
    outline: 'none',
  },
  chatSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
