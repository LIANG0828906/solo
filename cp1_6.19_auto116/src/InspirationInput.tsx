import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd } from 'react-icons/md';
import { useThemeStore, eventBus } from './themeStore.tsx';

const InspirationInput: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addNote } = useThemeStore();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.inspiration-input-container') && isExpanded) {
        if (!inputValue.trim()) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, inputValue]);

  const handleSubmit = () => {
    const content = inputValue.trim();
    if (!content) return;
    addNote(content);
    eventBus.emit('inspiration:created', content);
    setInputValue('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setInputValue('');
    }
  };

  return (
    <div
      className="inspiration-input-container"
      style={{
        position: 'fixed',
        left: 32,
        bottom: 32,
        zIndex: 100,
      }}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="fab"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              transition: 'box-shadow 0.2s ease-in-out',
            }}
          >
            <MdAdd size={32} />
          </motion.button>
        ) : (
          <motion.div
            key="input-card"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.3,
            }}
            style={{
              width: 320,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div
              style={{
                padding: 16,
                backgroundColor: '#fff',
              }}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="记录此刻的灵感..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#2D3436',
                  fontFamily: 'inherit',
                  backgroundColor: 'transparent',
                }}
              />
            </div>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#2D3436',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setInputValue('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'color 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: inputValue.trim()
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                确认
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspirationInput;
