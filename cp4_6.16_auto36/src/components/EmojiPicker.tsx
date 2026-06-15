import React, { useState } from 'react';
import { EMOJI_LIST } from '../types';

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="emoji-picker-wrapper">
      <button
        type="button"
        className="emoji-picker-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="emoji-preview">{selected || '😀'}</span>
        <span className="emoji-picker-label">选择Emoji</span>
      </button>
      {open && (
        <>
          <div className="emoji-picker-overlay" onClick={() => setOpen(false)} />
          <div className="emoji-picker-panel">
            <div className="emoji-picker-grid">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-picker-item ${selected === emoji ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(emoji);
                    setOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmojiPicker;
