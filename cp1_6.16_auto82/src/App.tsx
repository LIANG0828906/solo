import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, SortType } from './types';
import { COLOR_PALETTE } from './types';
import AuroraCanvas from './components/Canvas';
import MessageCard from './components/MessageCard';
import MessageForm from './components/MessageForm';

const generateMockMessages = (): Message[] => {
  const mockContents = [
    '愿你的每一天都像极光一样绚丽多彩 ✨',
    '这里的星空真美，希望能永远记住这一刻',
    '遇见你们是我最大的幸运',
    '2024 加油！所有的梦想都会实现 🌟',
    '极光之下，我们都是追梦人',
    '希望下次还能和你一起来看极光',
    '生活不止眼前的苟且，还有诗和远方',
    '愿所有的美好都如期而至',
    '今天的风都是甜的 🍬',
    '记住这一刻的感动',
    '世界很大，想去看看',
    '你若盛开，蝴蝶自来 🦋',
  ];

  const now = Date.now();
  return mockContents.map((content, index) => ({
    id: uuidv4(),
    content,
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    timestamp: now - (index * 3600000) - Math.random() * 1800000,
    likes: Math.floor(Math.random() * 50) + 5,
    floatOffset: Math.random() * 2,
    floatDuration: 2 + Math.random() * 2,
  }));
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>(generateMockMessages);
  const [sortType, setSortType] = useState<SortType>('latest');
  const [sortKey, setSortKey] = useState(0);

  const sortedMessages = useMemo(() => {
    const sorted = [...messages];
    if (sortType === 'latest') {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      sorted.sort((a, b) => b.likes - a.likes);
    }
    return sorted.slice(0, 50);
  }, [messages, sortType]);

  const handleSubmit = useCallback((content: string, color: string) => {
    if (messages.length >= 50) {
      setMessages((prev) => {
        const oldest = [...prev].sort((a, b) => a.timestamp - b.timestamp);
        const rest = oldest.slice(1);
        return [
          ...rest,
          {
            id: uuidv4(),
            content,
            color,
            timestamp: Date.now(),
            likes: 0,
            floatOffset: Math.random() * 2,
            floatDuration: 2 + Math.random() * 2,
            isNew: true,
          },
        ];
      });
    } else {
      setMessages((prev) => [
        {
          id: uuidv4(),
          content,
          color,
          timestamp: Date.now(),
          likes: 0,
          floatOffset: Math.random() * 2,
          floatDuration: 2 + Math.random() * 2,
          isNew: true,
        },
        ...prev,
      ]);
    }
  }, [messages.length]);

  const handleLike = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, likes: msg.likes + 1 } : msg,
      ),
    );
  }, []);

  const handleSortChange = (type: SortType) => {
    if (type !== sortType) {
      setSortType(type);
      setSortKey((k) => k + 1);
    }
  };

  return (
    <div className="app-container">
      <AuroraCanvas />
      <div className="content-wrapper">
        <div className="sort-bar">
          <button
            className={`sort-btn ${sortType === 'latest' ? 'active' : ''}`}
            onClick={() => handleSortChange('latest')}
          >
            最新
          </button>
          <button
            className={`sort-btn ${sortType === 'hottest' ? 'active' : ''}`}
            onClick={() => handleSortChange('hottest')}
          >
            最热
          </button>
        </div>
        <div className="messages-container">
          <div key={sortKey} className="messages-grid fade-enter">
            {sortedMessages.map((message, index) => (
              <MessageCard
                key={message.id}
                message={message}
                onLike={handleLike}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
      <MessageForm onSubmit={handleSubmit} />
    </div>
  );
};

export default App;
