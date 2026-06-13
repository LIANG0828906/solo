import React, { useState, useEffect, useRef, memo } from 'react';

interface IngredientInputProps {
  ingredients: string[];
  onAdd: (ing: string) => void;
  onRemove: (ing: string) => void;
}

const IngredientInput: React.FC<IngredientInputProps> = ({ ingredients, onAdd, onRemove }) => {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    let active = true;
    fetch(`/api/ingredients?q=${encodeURIComponent(value)}`)
      .then(r => r.json())
      .then((data: string[]) => {
        if (active) {
          setSuggestions(data.filter(s => !ingredients.includes(s)).slice(0, 8));
        }
      });
    return () => { active = false; };
  }, [value, ingredients]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = (name?: string) => {
    const n = (name || value).trim();
    if (n && !ingredients.includes(n)) {
      onAdd(n);
    }
    setValue('');
    setShowSuggestions(false);
  };

  const handleRemove = (ing: string) => {
    setRemoving(ing);
    setTimeout(() => {
      onRemove(ing);
      setRemoving(null);
    }, 300);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKey}
          placeholder="输入食材名称，按回车添加..."
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 15,
            borderRadius: 10,
            border: '1px solid #d6cfc7',
            background: '#fffdfb',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={(e) => { e.target.style.borderColor = '#b08968'; e.target.style.boxShadow = '0 0 0 3px rgba(176,137,104,0.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#d6cfc7'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          onClick={() => handleAdd()}
          style={buttonStyle}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          添加
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div style={suggestionBoxStyle}>
          {suggestions.map(s => (
            <div
              key={s}
              onClick={() => handleAdd(s)}
              style={suggestionItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5efe8'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🔍 {s}
            </div>
          ))}
        </div>
      )}

      {ingredients.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {ingredients.map(ing => (
            <span
              key={ing}
              style={{
                ...tagStyle,
                transform: removing === ing ? 'translateX(-40px)' : 'translateX(0)',
                opacity: removing === ing ? 0 : 1,
                transition: 'transform 0.3s ease, opacity 0.3s ease'
              }}
            >
              {ing}
              <button
                onClick={() => handleRemove(ing)}
                style={removeBtnStyle}
                aria-label={`删除 ${ing}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 600,
  color: 'white',
  background: 'linear-gradient(135deg, #b08968, #8b6b4f)',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 8px rgba(176,137,104,0.3)'
};

const suggestionBoxStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 100,
  background: 'white',
  border: '1px solid #e8e0d6',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  zIndex: 10,
  overflow: 'hidden',
  maxHeight: 260,
  overflowY: 'auto'
};

const suggestionItemStyle: React.CSSProperties = {
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: 14,
  color: '#5a4a3a',
  transition: 'background 0.15s'
};

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px 6px 14px',
  background: '#e0f2e9',
  color: '#2f7d4f',
  fontSize: 14,
  fontWeight: 500,
  borderRadius: 999,
  border: '1px solid #c8e6d5'
};

const removeBtnStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: '#2f7d4f',
  color: 'white',
  border: 'none',
  fontSize: 11,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
  padding: 0,
  lineHeight: 1
};

export default memo(IngredientInput);
