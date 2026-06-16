import { useState } from 'react';

interface SaveDialogProps {
  defaultName: string;
  onConfirm: (name: string, description: string) => void;
  onCancel: () => void;
}

export default function SaveDialog({ defaultName, onConfirm, onCancel }: SaveDialogProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(62,39,35,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24
      }}
      onClick={onCancel}
    >
      <div 
        className="animate-bounce-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 36,
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>💾</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#3E2723', marginBottom: 6 }}>
            保存到灵感板
          </h2>
          <p style={{ fontSize: 14, color: '#795548' }}>
            为你的搭配方案取个名字吧
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            marginBottom: 8, 
            color: '#5D4037' 
          }}>
            方案名称 *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：温馨客厅搭配方案"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: '2px solid #EFEBE9',
              fontSize: 15,
              transition: 'border 0.2s ease'
            }}
            onFocus={e => (e.target.style.borderColor = '#E8A87C')}
            onBlur={e => (e.target.style.borderColor = '#EFEBE9')}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 600, 
            marginBottom: 8, 
            color: '#5D4037' 
          }}>
            搭配描述
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="描述一下你的设计思路和想法..."
            rows={4}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: '2px solid #EFEBE9',
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border 0.2s ease'
            }}
            onFocus={e => (e.target.style.borderColor = '#E8A87C')}
            onBlur={e => (e.target.style.borderColor = '#EFEBE9')}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: '#EFEBE9',
              color: '#5D4037',
              fontSize: 15,
              fontWeight: 500
            }}
          >
            取消
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim(), description.trim())}
            disabled={!name.trim()}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: name.trim() 
                ? 'linear-gradient(135deg, #E8A87C, #D7955F)' 
                : '#E0E0E0',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              boxShadow: name.trim() ? '0 4px 16px rgba(232,168,124,0.4)' : 'none',
              cursor: name.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            ✨ 保存方案
          </button>
        </div>
      </div>
    </div>
  );
}
