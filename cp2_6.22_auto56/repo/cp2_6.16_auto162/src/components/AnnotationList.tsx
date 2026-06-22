import { Square, ArrowRight, Type, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Annotation } from '@/utils/types';

function getAnnotationIcon(type: string) {
  const iconStyle = { width: 16, height: 16 };
  switch (type) {
    case 'rectangle':
      return <Square style={iconStyle} />;
    case 'arrow':
      return <ArrowRight style={iconStyle} />;
    case 'text':
      return <Type style={iconStyle} />;
    default:
      return null;
  }
}

function getAnnotationLabel(ann: Annotation): string {
  if (ann.type === 'rectangle') {
    return `矩形 ${Math.round(ann.width)}×${Math.round(ann.height)}`;
  }
  if (ann.type === 'arrow') {
    const len = Math.hypot(ann.endX - ann.x, ann.endY - ann.y);
    return `箭头 ${Math.round(len)}px`;
  }
  if (ann.type === 'text') {
    const content = ann.content.length > 12 ? ann.content.slice(0, 12) + '…' : ann.content;
    return `文字: ${content}`;
  }
  return '标注';
}

export function AnnotationList() {
  const {
    currentFrameIndex,
    annotations,
    selectedAnnotationId,
    focusAnnotation,
    deleteAnnotation,
  } = useAppStore();

  const list = (annotations[currentFrameIndex] || []).slice().sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          当前帧标注
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {list.length} 项
        </span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 260 }}>
        {list.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            暂无标注
            <div className="mt-1">选择工具后点击预览区添加</div>
          </div>
        ) : (
          list.map((ann, idx) => {
            const isSelected = selectedAnnotationId === ann.id;
            return (
              <div
                key={ann.id}
                className="flex items-center gap-3 px-3 py-2.5 btn-transition cursor-pointer"
                style={{
                  background: isSelected ? 'rgba(0, 188, 212, 0.12)' : 'transparent',
                  borderBottom:
                    idx < list.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
                onClick={() => focusAnnotation(ann.id)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--accent)',
                  }}
                >
                  {getAnnotationIcon(ann.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {getAnnotationLabel(ann)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    #{idx + 1} 添加
                  </div>
                </div>
                <button
                  className="btn-transition p-1.5 rounded-lg shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(ann.id);
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 82, 82, 0.15)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
