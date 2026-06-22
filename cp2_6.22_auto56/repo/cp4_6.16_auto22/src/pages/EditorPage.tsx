import { useState, useMemo, useCallback } from 'react';
import { Plus, RotateCcw, Clock, Layers, Save } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ScriptCard from '@/components/ScriptCard';
import { useScriptStore } from '@/store/scriptStore';
import { formatDurationLong } from '@/utils/audioAnalyzer';
import { ScriptSegment } from '@/types';

interface EditorPageProps {
  embedded?: boolean;
}

const EditorPage = ({ embedded = false }: EditorPageProps) => {
  const segments = useScriptStore(s => s.segments);
  const addSegment = useScriptStore(s => s.addSegment);
  const reorderSegments = useScriptStore(s => s.reorderSegments);
  const getTotalDuration = useScriptStore(s => s.getTotalDuration);
  const getSegmentPercentages = useScriptStore(s => s.getSegmentPercentages);
  const resetToDefaults = useScriptStore(s => s.resetToDefaults);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => a.order - b.order),
    [segments]
  );

  const sortedSegmentIds = useMemo(
    () => sortedSegments.map(s => s.id),
    [sortedSegments]
  );

  const activeSegment = useMemo(
    () => sortedSegments.find(s => s.id === activeId) || null,
    [sortedSegments, activeId]
  );

  const totalDuration = getTotalDuration();
  const percentages = getSegmentPercentages();

  const handleAddSegment = () => {
    addSegment({
      title: '新段落',
      content: '',
      expectedDuration: 60,
      role: 'host',
    });
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedSegments.findIndex(s => s.id === active.id);
      const newIndex = sortedSegments.findIndex(s => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSegments(oldIndex, newIndex);
      }
    }
  }, [sortedSegments, reorderSegments]);

  const containerStyle = embedded
    ? { flex: 1, overflow: 'hidden', display: 'flex' as const, flexDirection: 'column' as const }
    : {
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: 'calc(100vh - 160px)',
      };

  return (
    <div style={containerStyle}>
      <div style={{
        padding: embedded ? '16px 20px' : '20px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: embedded ? 'transparent' : 'linear-gradient(180deg, rgba(233,69,96,0.08) 0%, transparent 100%)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 24,
          alignItems: 'stretch',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(233,69,96,0.15) 0%, rgba(155,135,245,0.15) 100%)',
                border: '1px solid rgba(233,69,96,0.25)',
              }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(233,69,96,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 2,
                  }}>
                    总预期时长
                  </div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1,
                    background: 'linear-gradient(135deg, var(--color-accent), #9B87F5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {formatDurationLong(totalDuration)}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(0,206,209,0.08)',
                border: '1px solid rgba(0,206,209,0.2)',
              }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,206,209,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00CED1',
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 2,
                  }}>
                    段落数量
                  </div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: '#00CED1',
                    lineHeight: 1,
                  }}>
                    {sortedSegments.length}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-secondary)',
                }}>
                  <Save size={20} />
                </div>
                <div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 2,
                  }}>
                    存储状态
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#00CED1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span style={{
                      width: 6, height: 6,
                      borderRadius: '50%',
                      background: '#00CED1',
                      boxShadow: '0 0 8px rgba(0,206,209,0.6)',
                    }} />
                    IndexedDB 已同步
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}>
                  各段时长占比
                </span>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}>
                  100%
                </span>
              </div>
              <div style={{
                height: 10,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 5,
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid var(--color-border-light)',
              }}>
                {sortedSegments.length === 0 ? (
                  <div style={{
                    flex: 1,
                    background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.06) 10px, rgba(255,255,255,0.06) 20px)',
                  }} />
                ) : (
                  sortedSegments.map((seg, idx) => {
                    const pct = percentages.get(seg.id) || 0;
                    const colors = [
                      ['#E94560', '#FF6B9D'],
                      ['#00CED1', '#7EC8E3'],
                      ['#9B87F5', '#C4B5FD'],
                      ['#FFA500', '#FFD700'],
                      ['#FF6B9D', '#FF9EC7'],
                    ];
                    const [c1, c2] = colors[idx % colors.length];
                    return (
                      <div
                        key={seg.id}
                        title={`${seg.title}: ${pct.toFixed(1)}%`}
                        style={{
                          width: `${pct}%`,
                          minWidth: pct > 0 ? 4 : 0,
                          background: `linear-gradient(135deg, ${c1}, ${c2})`,
                          height: '100%',
                          transition: 'width 0.3s ease',
                          borderLeft: idx > 0 ? '1px solid rgba(26,26,46,0.5)' : 'none',
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            justifyContent: 'center',
          }}>
            <button
              onClick={handleAddSegment}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #FF5572 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-base)',
                boxShadow: '0 4px 16px rgba(233,69,96,0.3)',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(233,69,96,0.4)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(233,69,96,0.3)';
              }}
            >
              <Plus size={18} /> 添加段落
            </button>
            <button
              onClick={() => {
                if (confirm('确定重置为示例脚本吗？当前所有内容将被清除。')) {
                  resetToDefaults();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'var(--transition-base)',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
              }}
            >
              <RotateCcw size={14} /> 重置示例
            </button>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: embedded ? '16px 20px' : '20px 24px',
      }}>
        {sortedSegments.length === 0 ? (
          <div style={{
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'rgba(233,69,96,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
              border: '2px dashed rgba(233,69,96,0.3)',
            }}>
              <Layers size={32} />
            </div>
            <div>
              <h3 style={{
                fontSize: 18,
                marginBottom: 6,
                color: '#fff',
              }}>
                还没有脚本段落
              </h3>
              <p style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                maxWidth: 400,
                margin: '0 auto 20px',
              }}>
                点击上方「添加段落」按钮开始创建你的播客脚本。每段可设置标题、正文、预期时长和角色标签。
              </p>
              <button
                onClick={handleAddSegment}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--color-accent)',
                  background: 'rgba(233,69,96,0.08)',
                  color: 'var(--color-accent)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-base)',
                }}
              >
                <Plus size={18} /> 创建第一个段落
              </button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedSegmentIds}
              strategy={verticalListSortingStrategy}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {sortedSegments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="fade-in-up"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      opacity: 0,
                    }}
                  >
                    <ScriptCard
                      segment={segment}
                      index={index}
                      percentage={percentages.get(segment.id) || 0}
                    />
                  </div>
                ))}

                <button
                  onClick={handleAddSegment}
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--color-border)',
                    background: 'rgba(255,255,255,0.01)',
                    color: 'var(--color-text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,69,96,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.01)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
                  }}
                >
                  <Plus size={16} /> 继续添加段落...
                </button>
              </div>
            </SortableContext>

            <DragOverlay>
              {activeSegment ? (
                <div style={{ opacity: 0.9, transform: 'scale(1.02)' }}>
                  <ScriptCard
                    segment={activeSegment}
                    index={sortedSegments.findIndex(s => s.id === activeId)}
                    percentage={percentages.get(activeSegment.id) || 0}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
