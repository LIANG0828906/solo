import type { Snippet } from '@/types';

interface SidebarProps {
  snippets: Snippet[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ snippets, onSelect, onDelete, isOpen, onClose }: SidebarProps) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}
      <div
        style={{
          width: '240px',
          height: '100%',
          backgroundColor: '#16162D',
          borderRight: '1px solid #2D2D4A',
          overflowY: 'auto',
          flexShrink: 0,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          position: 'relative',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #2D2D4A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              color: '#E0E0F0',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            已保存片段
          </span>
          <span
            style={{
              color: '#6A6A8E',
              fontSize: '11px',
            }}
          >
            {snippets.length} 个
          </span>
        </div>

        {snippets.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              color: '#6A6A8E',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            暂无保存的片段
          </div>
        ) : (
          snippets.map((snippet) => (
            <div
              key={snippet.id}
              style={{
                height: '48px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                borderBottom: '1px solid #1E1E2E',
                position: 'relative',
              }}
              onClick={() => onSelect(snippet.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1E1E2E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    color: '#E0E0F0',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {snippet.name}
                </div>
                <div
                  style={{
                    color: '#6A6A8E',
                    fontSize: '12px',
                  }}
                >
                  {formatTime(snippet.lastModified)}
                </div>
              </div>
              <span
                style={{
                  color: snippet.language === 'python' ? '#6C63FF' : '#FFD93D',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginLeft: '8px',
                  flexShrink: 0,
                }}
              >
                {snippet.language === 'python' ? 'PY' : 'JS'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(snippet.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6A6A8E',
                  fontSize: '14px',
                  padding: '2px 4px',
                  marginLeft: '8px',
                  flexShrink: 0,
                  transition: 'color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FF6B6B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6A6A8E';
                }}
                title="删除片段"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
