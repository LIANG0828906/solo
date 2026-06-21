import React, { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ToastItem: React.FC<{
  msg: ToastMessage;
  onRemove: (id: number) => void;
}> = ({ msg, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const removeTimer = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    removeTimer.current = window.setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(msg.id), 300);
    }, 2500);
    return () => {
      if (removeTimer.current) window.clearTimeout(removeTimer.current);
    };
  }, [msg.id, onRemove]);

  const icon =
    msg.type === 'success' ? <CheckCircle2 size={18} color="#22C55E" /> :
    msg.type === 'error' ? <XCircle size={18} color="#EF4444" /> :
    <Info size={18} color="#60A5FA" />;

  const bgColor =
    msg.type === 'success' ? 'rgba(34, 197, 94, 0.95)' :
    msg.type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
    'rgba(96, 165, 250, 0.95)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        color: '#F1F5F9',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${bgColor}33`,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: FONT_STACK,
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '90vw',
      }}
    >
      {icon}
      <span>{msg.message}</span>
    </div>
  );
};

import { FONT_STACK } from '../constants';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const idCounter = useRef(0);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = ++idCounter.current;
    setMessages(prev => [...prev, { id, message, type }]);
  }, []);

  const removeMessage = useCallback((id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {messages.map(msg => (
          <ToastItem key={msg.id} msg={msg} onRemove={removeMessage} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
