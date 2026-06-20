import type { Snippet, Theme } from '@/types';

interface SidebarProps {
  snippets: Snippet[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export function Sidebar({ snippets, onSelect, onDelete, isOpen, onClose, theme }: SidebarProps) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#16162D' : '#F0F0F5';
  const border = isDark ? '#2D2D4A' : '#E0E0E0';
  const headerText = isDark ? '#E0E0F0' : '#333333';
  const subText = isDark ? '#6A6A8E' : '#999999';
  const itemBg = isDark ? '#1E1E2E' : '#E8E8F0';
  const itemText = isDark ? '#E0E0F0' : '#333333';
  const itemBorder = isDark ? '#1E1E2E' : '#E8E8F0';

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
          backgroundColor: bg,
          borderRight: `1px solid ${border}`,
          overflowY: 'auto',
          flexShrink: 0,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, background-color 0.3s ease, border-color 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          position: 'relative',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color 0.3s ease',
          }}
        >
          <span
            style={{
              color: headerText,
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              transition: 'color 0.3s ease',
            }}
          >
            已保存片段
          </span>
          <span
            style={{
              color: subText,
              fontSize: '11px',
              transition: 'color 0.3s ease',
            }}
          >
            {snippets.length} 个
          </span>
        </div>

        {snippets.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              color: subText,
              fontSize: '13px',
              textAlign: 'center',
              transition: 'color 0.3s ease',
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
                borderBottom: `1px solid ${itemBorder}`,
                position: 'relative',
              }}
              onClick={() => onSelect(snippet.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = itemBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    color: itemText,
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {snippet.name}
                </div>
                <div
                  style={{
                    color: subText,
                    fontSize: '12px',
                    transition: 'color 0.3s ease',
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
                  color: subText,
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
                  e.currentTarget.style.color = subText;
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
