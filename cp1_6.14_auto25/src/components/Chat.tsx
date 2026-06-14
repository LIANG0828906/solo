import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, Smile, MessageCircle, Heart } from 'lucide-react';
import { getMatches, getMessages, sendMessage, getUser } from '../api';
import { useStore } from '../store/useStore';
import { formatMessageTime, formatTime, getInitials, getOtherUserId } from '../utils/helpers';
import type { User, Match, Message } from '../types';

const EMOJI_LIST = [
  '😀', '😂', '🥰', '😍', '😘', '😊', '🤗', '😏',
  '😢', '😤', '🥺', '😴', '🤔', '😎', '🤩', '😋',
  '❤️', '💕', '💖', '💗', '💘', '💝', '🌹', '💐',
  '👍', '👋', '🤝', '✨', '🎉', '🎊', '☕', '🍰',
];

const ContactItem: React.FC<{
  match: Match;
  currentUser: User;
  isActive: boolean;
  usersCache: Record<string, User>;
  onClick: () => void;
}> = ({ match, currentUser, isActive, usersCache, onClick }) => {
  const otherId = getOtherUserId(match.userIds, currentUser.id);
  const otherUser = usersCache[otherId];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
        isActive ? 'bg-[#FFE5E5]' : 'hover:bg-white/60'
      }`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
        style={{ backgroundColor: otherUser?.avatarColor || '#FF6B6B' }}
      >
        {otherUser ? getInitials(otherUser.nickname) : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800 truncate">
            {otherUser?.nickname || '未知用户'}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {match.lastMessageTime ? formatTime(match.lastMessageTime) : formatTime(match.matchedAt)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {match.lastMessage || '刚刚匹配，打个招呼吧！'}
        </p>
      </div>
    </button>
  );
};

const ChatView: React.FC<{
  match: Match;
  currentUser: User;
  usersCache: Record<string, User>;
  onBack: () => void;
}> = ({ match, currentUser, usersCache, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<string>('');

  const otherId = getOtherUserId(match.userIds, currentUser.id);
  const otherUser = usersCache[otherId];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const newMsgs = await getMessages(match.id, lastTimestampRef.current || undefined, 100);
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = newMsgs.filter((m) => !existingIds.has(m.id));
          return [...prev, ...unique];
        });
        lastTimestampRef.current = newMsgs[newMsgs.length - 1].timestamp;
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    }
  }, [match.id, scrollToBottom]);

  useEffect(() => {
    lastTimestampRef.current = '';
    setMessages([]);
    fetchMessages();

    pollRef.current = setInterval(fetchMessages, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [match.id, fetchMessages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      const msg = await sendMessage(match.id, currentUser.id, trimmed);
      setMessages((prev) => [...prev, msg]);
      lastTimestampRef.current = msg.timestamp;
      setInput('');
      setShowEmoji(false);
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="md:hidden w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: otherUser?.avatarColor || '#FF6B6B' }}
        >
          {otherUser ? getInitials(otherUser.nickname) : '?'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{otherUser?.nickname || '未知用户'}</h3>
          <p className="text-xs text-gray-400">匹配于 {formatTime(match.matchedAt)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FFF5E6]/30">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-10 h-10 text-[#FF6B6B] mx-auto mb-2" />
            <p className="text-gray-400 text-sm">你们已匹配成功，快打个招呼吧 💕</p>
          </div>
        )}
        {messages.map((msg) => {
          const isSelf = msg.senderId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isSelf ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl break-words ${
                    isSelf
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <p
                  className={`text-xs text-gray-400 mt-1 ${
                    isSelf ? 'text-right mr-1' : 'ml-1'
                  }`}
                >
                  {formatMessageTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmoji && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showEmoji ? 'bg-[#FFE5E5]' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Smile className={`w-5 h-5 ${showEmoji ? 'text-[#FF6B6B]' : 'text-gray-500'}`} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-[#FF6B6B] transition-colors text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const loadMatches = async () => {
      try {
        const matchList = await getMatches(currentUser.id);
        setMatches(matchList);

        const userMap: Record<string, User> = { ...usersCache };
        for (const match of matchList) {
          const otherId = getOtherUserId(match.userIds, currentUser.id);
          if (!userMap[otherId]) {
            try {
              userMap[otherId] = await getUser(otherId);
            } catch {
              // skip
            }
          }
        }
        setUsersCache(userMap);

        if (matchId) {
          const target = matchList.find((m) => m.id === matchId);
          if (target) {
            setSelectedMatch(target);
            setShowChat(true);
          }
        }
      } catch (error) {
        console.error('加载匹配列表失败:', error);
      }
    };

    loadMatches();
  }, [currentUser, matchId]);

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedMatch(null);
  };

  if (!currentUser) return null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 bg-[#FFF5E6]/50 overflow-y-auto flex-shrink-0 ${
          showChat ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="p-4 border-b border-gray-200/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#FF6B6B]" />
            心动聊天
            {matches.length > 0 && (
              <span className="text-xs bg-[#FF6B6B] text-white px-2 py-0.5 rounded-full">
                {matches.length}
              </span>
            )}
          </h2>
        </div>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Heart className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">还没有匹配对象</p>
            <p className="text-gray-400 text-xs mt-1">发送心动信号，双向奔赴即可匹配</p>
            <button
              onClick={() => navigate('/discover')}
              className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] text-white text-sm font-medium"
            >
              去发现
            </button>
          </div>
        ) : (
          <div>
            {matches.map((match) => (
              <ContactItem
                key={match.id}
                match={match}
                currentUser={currentUser}
                isActive={selectedMatch?.id === match.id}
                usersCache={usersCache}
                onClick={() => handleSelectMatch(match)}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={`flex-1 min-h-0 ${
          showChat ? 'block' : 'hidden md:block'
        }`}
      >
        {selectedMatch && currentUser ? (
          <ChatView
            match={selectedMatch}
            currentUser={currentUser}
            usersCache={usersCache}
            onBack={handleBack}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400">选择一个匹配对象开始聊天</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
