import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Whiteboard from './whiteboard/Whiteboard';
import ChatPanel from './chat/ChatPanel';
import { useStore } from './store';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const sessionName = useStore((state) => state.sessionName);
  const users = useStore((state) => state.users);
  const currentUserId = useStore((state) => state.currentUserId);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndo = useStore((state) => state.canUndo());
  const canRedo = useStore((state) => state.canRedo());
  const newSession = useStore((state) => state.newSession);

  const currentUser = users.find((u) => u.id === currentUserId);
  const onlineCount = users.filter((u) => u.isOnline).length;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#F5F6FA',
      }}
    >
      <div
        style={{
          height: 50,
          backgroundColor: '#34495E',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          flexShrink: 0,
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={undo}
            disabled={!canUndo}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: canUndo ? '#95A5A6' : '#5D6D7E',
              color: 'white',
              border: 'none',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'all 0.2s ease-out',
              opacity: canUndo ? 1 : 0.5,
            }}
            title="撤销 (Ctrl+Z)"
          >
            ←
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={redo}
            disabled={!canRedo}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: canRedo ? '#95A5A6' : '#5D6D7E',
              color: 'white',
              border: 'none',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'all 0.2s ease-out',
              opacity: canRedo ? 1 : 0.5,
            }}
            title="重做 (Ctrl+Shift+Z)"
          >
            →
          </motion.button>
        </div>

        <div
          style={{
            height: 24,
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{sessionName}</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            {onlineCount} 人在线
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: '#2980B9' }}
          whileTap={{ scale: 0.95 }}
          onClick={newSession}
          style={{
            width: 120,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#3498DB',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 500,
            transition: 'background-color 0.3s ease-out',
          }}
        >
          新建会话
        </motion.button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {users
            .filter((u) => u.isOnline)
            .map((user, index) => (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.1, y: -2 }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: user.avatarColor,
                  border: user.id === currentUserId ? '2px solid white' : '2px solid transparent',
                  marginLeft: index > 0 ? -8 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  position: 'relative',
                  zIndex: users.length - index,
                }}
                title={user.name}
              >
                {user.name.charAt(0)}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#2ECC71',
                    border: '1.5px solid #34495E',
                  }}
                />
              </motion.div>
            ))}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Whiteboard />
        {!isMobile && <ChatPanel />}
      </div>

      <AnimatePresence>
        {isMobile && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setChatOpen(true)}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: '#3498DB',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)',
              zIndex: 100,
            }}
          >
            💬
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && chatOpen && (
          <ChatPanel isMobile onClose={() => setChatOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
