import { useEditorStore, type Language, type Draft } from '@/store/editorStore';

const LANGUAGE_COLORS: Record<Language, { bg: string; text: string; label: string }> = {
  javascript: { bg: '#F0DB4F', text: '#323330', label: 'JS' },
  typescript: { bg: '#3178C6', text: '#FFFFFF', label: 'TS' },
  python: { bg: '#3776AB', text: '#FFFFFF', label: 'PY' },
  html: { bg: '#E34F26', text: '#FFFFFF', label: 'HTML' },
  css: { bg: '#1572B6', text: '#FFFFFF', label: 'CSS' },
  json: { bg: '#CBCB41', text: '#323330', label: 'JSON' },
  markdown: { bg: '#519ABA', text: '#FFFFFF', label: 'MD' },
};

const formatTime = (ts: number) => {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(ts).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface DraftPanelProps {
  width: number;
  onResize: (width: number) => void;
}

const DraftPanel = ({ width, onResize }: DraftPanelProps) => {
  const { drafts, currentDraftId, loadDraft } = useEditorStore();
  let isDragging = false;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.max(200, Math.min(500, startWidth + delta));
      onResize(newWidth);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        background: '#252526',
        borderRadius: 8,
        margin: 12,
        marginRight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.1s linear',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid #3A3A3C',
        }}
      >
        <h3
          style={{
            color: '#D4D4D4',
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            marginBottom: 4,
          }}
        >
          草稿列表
        </h3>
        <p style={{ color: '#6A6A6A', fontSize: 12, margin: 0 }}>
          共 {drafts.length} 个草稿
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
        }}
      >
        {drafts.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#6A6A6A',
              fontSize: 13,
            }}
          >
            暂无草稿
            <div style={{ marginTop: 8, fontSize: 12 }}>
              点击顶部"保存"按钮创建你的第一个草稿
            </div>
          </div>
        ) : (
          drafts.map((draft: Draft) => {
            const langConfig = LANGUAGE_COLORS[draft.language];
            const isActive = draft.id === currentDraftId;

            return (
              <div
                key={draft.id}
                onClick={() => loadDraft(draft.id)}
                style={{
                  position: 'relative',
                  padding: '12px 14px',
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: isActive ? '#2A2A2B' : 'transparent',
                  transition: 'background 0.2s ease-in-out',
                  borderLeft: isActive ? '3px solid #007ACC' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = '#2A2A2B';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#FFFFFF',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {draft.title}
                  </span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: langConfig.bg,
                      color: langConfig.text,
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {langConfig.label}
                  </span>
                </div>
                <div style={{ color: '#6A6A6A', fontSize: 12 }}>
                  {formatTime(draft.updatedAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        onMouseDown={startResize}
        style={{
          position: 'absolute',
          top: 0,
          right: -2,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 100,
        }}
      />
    </div>
  );
};

export default DraftPanel;
