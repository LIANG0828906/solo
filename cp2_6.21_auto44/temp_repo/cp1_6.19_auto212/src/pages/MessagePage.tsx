import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';
import Empty from '@/components/Empty';
import { useStore } from '@/store';
import type { Conversation } from '@/types';

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function ConversationItem({ conversation }: { conversation: Conversation }) {
  const navigate = useNavigate();
  const markConversationRead = useStore((state) => state.markConversationRead);

  const handleClick = () => {
    markConversationRead(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className="flex items-center gap-4 p-4 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#E3F2FD' }}
      >
        <MessageSquare size={22} color="#4FC3F7" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium truncate" style={{ color: 'var(--text)' }}>
            匹配对话
          </span>
          {conversation.lastMessageTime && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatTime(conversation.lastMessageTime)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">
            {conversation.lastMessage || '暂无消息，点击开始对话'}
          </p>
          {conversation.unreadCount > 0 && (
            <span
              className="ml-2 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
              style={{ backgroundColor: 'var(--error)' }}
            >
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
    </motion.div>
  );
}

export default function MessagePage() {
  const navigate = useNavigate();
  const currentUserId = useStore((state) => state.currentUserId);
  const getConversationsForUser = useStore((state) => state.getConversationsForUser);

  const conversations = getConversationsForUser(currentUserId).sort(
    (a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          消息
        </h1>
        <p className="text-sm text-gray-500 mt-1">与匹配成功的对方进行匿名沟通</p>
      </div>

      {conversations.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
    </div>
  );
}
