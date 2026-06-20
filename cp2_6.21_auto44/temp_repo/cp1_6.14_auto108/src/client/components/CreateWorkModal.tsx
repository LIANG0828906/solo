import { useState } from 'react';

interface CreateWorkModalProps {
  onClose: () => void;
  onCreate: (title: string, type: string) => void;
}

const typeOptions = [
  { value: 'story', label: '故事', icon: '📖', desc: '小说、故事创作' },
  { value: 'poem', label: '诗歌', icon: '🪶', desc: '诗歌、散文创作' },
  { value: 'script', label: '剧本', icon: '🎭', desc: '剧本、脚本创作' },
];

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  animation: 'fadeIn 0.2s ease',
  padding: '20px',
};

const modalStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '20px',
  padding: '32px',
  width: '100%',
  maxWidth: '480px',
  animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#2D3748',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#A0AEC0',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '10px',
  fontWeight: 600,
  color: '#2D3748',
  fontSize: '0.95rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '1rem',
  borderRadius: '10px',
  border: '2px solid #E2E8F0',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
};

const typeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

const typeCardStyle = (selected: boolean): React.CSSProperties => ({
  padding: '16px',
  borderRadius: '12px',
  border: selected ? '2px solid #3B4A6B' : '2px solid #E2E8F0',
  background: selected ? '#F5F0EB' : 'white',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
});

const typeIconStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '8px',
};

const typeLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#2D3748',
  fontSize: '0.95rem',
  marginBottom: '4px',
};

const typeDescStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#718096',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginTop: '8px',
};

export default function CreateWorkModal({ onClose, onCreate }: CreateWorkModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('story');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }
    onCreate(title.trim(), type);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>创建新作品</h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F0EB';
              e.currentTarget.style.color = '#2D3748';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#A0AEC0';
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>作品标题</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="输入作品标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>作品类型</label>
            <div style={typeGridStyle}>
              {typeOptions.map((option) => (
                <div
                  key={option.value}
                  style={typeCardStyle(type === option.value)}
                  onClick={() => setType(option.value)}
                  onMouseEnter={(e) => {
                    if (type !== option.value) {
                      e.currentTarget.style.borderColor = '#CBD5E0';
                      e.currentTarget.style.background = '#F7FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (type !== option.value) {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div style={typeIconStyle}>{option.icon}</div>
                  <div style={typeLabelStyle}>{option.label}</div>
                  <div style={typeDescStyle}>{option.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={submitBtnStyle}
            disabled={!title.trim()}
            onMouseEnter={(e) => {
              if (title.trim()) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 154, 62, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            创建作品
          </button>
        </form>
      </div>
    </div>
  );
}
