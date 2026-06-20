import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useStore } from './store';
import type { ChatMessage } from './types';
import { useNavigate, useParams } from 'react-router-dom';

const COMMON_EMOJIS = [
  '😀', '😂', '😍', '🥰', '😎', '🤗', '😢', '😡',
  '👍', '👎', '❤️', '💔', '🎉', '🔥', '⭐', '👏',
  '🍜', '🍕', '🍔', '🍱',
];

function ChatRoom() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { chats, currentUser, addMessage } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const chat = chats.find((c) => c.id === chatId);
  const messages = chat?.messages || [];
  const partner = chat?.partner;

  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket('ws://localhost:3000');
      wsRef.current = ws;

      ws.onopen = () => {
        if (currentUser && chatId) {
          ws.send(JSON.stringify({ type: 'CONNECT_USER', userId: currentUser.id }));
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'JOIN_CHAT', chatId, userId: currentUser.id }));
          }, 100);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE' && data.chatId === chatId) {
            handleIncomingMessage(data.message);
          } else if (data.type === 'MESSAGE_READ' && data.chatId === chatId) {
            useStore.getState().markAsRead(data.chatId, data.messageId, data.readerId);
          }
        } catch {}
      };

      ws.onclose = () => {
        setTimeout(connectWS, 3000);
      };
    };

    if (currentUser && chatId) {
      connectWS();
    }

    return () => {
      if (wsRef.current && chatId && currentUser) {
        wsRef.current.send(JSON.stringify({ type: 'LEAVE_CHAT', chatId, userId: currentUser.id }));
        wsRef.current.close();
      }
    };
  }, [chatId, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleIncomingMessage = (message: ChatMessage) => {
    const exists = messages.find((m) => m.id === message.id);
    if (!exists) {
      addMessage(chatId!, message);
      if (message.senderId !== currentUser?.id && currentUser) {
        sendMarkRead(message.id);
      }
    }
  };

  const sendMarkRead = (messageId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'MARK_READ',
          chatId,
          userId: currentUser?.id,
          messageId,
        })
      );
    }
  };

  const sendMessage = (type: 'text' | 'emoji' | 'image', content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentUser || !chatId) return;

    const sendContent: any = { type };
    if (type === 'text' || type === 'emoji') {
      sendContent.text = content;
    } else if (type === 'image') {
      sendContent.imageUrl = content;
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'SEND_MESSAGE',
        chatId,
        senderId: currentUser.id,
        content: sendContent,
      })
    );
  };

  const handleSend = () => {
    const value = inputValue.trim();
    if (!value) return;
    sendMessage('text', value);
    setInputValue('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    sendMessage('emoji', emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        sendMessage('image', data.url);
      }
    } catch {}

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isSelf = (msg: ChatMessage) => msg.senderId === currentUser?.id;

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.type === 'image') {
      return (
        <img
          src={msg.content.startsWith('http') ? msg.content : `http://localhost:3000${msg.content}`}
          alt=""
          className="max-w-[200px] rounded-lg"
        />
      );
    }
    return <span className="break-words">{msg.content}</span>;
  };

  const renderReadStatus = (msg: ChatMessage) => {
    if (!isSelf(msg)) return null;
    const partnerId = partner?.id;
    const isRead = partnerId && msg.readBy.includes(partnerId);
    return (
      <span className={`ml-1 ${isSelf(msg) ? 'text-white/80' : 'text-gray-400'}`}>
        {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-warm-50">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-warm-100 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg">
            {partner?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{partner?.username || '聊天'}</div>
            <div className="text-xs text-gray-500">聊天中</div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.map((msg, idx) => {
          const self = isSelf(msg);
          const showAvatar = !self && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${self ? 'justify-end' : 'justify-start'}`}
            >
              {!self && (
                <div className="w-8 h-8 flex-shrink-0">
                  {showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-white text-sm font-semibold">
                      {partner?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  ) : null}
                </div>
              )}
              <div className={`flex flex-col ${self ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={self ? 'bubble-self' : 'bubble-other'}>
                  {renderMessageContent(msg)}
                </div>
                <div
                  className={`flex items-center mt-1 text-[10px] ${
                    self ? 'text-gray-400' : 'text-gray-400'
                  }`}
                >
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {renderReadStatus(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div className="mx-4 mb-2 p-3 bg-white rounded-2xl border border-warm-100 shadow-md animate-slide-up">
          <div className="grid grid-cols-10 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="p-2 text-2xl hover:bg-gray-100 rounded-lg transition-colors active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 bg-white border-t border-warm-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-full transition-colors ${
              showEmojiPicker ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <Smile size={22} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Image size={22} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="w-full px-4 py-2.5 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`p-2.5 rounded-full transition-all ${
              inputValue.trim()
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md active:scale-95'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
