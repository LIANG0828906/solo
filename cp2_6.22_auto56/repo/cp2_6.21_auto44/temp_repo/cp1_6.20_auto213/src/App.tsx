import { useCallback, useEffect, useRef, useState } from 'react';
import type { WordEntry, User, ChatMessage, WSMessage } from './types';
import WordBoard from './WordBoard';
import WordCloud from './WordCloud';
import ChatPanel from './ChatPanel';

const NICKNAMES = [
  '诗仙', '词客', '墨客', '吟者', '骚人',
  '才子', '佳人', '隐士', '书生', '画师',
  '琴师', '剑客', '茶人', '棋手', '花匠',
];

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function App() {
  const [userId] = useState(() => genId());
  const [nickname] = useState(() => NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)] + Math.floor(Math.random() * 100));
  const [words, setWords] = useState<WordEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', userId, nickname }));
    };

    ws.onmessage = (ev) => {
      const msg: WSMessage = JSON.parse(ev.data);
      switch (msg.type) {
        case 'init':
          setWords(msg.words);
          setUsers(msg.users);
          setMessages(msg.messages);
          break;
        case 'word_list':
          setWords(msg.words);
          break;
        case 'word_update':
          setWords(prev => prev.map(w => w.id === msg.word.id ? msg.word : w));
          break;
        case 'word_removed':
          setWords(prev => prev.map(w => w.id === msg.wordId ? { ...w, removed: true } : w));
          setTimeout(() => {
            setWords(prev => prev.filter(w => w.id !== msg.wordId));
          }, 800);
          break;
        case 'add_word':
          setWords(prev => [...prev, {
            id: msg.wordId,
            text: msg.text,
            userId: msg.userId,
            likes: 0,
            dislikes: 0,
            hue: msg.hue,
            addedAt: Date.now(),
            removed: false,
          }]);
          break;
        case 'user_list':
          setUsers(msg.users);
          break;
        case 'user_update':
          setUsers(prev => {
            const idx = prev.findIndex(u => u.id === msg.user.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = msg.user;
              return next;
            }
            return [...prev, msg.user];
          });
          break;
        case 'new_chat':
          setMessages(prev => [...prev, msg.message]);
          break;
        case 'leave':
          setUsers(prev => prev.map(u => u.id === msg.userId ? { ...u, online: false } : u));
          break;
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, [userId, nickname]);

  const handleAddWord = useCallback(() => {
    const text = inputValue.trim();
    if (!text || text.length > 10) return;
    const hue = Math.floor(Math.random() * 360);
    send({ type: 'add_word', wordId: genId(), text, userId, hue });
    setInputValue('');
  }, [inputValue, userId, send]);

  const handleLike = useCallback((wordId: string) => {
    send({ type: 'like_word', wordId, userId });
  }, [userId, send]);

  const handleDislike = useCallback((wordId: string) => {
    send({ type: 'dislike_word', wordId, userId });
  }, [userId, send]);

  const handleChatSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    send({ type: 'chat', userId, nickname, text });
    setChatInput('');
  }, [chatInput, userId, nickname, send]);

  const activeWords = words.filter(w => !w.removed);

  return (
    <div style={styles.root}>
      <WordCloud words={activeWords} />

      <div style={styles.main}>
        <div style={styles.center}>
          <h1 style={styles.title}>词云诗会</h1>

          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddWord()}
              placeholder="输入一个词或短句（≤10字）"
              maxLength={10}
            />
            <button
              style={{
                ...styles.sendBtn,
                opacity: connected ? 1 : 0.5,
              }}
              onClick={handleAddWord}
              disabled={!connected}
            >
              发送
            </button>
          </div>

          <WordBoard words={activeWords} onLike={handleLike} onDislike={handleDislike} userId={userId} />
        </div>

        <ChatPanel
          users={users}
          messages={messages}
          chatInput={chatInput}
          onChatInput={setChatInput}
          onChatSend={handleChatSend}
          userId={userId}
          open={chatOpen}
          onToggle={() => setChatOpen(v => !v)}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  main: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    overflow: 'auto',
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 8,
    marginBottom: 24,
    textShadow: '0 0 20px rgba(120,100,255,0.5)',
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 24,
    width: '100%',
    maxWidth: 440,
    padding: '0 16px',
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    backdropFilter: 'blur(4px)',
  },
  sendBtn: {
    padding: '10px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};
