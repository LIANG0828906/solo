import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { useStore } from '@/store';
import type { Message } from '@/types';

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="max-w-[70%] px-4 py-2 rounded-2xl"
        style={{
          backgroundColor: isOwn ? 'var(--primary)' : '#fff',
          color: isOwn ? '#fff' : 'var(--text)',
          borderTopRightRadius: isOwn ? '4px' : undefined,
          borderTopLeftRadius: isOwn ? undefined : '4px',
          boxShadow: isOwn ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className="text-xs mt-1"
          style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : '#999' }}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = useStore((state) => state.conversations);
  const currentUserId = useStore((state) => state.currentUserId);
  const sendMessage = useStore((state) => state.sendMessage);
  const markConversationRead = useStore((state) => state.markConversationRead);

  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const conversation = conversations.find((c) => c.id === id);

  useEffect(() => {
    if (id) {
      markConversationRead(id);
    }
  }, [id, markConversationRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!content.trim() || !id) return;

    const result = sendMessage(id, currentUserId, content.trim());
    if (!result) {
      setError('今日消息已达上限（10条/天）');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            对话不存在
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-56px-48px)] flex flex-col">
      <div
        className="flex items-center gap-3 p-4 bg-white rounded-t-xl"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <button
          onClick={() => navigate('/messages')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            匹配对话
          </h1>
          <p className="text-xs text-gray-500">匿名沟通，请勿发送个人隐私信息</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-white mt-0.5"
        style={{ backgroundColor: '#FAFAFA' }}
      >
        {conversation.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-sm">暂无消息</p>
              <p className="text-gray-300 text-xs mt-1">发送第一条消息开始沟通</p>
            </div>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
            />
          ))
        )}
      </div>

      <div className="bg-white rounded-b-xl p-4" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mb-3 p-2 rounded-lg"
              style={{ backgroundColor: '#FFEBEE' }}
            >
              <AlertCircle size={16} color="#E53935" />
              <span className="text-sm" style={{ color: 'var(--error)' }}>
                {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息...（Enter 发送，Shift+Enter 换行）"
            rows={1}
            className="flex-1 resize-none py-3 px-4 rounded-xl"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: '#FAFAFA',
              fontSize: '14px',
              maxHeight: '120px',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!content.trim()}
            className="p-3 rounded-xl text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
