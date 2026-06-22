import { useState, useEffect, useRef, useCallback } from 'react';
import { Minus, X, Send, Smile } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as chatService from '@/modules/chat/chatService';
import type { ChatMessage } from '@/shared/types';

const EMOJIS = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '👏', '🙌', '💪', '🤝'];

export default function ChatWindow() {
  const {
    users,
    schedules,
    messages,
    selectedScheduleId,
    chatOpen,
    chatMinimized,
    addMessage,
    setMessages,
    toggleChatMinimize,
    toggleChat,
  } = useStore();

  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 420 });
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const listRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const currentSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const currentUserId = users[0]?.id;
  const filteredMessages = messages.filter((m) => m.scheduleId === selectedScheduleId);

  const handleIncomingMessage = useCallback(
    (msg: ChatMessage) => {
      if (msg.scheduleId === selectedScheduleId) {
        addMessage(msg);
      }
    },
    [selectedScheduleId, addMessage],
  );

  useEffect(() => {
    chatService.connect();
    chatService.onMessage(handleIncomingMessage);
    return () => {
      chatService.disconnect();
    };
  }, [handleIncomingMessage]);

  useEffect(() => {
    setMessages([]);
  }, [selectedScheduleId, setMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredMessages.length]);

  useEffect(() => {
    if (!showEmojis) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojis]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (chatMinimized) return;
    setDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const handleUp = () => setDragging(false);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, dragOffset]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !selectedScheduleId || !currentUserId) return;
    const isEmoji = EMOJIS.includes(content);
    chatService.sendMessage({
      scheduleId: selectedScheduleId,
      userId: currentUserId,
      content,
      type: isEmoji ? 'emoji' : 'text',
    });
    setInput('');
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name ?? 'Unknown';

  const getAvatarColor = (userId: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (!chatOpen) return null;

  if (chatMinimized) {
    const participantIds = currentSchedule?.participantIds ?? [];
    const participants = users.filter((u) => participantIds.includes(u.id));

    return (
      <div
        className="fixed z-50 flex flex-col items-center gap-2 rounded-l-lg border border-gray-200 bg-white py-3 shadow-lg"
        style={{ left: position.x + 260, top: position.y, width: 60, height: 400 }}
        onMouseDown={handleHeaderMouseDown}
      >
        <button onClick={toggleChatMinimize} className="mb-1 text-gray-400 hover:text-gray-600">
          <Minus size={16} />
        </button>
        <div className="flex flex-col items-center gap-2 overflow-y-auto px-1">
          {participants.map((u) => (
            <div
              key={u.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(u.id)}`}
              title={u.name}
            >
              {u.name[0]}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
      style={{ left: position.x, top: position.y, width: 320, height: 400 }}
    >
      <div
        className="flex cursor-move items-center justify-between border-b border-gray-200 bg-indigo-600 px-3 py-2 text-white select-none"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="truncate text-sm font-semibold">
          {currentSchedule ? currentSchedule.title : '聊天'}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={toggleChatMinimize} className="rounded p-0.5 hover:bg-indigo-500">
            <Minus size={14} />
          </button>
          <button onClick={toggleChat} className="rounded p-0.5 hover:bg-indigo-500">
            <X size={14} />
          </button>
        </div>
      </div>

      {!selectedScheduleId ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          请先选择一个日程
        </div>
      ) : (
        <>
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {filteredMessages.map((msg) => {
              const name = getUserName(msg.userId);
              return (
                <div key={msg.id} className="flex gap-2 animate-[fadeIn_0.3s_ease-in]">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(msg.userId)}`}
                  >
                    {name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-gray-700">{name}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="mt-0.5 break-words text-sm text-gray-800">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 px-3 py-2">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <div className="relative" ref={emojiRef}>
                <button
                  onClick={() => setShowEmojis((prev) => !prev)}
                  className="rounded p-1 text-gray-400 hover:text-indigo-500"
                >
                  <Smile size={18} />
                </button>
                {showEmojis && (
                  <div className="absolute bottom-full right-0 mb-2 grid grid-cols-4 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                className="rounded p-1 text-indigo-500 hover:text-indigo-700"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
