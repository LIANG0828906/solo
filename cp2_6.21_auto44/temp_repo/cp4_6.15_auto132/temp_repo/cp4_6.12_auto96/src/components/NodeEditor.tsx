import { useEffect, useRef, useState } from 'react';

interface NodeEditorProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  fontSize: number;
  fontWeight: string;
}

export function NodeEditor({
  initialText,
  onSave,
  onCancel,
  fontSize,
  fontWeight,
}: NodeEditorProps) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSave(text);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, onSave, onCancel]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text)}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        textAlign: 'center',
        fontSize: `${fontSize}px`,
        fontWeight,
        padding: '0 8px',
        color: '#333',
        boxSizing: 'border-box',
      }}
    />
  );
}
