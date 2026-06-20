import React, { useEffect, useRef, useState } from 'react';
import { Position } from '../types';
import { CAPSULE_COLORS, EMOJIS } from '../constants';
import { useGameStore } from '../store/gameStore';

interface CapsuleEditorProps {
  position: Position;
  onClose: () => void;
}

export const CapsuleEditor: React.FC<CapsuleEditorProps> = ({ position, onClose }) => {
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState<string>(EMOJIS[0]);
  const [shake, setShake] = useState(false);
  const addCapsule = useGameStore(s => s.addCapsule);
  const isLoading = useGameStore(s => s.isLoading);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const color = CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)] as typeof CAPSULE_COLORS[number];

  const handleBury = async () => {
    if (!content.trim() || isLoading) return;
    setShake(true);
    setTimeout(() => setShake(false), 100);
    await addCapsule({
      position,
      color,
      emoji,
      content: content.trim()
    });
  };

  return (
    <div className="capsule-editor-overlay" onClick={onClose}>
      <div className="capsule-editor" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <span className="editor-title">埋入时光胶囊</span>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="editor-textarea"
          placeholder="写下你想埋入的秘密、祝福或回忆……"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={500}
        />

        <div className="emoji-picker">
          {EMOJIS.map(em => (
            <button
              key={em}
              className={`emoji-btn ${emoji === em ? 'selected' : ''}`}
              onClick={() => setEmoji(em)}
              type="button"
            >
              {em}
            </button>
          ))}
        </div>

        <button
          className={`bury-btn ${shake ? 'shake' : ''}`}
          onClick={handleBury}
          disabled={!content.trim() || isLoading}
        >
          {isLoading ? '埋下中…' : '埋下胶囊 ✨'}
        </button>
      </div>
    </div>
  );
};
