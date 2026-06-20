import { useState, useEffect, useCallback } from 'react';
import CardEditor from './components/CardEditor';
import CardViewer from './components/CardViewer';
import CardBox from './components/CardBox';
import Sidebar from './components/Sidebar';
import { Card, GROUPS, GroupType } from '../../shared/types';
import './styles/App.css';

type View = 'editor' | 'exchange' | 'cardbox';

function App() {
  const [userId, setUserId] = useState<string>('');
  const [myCard, setMyCard] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [currentView, setCurrentView] = useState<View>('cardbox');
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
    } else {
      const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'connected') {
        console.log('Connected with WS ID:', message.payload.userId);
      }
      
      if (message.type === 'exchange') {
        const newCard = message.payload.card;
        setCards(prev => {
          const exists = prev.some(c => c.id === newCard.id);
          if (exists) return prev;
          return [newCard, ...prev];
        });
        setUnreadCount(prev => prev + 1);
      }
      
      if (message.type === 'notification') {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchCards();
  }, [userId, activeGroup]);

  const fetchCards = useCallback(async () => {
    if (!userId) return;
    try {
      const url = activeGroup === 'all'
        ? '/api/cards'
        : `/api/cards?group=${activeGroup}`;
      const response = await fetch(url, {
        headers: { 'x-user-id': userId }
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  }, [userId, activeGroup]);

  const handleCardCreated = useCallback((card: Card, ownerId: string) => {
    setMyCard(card);
    if (!userId) {
      setUserId(ownerId);
      localStorage.setItem('userId', ownerId);
    }
    setCurrentView('cardbox');
  }, [userId]);

  const handleExchange = useCallback(async (targetCardId: string) => {
    if (!ws || !myCard || !userId) return;
    
    ws.send(JSON.stringify({
      type: 'exchange',
      payload: {
        fromCardId: myCard.id,
        toCardId: targetCardId,
        fromUserId: userId,
        toUserId: userId
      }
    }));
  }, [ws, myCard, userId]);

  const handleGroupChange = useCallback(async (cardId: string, group: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}/group`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ group })
      });
      if (response.ok) {
        const updatedCard = await response.json();
        setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));
      }
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  }, [userId]);

  const handleMarkAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const filteredCards = activeGroup === 'all'
    ? cards
    : cards.filter(c => c.group === activeGroup);

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">💳</span>
          <span className="brand-name">数字名片</span>
        </div>
        
        {isMobile ? (
          <div className="mobile-nav">
            <button
              className="menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            {mobileMenuOpen && (
              <nav className="mobile-menu">
                <button
                  className={`nav-btn ${currentView === 'editor' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('editor'); setMobileMenuOpen(false); }}
                >
                  创建名片
                </button>
                <button
                  className={`nav-btn ${currentView === 'exchange' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('exchange'); setMobileMenuOpen(false); }}
                >
                  交换名片
                </button>
                <button
                  className={`nav-btn ${currentView === 'cardbox' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('cardbox'); setMobileMenuOpen(false); handleMarkAsRead(); }}
                >
                  名片盒
                  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                </button>
              </nav>
            )}
          </div>
        ) : (
          <nav className="desktop-nav">
            <button
              className={`nav-btn ${currentView === 'editor' ? 'active' : ''}`}
              onClick={() => setCurrentView('editor')}
            >
              创建名片
            </button>
            <button
              className={`nav-btn ${currentView === 'exchange' ? 'active' : ''}`}
              onClick={() => setCurrentView('exchange')}
            >
              交换名片
            </button>
            <button
              className={`nav-btn ${currentView === 'cardbox' ? 'active' : ''}`}
              onClick={() => { setCurrentView('cardbox'); handleMarkAsRead(); }}
            >
              名片盒
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          </nav>
        )}
      </header>

      <div className="main-content">
        {currentView === 'cardbox' && !isMobile && (
          <Sidebar
            groups={GROUPS}
            activeGroup={activeGroup}
            onGroupChange={setActiveGroup}
            cards={cards}
          />
        )}

        {currentView === 'cardbox' && isMobile && (
          <div className="mobile-group-selector">
            <select
              value={activeGroup}
              onChange={(e) => setActiveGroup(e.target.value)}
              className="group-select"
            >
              <option value="all">全部分组</option>
              {GROUPS.map(g => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          </div>
        )}

        <main className="content-area">
          {currentView === 'editor' && (
            <CardEditor
              userId={userId}
              onCardCreated={handleCardCreated}
            />
          )}

          {currentView === 'exchange' && (
            <CardViewer
              myCard={myCard}
              userId={userId}
              ws={ws}
              onExchange={handleExchange}
            />
          )}

          {currentView === 'cardbox' && (
            <CardBox
              cards={filteredCards}
              onGroupChange={handleGroupChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
