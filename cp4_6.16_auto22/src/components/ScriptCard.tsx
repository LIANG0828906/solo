import { useState, useRef, memo } from 'react';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Clock, Edit3, Check, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptSegment, RoleType, ROLE_LABELS, ROLE_COLORS } from '@/types';
import { useScriptStore } from '@/store/scriptStore';
import { formatDuration } from '@/utils/audioAnalyzer';

interface ScriptCardProps {
  segment: ScriptSegment;
  index: number;
  percentage: number;
}

const ScriptCard = memo(function ScriptCard({
  segment,
  index,
  percentage,
}: ScriptCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(segment.title);
  const [editContent, setEditContent] = useState(segment.content);
  const [editDuration, setEditDuration] = useState(segment.expectedDuration);
  const [editRole, setEditRole] = useState<RoleType>(segment.role);
  const updateSegment = useScriptStore(s => s.updateSegment);
  const deleteSegment = useScriptStore(s => s.deleteSegment);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const roleColors = ROLE_COLORS[segment.role];
  const preview = segment.content.length > 50 
    ? segment.content.slice(0, 50) + '...' 
    : segment.content || '（暂无内容）';

  const handleSave = () => {
    updateSegment(segment.id, {
      title: editTitle,
      content: editContent,
      expectedDuration: editDuration,
      role: editRole,
    });
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setEditTitle(segment.title);
    setEditContent(segment.content);
    setEditDuration(segment.expectedDuration);
    setEditRole(segment.role);
    setIsExpanded(false);
  };

  const handleDelete = () => {
    if (confirm(`确定删除段落「${segment.title}」吗？`)) {
      deleteSegment(segment.id);
    }
  };

  const roleOptions: { value: RoleType; label: string }[] = [
    { value: 'host', label: '主播' },
    { value: 'guest', label: '嘉宾' },
    { value: 'narrator', label: '旁白' },
  ];

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 300ms ease',
    opacity: isDragging ? 0.5 : 1,
    transformOrigin: '50% 50%',
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto',
  };

  const cardStyle: React.CSSProperties = {
    transform: isDragging ? 'scale(1.02)' : 'none',
    boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.4)' : 'none',
    background: 'linear-gradient(135deg, rgba(15,52,96,0.6) 0%, rgba(22,33,62,0.8) 100%)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: isExpanded ? 0 : '18px',
    cursor: isDragging ? 'grabbing' : 'default',
    overflow: 'hidden',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <div
        className="card-hover"
        style={cardStyle}
      >
        {!isExpanded ? (
          <div style={{ display: 'flex', gap: 14 }}>
            <div
              {...attributes}
              {...listeners}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
                padding: '8px 6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flexShrink: 0,
                alignSelf: 'flex-start',
                marginTop: 2,
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              <GripVertical size={16} />
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                opacity: 0.6,
                lineHeight: 1,
              }}>
                #{(index + 1).toString().padStart(2, '0')}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                }}>
                  {segment.title}
                </h3>

                <span style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid ' + roleColors.border,
                  background: roleColors.bg,
                  color: roleColors.text,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {ROLE_LABELS[segment.role]}
                </span>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)',
                  flexShrink: 0,
                }}>
                  <Clock size={12} />
                  {formatDuration(segment.expectedDuration)}
                </div>

                <div style={{
                  display: 'flex',
                  gap: 4,
                  flexShrink: 0,
                }}>
                  <button
                    onClick={() => setIsExpanded(true)}
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'var(--transition-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,69,96,0.15)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    }}
                    title="编辑"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'var(--transition-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,68,68,0.15)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-over-budget)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    }}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                marginBottom: 12,
                wordBreak: 'break-word',
              }}>
                {preview}
              </p>

              <div>
                <div style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: 4,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, var(--color-accent) 0%, ${roleColors.text} 100%)`,
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}>
                  <span>占比 {percentage.toFixed(1)}%</span>
                  <button
                    onClick={() => setIsExpanded(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    展开编辑 <ChevronDown size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(233,69,96,0.05)',
            }}>
              <div
                {...attributes}
                {...listeners}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-muted)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  flexShrink: 0,
                  touchAction: 'none',
                }}
              >
                <GripVertical size={16} />
              </div>
              <div style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.03)',
              }}>
                #{(index + 1).toString().padStart(2, '0')} · 编辑中
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button
                  onClick={handleSave}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
                  }}
                >
                  <Check size={14} /> 保存
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                  }}
                >
                  <X size={14} /> 取消
                </button>
              </div>
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 6,
                  display: 'block',
                }}>
                  段落标题
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'rgba(26,26,46,0.6)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'var(--transition-base)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(233,69,96,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="输入段落标题..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 6,
                    display: 'block',
                  }}>
                    预期时长（秒）
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="range"
                      min={5}
                      max={600}
                      step={5}
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <input
                        type="number"
                        min={1}
                        value={editDuration}
                        onChange={(e) => setEditDuration(Math.max(1, Number(e.target.value) || 1))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          background: 'rgba(26,26,46,0.6)',
                          color: '#fff',
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          outline: 'none',
                        }}
                      />
                      <span style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        ≈ {formatDuration(editDuration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 6,
                    display: 'block',
                  }}>
                    角色标签
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {roleOptions.map(opt => {
                      const colors = ROLE_COLORS[opt.value];
                      const active = editRole === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setEditRole(opt.value)}
                          style={{
                            flex: 1,
                            minWidth: 70,
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid ' + (active ? colors.border : 'var(--color-border)'),
                            background: active ? colors.bg : 'rgba(26,26,46,0.4)',
                            color: active ? colors.text : 'var(--color-text-secondary)',
                            fontSize: 12,
                            fontWeight: active ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'var(--transition-base)',
                            fontFamily: active ? 'var(--font-mono)' : 'inherit',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>正文内容 <span style={{ opacity: 0.6 }}>（支持 Markdown 语法）</span></span>
                  <span style={{ opacity: 0.6 }}>{editContent.length} 字</span>
                </label>
                <textarea
                  ref={contentRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  placeholder={'在此输入脚本正文内容...\n\n支持 Markdown 语法：\n**加粗**、*斜体*、`代码`、- 列表'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'rgba(26,26,46,0.6)',
                    color: '#fff',
                    fontSize: 13,
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'var(--transition-base)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(233,69,96,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 10,
                borderTop: '1px dashed var(--color-border)',
              }}>
                <span style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  ID: {segment.id.slice(0, 8)}...
                </span>
                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,68,68,0.3)',
                    background: 'rgba(255,68,68,0.08)',
                    color: 'var(--color-over-budget)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                  }}
                >
                  <Trash2 size={13} /> 删除此段落
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: 8,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-light)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'var(--transition-base)',
                }}
              >
                <ChevronUp size={12} /> 收起编辑面板
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ScriptCard;
