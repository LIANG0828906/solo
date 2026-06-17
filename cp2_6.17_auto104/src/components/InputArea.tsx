import { useEffect, useRef, useCallback } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { getRandomArticle } from '../data/articles';

interface InputAreaProps {
  onStart?: () => void;
}

export function InputArea({ onStart }: InputAreaProps) {
  const { status, handleKeyPress, startGame } = useTypingEngine();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startAndType = useCallback(
    (key: string) => {
      const article = getRandomArticle();
      startGame(article);
      setTimeout(() => {
        handleKeyPress(key);
      }, 0);
    },
    [startGame, handleKeyPress]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (status === 'idle') {
        if (e.key.length === 1) {
          e.preventDefault();
          if (onStart) {
            onStart();
          }
          startAndType(e.key);
        }
        return;
      }

      if (status !== 'playing') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('Backspace');
      } else if (e.key.length === 1) {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleKeyPress, onStart, startAndType]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = () => {
    // 不做任何事情，输入通过键盘事件处理
  };

  return (
    <div className="input-area">
      <textarea
        ref={inputRef}
        value=""
        onChange={handleChange}
        placeholder={status === 'idle' ? 'Start typing to begin the test...' : ''}
        disabled={status === 'finished'}
        autoFocus
        style={{ height: '60px', overflow: 'hidden', opacity: 0 }}
      />
    </div>
  );
}
