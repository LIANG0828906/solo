import { useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { X } from 'lucide-react';

export default function FontInput() {
  const text = useAppStore((s) => s.text);
  const setText = useAppStore((s) => s.setText);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.slice(0, 50);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setText(val);
      }, 100);
    },
    [setText],
  );

  const handleClear = useCallback(() => {
    setText('');
  }, [setText]);

  return (
    <div style={styles.wrapper}>
      <input
        type="text"
        defaultValue={text}
        onChange={handleChange}
        maxLength={50}
        placeholder="输入文字，实时预览..."
        style={styles.input}
      />
      <button onClick={handleClear} style={styles.clearBtn} title="清空">
        <X size={16} />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '80%',
  },
  input: {
    width: '100%',
    height: 40,
    background: '#1E1E1E',
    color: '#FFFFFF',
    border: '1px solid #444',
    borderRadius: 6,
    padding: '0 36px 0 12px',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    transition: 'color 0.2s, transform 0.1s',
  },
};
