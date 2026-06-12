import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Plus, Users, MessageCircle, User } from 'lucide-react';
import { useStore, useWSStore } from './store';
import type { WSMessage } from './types';
import MapPage from './pages/mapPage';
import PublishPage from './pages/publishPage';
import MatchesPage from './pages/matchesPage';
import MessagesPage from './pages/messagesPage';
import ChatRoomPage from './pages/chatRoomPage';
import ProfilePage from './pages/profilePage';
import LoginPage from './pages/loginPage';

function App() {
  const { currentUser, addMeal, addChat, addMessage, markAsRead, addRequest, updateRequest, chats } = useStore();
  const { setWSConnected, setLastNotification } = useWSStore();
  const wsRef = useRef<WebSocket | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        useStore.getState().setCurrentUser(user);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const connectWS = () => {
      const ws = new WebSocket('ws://localhost:3000');
      wsRef.current = ws;

      ws.onopen = () => {
        setWSConnected(true);
        ws.send(JSON.stringify({ type: 'CONNECT_USER', userId: currentUser.id }));
      };

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          handleWSMessage(data);
        } catch {}
      };

      ws.onclose = () => {
        setWSConnected(false);
        setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser?.id]);

  const handleWSMessage = (data: WSMessage) => {
    switch (data.type) {
      case 'MEAL_PUSH': {
        addMeal({ ...data.meal, matchScore: data.matchScore });
        showNotification('附近有新餐食', data.meal.name);
        break;
      }
      case 'NEW_MESSAGE': {
        addMessage(data.chatId, data.message);
        if (data.message.senderId !== currentUser?.id) {
          const chat = chats.find((c) => c.id === data.chatId);
          const partnerName = chat?.partner?.username || '有人';
          const preview =
            data.message.type === 'image' ? '[图片]' : data.message.content;
          showNotification(`${partnerName}发来消息`, preview);
          playSound();
        }
        break;
      }
      case 'MESSAGE_READ': {
        markAsRead(data.chatId, data.messageId, data.readerId);
        break;
      }
      case 'MATCH_REQUEST': {
        addRequest(data.request);
        showNotification('收到新的拼餐请求', '快去看看吧');
        playSound();
        break;
      }
      case 'REQUEST_ACCEPTED': {
        const newChat = {
          id: data.chatId,
          requestId: '',
          participants: [currentUser!.id, data.partner.id],
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          messages: [],
          partner: data.partner,
        };
        addChat(newChat);
        updateRequest('', 'accepted');
        showNotification('拼餐成功！', `已与${data.partner.username}开始聊天`);
        navigate(`/messages/${data.chatId}`);
        break;
      }
      case 'NOTIFICATION': {
        setLastNotification(data.title);
        showNotification(data.title, data.body);
        break;
      }
    }
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  };

  const playSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  const isAuthPage = location.pathname === '/login';
  const isProtected =
    location.pathname !== '/login' && !currentUser;

  if (isProtected) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/', icon: Map, label: '地图' },
    { path: '/publish', icon: Plus, label: '发布' },
    { path: '/matches', icon: Users, label: '匹配' },
    { path: '/messages', icon: MessageCircle, label: '消息' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:chatId" element={<ChatRoomPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>

      {!isAuthPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-50">
          <div className="flex justify-around py-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active =
                location.pathname === path ||
                (path === '/messages' && location.pathname.startsWith('/messages/'));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
