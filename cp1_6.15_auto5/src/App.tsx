import { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import Toast from './components/Toast';
import { getSocket } from './utils/socket';
import type { User, ToastMessage, RecipeCard, Annotation } from './types';
import styles from './App.module.css';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
];

const DEFAULT_NAMES = ['小明', '小红', '爸爸', '妈妈', '爷爷', '奶奶'];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cards, setCards] = useState<RecipeCard[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const socket = getSocket();

  useEffect(() => {
    const savedName = localStorage.getItem('recipeBoardUserName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const handleJoin = useCallback(() => {
    if (!userName.trim()) return;

    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const newUser: User = {
      id: socket.id || Date.now().toString(),
      name: userName.trim(),
      avatar: randomAvatar,
    };

    localStorage.setItem('recipeBoardUserName', userName.trim());
    setUser(newUser);

    socket.emit('board:join', { boardId: 'family-board', user: newUser });
  }, [userName, socket]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleBoardState = (state: { cards: RecipeCard[]; onlineCount: number }) => {
      setCards(state.cards);
      setOnlineCount(state.onlineCount);
    };

    const handleCardAdded = (data: { card: RecipeCard; user: User }) => {
      if (data.user.id !== user.id) {
        setCards(prev => [...prev, data.card].sort((a, b) => a.order - b.order));
        addToast(`${data.user.name} 新增了「${data.card.title}」`, 'success');
      }
    };

    const handleCardReordered = (data: { cards: RecipeCard[]; user: User }) => {
      if (data.user.id !== user.id) {
        setCards(data.cards);
        addToast(`${data.user.name} 调整了卡片顺序`, 'info');
      }
    };

    const handleAnnotationAdded = (data: { cardId: string; annotation: Annotation; user: User }) => {
      if (data.user.id !== user.id) {
        setCards(prev =>
          prev.map(card =>
            card.id === data.cardId
              ? { ...card, annotations: [...card.annotations, data.annotation] }
              : card
          )
        );
        addToast(`${data.user.name} 添加了新批注`, 'info');
      }
    };

    const handleUserJoined = (data: { user: User; onlineCount: number }) => {
      if (data.user.id !== user.id) {
        setOnlineCount(data.onlineCount);
        addToast(`${data.user.name} 加入了灵感板`, 'success');
      }
    };

    const handleUserLeft = (data: { user: User; onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
      addToast(`${data.user.name} 离开了灵感板`, 'warning');
    };

    socket.on('board:state', handleBoardState);
    socket.on('card:added', handleCardAdded);
    socket.on('card:reordered', handleCardReordered);
    socket.on('annotation:added', handleAnnotationAdded);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);

    return () => {
      socket.off('board:state', handleBoardState);
      socket.off('card:added', handleCardAdded);
      socket.off('card:reordered', handleCardReordered);
      socket.off('annotation:added', handleAnnotationAdded);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
    };
  }, [user, socket, addToast]);

  const handleLocalCardAdd = useCallback((card: RecipeCard) => {
    setCards(prev => [...prev, card].sort((a, b) => a.order - b.order));
  }, []);

  const handleLocalReorder = useCallback((newCards: RecipeCard[]) => {
    setCards(newCards);
  }, []);

  const handleLocalAnnotationAdd = useCallback((cardId: string, annotation: Annotation) => {
    setCards(prev =>
      prev.map(card =>
        card.id === cardId
          ? { ...card, annotations: [...card.annotations, annotation] }
          : card
      )
    );
  }, []);

  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>🍳 共享食谱灵感板</h1>
          <p className={styles.subtitle}>和家人一起收集美食灵感，规划一周菜单</p>
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={styles.input}
              placeholder="请输入您的昵称"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <div className={styles.suggestions}>
              {DEFAULT_NAMES.map((name) => (
                <button
                  key={name}
                  className={styles.suggestionBtn}
                  onClick={() => setUserName(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <button className={styles.joinBtn} onClick={handleJoin} disabled={!userName.trim()}>
            加入灵感板
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>🍳 食谱灵感板</h1>
          <div className={styles.headerRight}>
            <div className={styles.onlineBadge}>
              <span className={styles.onlineDot}></span>
              <span>{onlineCount} 人在线</span>
            </div>
            <div className={styles.userInfo}>
              <img src={user.avatar} alt={user.name} className={styles.avatar} />
              <span className={styles.userName}>{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Board
          cards={cards}
          user={user}
          onCardAdd={handleLocalCardAdd}
          onReorder={handleLocalReorder}
          onAnnotationAdd={handleLocalAnnotationAdd}
          addToast={addToast}
        />
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}

export default App;
