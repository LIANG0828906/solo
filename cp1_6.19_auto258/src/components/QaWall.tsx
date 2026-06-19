import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import useAppStore from '@/store';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export default function QaWall() {
  const qaWallOpen = useAppStore((s) => s.qaWallOpen);
  const qaItems = useAppStore((s) => s.qaItems);
  const toggleQaWall = useAppStore((s) => s.toggleQaWall);
  const addQuestion = useAppStore((s) => s.addQuestion);

  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addQuestion(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {qaWallOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 400,
            height: '100vh',
            background: '#2C3E50',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={20} color="#fff" />
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>问答墙</span>
              {qaItems.length > 0 && (
                <span
                  style={{
                    background: '#E74C3C',
                    color: '#fff',
                    fontSize: 12,
                    borderRadius: 10,
                    padding: '2px 8px',
                    fontWeight: 600,
                  }}
                >
                  {qaItems.length}
                </span>
              )}
            </div>
            <button
              onClick={toggleQaWall}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {qaItems.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: 0.4,
                }}
              >
                <MessageSquare size={40} color="#fff" />
                <span style={{ color: '#fff', fontSize: 14 }}>暂无提问</span>
              </div>
            )}
            <AnimatePresence initial={false}>
              {qaItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {item.content}
                  </p>
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 12,
                      marginTop: 6,
                      display: 'block',
                    }}
                  >
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题…"
              maxLength={200}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? '#3498DB' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: input.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.2s',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
